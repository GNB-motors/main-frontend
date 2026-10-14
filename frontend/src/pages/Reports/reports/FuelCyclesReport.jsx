import { useMemo, useState } from 'react';
import { AlertTriangle, Receipt, RefreshCcw, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.jsx';
import { formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { useFuelCyclesColumns } from './useFuelCyclesColumns.jsx';
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

// The fuel-cycles validator accepts OPEN · CLOSED · RECONCILED only (400 on
// anything else), so the no-ledger status is narrowed here on the rows that
// came back, and exported from them.
const CLIENT_ONLY_STATUS = 'UNRECONCILED_NO_LEDGER';

const EXPORT_COLUMNS = [
  ['Open', (r) => r.open?.at],
  ['Close', (r) => r.close?.at],
  ['Vehicle', (r) => r.registrationNumber],
  ['Start Odo', (r) => r.open?.odo],
  ['End Odo', (r) => r.close?.odo],
  ['Distance (km)', (r) => r.km?.sumBest],
  ['Bills (L)', (r) => r.fuel?.bills],
  ['ECU (L)', (r) => r.fuel?.ecu],
  ['Unaccounted (L)', (r) => r.fuel?.unaccounted],
  ['Mileage T2T (km/L)', (r) => r.mileage?.tankToTank],
  ['Cost (INR)', (r) => r.cost?.total],
  ['Status', (r) => r.status],
  ['Flags', (r) => (r.flags || []).join(' ')],
];

function cycleKpis(rows) {
  return [
    { label: 'Cycles', value: formatNum(rows.length), icon: RefreshCcw },
    {
      label: 'Distance',
      value: formatKm(sumOf(rows, (r) => r.km?.sumBest)),
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
  const [range, setRange] = useState(EMPTY_RANGE);
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [status, setStatus] = useState('all');
  const serverStatus = status === CLIENT_ONLY_STATUS ? 'all' : status;

  const params = useMemo(
    () => buildTripFilterParams({ ...range, vehicleId, status: serverStatus }),
    [range, vehicleId, serverStatus],
  );
  const paramsKey = JSON.stringify(params);
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi((signal) => ReportsService.getFuelCycles(params, signal), [paramsKey]);

  const rows = useMemo(
    () => (error ? [] : newestFirst(response?.data || [], (r) => r.open?.at)),
    [response, error],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status !== CLIENT_ONLY_STATUS || r.status === status) &&
          matchesSearch(search, [r.registrationNumber]),
      ),
    [rows, status, search],
  );
  const kpis = useMemo(() => cycleKpis(filtered), [filtered]);

  const [page, setPage] = useReportPage(`${paramsKey}|${status}|${search.trim()}`);
  const pageRows = pageSlice(filtered, page);

  // The export endpoint applies vehicle and status but not from/to, so a dated
  // or searched export is built from the rows on screen instead.
  const exportFromRows =
    status === CLIENT_ONLY_STATUS || Boolean(search.trim()) || Boolean(range.from || range.to);

  const activeFilters =
    rangeFilterCount(range) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0);

  const columns = useFuelCyclesColumns();

  return (
    <ReportFrame
      title="Fuel Cycles"
      subtitle="Full-tank to full-tank cycles — distance, fuel reconciliation and cost per cycle"
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ReportSearch value={search} onChange={setSearch} placeholder="Search vehicle" />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
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
              setVehicleId('all');
              setStatus('all');
            }}
          />
        </>
      }
      actions={
        <ExportButton
          buttonClass="rpt-btn"
          onExport={(extension) =>
            exportTripReport({
              extension,
              clientRows: exportFromRows ? filtered : null,
              columns: EXPORT_COLUMNS,
              endpoint: 'api/reports/fuel-cycles/export',
              params,
              filenamePrefix: 'fuel_cycles_report',
              errorMessage: 'Could not export fuel cycles report.',
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
