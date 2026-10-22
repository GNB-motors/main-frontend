import { toast } from 'react-toastify';
import { Fuel, Gauge, IndianRupee, ListChecks, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import { exportFilteredReportCsv } from '../../../utils/reportCsvExport';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { useMileageIntervalReportColumns } from './useMileageIntervalReportColumns.jsx';
import { PAGE_SIZE } from './mileageIntervalReportUtils.js';
import ReportFrame, { ReportFooter, ReportSelect } from './ReportFrame';
import ReportFilterBar from './ReportFilterBar';
import { rangeLabel } from './reportFilters';
import useReportFilterParams from './useReportFilterParams';
import useReportPage from './useReportPage';

// Server-side row cap of GET /reports/mileage-intervals/export.
const MILEAGE_EXPORT_CAP = 5000;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All cycles' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ONGOING', label: 'Ongoing' },
];

const MileageIntervalReport = () => {
  // Filters live in the URL (see <ReportFilterBar/>), so this report keeps no
  // filter state and a filtered view can be shared as a link.
  const { requestParams, activeCount } = useReportFilterParams();
  const filterKey = JSON.stringify(requestParams);
  const [page, setPage] = useReportPage(filterKey);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi(
    (signal) =>
      ReportsService.getMileageIntervalReports(
        { ...requestParams, page, limit: PAGE_SIZE },
        signal,
      ),
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
      filters:
        format === 'xlsx' ? { ...requestParams, format: 'xlsx' } : requestParams,
      filenamePrefix: format === 'xlsx' ? 'mileage_report' : 'mileage_interval_report',
      extension: format,
      errorMessage: 'Could not export mileage report.',
    });
  };

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
        <ReportFilterBar
          searchPlaceholder="Search vehicle number"
          extra={({ filters: current, setFilter }) => (
            <ReportSelect
              label="Status"
              value={current.status || 'ALL'}
              onChange={(value) => setFilter('status', value === 'ALL' ? '' : value)}
              options={STATUS_OPTIONS}
            />
          )}
        />
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
        activeFilters={activeCount}
        emptyTitle="No mileage records found"
        emptyHint="Try widening the date range, clearing the search or choosing All vehicles, All drivers and All cycles."
      />
    </ReportFrame>
  );
};

export default MileageIntervalReport;
