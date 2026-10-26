import { useMemo, useState } from 'react';
import { useAdminRecords } from '../../hooks/useAdminRecords';
import { resolveApiAssetUrl } from '../../utils/api';
import { reviewEnrollment } from '../../utils/features';
import { htmlToText } from '../../utils/richText';
import ConfirmDialog from '../admin/ConfirmDialog';
import { errorReason, useToast } from '../admin/Toast';
import '../../styles/features.css';

type ApiRecord = Record<string, unknown>;
type Tab = 'pending' | 'approved' | 'rejected' | 'all';

const str = (r: ApiRecord, k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
const statusOf = (r: ApiRecord) => str(r, 'status') || 'approved';

function fmt(value: string) {
  const t = Date.parse(value);
  return Number.isNaN(t)
    ? ''
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(t));
}

/** Admin review of course applications: approve or reject with a reason. */
function EnrollmentReview() {
  const toast = useToast();
  const { records, isLoading, errorMessage, refetch } = useAdminRecords<ApiRecord>('Student_Enrollment');
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [decision, setDecision] = useState<{ record: ApiRecord; action: 'approved' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: records.length };
    records.forEach((r) => {
      const s = statusOf(r) as keyof typeof c;
      if (s in c) c[s] += 1;
    });
    return c;
  }, [records]);

  const visible = records.filter((r) => {
    if (tab !== 'all' && statusOf(r) !== tab) return false;
    const term = search.trim().toLowerCase();
    return !term || [str(r, 'first_name'), str(r, 'last_name'), str(r, 'email'), str(r, 'course')].join(' ').toLowerCase().includes(term);
  });

  const submit = async () => {
    if (!decision) return;
    if (decision.action === 'rejected' && !note.trim()) {
      toast.error('Add a reason', 'Tell the applicant why, so they know what to do next.');
      return;
    }
    setBusy(true);
    try {
      await reviewEnrollment(str(decision.record, 'name'), decision.action, note);
      toast.success(
        decision.action === 'approved' ? 'Enrollment approved' : 'Enrollment rejected',
        `${str(decision.record, 'first_name')} has been notified.`,
      );
      setDecision(null);
      setNote('');
      refetch();
    } catch (error) {
      toast.error('Could not save decision', errorReason(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fx">
      <div className="fx-spread">
        <div className="fx-tabs" role="tablist">
          {(['pending', 'approved', 'rejected', 'all'] as Tab[]).map((t) => (
            <button key={t} type="button" className={tab === t ? 'fx-tab-active' : ''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>
        <input
          className="fx-input"
          style={{ maxWidth: 280 }}
          type="search"
          placeholder="Search applicants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {errorMessage ? <div className="fx-alert">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="fx-empty">Loading applications…</div>
      ) : visible.length === 0 ? (
        <div className="fx-empty">{tab === 'pending' ? 'No applications waiting for review. 🎉' : 'Nothing here.'}</div>
      ) : (
        visible.map((r) => {
          const status = statusOf(r);
          const docs = Array.isArray(r.documents) ? (r.documents as { name?: string; url?: string }[]) : [];
          return (
            <div key={str(r, 'name')} className="fx-card fx" style={{ gap: 12 }}>
              <div className="fx-spread">
                <div>
                  <strong style={{ fontSize: 16 }}>
                    {str(r, 'first_name')} {str(r, 'last_name')}
                  </strong>
                  <div className="fx-small fx-muted">
                    {str(r, 'email')} · applied {fmt(str(r, 'creation'))}
                  </div>
                </div>
                <span
                  className={`fx-pill ${status === 'approved' ? 'fx-pill-good' : status === 'rejected' ? 'fx-pill-bad' : 'fx-pill-warn'}`}
                >
                  {status}
                </span>
              </div>
              <div>
                <span className="fx-small fx-muted">Course</span>
                <div>
                  <strong>{str(r, 'course')}</strong> {str(r, 'duration') ? <span className="fx-muted">· {str(r, 'duration')}</span> : null}
                </div>
              </div>
              {str(r, 'description') ? (
                <div>
                  <span className="fx-small fx-muted">Why they want to join</span>
                  <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>{htmlToText(str(r, 'description'))}</p>
                </div>
              ) : null}
              {docs.length ? (
                <div className="fx-row">
                  {docs.map((d, i) => (
                    <a key={i} className="fx-btn fx-btn-small" href={resolveApiAssetUrl(d.url ?? '')} target="_blank" rel="noopener noreferrer">
                      📎 {d.name || `Document ${i + 1}`}
                    </a>
                  ))}
                </div>
              ) : (
                <span className="fx-small fx-muted">No documents uploaded.</span>
              )}
              {str(r, 'review_note') ? (
                <div className="fx-alert fx-alert-info">
                  Note: {str(r, 'review_note')} {str(r, 'reviewed_by') ? `— ${str(r, 'reviewed_by')}` : ''}
                </div>
              ) : null}
              <div className="fx-row" style={{ justifyContent: 'flex-end' }}>
                {status !== 'rejected' ? (
                  <button type="button" className="fx-btn fx-btn-danger" onClick={() => setDecision({ record: r, action: 'rejected' })}>
                    Reject
                  </button>
                ) : null}
                {status !== 'approved' ? (
                  <button type="button" className="fx-btn fx-btn-good" onClick={() => setDecision({ record: r, action: 'approved' })}>
                    Approve
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}

      <ConfirmDialog
        open={decision !== null}
        busy={busy}
        tone={decision?.action === 'rejected' ? 'danger' : 'primary'}
        title={decision?.action === 'approved' ? 'Approve this enrollment?' : 'Reject this enrollment?'}
        confirmLabel={decision?.action === 'approved' ? 'Yes, approve' : 'Reject application'}
        onCancel={() => {
          setDecision(null);
          setNote('');
        }}
        onConfirm={() => void submit()}
      >
        {decision ? (
          <>
            <p style={{ margin: 0 }}>
              <strong>
                {str(decision.record, 'first_name')} {str(decision.record, 'last_name')}
              </strong>{' '}
              → {str(decision.record, 'course')}
            </p>
            <label className="fx-field">
              {decision.action === 'rejected' ? 'Reason (sent to the applicant)' : 'Welcome message (optional)'}
              <textarea className="fx-textarea" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <p className="confirm-note">The applicant will get an in-app notification and an SMS.</p>
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

export default EnrollmentReview;
