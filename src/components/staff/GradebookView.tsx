import { useEffect, useMemo, useState } from 'react';
import { useStaffRecords } from '../../hooks/useAdminRecords';
import type { StaffScope } from '../../utils/auth';
import { downloadCsv, fetchGradebook, type Gradebook } from '../../utils/features';
import { Spinner, errorReason } from '../admin/Toast';
import '../../styles/features.css';

function scoreClass(pct: number, pass: number) {
  if (pct >= Math.max(pass + 20, 70)) return 'fx-score-high';
  if (pct >= pass) return 'fx-score-mid';
  return 'fx-score-low';
}

function fmtDate(value: string) {
  const t = Date.parse(value);
  return Number.isNaN(t) ? '—' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(t));
}

/** Every learner × every assignment and quiz in a course, with CA and at-risk flags. */
function GradebookView({ scope }: { scope: StaffScope }) {
  const courses = useStaffRecords<Record<string, unknown>>(scope, 'Course');
  const names = useMemo(() => courses.records.map((c) => String(c.name ?? '')).filter(Boolean), [courses.records]);
  const [course, setCourse] = useState('');
  const [book, setBook] = useState<Gradebook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskOnly, setRiskOnly] = useState(false);

  useEffect(() => {
    if (!course && names.length) setCourse(names[0]);
  }, [names, course]);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGradebook(scope, course)
      .then((data) => !cancelled && setBook(data))
      .catch((e) => !cancelled && setError(errorReason(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scope, course]);

  const rows = useMemo(() => (book ? book.rows.filter((r) => !riskOnly || r.risks.length) : []), [book, riskOnly]);
  const atRisk = book ? book.rows.filter((r) => r.risks.length).length : 0;
  const classAverage = useMemo(() => {
    const cas = (book?.rows ?? []).map((r) => r.ca).filter((v): v is number => v !== null);
    return cas.length ? cas.reduce((a, b) => a + b, 0) / cas.length : null;
  }, [book]);

  const exportCsv = () => {
    if (!book) return;
    const header = ['Learner', 'Email', ...book.columns.map((c) => `${c.title} (${c.kind})`), 'CA %', 'At risk', 'Last active'];
    const body = book.rows.map((r) => [
      r.name,
      r.email,
      ...book.columns.map((c) => {
        const cell = r.cells[c.key];
        if (!cell) return '';
        if (cell.max_score > 0 && (cell.status === 'marked' || cell.status === 'returned')) return `${cell.score}/${cell.max_score}`;
        return cell.status || 'submitted';
      }),
      r.ca === null ? '' : r.ca.toFixed(1),
      r.risks.join('; '),
      fmtDate(r.last_active),
    ]);
    downloadCsv(`gradebook-${book.course.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`, [header, ...body]);
  };

  return (
    <div className="fx">
      <div className="fx-spread fx-no-print">
        <div className="fx-row">
          <select className="fx-select" style={{ width: 'auto', minWidth: 260 }} value={course} onChange={(e) => setCourse(e.target.value)}>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className="fx-row fx-small">
            <input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} /> Show at-risk learners only
          </label>
        </div>
        <button type="button" className="fx-btn" onClick={exportCsv} disabled={!book || loading}>
          ⬇ Export to Excel (CSV)
        </button>
      </div>

      {book ? (
        <div className="fx-kpis">
          <div className="fx-kpi">
            <strong>{book.rows.length}</strong>
            <span>Learners</span>
          </div>
          <div className="fx-kpi">
            <strong>{classAverage === null ? '—' : `${Math.round(classAverage)}%`}</strong>
            <span>Class average CA</span>
          </div>
          <div className="fx-kpi">
            <strong>{book.columns.length}</strong>
            <span>Assessments</span>
          </div>
          <div className="fx-kpi">
            <strong style={{ color: atRisk ? '#b3203a' : undefined }}>{atRisk}</strong>
            <span>At risk</span>
          </div>
        </div>
      ) : null}

      {error ? <div className="fx-alert">{error}</div> : null}
      {!names.length && !courses.isLoading ? <div className="fx-empty">No courses to show.</div> : null}

      {loading && !book ? (
        <div className="fx-empty">
          <Spinner /> Loading gradebook…
        </div>
      ) : book ? (
        <div className="fx-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
          <table className="fx-table fx-gradebook">
            <thead>
              <tr>
                <th className="fx-sticky">Learner</th>
                {book.columns.map((c) => (
                  <th key={c.key} title={c.title}>
                    {c.title.length > 22 ? `${c.title.slice(0, 21)}…` : c.title}
                    <div style={{ textTransform: 'none', fontWeight: 400 }}>
                      {c.kind === 'quiz' ? 'Quiz' : c.due ? `Due ${fmtDate(c.due)}` : 'Assignment'}
                    </div>
                  </th>
                ))}
                <th>CA</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={book.columns.length + 3} className="fx-muted" style={{ textAlign: 'center', padding: 24 }}>
                    {riskOnly ? 'Nobody is at risk right now. 🎉' : 'No learners enrolled yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.email}>
                    <td className="fx-sticky">
                      <strong>{r.name || r.email}</strong>
                      <div className="fx-small fx-muted">Active {fmtDate(r.last_active)}</div>
                    </td>
                    {book.columns.map((c) => {
                      const cell = r.cells[c.key];
                      if (!cell) return <td key={c.key}><span className="fx-score fx-score-none">—</span></td>;
                      const scored = cell.max_score > 0 && (cell.status === 'marked' || cell.status === 'returned');
                      if (!scored) {
                        return (
                          <td key={c.key}>
                            <span className="fx-pill fx-pill-warn">To mark</span>
                          </td>
                        );
                      }
                      const pct = (cell.score / cell.max_score) * 100;
                      return (
                        <td key={c.key}>
                          <span className={`fx-score ${scoreClass(pct, book.pass_mark)}`} title={`${Math.round(pct)}%`}>
                            {cell.score}/{cell.max_score}
                          </span>
                        </td>
                      );
                    })}
                    <td>
                      {r.ca === null ? (
                        <span className="fx-score fx-score-none">—</span>
                      ) : (
                        <span className={`fx-score ${scoreClass(r.ca, book.pass_mark)}`}>{Math.round(r.ca)}%</span>
                      )}
                    </td>
                    <td>
                      {r.risks.length ? (
                        <div className="fx-row" style={{ gap: 4 }}>
                          {r.risks.map((risk) => (
                            <span key={risk} className="fx-pill fx-pill-bad">
                              {risk}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="fx-pill fx-pill-good">On track</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {book ? (
        <p className="fx-small fx-muted" style={{ margin: 0 }}>
          CA = marks awarded ÷ marks available across marked assignments and each quiz's best attempt. Pass mark {book.pass_mark}%.
          Learners are flagged when CA is below the pass mark, they've been inactive 10+ days, or assignments are overdue.
        </p>
      ) : null}
    </div>
  );
}

export default GradebookView;
