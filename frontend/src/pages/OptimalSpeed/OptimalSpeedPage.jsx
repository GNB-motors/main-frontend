import { useState } from 'react';
import { Gauge, TrendingDown } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { useApi } from '../../hooks/useApi';
import { OptimalSpeedService } from './OptimalSpeedService';
import { optimalSpeedResponseSchema } from '../../schemas/optimalSpeed.schema';
import { formatInrCompact, formatNum } from '../../utils/formatters';

const CARD_BORDER = '1px solid color-mix(in srgb, var(--cluster-text) 16%, transparent)';

function bandLabel(p) {
  if (p.optimalMinKmh == null || p.optimalMaxKmh == null) return '—';
  const max = p.optimalMaxKmh >= 999 ? '+' : `–${formatNum(p.optimalMaxKmh)}`;
  return `${formatNum(p.optimalMinKmh)}${max} km/h`;
}

export default function OptimalSpeedPage() {
  const [sort, setSort] = useState('savings');

  const { data, loading, error } = useApi(
    (signal) =>
      OptimalSpeedService.getProfiles({ sort }, signal).then((d) =>
        optimalSpeedResponseSchema.parse(d),
      ),
    [sort],
  );

  const profiles = data?.profiles ?? [];
  const totalSavings = data?.summary?.totalPotentialSavingsInr ?? 0;

  return (
    <div className="cluster-page">
      <PageShell
        title="Optimal Speed"
        subtitle="The average-speed band each vehicle burns the least fuel in, and the ₹ lost running outside it."
      >
        <PanelErrorBoundary name="optimal-speed">
          {loading && !data ? (
            <div className="text-dim p-6 text-sm">Loading optimal-speed profiles…</div>
          ) : error ? (
            <div className="p-6 text-sm" style={{ color: 'var(--critical)' }}>
              Could not load optimal-speed profiles. {error.detail || error.message || ''}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="ov-kpi" style={{ border: CARD_BORDER }}>
                <span className="ov-kpi-label">
                  <TrendingDown size={13} style={{ color: 'var(--critical)' }} />
                  Total ₹ opportunity / month
                </span>
                <span className="ov-kpi-value" style={{ color: 'var(--critical)' }}>
                  {formatInrCompact(totalSavings)}
                </span>
                <span className="ov-kpi-sub">
                  If out-of-band distance matched each vehicle&apos;s most efficient speed band
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSort('savings')}
                  className="ov-pill"
                  style={{ opacity: sort === 'savings' ? 1 : 0.55 }}
                >
                  By ₹ opportunity
                </button>
                <button
                  type="button"
                  onClick={() => setSort('efficiency')}
                  className="ov-pill"
                  style={{ opacity: sort === 'efficiency' ? 1 : 0.55 }}
                >
                  By worst efficiency
                </button>
              </div>

              {profiles.length === 0 ? (
                <div className="text-dim p-4 text-sm">
                  No optimal-speed profiles yet — the sweep needs a few fuel windows per vehicle.
                </div>
              ) : (
                <div className="ov-panel overflow-x-auto p-0" style={{ border: CARD_BORDER }}>
                  <table className="w-full text-sm" style={{ color: 'var(--cluster-text)' }}>
                    <thead>
                      <tr className="text-dim text-left text-xs uppercase tracking-wide">
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Optimal band</th>
                        <th className="num p-3 text-right">Best km/L</th>
                        <th className="num p-3 text-right">Avg speed</th>
                        <th className="num p-3 text-right">Avg km/L</th>
                        <th className="num p-3 text-right">% in band</th>
                        <th className="num p-3 text-right">₹ opportunity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr
                          key={p._id || p.registrationNumber}
                          style={{ borderTop: '1px solid var(--hairline)' }}
                        >
                          <td className="p-3 font-semibold">
                            <span className="inline-flex items-center gap-1.5">
                              <Gauge size={13} className="text-dim" />
                              {p.registrationNumber || 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3">{bandLabel(p)}</td>
                          <td className="num p-3 text-right">
                            {formatNum(p.optimalEfficiencyKmpl)}
                          </td>
                          <td className="num p-3 text-right">{formatNum(p.avgSpeedKmh)} km/h</td>
                          <td className="num p-3 text-right">{formatNum(p.avgEfficiencyKmpl)}</td>
                          <td className="num p-3 text-right">
                            {formatNum(p.pctDistanceInOptimalBand)}%
                          </td>
                          <td
                            className="num p-3 text-right font-semibold"
                            style={{ color: 'var(--critical)' }}
                          >
                            {formatInrCompact(p.potentialSavingsInr)}
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
