import { useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, Route as RouteIcon } from 'lucide-react';
import dayjs from 'dayjs';
import PageShell from '../../components/ui/PageShell';
import { useApi } from '../../hooks/useApi';
import { formatKm, formatLitres } from '../../utils/formatters';
import TripDashboardService from './TripDashboardService';

/**
 * Trip-window analytics (B2.3). Per-trip planned km alongside the telematics
 * rollup's per-leg actuals (approach / laden / return + fuel detour), fuel and
 * flags — the read model the fuel-attribution / good-driver / ETA work reads.
 * Read-only. Estimates from telematics; flags mean "please review".
 */
const STATUS_LABEL = {
  COMPUTED: { text: 'Verified', color: 'var(--positive, #16a34a)' },
  PENDING: { text: 'Pending Rollup', color: 'var(--caution)' },
  NO_DATA: { text: 'No Telematics', color: 'var(--text-dim, #94a3b8)' },
  NO_TELEMATICS: { text: 'No GPS Device', color: 'var(--text-dim, #94a3b8)' },
  FAILED: { text: 'Failed', color: 'var(--critical)' },
};

const LEG_TILES = [
  { key: 'ladenKm', label: 'Laden Distance', hint: 'Loaded travel with cargo' },
  { key: 'approachKm', label: 'Approach Distance', hint: 'Empty run to pickup' },
  { key: 'returnKm', label: 'Return Distance', hint: 'Return leg after drop' },
  { key: 'fuelDetourKm', label: 'Fuel Detour', hint: 'Route deviation for refueling' },
  { key: 'totalTripKm', label: 'Total Distance', hint: 'Sum of all verified legs' },
  { key: 'fuelConsumedL', label: 'Total Fuel', hint: 'Sensor measured fuel burn' },
];

export default function TripWindowsPage() {
  const [inputFrom, setInputFrom] = useState('');
  const [inputTo, setInputTo] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '' });

  const params = useMemo(() => {
    const p = {};
    if (applied.from) p.from = dayjs(applied.from).startOf('day').toISOString();
    if (applied.to) p.to = dayjs(applied.to).endOf('day').toISOString();
    return p;
  }, [applied]);

  const { data, loading, error, refetch } = useApi(
    (signal) => TripDashboardService.getTripWindows(params, { signal }),
    [JSON.stringify(params)],
  );

  const windows = data?.windows || [];
  const legTotals = data?.legTotals || {};

  const fmtLeg = (key, value) =>
    key === 'fuelConsumedL' ? formatLitres(value || 0) : formatKm(value || 0);

  return (
    <PageShell
      title="Trip Windows"
      subtitle="Planned vs verified GPS telematics kilometres and fuel consumption for each trip leg"
      count={data?.count ?? null}
      actions={
        <button className="ov-btn" onClick={refetch} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col text-xs">
            <span className="text-dim mb-1">From</span>
            <input
              type="date"
              aria-label="From date"
              value={inputFrom}
              onChange={(e) => setInputFrom(e.target.value)}
              className="rounded-md border px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="text-dim mb-1">To</span>
            <input
              type="date"
              aria-label="To date"
              value={inputTo}
              onChange={(e) => setInputTo(e.target.value)}
              className="rounded-md border px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </label>
          <button
            className="ov-btn ov-btn--primary"
            onClick={() => setApplied({ from: inputFrom, to: inputTo })}
          >
            Apply
          </button>
          <span className="text-dim self-center text-xs">Defaults to the last 90 days.</span>
        </div>
      }
    >
      {error && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--critical)', color: 'var(--critical)' }}
        >
          <AlertTriangle size={16} /> Could not load trip windows.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {LEG_TILES.map((t) => (
          <div key={t.key} className="ov-inset flex flex-col items-center gap-0.5 py-3">
            <span className="num text-lg font-bold">{fmtLeg(t.key, legTotals[t.key])}</span>
            <span className="text-dim text-[10px] uppercase tracking-wide">{t.label}</span>
          </div>
        ))}
      </div>

      {!loading && windows.length === 0 ? (
        <div className="text-dim flex flex-col items-center gap-2 py-10 text-center text-sm">
          <RouteIcon size={20} className="opacity-60" />
          <span>No trips in this window.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dim text-left text-[11px] uppercase tracking-wide">
                <th className="py-2 pr-2">Trip</th>
                <th className="py-2 px-2">Route</th>
                <th className="py-2 px-2 text-right">Planned</th>
                <th className="py-2 px-2 text-right">Laden</th>
                <th className="py-2 px-2 text-right">Approach</th>
                <th className="py-2 px-2 text-right">Return</th>
                <th className="py-2 px-2 text-right">Fuel</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 pl-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => {
                const a = w.actual || {};
                const status = STATUS_LABEL[w.telematicsStatus] || {
                  text: w.telematicsStatus || '—',
                  color: 'var(--text-dim, #94a3b8)',
                };
                return (
                  <tr
                    key={w.erpTripId}
                    className="border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="py-2 pr-2">
                      <div className="font-semibold">{w.tripNumber}</div>
                      <div className="text-dim text-[11px]">
                        {dayjs(w.tripDate).format('DD MMM YYYY')}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-xs">
                        {w.route?.from || '—'} → {w.route?.to || '—'}
                      </div>
                      <div className="text-dim text-[11px]">
                        {w.vehicleNumber || (w.vehicleType === 'HIRE' ? 'Hire' : '—')}
                      </div>
                    </td>
                    <td className="num py-2 px-2 text-right">
                      {w.plannedKm != null ? formatKm(w.plannedKm) : '—'}
                    </td>
                    <td className="num py-2 px-2 text-right">
                      {a.ladenKm != null ? formatKm(a.ladenKm) : '—'}
                    </td>
                    <td className="num py-2 px-2 text-right">
                      {a.approachKm != null ? formatKm(a.approachKm) : '—'}
                    </td>
                    <td className="num py-2 px-2 text-right">
                      {a.returnKm != null ? formatKm(a.returnKm) : '—'}
                    </td>
                    <td className="num py-2 px-2 text-right">
                      {a.fuelConsumedL != null ? formatLitres(a.fuelConsumedL) : '—'}
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-xs font-semibold" style={{ color: status.color }}>
                        {status.text}
                      </span>
                    </td>
                    <td className="py-2 pl-2">
                      {w.flags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {w.flags.map((f) => {
                            const isExtraKm = f === 'EXTRA_KM';
                            const label = isExtraKm ? 'Extra Distance' : f;
                            const title = isExtraKm
                              ? 'Trip actual distance exceeded planned route corridor'
                              : f;
                            return (
                              <span
                                key={f}
                                title={title}
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
                                style={{
                                  background: 'color-mix(in srgb, var(--caution) 16%, transparent)',
                                  color: 'var(--caution)',
                                  border:
                                    '1px solid color-mix(in srgb, var(--caution) 30%, transparent)',
                                }}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-dim text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
