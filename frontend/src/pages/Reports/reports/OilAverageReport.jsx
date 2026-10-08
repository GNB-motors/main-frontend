import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import { CsvIcon } from '../../../components/Icons';
import useApi from '../../../hooks/useApi';
import AutoTripService from '../../../services/AutoTripService';

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const todayISO = () => new Date().toISOString().slice(0, 10);
const DEFAULT_DAYS = 30;

function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}
const n0 = (v) => (v == null ? '' : Math.round(v));
const n2 = (v) => (v == null ? '' : (Math.round(v * 100) / 100).toFixed(2));
const inr = (v) => (v == null ? '' : `₹${Math.round(v).toLocaleString('en-IN')}`);
const pct = (v) => (v == null ? '' : `${(Math.round(v * 10) / 10).toFixed(1)}%`);

// Field fallbacks: the API contract renames refuelLitres→refuelL and
// fuelUsedLitres→fuelUsedL (V-69); read both so the report works before and after
// the backend ships the renamed shape. The role/cost columns (v2) stay blank
// until the backend sends them.
const COLUMNS = [
  ['date', 'Date', (r) => fmtDate(r.date)],
  ['vehicleNumber', 'Vehicle', (r) => r.vehicleNumber || ''],
  ['driverName', 'Driver', (r) => r.driverName || ''],
  ['from', 'From', (r) => r.from || ''],
  ['to', 'To', (r) => r.to || ''],
  ['odometerStart', 'Odo Start', (r) => n0(r.odometerStart)],
  ['odometerEnd', 'Odo End', (r) => n0(r.odometerEnd)],
  ['distanceKm', 'Distance', (r) => n0(r.distanceKm)],
  ['refuel', 'Refuel (L)', (r) => n2(r.refuelL ?? r.refuelLitres)],
  ['fuelUsed', 'Fuel Used (L)', (r) => n2(r.fuelUsedL ?? r.fuelUsedLitres)],
  ['mileageKmPerL', 'Mileage (F.E.)', (r) => n2(r.mileageKmPerL)],
  ['fuelCost', 'Fuel Cost', (r) => n0(r.fuelCost)],
  ['fuelStation', 'Fuel Station', (r) => r.fuelStation || ''],
  // Role / cost columns (contract OilRow, v2) — appended after the station.
  ['kmApproach', 'Approach km', (r) => n0(r.kmApproach)],
  ['kmLaden', 'Laden km', (r) => n0(r.kmLaden)],
  ['kmReturn', 'Return km', (r) => n0(r.kmReturn)],
  ['ladenFuelL', 'Laden Fuel (L)', (r) => n2(r.ladenFuelL)],
  ['ladenFuelInr', 'Laden Fuel ₹', (r) => inr(r.ladenFuelInr)],
  ['ladenWearInr', 'Laden Wear ₹', (r) => inr(r.ladenWearInr)],
  ['ladenTotalInr', 'Laden Total ₹', (r) => inr(r.ladenTotalInr)],
  ['emptySharePct', 'Empty %', (r) => pct(r.emptySharePct)],
  ['totalCostInr', 'Total Cost ₹', (r) => inr(r.totalCostInr)],
];

const RIGHT_ALIGNED = new Set([
  'odometerStart',
  'odometerEnd',
  'distanceKm',
  'refuel',
  'fuelUsed',
  'mileageKmPerL',
  'fuelCost',
  'kmApproach',
  'kmLaden',
  'kmReturn',
  'ladenFuelL',
  'ladenFuelInr',
  'ladenWearInr',
  'ladenTotalInr',
  'emptySharePct',
  'totalCostInr',
]);

function toCsv(rows) {
  const esc = (s) => {
    const v = s == null ? '' : String(s);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const header = COLUMNS.map(([, label]) => label).join(',');
  const body = rows.map((r) => COLUMNS.map(([, , render]) => esc(render(r))).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oil-average-report-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Trip-wise Oil & Average report, shown on the Reports page (?report=oilAverage). */
export default function OilAverageReport() {
  const navigate = useNavigate();
  const defaultFrom = daysAgoISO(DEFAULT_DAYS);
  const defaultTo = todayISO();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  // Whole IST days: a bare "to" date would be read as its midnight and drop that day.
  const params = useMemo(
    () => ({
      ...(from ? { from: `${from}T00:00:00+05:30` } : {}),
      ...(to ? { to: `${to}T23:59:59.999+05:30` } : {}),
    }),
    [from, to],
  );
  const { data, loading, error, refetch } = useApi(
    (signal) => AutoTripService.oilAverage(params, { signal }),
    [JSON.stringify(params)],
  );

  const rows = data?.rows ?? [];

  const columns = useMemo(
    () =>
      COLUMNS.map(([key, label, render]) => ({
        key,
        label,
        align: RIGHT_ALIGNED.has(key) ? 'right' : 'left',
        render,
      })),
    [],
  );

  const activeCount = (from !== defaultFrom ? 1 : 0) + (to !== defaultTo ? 1 : 0);
  const range = from || to ? `${from || '…'} → ${to || '…'}` : 'last 31 days';

  return (
    <PageShell
      className="p-6"
      title="Oil & Average Report"
      count={rows.length}
      subtitle="Trip-wise — each trip with its fuel, mileage and odometer where available. Mileage is laden distance ÷ fuel used on the run (not litres bought)."
      actions={
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          disabled={rows.length === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECECEE] bg-[#F8F8FB] transition-colors hover:bg-[#ECECEE] disabled:opacity-40"
          title="Export these rows to CSV"
          aria-label="Export to CSV"
        >
          <CsvIcon width={20} height={20} />
        </button>
      }
      filters={
        <FilterBar
          from={from}
          to={to}
          onRangeChange={(patch) => {
            if ('from' in patch) setFrom(patch.from);
            if ('to' in patch) setTo(patch.to);
          }}
          activeCount={activeCount}
          onClear={() => {
            setFrom(defaultFrom);
            setTo(defaultTo);
          }}
        />
      }
      footer={
        <span className="text-dim text-xs">
          {data?.truncated
            ? `First ${rows.length} trips only — narrow the dates to see the rest · ${range}`
            : `${rows.length} trips · ${range}`}
        </span>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.autoTripId}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={rows.length}
        onRowClick={(r) => navigate(`/auto-trips/${r.autoTripId}`)}
        emptyTitle="No trips in this range"
        emptyHint="Widen the date range, or confirm pickup / drop places so more trips are detected."
      />
    </PageShell>
  );
}
