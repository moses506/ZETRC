import { FormEvent, useMemo, useState } from 'react';
import { useAdminRecords, useUsers } from '../../hooks/useAdminRecords';
import {
  createUser,
  deleteUser,
  updateUser,
  updateAdminRecord,
  type PortalUser,
  type PortalUserInput,
  type UserRole,
} from '../../utils/api';
import type { AdminProfile } from '../../utils/auth';
import '../../styles/admin.css';
import { Spinner, errorReason, useToast } from './Toast';

type ApiRecord = Record<string, unknown>;

type AdminUsersTableProps = {
  role: UserRole;
  adminProfile: AdminProfile;
};

type UserForm = {
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  password: string;
  role: UserRole;
  courses: string[];
};

const ROLE_COPY: Record<UserRole, { singular: string; description: string }> = {
  Learner: {
    singular: 'student',
    description: 'Learners who signed up on the portal. Activate, deactivate, reset passwords or change roles.',
  },
  Lecturer: {
    singular: 'lecturer',
    description: 'Lecturers sign in at #lecturer-login and only see the courses assigned to them here.',
  },
  Admin: {
    singular: 'administrator',
    description: 'Accounts with full access to this admin console.',
  },
};

function readString(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function fullName(user: PortalUser): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
}

function initials(user: PortalUser): string {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase() || '?';
}

function formatDate(value: string): string {
  const time = Date.parse(value);
  return Number.isNaN(time)
    ? ''
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(time));
}

function emptyForm(role: UserRole): UserForm {
  return { first_name: '', last_name: '', email: '', contact_no: '', password: '', role, courses: [] };
}

function AdminUsersTable({ role, adminProfile }: AdminUsersTableProps) {
  const { records: users, isLoading, errorMessage, refetch } = useUsers(role);
  const courses = useAdminRecords<ApiRecord>('Course');
  const enrollments = useAdminRecords<ApiRecord>('Student_Enrollment');
  const copy = ROLE_COPY[role];
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(() => emptyForm(role));
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const coursesByLecturer = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const course of courses.records) {
      const lecturer = readString(course, 'lecturer').toLowerCase();
      if (lecturer) {
        (map[lecturer] ??= []).push(readString(course, 'name'));
      }
    }
    return map;
  }, [courses.records]);

  const coursesByStudent = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const enrollment of enrollments.records) {
      const email = readString(enrollment, 'email').toLowerCase();
      if (email) {
        (map[email] ??= []).push(readString(enrollment, 'course'));
      }
    }
    return map;
  }, [enrollments.records]);

  const coursesFor = (user: PortalUser): string[] =>
    (role === 'Lecturer' ? coursesByLecturer : coursesByStudent)[user.email.toLowerCase()] ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.first_name, user.last_name, user.email, user.contact_no].join(' ').toLowerCase().includes(term),
    );
  }, [users, search]);

  const activeCount = users.filter((user) => user.active !== false).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(role));
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (user: PortalUser) => {
    setEditing(user);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      contact_no: user.contact_no,
      password: '',
      role: user.role,
      courses: role === 'Lecturer' ? coursesFor(user) : [],
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  // Point each course's lecturer field at this lecturer (or clear it).
  const syncCourseAssignments = async (email: string, previousEmail: string, selected: string[]) => {
    const changes = courses.records
      .map((course) => {
        const name = readString(course, 'name');
        const current = readString(course, 'lecturer').toLowerCase();
        const wanted = selected.includes(name);
        const ownedBefore = current === previousEmail.toLowerCase() || current === email.toLowerCase();

        if (wanted && current !== email.toLowerCase()) return { name, lecturer: email };
        if (!wanted && ownedBefore) return { name, lecturer: '' };
        return null;
      })
      .filter((change): change is { name: string; lecturer: string } => change !== null);

    await Promise.all(changes.map((change) => updateAdminRecord('Course', change)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!editing && form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      toast.error('Please fix the form', 'Password must be at least 8 characters.');
      return;
    }

    const body: PortalUserInput = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      contact_no: form.contact_no,
      role: form.role,
    };
    if (form.password) {
      body.password = form.password;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await updateUser(editing.id, body);
      } else {
        await createUser(body);
      }

      if (role === 'Lecturer' && form.role === 'Lecturer') {
        await syncCourseAssignments(form.email.trim().toLowerCase(), editing?.email ?? '', form.courses);
        courses.refetch();
      }

      const who = `${form.first_name} ${form.last_name}`.trim() || form.email;
      if (editing) {
        toast.success('Account updated', form.password ? `${who} — password changed too.` : who);
      } else {
        toast.success(`${copy.singular.charAt(0).toUpperCase()}${copy.singular.slice(1)} added`, `${who} can now sign in.`);
      }
      closeForm();
      refetch();
    } catch (error) {
      const reason = errorReason(error, 'Could not save this account.');
      setFormError(reason);
      toast.error(editing ? 'Could not update account' : 'Could not create account', reason);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (user: PortalUser) => {
    setBusyId(user.id);
    setActionError(null);
    try {
      const activating = user.active === false;
      await updateUser(user.id, { active: activating });
      toast.success(
        activating ? 'Account activated' : 'Account deactivated',
        activating ? `${fullName(user)} can sign in again.` : `${fullName(user)} can no longer sign in.`,
      );
      refetch();
    } catch (error) {
      const reason = errorReason(error, 'Could not update this account.');
      setActionError(reason);
      toast.error('Could not change account status', reason);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: PortalUser) => {
    if (!window.confirm(`Delete ${fullName(user)}'s account? This cannot be undone.`)) {
      return;
    }
    setBusyId(user.id);
    setActionError(null);
    try {
      await deleteUser(user.id);
      toast.success('Account deleted', fullName(user));
      refetch();
      courses.refetch();
    } catch (error) {
      const reason = errorReason(error, 'Could not delete this account.');
      setActionError(reason);
      toast.error('Could not delete account', reason);
    } finally {
      setBusyId(null);
    }
  };

  const toggleCourse = (name: string) =>
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.includes(name) ? prev.courses.filter((course) => course !== name) : [...prev.courses, name],
    }));

  return (
    <div className="admin-table-panel">
      <div className="admin-user-summary">
        <div className="admin-user-summary-item">
          <span className="admin-user-summary-value">{isLoading ? '–' : users.length}</span>
          <span>Total {copy.singular}s</span>
        </div>
        <div className="admin-user-summary-item">
          <span className="admin-user-summary-value">{isLoading ? '–' : activeCount}</span>
          <span>Active</span>
        </div>
        <div className="admin-user-summary-item">
          <span className="admin-user-summary-value">{isLoading ? '–' : users.length - activeCount}</span>
          <span>Deactivated</span>
        </div>
      </div>

      <div className="admin-table-header">
        <div className="admin-table-heading">
          <p className="admin-table-description">{copy.description}</p>
        </div>
        <div className="admin-table-tools">
          <input
            type="search"
            className="admin-search"
            placeholder={`Search ${copy.singular}s…`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Add {copy.singular}
          </button>
        </div>
      </div>

      {errorMessage ? <div className="admin-alert admin-alert-error">{errorMessage}</div> : null}
      {actionError ? <div className="admin-alert admin-alert-error">{actionError}</div> : null}

      {isFormOpen ? (
        <form className="admin-record-form" onSubmit={handleSubmit}>
          <h3>{editing ? `Edit ${fullName(editing)}` : `New ${copy.singular}`}</h3>
          {formError ? <div className="admin-alert admin-alert-error">{formError}</div> : null}

          <fieldset className="admin-form-grid admin-fieldset" disabled={isSaving}>
            <label className="admin-field">
              <span>First name</span>
              <input
                required
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Last name</span>
              <input
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Contact number</span>
              <input
                value={form.contact_no}
                onChange={(event) => setForm((prev) => ({ ...prev, contact_no: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>{editing ? 'New password (leave blank to keep)' : 'Password'}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </label>
            <label className="admin-field">
              <span>Role</span>
              <select
                value={form.role}
                disabled={editing?.email === adminProfile.email}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              >
                <option value="Learner">Student</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Admin">Admin</option>
              </select>
            </label>

            {role === 'Lecturer' && form.role === 'Lecturer' ? (
              <div className="admin-field admin-field-wide">
                <span>Assigned courses</span>
                {courses.records.length === 0 ? (
                  <p className="admin-panel-empty">No courses yet. Create courses first.</p>
                ) : (
                  <div className="admin-chip-group">
                    {courses.records.map((course) => {
                      const name = readString(course, 'name');
                      const owner = readString(course, 'lecturer');
                      const selected = form.courses.includes(name);
                      const takenByOther =
                        owner && owner.toLowerCase() !== (editing?.email ?? form.email).toLowerCase();
                      return (
                        <button
                          type="button"
                          key={name}
                          className={`admin-chip${selected ? ' admin-chip-selected' : ''}`}
                          onClick={() => toggleCourse(name)}
                          title={takenByOther ? `Currently assigned to ${owner}` : undefined}
                        >
                          {selected ? '✓ ' : ''}
                          {name}
                          {takenByOther && !selected ? <em> · reassign</em> : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </fieldset>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn" onClick={closeForm} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
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
              <th>Contact</th>
              {role === 'Admin' ? null : <th>{role === 'Lecturer' ? 'Assigned courses' : 'Enrolled courses'}</th>}
              <th>Status</th>
              <th>Joined</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-table-empty">
                  {search ? 'No accounts match your search.' : `No ${copy.singular}s yet.`}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isSelf = user.email === adminProfile.email;
                const userCourses = coursesFor(user);
                const active = user.active !== false;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className={`admin-user-avatar admin-user-avatar-${role.toLowerCase()}`}>
                          {initials(user)}
                        </span>
                        <span>
                          <strong>{fullName(user)}</strong>
                          <span className="admin-user-email">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>{user.contact_no || '—'}</td>
                    {role === 'Admin' ? null : (
                      <td>
                        {userCourses.length === 0 ? (
                          <span className="admin-muted">None</span>
                        ) : (
                          <div className="admin-chip-list">
                            {userCourses.map((course) => (
                              <span key={course} className="admin-chip admin-chip-static">
                                {course}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    <td>
                      <span className={`admin-pill ${active ? 'admin-pill-active' : 'admin-pill-inactive'}`}>
                        {active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>{formatDate(user.creation)}</td>
                    <td className="admin-table-actions">
                      <button type="button" className="admin-btn admin-btn-small" onClick={() => openEdit(user)}>
                        Edit
                      </button>
                      {isSelf ? null : (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn-small"
                            disabled={busyId === user.id}
                            onClick={() => toggleActive(user)}
                          >
                            {busyId === user.id ? <Spinner /> : null}
                            {active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-small admin-btn-danger"
                            disabled={busyId === user.id}
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
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

export default AdminUsersTable;
