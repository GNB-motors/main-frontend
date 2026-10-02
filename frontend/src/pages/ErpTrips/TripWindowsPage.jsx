import { useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
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
  PENDING: { text: 'Pending Rollup', color: '#2563eb' },
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
  { key: 'fuelConsumedL', label: 'Fuel Used', hint: 'FleetEdge fuel used over each trip window' },
];

// SNAPSHOT fuel is our fuel-level-drop estimate, used only when FleetEdge's hourly
// fuel-used does not cover the trip window — marked so it is not read as FleetEdge's own.
const FUEL_SOURCE_TITLE = {
  SINK: 'FleetEdge fuel used over the trip window (edge hours pro-rated)',
  SNAPSHOT: 'Estimated from fuel-level drops — FleetEdge fuel data did not cover this window',
};

export default function TripWindowsPage() {
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

  const columns = [
    {
      key: 'tripNumber',
      label: 'Trip',
      render: (w) => (
        <div>
          <div className="font-semibold text-slate-800">{w.tripNumber}</div>
          <div className="text-dim text-xs">
            {w.tripDate ? dayjs(w.tripDate).format('DD MMM YYYY') : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (w) => (
        <div>
          <div className="text-xs font-medium text-slate-800">
            {w.route?.from || '—'} → {w.route?.to || '—'}
          </div>
          <div className="text-dim text-xs">
            {w.vehicleNumber || (w.vehicleType === 'HIRE' ? 'Hire' : '—')}
          </div>
        </div>
      ),
    },
    {
      key: 'plannedKm',
      label: 'Planned',
      align: 'right',
      render: (w) => (
        <span className="num">{w.plannedKm != null ? formatKm(w.plannedKm) : '—'}</span>
      ),
    },
    {
      key: 'ladenKm',
      label: 'Laden',
      align: 'right',
      render: (w) => (
        <span className="num">{w.actual?.ladenKm != null ? formatKm(w.actual.ladenKm) : '—'}</span>
      ),
    },
    {
      key: 'approachKm',
      label: 'Approach',
      align: 'right',
      render: (w) => (
        <span className="num">
          {w.actual?.approachKm != null ? formatKm(w.actual.approachKm) : '—'}
        </span>
      ),
    },
    {
      key: 'returnKm',
      label: 'Return',
      align: 'right',
      render: (w) => (
        <span className="num">
          {w.actual?.returnKm != null ? formatKm(w.actual.returnKm) : '—'}
        </span>
      ),
    },
    {
      key: 'fuelConsumedL',
      label: 'Fuel Used',
      align: 'right',
      render: (w) => (
        <span
          className="num"
          title={
            w.actual?.fuelConsumedL != null ? FUEL_SOURCE_TITLE[w.actual.fuelSource] : undefined
          }
        >
          {w.actual?.fuelConsumedL != null ? formatLitres(w.actual.fuelConsumedL) : '—'}
          {w.actual?.fuelConsumedL != null && w.actual.fuelSource === 'SNAPSHOT' && (
            <span className="text-dim text-xs ml-1">(est.)</span>
          )}
        </span>
      ),
    },
    {
      key: 'telematicsStatus',
      label: 'Status',
      render: (w) => {
        const status = STATUS_LABEL[w.telematicsStatus] || {
          text: w.telematicsStatus || '—',
          color: 'var(--text-dim, #94a3b8)',
        };
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              color: status.color,
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: `1px solid ${status.color}33`,
            }}
          >
            {status.text}
          </span>
        );
      },
    },
    {
      key: 'flags',
      label: 'Flags',
      render: (w) => {
        const flags = w.flags || [];
        return flags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {flags.map((f) => {
              const isExtraKm = f === 'EXTRA_KM';
              const label = isExtraKm ? 'Extra Distance' : f;
              return (
                <span
                  key={f}
                  className="rounded-full px-2 py-0.5 text-xs font-bold tracking-wide"
                  style={{
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: '#1d4ed8',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-dim text-xs">—</span>
        );
      },
    },
  ];

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
        <FilterBar
          from={applied.from}
          to={applied.to}
          onRangeChange={(range) => setApplied(range)}
          activeCount={applied.from || applied.to ? 1 : 0}
          onClear={() => setApplied({ from: '', to: '' })}
        />
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
            <span className="text-dim text-xs uppercase tracking-wide">{t.label}</span>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={windows}
        rowKey={(w) => w.erpTripId || w.tripNumber}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={windows.length}
        total={data?.count ?? windows.length}
        emptyTitle="No trips in this window"
        emptyHint="Planned vs verified GPS telematics kilometres and fuel consumption for each trip leg will appear here."
      />
    </PageShell>
  );
}
