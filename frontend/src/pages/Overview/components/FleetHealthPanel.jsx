import { Panel, StatusPill } from './overview.primitives.jsx';
import EmptyState from '../../../components/cluster/EmptyState';
import { FleetHealthSkeleton } from './OverviewSkeletons.jsx';
import { gradeSignal } from '../../../utils/formatters';

const SIGNAL = {
  ok: 'var(--ok)',
  caution: 'var(--caution)',
  critical: 'var(--critical)',
};

/** Compact score ring — one hue by grade band, thin stroke, tabular centre. */
function ScoreRing({ score = 0, grade = 'D', color }) {
  const size = 132;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`Fleet health ${Math.round(score)} of 100, grade ${grade}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="num text-3xl font-bold leading-none"
          style={{ color: 'var(--cluster-text)' }}
        >
          {Math.round(score)}
        </span>
        <span className="text-dim text-[10px] font-medium">/ 100</span>
      </div>
    </div>
  );
}

/** One penalty component as a labelled bar: penalty / weight fills the track. */
function ComponentBar({ name, comp }) {
  const weight = comp?.weight || 0;
  const penalty = comp?.penalty || 0;
  const pct = weight > 0 ? Math.min(100, (penalty / weight) * 100) : 0;
  const tone = penalty <= 0 ? 'ok' : pct >= 60 ? 'critical' : 'caution';
  const color = SIGNAL[tone];
  return (
    <div className="flex items-center gap-3" title={comp?.detail || ''}>
      <span
        className="w-20 shrink-0 text-xs font-medium capitalize"
        style={{ color: 'var(--cluster-text-dim)' }}
      >
        {name}
      </span>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: 'var(--hairline)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${Math.max(pct, penalty > 0 ? 6 : 0)}%`,
            background: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span
        className="num w-10 shrink-0 text-right text-xs font-semibold"
        style={{ color: penalty > 0 ? color : 'var(--cluster-text-dim)' }}
      >
        {penalty > 0 ? `−${Number(penalty).toFixed(1)}` : '0'}
      </span>
    </div>
  );
}

/**
 * Fleet Health — "How healthy is my fleet?"
 * Score ring + grade + the honest headline (points lost from perfect, which we
 * actually have) and a per-driver breakdown of every penalty component.
 */
export default function FleetHealthPanel({ health, loading, error }) {
  const grade = health?.grade ?? 'D';
  const score = health?.score ?? 0;
  const color = SIGNAL[gradeSignal(grade)] || 'var(--inert)';
  const components = health?.components || {};
  const lostPts = Math.max(0, Math.round((100 - score) * 10) / 10);
  const worst = Object.entries(components)
    .filter(([, c]) => c?.penalty > 0)
    .sort((a, b) => b[1].penalty - a[1].penalty)[0];

  return (
    <Panel
      eyebrow="Fleet Health"
      question="How healthy is my fleet?"
      className="h-full"
      id="fleet-health"
    >
      {loading && !health ? (
        <FleetHealthSkeleton />
      ) : error && !health ? (
        <EmptyState
          title="Health score unavailable"
          hint="The score computes from telemetry, compliance and mileage — it appears once those pipelines have run."
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <ScoreRing score={score} grade={grade} color={color} />
            <div className="flex min-w-0 flex-col gap-2">
              <StatusPill tone={gradeSignal(grade)}>Grade {grade}</StatusPill>
              <p className="num text-sm" style={{ color: 'var(--cluster-text-dim)' }}>
                <span className="font-bold" style={{ color: lostPts > 0 ? color : 'var(--ok)' }}>
                  {lostPts > 0 ? `−${lostPts}` : '0'}
                </span>{' '}
                pts from a perfect fleet
              </p>
              <p className="text-dim text-[11px] leading-relaxed">
                {worst
                  ? `Biggest drag: ${worst[0]} (${worst[1].detail}).`
                  : 'No penalties across theft, utilization, compliance or mileage.'}
              </p>
            </div>
          </div>
          <div
            className="flex flex-col gap-2.5 border-t pt-4"
            style={{ borderColor: 'var(--hairline)' }}
          >
            {Object.entries(components).map(([name, comp]) => (
              <ComponentBar key={name} name={name} comp={comp} />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
