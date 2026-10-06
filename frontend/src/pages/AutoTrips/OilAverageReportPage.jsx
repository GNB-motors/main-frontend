import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useApi } from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const todayISO = () => new Date().toISOString().slice(0, 10);

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
// fuelUsedLitres→fuelUsedL (V-69); read both so the page works before and after
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

export default function OilAverageReportPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());

  // Whole IST days: a bare "to" date would be read as its midnight and drop that day.
  const params = useMemo(
    () => ({ from: `${from}T00:00:00+05:30`, to: `${to}T23:59:59.999+05:30` }),
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

  return (
    <PageShell
      title="Oil & Average Report"
      count={rows.length}
      subtitle="Trip-wise — each trip with its fuel, mileage and odometer where available. Mileage is laden distance ÷ fuel used on the run (not litres bought). Blank columns fill in as fuel data and driver assignments arrive."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/auto-trips')}>
            <ArrowLeft size={16} /> Trips
          </Button>
          <Button size="sm" disabled={!rows.length} onClick={() => downloadCsv(rows)}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      }
      filters={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            From
            <Input
              type="date"
              aria-label="From date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              style={{ width: 160 }}
            />
          </span>
          <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            To
            <Input
              type="date"
              aria-label="To date"
              value={to}
              min={from}
              max={todayISO()}
              onChange={(e) => setTo(e.target.value)}
              style={{ width: 160 }}
            />
          </span>
        </div>
      }
      footer={
        data?.truncated
          ? `First ${rows.length} trips only — narrow the dates to see the rest · ${from} → ${to}`
          : `${rows.length} trips · ${from} → ${to}`
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.autoTripId}
        loading={loading}
        error={error}
        onRetry={refetch}
        onRowClick={(r) => navigate(`/auto-trips/${r.autoTripId}`)}
        emptyTitle="No trips in this range"
        emptyHint="Widen the date range, or detect trips first from the Auto Trips page."
      />
    </PageShell>
  );
}
