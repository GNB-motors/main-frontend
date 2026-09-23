import { useState } from 'react';
import { Fuel } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { useApi } from '../../hooks/useApi';
import { RefuelAdvisoryService } from './RefuelAdvisoryService';
import { refuelAdvisoryResponseSchema } from '../../schemas/refuelAdvisory.schema';
import { formatInrCompact, formatNum } from '../../utils/formatters';

const CARD_BORDER = '1px solid color-mix(in srgb, var(--cluster-text) 16%, transparent)';

const STATUS_STYLE = {
  CRITICAL: { label: 'Critical', color: 'var(--critical)' },
  REFUEL_SOON: { label: 'Refuel soon', color: '#d97706' },
  OK: { label: 'OK', color: 'var(--ok)' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.OK;
  return (
    <span
      className="ov-pill"
      style={{ color: s.color, border: `1px solid ${s.color}`, background: 'transparent' }}
    >
      {s.label}
    </span>
  );
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'REFUEL_SOON', label: 'Refuel soon' },
];

export default function RefuelAdvisoryPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, error } = useApi(
    (signal) =>
      RefuelAdvisoryService.getAdvisories(
        statusFilter ? { status: statusFilter } : {},
        signal,
      ).then((d) => refuelAdvisoryResponseSchema.parse(d)),
    [statusFilter],
  );

  const advisories = data?.advisories ?? [];
  const summary = data?.summary ?? {};

  return (
    <div className="cluster-page">
      <PageShell
        title="Refuel Advisory"
        subtitle="Estimated remaining range per vehicle (tank level × recent efficiency) and which need refuelling soon."
      >
        <PanelErrorBoundary name="refuel-advisory">
          {loading && !data ? (
            <div className="text-dim p-6 text-sm">Loading refuel advisories…</div>
          ) : error ? (
            <div className="p-6 text-sm" style={{ color: 'var(--critical)' }}>
              Could not load refuel advisories. {error.detail || error.message || ''}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <div className="ov-kpi" style={{ border: CARD_BORDER }}>
                  <span className="ov-kpi-label" style={{ color: 'var(--critical)' }}>
                    Critical
                  </span>
                  <span className="ov-kpi-value" style={{ color: 'var(--critical)' }}>
                    {formatNum(summary.CRITICAL ?? 0)}
                  </span>
                  <span className="ov-kpi-sub">Refuel now</span>
                </div>
                <div className="ov-kpi" style={{ border: CARD_BORDER }}>
                  <span className="ov-kpi-label" style={{ color: '#d97706' }}>
                    Refuel soon
                  </span>
                  <span className="ov-kpi-value" style={{ color: '#d97706' }}>
                    {formatNum(summary.REFUEL_SOON ?? 0)}
                  </span>
                  <span className="ov-kpi-sub">Plan a fill</span>
                </div>
              </div>

              <div className="flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.key || 'all'}
                    type="button"
                    onClick={() => setStatusFilter(f.key)}
                    className="ov-pill"
                    style={{ opacity: statusFilter === f.key ? 1 : 0.55 }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {advisories.length === 0 ? (
                <div className="text-dim p-4 text-sm">
                  No advisories — the sweep needs a recent tank reading and efficiency history.
                </div>
              ) : (
                <div className="ov-panel overflow-x-auto p-0" style={{ border: CARD_BORDER }}>
                  <table className="w-full text-sm" style={{ color: 'var(--cluster-text)' }}>
                    <thead>
                      <tr className="text-dim text-left text-xs uppercase tracking-wide">
                        <th className="p-3">Vehicle</th>
                        <th className="num p-3 text-right">% full</th>
                        <th className="num p-3 text-right">Range</th>
                        <th className="p-3">Status</th>
                        <th className="num p-3 text-right">Litres to full</th>
                        <th className="num p-3 text-right">Fill ₹</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advisories.map((a) => (
                        <tr
                          key={a._id || a.registrationNumber}
                          style={{ borderTop: '1px solid var(--hairline)' }}
                        >
                          <td className="p-3 font-semibold">
                            <span className="inline-flex items-center gap-1.5">
                              <Fuel size={13} className="text-dim" />
                              {a.registrationNumber || 'Unknown'}
                            </span>
                          </td>
                          <td className="num p-3 text-right">
                            {a.pctFull != null ? `${formatNum(a.pctFull)}%` : '—'}
                          </td>
                          <td className="num p-3 text-right">
                            {a.estimatedRangeKm != null
                              ? `${formatNum(a.estimatedRangeKm)} km`
                              : '—'}
                          </td>
                          <td className="p-3">
                            <StatusPill status={a.status} />
                          </td>
                          <td className="num p-3 text-right">
                            {a.litresToFull != null ? `${formatNum(a.litresToFull)} L` : '—'}
                          </td>
                          <td className="num p-3 text-right">
                            {formatInrCompact(a.estimatedFillCostInr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
