import ManufacturerFilter from '../../../components/filters/ManufacturerFilter';
import useManufacturerFilter from '../../../hooks/useManufacturerFilter';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Gauge, IndianRupee, Route, Truck } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import useApi from '../../../hooks/useApi';
import AutoTripService from '../../../services/AutoTripService';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { exportFilterMeta } from './fleetReportUtils';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
} from './ReportFrame';
import { VehiclePicker } from './ReportEntityPicker';
import { matchesSearch, pageCount, pageSlice } from './reportFilters';
import useReportPage from './useReportPage';
import {
  buildTripFilterParams,
  defaultTripRange,
  newestFirst,
  numOrNull,
  rangeFilterCount,
  sumOf,
  tripReportSummary,
} from './tripReportsUtils';

// Delivered, or confirmed by a person. The API returns only these; filtering here too
// keeps trips still on the road or needing a check out against an older API.
const COMPLETED = new Set(['COMPLETE', 'CONFIRMED']);

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        timeZone: 'Asia/Kolkata',
      });
}
const text = (v) => (v == null || v === '' ? '—' : v);
const n0 = (v) => (v == null ? '—' : Math.round(v).toLocaleString('en-IN'));
const n2 = (v) => (v == null ? '—' : (Math.round(v * 100) / 100).toFixed(2));
const inr = (v) => (v == null ? '—' : `₹${Math.round(v).toLocaleString('en-IN')}`);
const pct = (v) => (v == null ? '—' : `${(Math.round(v * 10) / 10).toFixed(1)}%`);

// The API contract renames refuelLitres→refuelL and fuelUsedLitres→fuelUsedL, and
// the backend sends the laden-role cost as role* (V-69); read both shapes.
const fuelUsedOf = (r) => numOrNull(r.fuelUsedL ?? r.fuelUsedLitres);

// One list drives the table and the export: `value` is the raw cell, `show` formats it.
const COLUMNS = [
  { key: 'date', label: 'Date', value: (r) => r.date || null, show: fmtDate, type: 'date' },
  { key: 'vehicleNumber', label: 'Vehicle', value: (r) => r.vehicleNumber || null },
  { key: 'driverName', label: 'Driver', value: (r) => r.driverName || null },
  { key: 'from', label: 'From', value: (r) => r.from || null },
  { key: 'to', label: 'To', value: (r) => r.to || null },
  { key: 'odometerStart', label: 'Odo Start', value: (r) => numOrNull(r.odometerStart), show: n0 },
  { key: 'odometerEnd', label: 'Odo End', value: (r) => numOrNull(r.odometerEnd), show: n0 },
  { key: 'distanceKm', label: 'Distance (km)', value: (r) => numOrNull(r.distanceKm), show: n0 },
  {
    key: 'refuelL',
    label: 'Refuel (L)',
    value: (r) => numOrNull(r.refuelL ?? r.refuelLitres),
    show: n2,
  },
  { key: 'fuelUsedL', label: 'Fuel Used (L)', value: fuelUsedOf, show: n2 },
  {
    key: 'mileageKmPerL',
    label: 'Mileage (km/L)',
    value: (r) => numOrNull(r.mileageKmPerL),
    show: n2,
  },
  {
    key: 'fuelCost',
    label: 'Fuel Cost ₹',
    value: (r) => numOrNull(r.fuelCost),
    show: inr,
    type: 'currency',
  },
  { key: 'fuelStation', label: 'Fuel Station', value: (r) => r.fuelStation || null },
  { key: 'kmApproach', label: 'Approach km', value: (r) => numOrNull(r.kmApproach), show: n0 },
  { key: 'kmLaden', label: 'Laden km', value: (r) => numOrNull(r.kmLaden), show: n0 },
  { key: 'kmReturn', label: 'Return km', value: (r) => numOrNull(r.kmReturn), show: n0 },
  {
    key: 'ladenFuelL',
    label: 'Laden Fuel (L)',
    value: (r) => numOrNull(r.ladenFuelL ?? r.roleFuelL),
    show: n2,
  },
  {
    key: 'ladenFuelInr',
    label: 'Laden Fuel ₹',
    value: (r) => numOrNull(r.ladenFuelInr ?? r.roleFuelInr),
    show: inr,
    type: 'currency',
  },
  {
    key: 'ladenWearInr',
    label: 'Laden Wear ₹',
    value: (r) => numOrNull(r.ladenWearInr ?? r.roleWearInr),
    show: inr,
    type: 'currency',
  },
  {
    key: 'ladenTotalInr',
    label: 'Laden Total ₹',
    value: (r) => numOrNull(r.ladenTotalInr ?? r.roleTotalInr),
    show: inr,
    type: 'currency',
  },
  { key: 'emptySharePct', label: 'Empty %', value: (r) => numOrNull(r.emptySharePct), show: pct },
  {
    key: 'totalCostInr',
    label: 'Total Cost ₹',
    value: (r) => numOrNull(r.totalCostInr),
    show: inr,
    type: 'currency',
  },
];

const TEXT_KEYS = new Set(['date', 'vehicleNumber', 'driverName', 'from', 'to', 'fuelStation']);

const TABLE_COLUMNS = COLUMNS.map((c) => ({
  key: c.key,
  label: c.label,
  align: TEXT_KEYS.has(c.key) ? 'left' : 'right',
  render: (r) => (c.show || text)(c.value(r)),
}));

const EXPORT_COLUMNS = COLUMNS.map(({ key, label, type }) => ({
  key,
  label,
  type: type || (TEXT_KEYS.has(key) ? undefined : 'number'),
}));

const exportRowOf = (r) => Object.fromEntries(COLUMNS.map((c) => [c.key, c.value(r)]));

function oilKpis(rows) {
  const fuelUsed = sumOf(rows, fuelUsedOf);
  // Same definition as each row's mileage: laden km ÷ fuel used, over the trips
  // that have both — so it is distance-weighted, not an average of row ratios.
  const paired = rows.filter((r) => numOrNull(r.distanceKm) != null && fuelUsedOf(r) > 0);
  const pairedKm = sumOf(paired, (r) => r.distanceKm);
  const pairedFuel = sumOf(paired, fuelUsedOf);
  const mileage = pairedFuel ? pairedKm / pairedFuel : null;
  return [
    { label: 'Trips', value: formatNum(rows.length), icon: Truck },
    {
      label: 'Distance',
      value: formatKm(sumOf(rows, (r) => r.distanceKm)),
      icon: Route,
      tone: 'teal',
      hint: 'Laden km of these trips',
    },
    {
      label: 'Fuel used',
      value: formatLitres(fuelUsed, { decimals: 0 }),
      icon: Fuel,
      tone: 'violet',
      hint: 'Fuel burnt on the laden run, from telemetry',
    },
    {
      label: 'Average mileage',
      value: mileage != null ? `${formatNum(mileage, { decimals: 2 })} km/L` : '—',
      icon: Gauge,
      tone: 'orange',
      hint: `Laden km ÷ fuel used, over the ${paired.length} trips with fuel telemetry`,
    },
    {
      label: 'Total cost',
      value: formatINR(sumOf(rows, (r) => r.totalCostInr)),
      icon: IndianRupee,
      tone: 'green',
      hint: 'Running cost of these trips, where it has been computed',
    },
  ];
}

/** Trip-wise Oil & Average report, shown on the Reports page (?report=oilAverage). */
export default function OilAverageReport() {
  const navigate = useNavigate();
  const { manufacturer, setManufacturer } = useManufacturerFilter();
  const [range, setRange] = useState(defaultTripRange);
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('all');

  const params = useMemo(
    () => buildTripFilterParams({ ...range, manufacturer, vehicleId }),
    [range, manufacturer, vehicleId],
  );
  const paramsKey = JSON.stringify(params);
  const { data, loading, error, refetch } = useApi(
    (signal) => AutoTripService.oilAverage(params, { signal }),
    [paramsKey],
    { scopeKey: manufacturer },
  );

  const rows = useMemo(
    () =>
      error
        ? []
        : newestFirst(
            (data?.rows ?? []).filter((r) => COMPLETED.has(r.status)),
            (r) => r.date,
          ),
    [data, error],
  );
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesSearch(search, [r.vehicleNumber, r.driverName, r.from, r.to, r.fuelStation]),
      ),
    [rows, search],
  );
  const kpis = useMemo(() => oilKpis(filtered), [filtered]);

  const [page, setPage] = useReportPage(`${paramsKey}|${search.trim()}`);
  const pageRows = pageSlice(filtered, page);

  const defaults = defaultTripRange();
  const activeFilters =
    (manufacturer ? 1 : 0) +
    rangeFilterCount(range, defaults) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0);
  const vehicleLabel = vehicleId !== 'all' && rows[0] ? rows[0].vehicleNumber : null;
  const searchLabel = search.trim() ? `“${search.trim()}”` : null;

  return (
    <ReportFrame
      title="Oil & Average Report"
      subtitle="Completed trips only — each with its fuel, mileage and odometer where available. Mileage is laden distance ÷ fuel used on the run (not litres bought)."
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ManufacturerFilter value={manufacturer} onChange={setManufacturer} />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportSearch
            value={search}
            onChange={setSearch}
            placeholder="Search vehicle, driver, place"
          />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange(defaultTripRange());
              setSearch('');
              setManufacturer('');
              setVehicleId('all');
            }}
          />
        </>
      }
      actions={
        <ExportButton
          columns={EXPORT_COLUMNS}
          filename="oil-average-report"
          buttonClass="rpt-btn"
          fetchAll={() => filtered.map(exportRowOf)}
          meta={{
            filters: exportFilterMeta({
              ...range,
              entityLabel: [vehicleLabel, searchLabel].filter(Boolean).join(' · ') || null,
            }),
          }}
          disabled={!filtered.length}
        />
      }
      kpis={data && !error ? kpis : null}
      footer={
        <ReportFooter
          summary={tripReportSummary({
            page,
            total: filtered.length,
            noun: 'trips',
            truncated: Boolean(data?.truncated),
            capNoun: 'trips',
          })}
          page={page}
          totalPages={pageCount(filtered.length)}
          onPage={setPage}
        />
      }
    >
      <DataTable
        columns={TABLE_COLUMNS}
        rows={pageRows}
        rowKey={(r) => r.autoTripId}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={pageRows.length}
        total={filtered.length}
        activeFilters={activeFilters}
        onRowClick={(r) => navigate(`/auto-trips/${r.autoTripId}`)}
        emptyTitle="No completed trips in this range"
        emptyHint="Widen the date range, clear the search or vehicle, or confirm pickup / drop places so more trips are detected."
      />
    </ReportFrame>
  );
}
