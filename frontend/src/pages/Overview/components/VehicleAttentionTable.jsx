import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Panel, StatusPill } from './overview.primitives.jsx';
import EmptyState from '../../../components/cluster/EmptyState';
import { VehicleAttentionSkeleton } from './OverviewSkeletons.jsx';
import { formatINR, formatPct } from '../../../utils/formatters';

const TARGET_UTIL_PCT = 75;

/**
 * Merge the three per-vehicle signals we have (waste, downtime exposure, empty
 * running) into one attention list keyed by registration number, so each
 * vehicle appears once with its worst issue surfaced.
 */
function mergeVehicles({ money, downtime, utilization }) {
  const byReg = new Map();
  const ensure = (reg) => {
    if (!reg) return null;
    if (!byReg.has(reg)) {
      byReg.set(reg, { reg, wasteInr: 0, exposureInr: 0, emptyKmPct: null, risk: null });
    }
    return byReg.get(reg);
  };

  (money?.topVehicles || []).forEach((v) => {
    const row = ensure(v.registrationNumber);
    if (row) row.wasteInr = Number(v.wasteInr || 0);
  });
  (downtime?.vehicles || []).forEach((v) => {
    const row = ensure(v.registrationNumber);
    if (row) {
      row.exposureInr = Number(v.exposureInr || 0);
      row.risk = v.risk;
    }
  });
  (utilization?.vehicles || []).forEach((v) => {
    if (!(v.totalKm > 0)) return;
    const row = ensure(v.registrationNumber);
    if (row) row.emptyKmPct = v.emptyKmPct;
  });

  return [...byReg.values()].map((row) => {
    const loss = row.wasteInr + row.exposureInr;
    const util = row.emptyKmPct == null ? null : 100 - row.emptyKmPct;
    // Worst issue wins the label
    let issue = 'High waste';
    let tone = 'caution';
    if (row.risk === 'OVERDUE') {
      issue = 'Service overdue';
      tone = 'critical';
    } else if (row.risk === 'DUE_SOON') {
      issue = 'Downtime risk';
      tone = 'caution';
    } else if (util != null && util < TARGET_UTIL_PCT && row.emptyKmPct > 30) {
      issue = 'Idle / empty running';
      tone = row.emptyKmPct > 50 ? 'critical' : 'caution';
    } else if (row.wasteInr > 0) {
      issue = 'High waste';
      tone = 'caution';
    }
    const status = tone === 'critical' ? 'Critical' : 'Warning';
    return { ...row, loss, util, issue, tone, status };
  });
}

const SORTS = {
  loss: { label: 'Highest loss', fn: (a, b) => b.loss - a.loss },
  util: { label: 'Lowest utilization', fn: (a, b) => (a.util ?? 101) - (b.util ?? 101) },
  risk: { label: 'Downtime', fn: (a, b) => b.exposureInr - a.exposureInr },
};

/**
 * Vehicles Requiring Attention — "Which assets need me?"
 * One row per vehicle, worst issue surfaced, sortable by the axis the manager
 * cares about right now.
 */
export default function VehicleAttentionTable({ money, downtime, utilization, loading }) {
  const [sort, setSort] = useState('loss');
  const merged = useMemo(
    () => mergeVehicles({ money, downtime, utilization }),
    [money, downtime, utilization],
  );
  const rows = useMemo(() => [...merged].sort(SORTS[sort].fn).slice(0, 8), [merged, sort]);

  return (
    <Panel
      eyebrow="Vehicles Requiring Attention"
      question="Which vehicles need action?"
      action={
        <div className="ov-seg" role="group" aria-label="Sort vehicles">
          {Object.entries(SORTS).map(([key, s]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      {loading && !merged.length ? (
        <VehicleAttentionSkeleton />
      ) : merged.length === 0 ? (
        <EmptyState
          title="No vehicle needs attention"
          hint="When telemetry flags waste, a service is due, or a vehicle runs empty, it surfaces here ranked by impact."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="ov-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Issue</th>
                <th className="text-right">Utilization</th>
                <th className="text-right">Est. loss</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.reg}>
                  <td>
                    <span className="reg-plate">{r.reg}</span>
                  </td>
                  <td>
                    <StatusPill tone={r.tone}>{r.status}</StatusPill>
                  </td>
                  <td className="text-dim">{r.issue}</td>
                  <td
                    className="num text-right"
                    style={{
                      color:
                        r.util != null && r.util < TARGET_UTIL_PCT
                          ? 'var(--caution)'
                          : 'var(--cluster-text-dim)',
                    }}
                  >
                    {r.util == null ? '—' : formatPct(r.util)}
                  </td>
                  <td
                    className="num text-right font-semibold"
                    style={{ color: r.loss > 0 ? 'var(--critical)' : 'var(--cluster-text-dim)' }}
                  >
                    {r.loss > 0 ? formatINR(r.loss) : '—'}
                  </td>
                  <td className="text-right">
                    <Link
                      to={`/vehicles/${encodeURIComponent(r.reg)}`}
                      className="inline-flex items-center gap-0.5 text-xs font-semibold"
                      style={{ color: 'var(--gnb-400)' }}
                    >
                      View <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
