import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProgressReport, type ProgressReport } from '../../utils/api';
import type { StaffScope } from '../../utils/auth';
import ProgressLineChart, { formatPercent, type ChartSeries } from './ProgressLineChart';
import { AdminIcon } from './AdminIcons';
import '../../styles/admin.css';

// Categorical palette, assigned in fixed order to a stable entity order (never by rank).
const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const MAX_SERIES = SERIES_COLORS.length;
const DAY_MS = 86_400_000;

type RangeKey = '7' | '30' | '90' | 'all';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
];

type PairStats = {
  email: string;
  name: string;
  course: string;
  percent: number;
  completedLessons: number;
  totalLessons: number;
  lastActive: number;
};

type ProgressViewProps = {
  scope: StaffScope;
};

function startOfDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function parseTime(value: string | undefined) {
  const time = Date.parse(value ?? '');
  return Number.isNaN(time) ? 0 : time;
}

const pairKey = (email: string, course: string) => `${email.toLowerCase()}|${course}`;

function relativeTime(time: number): string {
  if (!time) return 'No activity yet';
  const days = Math.floor((Date.now() - time) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(time));
}

function ProgressView({ scope }: ProgressViewProps) {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [course, setCourse] = useState<string>('all');
  const [range, setRange] = useState<RangeKey>('30');
  const [search, setSearch] = useState('');
  const [showChartTable, setShowChartTable] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const started = Date.now();
    try {
      const next = await fetchProgressReport(scope);
      // Keep the spinner visible briefly so a fast refresh still reads as one.
      const elapsed = Date.now() - started;
      if (elapsed < 450) await new Promise((resolve) => setTimeout(resolve, 450 - elapsed));
      setReport(next);
      setUpdatedAt(Date.now());
      setLoadCount((count) => count + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load learner progress.');
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const courseNames = useMemo(() => (report?.courses ?? []).map((c) => c.name), [report]);

  // Lessons per course; falls back to lessons seen in progress if none are published yet.
  const lessonsIn = useCallback(
    (courseName: string) => {
      const published = report?.lessons_per_course[courseName] ?? 0;
      if (published > 0) return published;
      const seen = new Set((report?.progress ?? []).filter((row) => row.course === courseName).map((row) => row.key));
      return Math.max(1, seen.size);
    },
    [report],
  );

  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of report?.enrollments ?? []) {
      map[e.email.toLowerCase()] = `${e.first_name} ${e.last_name}`.trim() || e.email;
    }
    return map;
  }, [report]);

  // Every learner/course pair: enrolled learners plus anyone with progress.
  const pairs = useMemo<PairStats[]>(() => {
    if (!report) return [];
    const map = new Map<string, PairStats>();
    const ensure = (email: string, courseName: string) => {
      const key = pairKey(email, courseName);
      if (!map.has(key)) {
        map.set(key, {
          email: email.toLowerCase(),
          name: names[email.toLowerCase()] ?? email,
          course: courseName,
          percent: 0,
          completedLessons: 0,
          totalLessons: lessonsIn(courseName),
          lastActive: 0,
        });
      }
      return map.get(key)!;
    };

    for (const e of report.enrollments) ensure(e.email, e.course);
    for (const row of report.progress) {
      if (!row.course) continue;
      const pair = ensure(row.learner_email, row.course);
      pair.percent += row.percent;
      if (row.completed || row.percent >= 95) pair.completedLessons += 1;
      pair.lastActive = Math.max(pair.lastActive, parseTime(row.modified));
    }
    for (const pair of map.values()) {
      pair.percent = Math.min(100, pair.percent / pair.totalLessons);
      pair.completedLessons = Math.min(pair.completedLessons, pair.totalLessons);
    }
    return [...map.values()];
  }, [report, names, lessonsIn]);

  const scopedPairs = useMemo(
    () => (course === 'all' ? pairs : pairs.filter((pair) => pair.course === course)),
    [pairs, course],
  );

  // Daily axis for the selected range.
  const days = useMemo(() => {
    const today = startOfDay(Date.now());
    let start: number;
    if (range === 'all') {
      const earliest = Math.min(
        today - 6 * DAY_MS,
        ...(report?.logs ?? []).map((log) => startOfDay(parseTime(log.creation))).filter(Boolean),
        ...(report?.enrollments ?? []).map((e) => startOfDay(parseTime(e.creation))).filter(Boolean),
      );
      start = earliest;
    } else {
      start = today - (Number(range) - 1) * DAY_MS;
    }
    const list: number[] = [];
    for (let day = start; day <= today; day += DAY_MS) list.push(day);
    return list;
  }, [range, report]);

  // Progress of each pair at the end of each day, rebuilt from the history log.
  const pairSeries = useMemo(() => {
    const result = new Map<string, number[]>();
    if (!report) return result;

    const logsByPair = new Map<string, { time: number; key: string; percent: number }[]>();
    for (const log of report.logs) {
      if (!log.course) continue;
      const key = pairKey(log.learner_email, log.course);
      if (!logsByPair.has(key)) logsByPair.set(key, []);
      logsByPair.get(key)!.push({ time: parseTime(log.creation), key: log.key, percent: log.percent });
    }

    for (const pair of pairs) {
      const key = pairKey(pair.email, pair.course);
      const logs = (logsByPair.get(key) ?? []).sort((a, b) => a.time - b.time);
      const best: Record<string, number> = {};
      let cursor = 0;
      const values = days.map((day) => {
        const end = day + DAY_MS;
        while (cursor < logs.length && logs[cursor].time < end) {
          const log = logs[cursor];
          best[log.key] = Math.max(best[log.key] ?? 0, log.percent);
          cursor += 1;
        }
        const total = Object.values(best).reduce((sum, value) => sum + value, 0);
        return Math.min(100, total / pair.totalLessons);
      });
      // History is logged in steps; today always reflects the learner's current progress.
      if (values.length > 0) {
        values[values.length - 1] = Math.max(values[values.length - 1], pair.percent);
      }
      result.set(key, values);
    }
    return result;
  }, [report, pairs, days]);

  const { series, hiddenCount } = useMemo(() => {
    if (course === 'all') {
      // One line per course: average progress of its learners.
      const withLearners = courseNames.filter((name) => pairs.some((pair) => pair.course === name));
      const list: ChartSeries[] = withLearners.slice(0, MAX_SERIES).map((name) => {
        const coursePairs = pairs.filter((pair) => pair.course === name);
        const values = days.map((_, index) => {
          const sum = coursePairs.reduce(
            (total, pair) => total + (pairSeries.get(pairKey(pair.email, pair.course))?.[index] ?? 0),
            0,
          );
          return sum / coursePairs.length;
        });
        return {
          id: name,
          label: name,
          color: SERIES_COLORS[courseNames.indexOf(name) % MAX_SERIES],
          values,
        };
      });
      return { series: list, hiddenCount: Math.max(0, withLearners.length - MAX_SERIES) };
    }

    // One line per learner in the chosen course, in a stable (alphabetical) order.
    const learners = [...scopedPairs].sort((a, b) => a.name.localeCompare(b.name));
    const list: ChartSeries[] = learners.slice(0, MAX_SERIES).map((pair, index) => ({
      id: pair.email,
      label: pair.name,
      color: SERIES_COLORS[index],
      values: pairSeries.get(pairKey(pair.email, pair.course)) ?? days.map(() => 0),
    }));
    return { series: list, hiddenCount: Math.max(0, learners.length - MAX_SERIES) };
  }, [course, courseNames, pairs, scopedPairs, days, pairSeries]);

  const stats = useMemo(() => {
    const learners = new Set(scopedPairs.map((pair) => pair.email));
    const average = scopedPairs.length
      ? scopedPairs.reduce((sum, pair) => sum + pair.percent, 0) / scopedPairs.length
      : 0;
    const completed = scopedPairs.reduce((sum, pair) => sum + pair.completedLessons, 0);
    const weekAgo = Date.now() - 7 * DAY_MS;
    const active = new Set(scopedPairs.filter((pair) => pair.lastActive >= weekAgo).map((pair) => pair.email));
    const finished = scopedPairs.filter((pair) => pair.percent >= 99.5).length;
    return { learners: learners.size, average, completed, active: active.size, finished };
  }, [scopedPairs]);

  const tableRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scopedPairs
      .filter((pair) => !term || `${pair.name} ${pair.email} ${pair.course}`.toLowerCase().includes(term))
      .sort((a, b) => b.percent - a.percent || b.lastActive - a.lastActive);
  }, [scopedPairs, search]);

  const chartTitle =
    course === 'all' ? 'Average learner progress by course' : `Learner progress · ${course}`;

  return (
    <div className="admin-overview progress-view">
      <div className="progress-filters">
        <select value={course} onChange={(event) => setCourse(event.target.value)} aria-label="Course">
          <option value="all">All courses</option>
          {courseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="progress-range" role="group" aria-label="Date range">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={range === option.key ? 'progress-range-active' : ''}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="progress-updated" aria-live="polite">
          {isLoading
            ? 'Updating…'
            : updatedAt
              ? `Updated ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(updatedAt))}`
              : ''}
        </span>
        <button
          type="button"
          className={`admin-btn progress-refresh${isLoading ? ' progress-refresh-busy' : ''}`}
          onClick={() => void load()}
          disabled={isLoading}
        >
          <AdminIcon name="refresh" size={14} />
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {errorMessage ? <div className="admin-alert admin-alert-error">{errorMessage}</div> : null}

      <div className={`progress-body${isLoading && report ? ' progress-body-loading' : ''}`}>
        <div className="progress-stats">
          {[
            { label: 'Learners tracked', value: String(stats.learners) },
            { label: 'Average completion', value: formatPercent(stats.average) },
            { label: 'Lessons completed', value: String(stats.completed) },
            { label: 'Active in last 7 days', value: String(stats.active) },
            { label: 'Finished a course', value: String(stats.finished) },
          ].map((stat) => (
            <div key={stat.label} className="progress-stat">
              <span className="progress-stat-value">{!report && isLoading ? '–' : stat.value}</span>
              <span className="progress-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>{chartTitle}</h2>
              <p className="progress-subtitle">
                Share of lessons completed, per day
                {hiddenCount > 0 ? ` · showing ${series.length}, ${hiddenCount} more in the table below` : ''}
              </p>
            </div>
            <button type="button" className="admin-panel-link" onClick={() => setShowChartTable((v) => !v)}>
              {showChartTable ? 'Show chart' : 'View as table'}
            </button>
          </div>

          {!report && isLoading ? (
            <p className="admin-panel-empty">Loading progress…</p>
          ) : series.length === 0 ? (
            <p className="admin-panel-empty">
              No learner progress yet. Progress appears here once enrolled learners start their lessons.
            </p>
          ) : showChartTable ? (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{course === 'all' ? 'Course' : 'Learner'}</th>
                    <th>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(days[0]))}</th>
                    <th>Today</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s) => {
                    const first = s.values[0] ?? 0;
                    const last = s.values[s.values.length - 1] ?? 0;
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="progress-legend-key" style={{ background: s.color }} /> {s.label}
                        </td>
                            <td>{first.toFixed(1)}%</td>
                        <td>{last.toFixed(1)}%</td>
                        <td>{last - first >= 0.05 ? `+${(last - first).toFixed(1)} pts` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <ProgressLineChart key={loadCount} days={days} series={series} ariaLabel={chartTitle} />
          )}
        </div>

        <div className="admin-table-panel">
          <div className="admin-table-header">
            <div className="admin-table-heading">
              <h2 className="progress-table-title">Progress by learner</h2>
              <p className="admin-table-description">Current completion for each learner and course.</p>
            </div>
            <div className="admin-table-tools">
              <input
                type="search"
                className="admin-search"
                placeholder="Search learners…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Course</th>
                  <th>Progress</th>
                  <th>Lessons</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      {search ? 'No learners match your search.' : 'No enrolled learners yet.'}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((pair) => (
                    <tr key={pairKey(pair.email, pair.course)}>
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-user-avatar">
                            {pair.name
                              .split(/\s+/)
                              .map((part) => part.charAt(0))
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <span>
                            <strong>{pair.name}</strong>
                            <span className="admin-user-email">{pair.email}</span>
                          </span>
                        </div>
                      </td>
                      <td>{pair.course}</td>
                      <td>
                        <div className="progress-bar-cell">
                          <div className="progress-bar-track">
                            <span
                              className={`progress-bar-fill${pair.percent >= 99.5 ? ' progress-bar-done' : ''}`}
                              style={{ width: `${Math.max(pair.percent > 0 ? 3 : 0, pair.percent)}%` }}
                            />
                          </div>
                          <strong>{formatPercent(pair.percent)}</strong>
                        </div>
                      </td>
                      <td>
                        {pair.completedLessons} / {pair.totalLessons}
                      </td>
                      <td className="admin-muted">{relativeTime(pair.lastActive)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressView;
