import { KeyboardEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  /** One value (0–100) per entry in `days`. */
  values: number[];
};

type ProgressLineChartProps = {
  days: number[];
  series: ChartSeries[];
  height?: number;
  ariaLabel: string;
};

/** Whole percents, but one decimal for small values so early progress isn't shown as 0%. */
export function formatPercent(value: number): string {
  if (value > 0 && value < 10) return `${value.toFixed(1)}%`;
  return `${Math.round(value)}%`;
}

const MARGIN = { top: 16, bottom: 34, left: 44 };

/** Smallest "nice" axis top that fits the data, so small progress is still visible. */
function niceMax(maxValue: number): number {
  const steps = [5, 10, 20, 25, 50, 100];
  return steps.find((step) => maxValue <= step * 0.95) ?? 100;
}

const dayLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const longDayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Smooth path through the points using monotone cubic interpolation
 * (Fritsch–Carlson): curves gently but never overshoots, so a flat stretch
 * stays flat and progress never appears to dip.
 */
function monotonePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x},${points[0].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = points[i + 1].x - points[i].x;
    slope[i] = dx[i] === 0 ? 0 : (points[i + 1].y - points[i].y) / dx[i];
  }

  const tangent: number[] = new Array(n);
  tangent[0] = slope[0];
  tangent[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const third = dx[i] / 3;
    d += ` C${points[i].x + third},${points[i].y + tangent[i] * third} ${points[i + 1].x - third},${
      points[i + 1].y - tangent[i + 1] * third
    } ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

const gradientId = (id: string) => `progress-fill-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

/** Nudges end labels apart so they never overlap (min 14px between baselines). */
function spreadLabels(items: { id: string; y: number }[], min: number, max: number) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i += 1) {
    sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + 14);
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].y - max : 0;
  if (overflow > 0) sorted.forEach((item) => (item.y -= overflow));
  for (let i = sorted.length - 2; i >= 0; i -= 1) {
    sorted[i].y = Math.min(sorted[i].y, sorted[i + 1].y - 14);
  }
  sorted.forEach((item) => (item.y = Math.max(item.y, min)));
  return Object.fromEntries(sorted.map((item) => [item.id, item.y]));
}

function ProgressLineChart({ days, series, height = 300, ariaLabel }: ProgressLineChartProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const yMax = useMemo(
    () => niceMax(Math.max(0, ...series.flatMap((s) => s.values))),
    [series],
  );
  const yTicks = useMemo(() => {
    const step = ({ 5: 1, 10: 2, 20: 5, 25: 5, 50: 10 } as Record<number, number>)[yMax] ?? 25;
    const ticks: number[] = [];
    for (let tick = 0; tick <= yMax; tick += step) ticks.push(tick);
    return ticks;
  }, [yMax]);

  const directLabels = series.length <= 4;
  const right = directLabels ? 132 : 16;
  const plotW = Math.max(40, width - MARGIN.left - right);
  const plotH = height - MARGIN.top - MARGIN.bottom;

  const x = (index: number) => MARGIN.left + (days.length <= 1 ? plotW / 2 : (index / (days.length - 1)) * plotW);
  const y = (value: number) => MARGIN.top + plotH - (Math.max(0, Math.min(yMax, value)) / yMax) * plotH;

  const xTicks = useMemo(() => {
    if (days.length <= 1) return days.map((_, index) => index);
    const count = Math.min(6, days.length, Math.max(2, Math.floor(plotW / 90)));
    const ticks = new Set<number>();
    for (let i = 0; i < count; i += 1) ticks.add(Math.round((i / (count - 1)) * (days.length - 1)));
    return [...ticks];
  }, [days, plotW]);

  const endLabelY = useMemo(
    () =>
      directLabels
        ? spreadLabels(
            series.map((s) => ({ id: s.id, y: y(s.values[s.values.length - 1] ?? 0) + 4 })),
            MARGIN.top + 4,
            MARGIN.top + plotH + 4,
          )
        : {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, directLabels, plotH, yMax],
  );

  const pickIndex = (clientX: number, rect: DOMRect) => {
    if (days.length === 0) return null;
    const relative = ((clientX - rect.left) / rect.width) * width - MARGIN.left;
    const ratio = days.length <= 1 ? 0 : relative / plotW;
    return Math.max(0, Math.min(days.length - 1, Math.round(ratio * (days.length - 1))));
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    setHoverIndex(pickIndex(event.clientX, event.currentTarget.getBoundingClientRect()));
  };

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!days.length) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      setHoverIndex((index) => Math.max(0, Math.min(days.length - 1, (index ?? days.length - 1) + step)));
    } else if (event.key === 'Escape') {
      setHoverIndex(null);
    }
  };

  const tooltipRows =
    hoverIndex === null
      ? []
      : series
          .map((s) => ({ ...s, value: s.values[hoverIndex] ?? 0 }))
          .sort((a, b) => b.value - a.value);

  const tooltipLeft = hoverIndex === null ? 0 : (x(hoverIndex) / width) * 100;
  const baseline = MARGIN.top + plotH;
  const showFill = series.length <= 4;
  const paths = series.map((s) => {
    const line = monotonePath(s.values.map((value, index) => ({ x: x(index), y: y(value) })));
    const area = line ? `${line} L${x(s.values.length - 1)},${baseline} L${x(0)},${baseline} Z` : '';
    return { ...s, line, area };
  });
  // Re-run the draw-in animation when the data set changes.
  const animationKey = `${days.length}-${series.map((s) => s.id).join('|')}`;

  return (
    <div className="progress-chart" ref={ref}>
      {series.length >= 2 ? (
        <ul className="progress-legend" aria-label="Legend">
          {series.map((s) => (
            <li key={s.id}>
              <span className="progress-legend-key" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="progress-chart-plot">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex((index) => index ?? days.length - 1)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={handleKeyDown}
        >
          <defs>
            {paths.map((s) => (
              <linearGradient key={s.id} id={gradientId(s.id)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={series.length === 1 ? 0.22 : 0.14} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + plotW}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? 'progress-axis-line' : 'progress-grid-line'}
              />
              <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end" className="progress-axis-text">
                {tick}%
              </text>
            </g>
          ))}

          {xTicks.map((index) => (
            <text
              key={index}
              x={x(index)}
              y={height - 10}
              textAnchor={index === 0 ? 'start' : index === days.length - 1 ? 'end' : 'middle'}
              className="progress-axis-text"
            >
              {dayLabel.format(new Date(days[index]))}
            </text>
          ))}

          <g key={animationKey}>
            {showFill
              ? paths.map((s) => (
                  <path key={`${s.id}-area`} d={s.area} fill={`url(#${gradientId(s.id)})`} className="progress-area" />
                ))
              : null}
            {paths.map((s) => (
              <path
                key={s.id}
                d={s.line}
                pathLength={1}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="progress-line"
              />
            ))}
          </g>

          {hoverIndex === null
            ? series.map((s) => (
                <circle
                  key={s.id}
                  cx={x(s.values.length - 1)}
                  cy={y(s.values[s.values.length - 1] ?? 0)}
                  r={5}
                  fill={s.color}
                  className="progress-marker progress-marker-end"
                />
              ))
            : null}

          {directLabels
            ? series.map((s) => (
                <text
                  key={s.id}
                  x={MARGIN.left + plotW + 10}
                  y={endLabelY[s.id]}
                  className="progress-end-label"
                >
                  <tspan className="progress-end-value">{formatPercent(s.values[s.values.length - 1] ?? 0)}</tspan>
                  <tspan dx={6}>{s.label.length > 14 ? `${s.label.slice(0, 13)}…` : s.label}</tspan>
                </text>
              ))
            : null}

          {hoverIndex !== null ? (
            <g>
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotH}
                className="progress-crosshair"
              />
              {series.map((s) => (
                <circle
                  key={s.id}
                  cx={x(hoverIndex)}
                  cy={y(s.values[hoverIndex] ?? 0)}
                  r={5.5}
                  fill={s.color}
                  className="progress-marker"
                />
              ))}
            </g>
          ) : null}
        </svg>

        {hoverIndex !== null && days[hoverIndex] !== undefined ? (
          <div
            className={`progress-tooltip${tooltipLeft > 60 ? ' progress-tooltip-left' : ''}`}
            style={{ left: `${tooltipLeft}%` }}
            role="status"
          >
            <div className="progress-tooltip-date">{longDayLabel.format(new Date(days[hoverIndex]))}</div>
            {tooltipRows.map((row) => (
              <div key={row.id} className="progress-tooltip-row">
                <span className="progress-tooltip-key" style={{ background: row.color }} />
                <strong>{formatPercent(row.value)}</strong>
                <span>{row.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProgressLineChart;
