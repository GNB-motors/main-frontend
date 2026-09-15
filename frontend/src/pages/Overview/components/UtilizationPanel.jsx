import { Panel } from './overview.primitives.jsx';
import EmptyState from '../../../components/cluster/EmptyState';
import { UtilizationSkeleton } from './OverviewSkeletons.jsx';
import { formatKm, formatInrCompact, formatPct } from '../../../utils/formatters';

const TARGET_UTIL_PCT = 75; // configured fleet target (placeholder until a real target lands)

function Metric({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-dim text-[11px] font-medium uppercase tracking-wide">{label}</span>
      <span className="num text-lg font-bold" style={{ color: color || 'var(--cluster-text)' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Utilization — "How efficiently are my vehicles used?"
 * A single loaded-vs-empty track makes the imbalance obvious at a glance, then
 * target / actual / variance quantify it. Empty km carry the waste ₹.
 */
export default function UtilizationPanel({ utilization, loading }) {
  const fleet = utilization?.fleet;
  const hasData = fleet && fleet.totalKm > 0;
  const loadedPct = hasData ? (fleet.loadedKm / fleet.totalKm) * 100 : 0;
  const emptyPct = hasData ? fleet.emptyKmPct : 0;
  const actual = Math.round(loadedPct);
  const variance = actual - TARGET_UTIL_PCT;

  return (
    <Panel eyebrow="Utilization" question="How efficiently are vehicles used?" className="h-full">
      {loading && !utilization ? (
        <UtilizationSkeleton />
      ) : !hasData ? (
        <EmptyState
          title="No distance data in this window"
          hint="Loaded vs empty kilometres appear once trips run and FleetEdge distance data flows."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* loaded vs empty track */}
          <div>
            <div
              className="ov-track"
              role="img"
              aria-label={`Loaded ${formatKm(fleet.loadedKm)}, empty ${formatKm(fleet.emptyKm)}`}
            >
              {loadedPct > 0 && (
                <span
                  style={{ width: `${loadedPct}%`, background: 'var(--ok)' }}
                  title={`Loaded ${formatKm(fleet.loadedKm)}`}
                >
                  {loadedPct > 12 ? `Loaded ${Math.round(loadedPct)}%` : ''}
                </span>
              )}
              {emptyPct > 0 && (
                <span
                  style={{
                    width: `${emptyPct}%`,
                    background: emptyPct > 30 ? 'var(--critical)' : 'var(--caution)',
                  }}
                  title={`Empty ${formatKm(fleet.emptyKm)}`}
                >
                  {emptyPct > 12 ? `Empty ${Math.round(emptyPct)}%` : ''}
                </span>
              )}
            </div>
            <div className="text-dim mt-2 flex justify-between text-[11px]">
              <span className="num">{formatKm(fleet.loadedKm)} loaded</span>
              <span className="num">{formatKm(fleet.emptyKm)} empty</span>
            </div>
          </div>

          {/* target / actual / variance + waste */}
          <div
            className="grid grid-cols-4 gap-3 border-t pt-4"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <Metric label="Target" value={formatPct(TARGET_UTIL_PCT)} />
            <Metric
              label="Actual"
              value={formatPct(actual)}
              color={actual < TARGET_UTIL_PCT ? 'var(--caution)' : 'var(--ok)'}
            />
            <Metric
              label="Variance"
              value={`${variance > 0 ? '+' : ''}${variance}%`}
              color={variance < 0 ? 'var(--critical)' : 'var(--ok)'}
            />
            <Metric
              label="Waste"
              value={formatInrCompact(fleet.emptyKmWasteInr)}
              color={fleet.emptyKmWasteInr > 0 ? 'var(--critical)' : 'var(--ok)'}
            />
          </div>
        </div>
      )}
    </Panel>
  );
}
