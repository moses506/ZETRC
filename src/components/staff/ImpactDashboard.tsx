import { useEffect, useState } from 'react';
import { downloadCsv, fetchImpact, type CountRow, type ImpactReport } from '../../utils/features';
import { Spinner, errorReason } from '../admin/Toast';
import '../../styles/features.css';

const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v)}%`);

function Bars({ rows, color = '#2a78d6' }: { rows: CountRow[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <div className="fx-empty">No data yet.</div>;
  return (
    <div className="fx-bar-list">
      {rows.map((r) => (
        <div className="fx-bar-row" key={r.label}>
          <span style={{ textTransform: 'capitalize' }}>{r.label}</span>
          <div className="fx-bar-track">
            <div className="fx-bar-fill" style={{ width: `${(r.count / max) * 100}%`, background: color }} />
          </div>
          <strong>{r.count}</strong>
        </div>
      ))}
    </div>
  );
}

const monthLabel = (m: string) => {
  const [y, mo] = m.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(new Date(y, (mo || 1) - 1, 1));
};

/** Funder-facing impact report: reach, completion, CA, by district/gender/course. */
function ImpactDashboard() {
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImpact()
      .then(setReport)
      .catch((e) => setError(errorReason(e)));
  }, []);

  if (error) return <div className="fx"><div className="fx-alert">{error}</div></div>;
  if (!report)
    return (
      <div className="fx">
        <div className="fx-empty">
          <Spinner /> Building impact report…
        </div>
      </div>
    );

  const t = report.totals;
  const monthMax = Math.max(1, ...report.by_month.map((m) => m.count));

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['ZETRC impact report', new Date(report.generated_at).toLocaleString('en-GB')],
      [],
      ['Measure', 'Value'],
      ['Learners registered', t.learners],
      ['Active learners (30 days)', t.active_30d],
      ['Enrollments', t.enrollments],
      ['Approved enrollments', t.approved],
      ['Certificates awarded', t.certificates],
      ['Completion rate %', Math.round(t.completion_rate)],
      ['Average CA %', t.average_ca === null ? '' : Math.round(t.average_ca)],
      ['Assignments submitted', t.submissions],
      ['Quiz attempts', t.quiz_attempts],
      ['Field photos', t.field_photos],
      [],
      ['Course', 'Enrollments', 'Certificates', 'Completion %', 'Average CA %'],
      ...report.by_course.map((c) => [c.course, c.enrollments, c.certificates, Math.round(c.completion), c.average_ca === null ? '' : Math.round(c.average_ca)]),
      [],
      ['District', 'Learners'],
      ...report.by_district.map((d) => [d.label, d.count]),
      [],
      ['Gender', 'Learners'],
      ...report.by_gender.map((g) => [g.label, g.count]),
    ];
    downloadCsv('zetrc-impact-report.csv', rows);
  };

  return (
    <div className="fx">
      <div className="fx-spread fx-no-print">
        <span className="fx-small fx-muted">Generated {new Date(report.generated_at).toLocaleString('en-GB')}</span>
        <div className="fx-row">
          <button type="button" className="fx-btn" onClick={exportCsv}>
            ⬇ Export CSV
          </button>
          <button type="button" className="fx-btn fx-btn-primary" onClick={() => window.print()}>
            🖨 Print / save as PDF
          </button>
        </div>
      </div>

      <div className="fx-kpis">
        {[
          ['Learners reached', t.learners],
          ['Active (30 days)', t.active_30d],
          ['Enrollments', t.enrollments],
          ['Certificates awarded', t.certificates],
          ['Completion rate', pct(t.completion_rate)],
          ['Average CA', pct(t.average_ca)],
          ['Pending applications', t.pending],
          ['Field photos', t.field_photos],
        ].map(([label, value]) => (
          <div className="fx-kpi" key={String(label)}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="fx-card fx" style={{ gap: 12 }}>
        <h3>New enrollments per month</h3>
        {report.by_month.length === 0 ? (
          <div className="fx-empty">No enrollments in the last 12 months.</div>
        ) : (
          <div className="fx-months" role="img" aria-label="Enrollments per month">
            {report.by_month.map((m) => (
              <div className="fx-month" key={m.month} title={`${m.month}: ${m.count}`}>
                <strong>{m.count}</strong>
                <div className="fx-month-bar" style={{ height: `${(m.count / monthMax) * 100}%` }} />
                <span>{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fx-grid-2">
        <div className="fx-card fx" style={{ gap: 12 }}>
          <h3>Learners by district</h3>
          <Bars rows={report.by_district} />
        </div>
        <div className="fx-card fx" style={{ gap: 12 }}>
          <h3>Learners by gender</h3>
          <Bars rows={report.by_gender} color="#1baf7a" />
        </div>
      </div>

      <div className="fx-card fx" style={{ gap: 12 }}>
        <h3>By course</h3>
        <div className="fx-table-wrap">
          <table className="fx-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Enrollments</th>
                <th>Certificates</th>
                <th>Completion</th>
                <th>Average CA</th>
              </tr>
            </thead>
            <tbody>
              {report.by_course.map((c) => (
                <tr key={c.course}>
                  <td>
                    <strong>{c.course}</strong>
                  </td>
                  <td>{c.enrollments}</td>
                  <td>{c.certificates}</td>
                  <td>
                    <div className="fx-bar-row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <div className="fx-bar-track">
                        <div className="fx-bar-fill" style={{ width: `${Math.min(100, c.completion)}%`, background: '#1baf7a' }} />
                      </div>
                      <span>{pct(c.completion)}</span>
                    </div>
                  </td>
                  <td>{pct(c.average_ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="fx-small fx-muted" style={{ margin: 0 }}>
        District and gender come from learners' profiles ("Not stated" until they fill them in). Completion = certificates ÷ approved enrollments.
      </p>
    </div>
  );
}

export default ImpactDashboard;
