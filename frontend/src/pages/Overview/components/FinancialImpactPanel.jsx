import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Panel } from './overview.primitives.jsx';
import EmptyState from '../../../components/cluster/EmptyState';
import { FinancialImpactSkeleton } from './OverviewSkeletons.jsx';
import { formatINR, formatInrCompact, formatPct } from '../../../utils/formatters';

/**
 * Cost lines in display order. `kind` drives the colour semantics:
 *   operating — informational blue (fuel, DEF: money spent, not lost)
 *   waste     — caution amber (idling, detour: recoverable inefficiency)
 *   loss      — critical red (theft, fraud: money leaving the business)
 */
const LINES = [
  { key: 'fuelCostInr', label: 'Fuel cost', kind: 'operating', to: '/fuel-spend' },
  { key: 'defCostInr', label: 'DEF cost', kind: 'operating', to: '/def-ledger' },
  { key: 'idlingWasteInr', label: 'Idling waste', kind: 'waste', to: '/owner-alerts' },
  { key: 'detourWasteInr', label: 'Detour waste', kind: 'waste', to: '/route-deviation' },
  { key: 'theftLossInr', label: 'Theft loss', kind: 'loss', to: '/fuel-integrity' },
  { key: 'billFraudSuspectInr', label: 'Bill fraud', kind: 'loss', to: '/fuel-integrity' },
];

const KIND_COLOR = {
  operating: 'var(--gnb-400)',
  waste: 'var(--caution)',
  loss: 'var(--critical)',
};

/**
 * Financial Impact — "Where is my fleet losing money?"
 * A single stacked magnitude bar of every cost line, then a ranked breakdown
 * with the largest line auto-highlighted. Waste (recoverable) is separated from
 * spend so the owner reads exposure, not just totals.
 */
export default function FinancialImpactPanel({ money, loading, error }) {
  const m = money?.money || {};
  const rows = LINES.map((l) => ({
    ...l,
    value: Number(m[l.key] || 0),
    color: KIND_COLOR[l.kind],
  }));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const wasteExposure = money?.totalWasteInr || 0;
  const ranked = [...rows].sort((a, b) => b.value - a.value);
  const topKey = ranked[0]?.value > 0 ? ranked[0].key : null;

  return (
    <Panel eyebrow="Financial Impact" question="Where is my fleet losing money?" className="h-full">
      {loading && !money ? (
        <FinancialImpactSkeleton />
      ) : error && !money ? (
        <EmptyState
          title="Cost rollup unavailable"
          hint="Estimated ₹ figures appear once telemetry and fuel data have been processed."
        />
      ) : total === 0 ? (
        <EmptyState
          title="No cost data in this window"
          hint="Fuel, DEF and waste figures populate as trips run and fuel slips are processed."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div
                className="num text-3xl font-bold leading-none"
                style={{ color: 'var(--cluster-text)' }}
              >
                {formatInrCompact(total)}
              </div>
              <div className="text-dim mt-1 text-xs">total tracked cost this period</div>
            </div>
            <div className="text-right">
              <div
                className="num text-xl font-bold leading-none"
                style={{ color: wasteExposure > 0 ? 'var(--critical)' : 'var(--ok)' }}
              >
                {formatInrCompact(wasteExposure)}
              </div>
              <div className="text-dim mt-1 text-xs">recoverable waste</div>
            </div>
          </div>

          {/* stacked magnitude bar */}
          <div className="ov-stack" role="img" aria-label="Cost composition">
            {ranked
              .filter((r) => r.value > 0)
              .map((r) => (
                <span
                  key={r.key}
                  style={{ width: `${(r.value / total) * 100}%`, background: r.color }}
                  title={`${r.label}: ${formatINR(r.value)}`}
                />
              ))}
          </div>

          {/* ranked breakdown */}
          <div className="flex flex-col">
            {ranked.map((r) => {
              const isTop = r.key === topKey;
              return (
                <Link
                  key={r.key}
                  to={r.to}
                  className="group flex items-center gap-3 border-t py-2.5 first:border-t-0"
                  style={{ borderColor: 'var(--hairline)' }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: r.color }}
                  />
                  <span
                    className="flex-1 text-sm"
                    style={{ color: 'var(--cluster-text)', fontWeight: isTop ? 700 : 500 }}
                  >
                    {r.label}
                    {isTop && (
                      <span className="text-dim ml-2 text-[11px] font-medium">largest</span>
                    )}
                  </span>
                  <span className="num text-xs text-dim">
                    {total > 0 ? formatPct((r.value / total) * 100) : '—'}
                  </span>
                  <span
                    className="num w-20 text-right text-sm font-semibold"
                    style={{ color: r.value > 0 ? r.color : 'var(--cluster-text-dim)' }}
                  >
                    {formatInrCompact(r.value)}
                  </span>
                  <ArrowUpRight
                    size={13}
                    className="shrink-0 text-transparent transition-colors group-hover:text-[var(--cluster-text-dim)]"
                  />
                </Link>
              );
            })}
          </div>
          {money?.disclaimer && (
            <p className="text-dim text-[11px] leading-relaxed">{money.disclaimer}</p>
          )}
        </div>
      )}
    </Panel>
  );
}
