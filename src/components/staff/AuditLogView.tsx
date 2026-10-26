import { useEffect, useState } from 'react';
import { fetchAuditLog, type AuditEntry } from '../../utils/features';
import { errorReason } from '../admin/Toast';
import '../../styles/features.css';

const MODELS = [
  'Account', 'Course', 'Course_Module', 'Lesson_Content', 'Assignment', 'Assignment_Submission', 'Quiz',
  'Announcement', 'Certificate', 'Student_Enrollment', 'Discussion', 'Lead', 'Inquiry', 'Proposal_Request',
];

function fmt(value: string) {
  const t = Date.parse(value);
  return Number.isNaN(t)
    ? ''
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(t));
}

function prettyChanges(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

/** Who changed what, and when — every staff change is recorded. */
function AuditLogView() {
  const [model, setModel] = useState('');
  const [actor, setActor] = useState('');
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchAuditLog({ model, actor: actor.trim() })
        .then((data) => !cancelled && (setRows(data), setError(null)))
        .catch((e) => !cancelled && setError(errorReason(e)))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [model, actor]);

  return (
    <div className="fx">
      <div className="fx-row">
        <select className="fx-select" style={{ width: 'auto' }} value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="">All record types</option>
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <input
          className="fx-input"
          style={{ maxWidth: 280 }}
          placeholder="Filter by staff email…"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        />
        <span className="fx-small fx-muted">Latest 300 changes</span>
      </div>

      {error ? <div className="fx-alert">{error}</div> : null}

      <div className="fx-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
        <table className="fx-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>What changed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="fx-muted" style={{ textAlign: 'center', padding: 24 }}>
                  No changes recorded yet.
                </td>
              </tr>
            ) : (
              rows.flatMap((row) => [
                <tr key={row.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(row.creation)}</td>
                  <td>
                    {row.actor_email}
                    <div className="fx-small fx-muted">{row.actor_role}</div>
                  </td>
                  <td>
                    <span
                      className={`fx-pill ${
                        row.action === 'delete' ? 'fx-pill-bad' : row.action === 'create' ? 'fx-pill-good' : 'fx-pill-blue'
                      }`}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td>{row.summary}</td>
                  <td>
                    <button type="button" className="fx-btn fx-btn-small" onClick={() => setOpen(open === row.id ? null : row.id)}>
                      {open === row.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>,
                open === row.id ? (
                  <tr key={`${row.id}-details`}>
                    <td colSpan={5}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, background: '#f5f8f3', padding: 12, borderRadius: 10 }}>
                        {prettyChanges(row.changes)}
                      </pre>
                    </td>
                  </tr>
                ) : null,
              ])
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogView;
