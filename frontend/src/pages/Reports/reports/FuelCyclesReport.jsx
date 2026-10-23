import ManufacturerFilter from '../../../components/filters/ManufacturerFilter';
import useManufacturerFilter from '../../../hooks/useManufacturerFilter';
import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Receipt, RefreshCcw, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import { formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { useFuelCyclesColumns } from './useFuelCyclesColumns.jsx';
import CycleTripsPanel from './CycleTripsPanel';
import { cycleDistance, tripCountLabel } from './cycleTrips';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
  ReportSelect,
} from './ReportFrame';
import { VehiclePicker } from './ReportEntityPicker';
import { matchesSearch, pageCount, pageSlice } from './reportFilters';
import useReportPage from './useReportPage';
import {
  EMPTY_RANGE,
  buildTripFilterParams,
  exportTripReport,
  newestFirst,
  rangeFilterCount,
  sumOf,
  tripReportSummary,
} from './tripReportsUtils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'RECONCILED', label: 'Reconciled' },
  { value: 'UNRECONCILED_NO_LEDGER', label: 'Unreconciled (no ledger)' },
];

// Uploaded slips open and close a cycle on a FULL_TANK fill; register cycles
// carry no fill type. Full → full is what the owner reconciles, so it is the default.
const FILL_OPTIONS = [
  { value: 'full', label: 'Full tank → full tank' },
  { value: 'all', label: 'All cycles' },
];

function cycleKpis(rows) {
  return [
    { label: 'Cycles', value: formatNum(rows.length), icon: RefreshCcw },
    {
      label: 'Distance',
      value: formatKm(sumOf(rows, (r) => cycleDistance(r).km)),
      icon: Route,
      tone: 'teal',
    },
    {
      label: 'Bills',
      value: formatLitres(
        sumOf(rows, (r) => r.fuel?.bills),
        { decimals: 0 },
      ),
      icon: Receipt,
      tone: 'violet',
      hint: 'Litres on the fuel bills inside these cycles',
    },
    {
      label: 'Unaccounted',
      value: formatLitres(
        sumOf(rows, (r) => r.fuel?.unaccounted),
        { decimals: 0 },
      ),
      icon: AlertTriangle,
      tone: 'orange',
      hint: 'Billed litres the engine (ECU) does not account for',
    },
  ];
}

const FuelCyclesReport = () => {
  const { manufacturer, setManufacturer } = useManufacturerFilter();
  const [range, setRange] = useState(EMPTY_RANGE);
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [status, setStatus] = useState('all');
  const [fills, setFills] = useState('full');
  const [openIds, setOpenIds] = useState(() => new Set());

  const params = useMemo(
    () => ({
      ...buildTripFilterParams({ ...range, manufacturer, vehicleId, status }),
      ...(fills === 'full' ? { fullToFull: true } : {}),
    }),
    [range, manufacturer, vehicleId, status, fills],
  );
  const paramsKey = JSON.stringify(params);
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi((signal) => ReportsService.getFuelCycles(params, signal), [paramsKey], {
    scopeKey: manufacturer,
  });

  const rows = useMemo(
    () => (error ? [] : newestFirst(response?.data || [], (r) => r.open?.at)),
    [response, error],
  );
  const filtered = useMemo(
    () => rows.filter((r) => matchesSearch(search, [r.registrationNumber])),
    [rows, search],
  );
  const kpis = useMemo(() => cycleKpis(filtered), [filtered]);

  const [page, setPage] = useReportPage(`${paramsKey}|${status}|${search.trim()}`);
  const pageRows = pageSlice(filtered, page);

  const activeFilters =
    (manufacturer ? 1 : 0) +
    rangeFilterCount(range) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (fills !== 'full' ? 1 : 0);

  const toggleTrips = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const baseColumns = useFuelCyclesColumns();
  const columns = [
    {
      key: 'trips',
      label: 'Trips',
      render: (r) => {
        const open = openIds.has(r._id);
        const Icon = open ? ChevronDown : ChevronRight;
        return (
          <button
            type="button"
            className="rpt-trips-toggle"
            aria-expanded={open}
            aria-label={`${open ? 'Hide' : 'Show'} trips in this cycle`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTrips(r._id);
            }}
          >
            <Icon size={13} aria-hidden="true" />
            {tripCountLabel(r.tripSummary)}
          </button>
        );
      },
    },
    ...baseColumns,
  ];

  return (
    <ReportFrame
      title="Fuel Cycles"
      subtitle="Full-tank to full-tank cycles from the fuel slips — distance, fuel, cost, and every trip run between the two fills"
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ManufacturerFilter value={manufacturer} onChange={setManufacturer} />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportSearch value={search} onChange={setSearch} placeholder="Search vehicle" />
          <ReportSelect
            label="Fills"
            value={fills}
            onChange={setFills}
            options={FILL_OPTIONS}
            width={200}
          />
          <ReportSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            width={190}
          />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange(EMPTY_RANGE);
              setSearch('');
              setManufacturer('');
              setVehicleId('all');
              setStatus('all');
              setFills('full');
            }}
          />
        </>
      }
      actions={
        <ExportButton
          buttonClass="rpt-btn"
          onExport={(extension) =>
            // Always the server's export: its Excel is the OIL REPORT layout (one row
            // per trip, grouped by refill, live formulas), which a client-built sheet
            // cannot reproduce. It applies every filter on screen, search included.
            exportTripReport({
              extension,
              endpoint: 'api/reports/fuel-cycles/export',
              params: {
                ...params,
                ...(search.trim() ? { search: search.trim() } : {}),
                format: extension,
              },
              filenamePrefix: 'oil_report',
              errorMessage: 'Could not export the oil report.',
            })
          }
          disabled={!filtered.length}
        />
      }
      kpis={response && !error ? kpis : null}
      footer={
        <ReportFooter
          summary={tripReportSummary({
            page,
            total: filtered.length,
            noun: 'cycles',
            truncated: Boolean(response?.truncated),
            capNoun: 'cycles',
          })}
          page={page}
          totalPages={pageCount(filtered.length)}
          onPage={setPage}
        />
      }
    >
      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(r) => r._id}
        onRowClick={(r) => toggleTrips(r._id)}
        expandedKeys={openIds}
        renderExpanded={(r) => <CycleTripsPanel cycleId={r._id} />}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={pageRows.length}
        total={filtered.length}
        activeFilters={activeFilters}
        emptyTitle="No fuel cycles found"
        emptyHint="Try widening the date range or clearing the search, vehicle and status filters."
      />
    </ReportFrame>
  );
};

export default FuelCyclesReport;
