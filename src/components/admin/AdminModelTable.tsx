import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useStaffRecords } from '../../hooks/useAdminRecords';
import {
  createStaffRecord,
  deleteStaffRecord,
  fetchStaffRecords,
  fetchUsers,
  resolveApiAssetUrl,
  updateStaffRecord,
} from '../../utils/api';
import type { StaffScope } from '../../utils/auth';
import SearchableSelect from './SearchableSelect';
import FileUploadField, { type UploadKind } from './FileUploadField';
import { htmlToText } from '../../utils/richText';
import { Spinner, errorReason, useToast } from './Toast';
import '../../styles/admin.css';

/** Where a select field loads its choices from. */
export type OptionSource = 'courses' | 'modules' | 'assignments' | 'lecturers';

export type AdminColumn = {
  key: string;
  label: string;
  multiline?: boolean;
  json?: boolean;
  /** Fixed choices rendered as a select. */
  options?: string[];
  /** Choices loaded from another model, rendered as a select. */
  source?: OptionSource;
  /** Shown in the table but not editable in the form. */
  readOnly?: boolean;
  /** Saved as a number. */
  number?: boolean;
  /** Upload a file from the computer; the stored value is the file's URL. */
  upload?: UploadKind;
};

type AdminModelTableProps = {
  model: string;
  title: string;
  columns: AdminColumn[];
  scope?: StaffScope;
  description?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

type ApiRecord = Record<string, unknown>;
type FormState = Record<string, string>;
type Option = { value: string; label: string; hint?: string };

function readString(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function valueToFieldString(value: unknown, json?: boolean): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (json || typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }

  return String(value);
}

function buildFormState(columns: AdminColumn[], record?: ApiRecord): FormState {
  const state: FormState = {};

  for (const column of columns) {
    state[column.key] = valueToFieldString(record?.[column.key], column.json);
  }

  return state;
}

async function loadOptions(scope: StaffScope, source: OptionSource): Promise<Option[]> {
  switch (source) {
    case 'courses':
      return (await fetchStaffRecords(scope, 'Course')).map((row) => ({
        value: readString(row, 'name'),
        label: readString(row, 'name'),
      }));
    case 'modules':
      return (await fetchStaffRecords(scope, 'Course_Module')).map((row) => ({
        value: readString(row, 'name'),
        label: `${readString(row, 'title') || readString(row, 'name')} · ${readString(row, 'course')}`,
      }));
    case 'assignments':
      return (await fetchStaffRecords(scope, 'Assignment')).map((row) => ({
        value: readString(row, 'name'),
        label: `${readString(row, 'course')} · ${readString(row, 'description').slice(0, 50) || readString(row, 'name')}`,
      }));
    case 'lecturers':
      return (await fetchUsers('Lecturer')).map((user) => ({
        value: user.email,
        label: `${user.first_name} ${user.last_name}`.trim() || user.email,
        hint: user.email,
      }));
    default:
      return [];
  }
}

function useColumnOptions(scope: StaffScope, columns: AdminColumn[]) {
  const sources = useMemo(
    () => Array.from(new Set(columns.map((column) => column.source).filter(Boolean))) as OptionSource[],
    [columns],
  );
  const [options, setOptions] = useState<Partial<Record<OptionSource, Option[]>>>({});

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      sources.map(async (source) => [source, await loadOptions(scope, source).catch(() => [])] as const),
    ).then((entries) => {
      if (!cancelled) {
        setOptions(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [scope, sources]);

  return options;
}

/** A <label> for normal inputs; a <div> for upload fields, whose buttons must not trigger the label. */
function FieldWrapper({ asDiv, className, children }: { asDiv: boolean; className: string; children: ReactNode }) {
  return asDiv ? <div className={className}>{children}</div> : <label className={className}>{children}</label>;
}

function AdminModelTable({
  model,
  title,
  columns,
  scope = 'admin',
  description,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: AdminModelTableProps) {
  const { records, isLoading, errorMessage, refetch } = useStaffRecords<ApiRecord>(scope, model);
  const options = useColumnOptions(scope, columns);
  const toast = useToast();
  const editableColumns = columns.filter((column) => !column.readOnly);
  const hasActions = canEdit || canDelete;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(() => buildFormState(editableColumns));
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploadsInFlight, setUploadsInFlight] = useState(0);

  const choicesFor = (column: AdminColumn): Option[] | null => {
    if (column.options) {
      return column.options.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
    }
    if (column.source) {
      return options[column.source] ?? [];
    }
    return null;
  };

  const displayValue = (column: AdminColumn, record: ApiRecord): string => {
    const raw = column.json
      ? valueToFieldString(record[column.key], true)
      : htmlToText(valueToFieldString(record[column.key]));
    if (column.source) {
      const match = options[column.source]?.find((option) => option.value === raw);
      if (match) {
        return match.label;
      }
    }
    return raw;
  };

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return records;
    }
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }, [records, search]);

  const openCreateForm = () => {
    setEditingName(null);
    setFormState(buildFormState(editableColumns));
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (record: ApiRecord) => {
    setEditingName(typeof record.name === 'string' ? record.name : null);
    setFormState(buildFormState(editableColumns, record));
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingName(null);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const body: ApiRecord = {};

    for (const column of editableColumns) {
      const raw = formState[column.key] ?? '';

      if (column.json) {
        if (!raw.trim()) {
          body[column.key] = null;
          continue;
        }

        try {
          body[column.key] = JSON.parse(raw);
        } catch {
          const reason = `"${column.label}" must be valid JSON.`;
          setFormError(reason);
          toast.error('Please fix the form', reason);
          return;
        }
      } else if (column.number) {
        const value = raw.trim() === '' ? 0 : Number(raw);
        if (!Number.isFinite(value)) {
          const reason = `"${column.label}" must be a number.`;
          setFormError(reason);
          toast.error('Please fix the form', reason);
          return;
        }
        body[column.key] = value;
      } else {
        body[column.key] = raw;
      }
    }

    if (editingName) {
      body.name = editingName;
    }

    setIsSaving(true);

    try {
      if (editingName) {
        await updateStaffRecord(scope, model, body);
        toast.success('Changes saved', `${title}: ${editingName}`);
      } else {
        await createStaffRecord(scope, model, body);
        toast.success('Record created', `A new entry was added to ${title}.`);
      }

      closeForm();
      refetch();
    } catch (error) {
      const reason = errorReason(error, 'Could not save this record.');
      setFormError(reason);
      toast.error(editingName ? 'Could not save changes' : 'Could not create record', reason);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) {
      return;
    }

    setPendingDelete(name);
    setActionError(null);

    try {
      await deleteStaffRecord(scope, model, name);
      toast.success('Record deleted', `${title}: ${name}`);
      refetch();
    } catch (error) {
      const reason = errorReason(error, 'Could not delete this record.');
      setActionError(reason);
      toast.error('Could not delete record', reason);
    } finally {
      setPendingDelete(null);
    }
  };

  const colSpan = columns.length + 1 + (hasActions ? 1 : 0);

  return (
    <div className="admin-table-panel">
      <div className="admin-table-header">
        <div className="admin-table-heading">
          <span className="admin-table-count">
            {records.length} record{records.length === 1 ? '' : 's'}
          </span>
          {description ? <p className="admin-table-description">{description}</p> : null}
        </div>
        <div className="admin-table-tools">
          <input
            type="search"
            className="admin-search"
            placeholder={`Search ${title.toLowerCase()}…`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {canCreate ? (
            <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateForm}>
              + Add new
            </button>
          ) : null}
        </div>
      </div>

      {errorMessage ? <div className="admin-alert admin-alert-error">{errorMessage}</div> : null}
      {actionError ? <div className="admin-alert admin-alert-error">{actionError}</div> : null}

      {isFormOpen ? (
        <form className="admin-record-form" onSubmit={handleSubmit}>
          <h3>{editingName ? `Edit ${title}` : `New ${title}`}</h3>

          {formError ? <div className="admin-alert admin-alert-error">{formError}</div> : null}

          <fieldset className="admin-form-grid admin-fieldset" disabled={isSaving}>
            {editableColumns.map((column) => {
              const choices = choicesFor(column);
              const value = formState[column.key] ?? '';
              const setValue = (next: string) => setFormState((prev) => ({ ...prev, [column.key]: next }));

              return (
                <FieldWrapper
                  key={column.key}
                  asDiv={Boolean(column.upload)}
                  className={`admin-field${column.multiline || column.json || column.upload ? ' admin-field-wide' : ''}`}
                >
                  <span>
                    {column.label}
                    {column.json ? ' (JSON)' : ''}
                  </span>
                  {column.upload ? (
                    <FileUploadField
                      scope={scope}
                      kind={column.upload}
                      value={value}
                      onChange={setValue}
                      onBusyChange={(busy) => setUploadsInFlight((count) => Math.max(0, count + (busy ? 1 : -1)))}
                    />
                  ) : column.source ? (
                    <SearchableSelect
                      value={value}
                      options={choices ?? []}
                      onChange={setValue}
                      placeholder={`— Select ${column.label.toLowerCase()} —`}
                      emptyText={`No ${column.label.toLowerCase()} matches your search`}
                    />
                  ) : choices ? (
                    <select value={value} onChange={(event) => setValue(event.target.value)}>
                      <option value="">
                        {choices.length === 0 ? `— No ${column.label.toLowerCase()} options found —` : '— Select —'}
                      </option>
                      {value && !choices.some((choice) => choice.value === value) ? (
                        <option value={value}>{value}</option>
                      ) : null}
                      {choices.map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                  ) : column.multiline || column.json ? (
                    <textarea rows={column.json ? 5 : 3} value={value} onChange={(event) => setValue(event.target.value)} />
                  ) : (
                    <input type="text" value={value} onChange={(event) => setValue(event.target.value)} />
                  )}
                </FieldWrapper>
              );
            })}
          </fieldset>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn" onClick={closeForm} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSaving || uploadsInFlight > 0}
              title={uploadsInFlight > 0 ? 'Wait for the upload to finish' : undefined}
            >
              {isSaving ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      ) : null}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              {hasActions ? <th aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="admin-table-empty">
                  Loading...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="admin-table-empty">
                  {search ? 'No records match your search.' : 'No records yet.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const name = typeof record.name === 'string' ? record.name : '';
                return (
                  <tr key={name || JSON.stringify(record)}>
                    <td className="admin-table-name">{name}</td>
                    {columns.map((column) => {
                      const text = displayValue(column, record);
                      return (
                        <td key={column.key}>
                          {column.upload && text ? (
                            <a
                              className="admin-file-chip"
                              href={resolveApiAssetUrl(text)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {column.upload === 'audio' ? '♪ Audio' : 'PDF'} · {decodeURIComponent(text.split('/').pop() ?? '').slice(0, 18)}
                            </a>
                          ) : column.options && text ? (
                            <span className={`admin-pill admin-pill-${text}`}>{text.replace(/_/g, ' ')}</span>
                          ) : (
                            text.slice(0, 140)
                          )}
                        </td>
                      );
                    })}
                    {hasActions ? (
                      <td className="admin-table-actions">
                        {canEdit ? (
                          <button type="button" className="admin-btn admin-btn-small" onClick={() => openEditForm(record)}>
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-small admin-btn-danger"
                            onClick={() => handleDelete(name)}
                            disabled={pendingDelete === name}
                          >
                            {pendingDelete === name ? (
                              <>
                                <Spinner /> Deleting…
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminModelTable;
