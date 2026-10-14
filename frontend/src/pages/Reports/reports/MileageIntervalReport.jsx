import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Fuel, Gauge, IndianRupee, ListChecks, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { ReportsService } from '../ReportsService.jsx';
import { exportFilteredReportCsv } from '../../../utils/reportCsvExport';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { useMileageIntervalReportColumns } from './useMileageIntervalReportColumns.jsx';
import { PAGE_SIZE } from './mileageIntervalReportUtils.js';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
  ReportSelect,
} from './ReportFrame';
import { DriverPicker, VehiclePicker } from './ReportEntityPicker';
import { compactParams, istDayEnd, istDayStart, rangeLabel } from './reportFilters';
import useReportPage from './useReportPage';

// Server-side row cap of GET /reports/mileage-intervals/export.
const MILEAGE_EXPORT_CAP = 5000;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All cycles' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ONGOING', label: 'Ongoing' },
];

const MileageIntervalReport = () => {
  const [range, setRange] = useState({ from: '', to: '' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [vehicleId, setVehicleId] = useState('all');
  const [driverId, setDriverId] = useState('all');
  const [status, setStatus] = useState('ALL');

  const filters = useMemo(
    () =>
      compactParams({
        startDate: istDayStart(range.from),
        endDate: istDayEnd(range.to),
        search: debouncedSearch,
        vehicleId,
        driverId,
        // ALL is the API default; only a narrowed status goes on the wire.
        status: status === 'ALL' ? null : status,
      }),
    [range, debouncedSearch, vehicleId, driverId, status],
  );
  const filterKey = JSON.stringify(filters);
  const [page, setPage] = useReportPage(filterKey);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi(
    (signal) =>
      ReportsService.getMileageIntervalReports({ ...filters, page, limit: PAGE_SIZE }, signal),
    [filterKey, page],
  );

  const rows = response?.data || [];
  const meta = response?.meta || { total: 0, totalPages: 0 };
  const summary = response?.summary;

  const columns = useMileageIntervalReportColumns();

  const exportMileage = async (format) => {
    if (meta.total > MILEAGE_EXPORT_CAP) {
      toast.info(
        `The file holds the newest ${MILEAGE_EXPORT_CAP.toLocaleString('en-IN')} of ${meta.total.toLocaleString('en-IN')} cycles — narrow the dates for the rest.`,
      );
    }
    // Excel: the owner workbook (what to check, where each vehicle's litres
    // went, idling, missing bills, every cycle); CSV: the flat rows.
    await exportFilteredReportCsv({
      fetchExport: (f) => ReportsService.exportReportCsv('api/reports/mileage-intervals/export', f),
      filters: format === 'xlsx' ? { ...filters, format: 'xlsx' } : filters,
      filenamePrefix: format === 'xlsx' ? 'mileage_report' : 'mileage_interval_report',
      extension: format,
      errorMessage: 'Could not export mileage report.',
    });
  };

  const activeFilters =
    (range.from ? 1 : 0) +
    (range.to ? 1 : 0) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0) +
    (driverId !== 'all' ? 1 : 0) +
    (status !== 'ALL' ? 1 : 0);

  const kpis = summary
    ? [
        { label: 'Cycles', value: formatNum(summary.totalCycles), icon: ListChecks },
        {
          label: 'Distance',
          value: formatKm(summary.totalDistanceKm),
          icon: Route,
          tone: 'violet',
        },
        {
          label: 'Fuel',
          value: formatLitres(summary.totalFuelLiters, { decimals: 0 }),
          icon: Fuel,
          tone: 'teal',
        },
        {
          label: 'Average mileage',
          value:
            summary.averageKmPerL != null
              ? `${formatNum(summary.averageKmPerL, { decimals: 2 })} km/L`
              : '—',
          icon: Gauge,
          tone: 'orange',
        },
        {
          label: 'Fuel cost',
          value: formatINR(summary.totalCost),
          icon: IndianRupee,
          tone: 'green',
        },
      ]
    : response
      ? [{ label: 'Cycles', value: formatNum(meta.total), icon: ListChecks }]
      : null;

  return (
    <ReportFrame
      title="Mileage Report"
      subtitle="Detailed vehicle mileage intervals, fuel consumption, distance, and alert status"
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ReportSearch value={search} onChange={setSearch} placeholder="Search vehicle number" />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <DriverPicker value={driverId} onChange={setDriverId} />
          <ReportSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange({ from: '', to: '' });
              setSearch('');
              setVehicleId('all');
              setDriverId('all');
              setStatus('ALL');
            }}
          />
        </>
      }
      actions={<ExportButton buttonClass="rpt-btn" onExport={exportMileage} disabled={!response} />}
      notice={
        response && 'dataAsOf' in meta ? (
          <ReportDataNotice
            dataAsOf={meta.dataAsOf}
            label="Latest fuel bill"
            emptyText="No fuel bills have been logged yet."
            staleHint="Cycles close only when a full-tank bill is logged, so no newer cycles exist."
          />
        ) : null
      }
      kpis={kpis}
      footer={
        <ReportFooter
          summary={`${rangeLabel(page, PAGE_SIZE, meta.total)} cycles`}
          page={page}
          totalPages={meta.totalPages}
          onPage={setPage}
        />
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={meta.total}
        activeFilters={activeFilters}
        emptyTitle="No mileage records found"
        emptyHint="Try widening the date range, clearing the search or choosing All vehicles, All drivers and All cycles."
      />
    </ReportFrame>
  );
};

export default MileageIntervalReport;
