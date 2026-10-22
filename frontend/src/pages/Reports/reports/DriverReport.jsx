import { Fuel, Gauge, IndianRupee, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import {
  DRIVER_EXPORT_COLUMNS,
  FLEET_REPORT_PAGE_SIZE,
  exportFilterMeta,
} from './fleetReportUtils';
import { KmplCell, NameCell } from './fleetReportCells';
import ReportFrame, { ReportFooter } from './ReportFrame';
import ReportFilterBar from './ReportFilterBar';
import { rangeLabel } from './reportFilters';
import useReportFilterParams from './useReportFilterParams';
import useReportPage from './useReportPage';

const DriverReport = () => {
  // Filters live in the URL (see <ReportFilterBar/>), so this report keeps no
  // filter state and a filtered view can be shared as a link.
  const { filters, range, requestParams, activeCount } = useReportFilterParams();
  const filterKey = JSON.stringify(requestParams);
  const [page, setPage] = useReportPage(filterKey);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi(
    (signal) =>
      ReportsService.getDriverReports({ ...requestParams, page, limit: FLEET_REPORT_PAGE_SIZE }, signal),
    [filterKey, page],
  );

  const rows = response?.data || [];
  const meta = response?.meta || { total: 0, totalPages: 0 };
  const summary = response?.summary;

  const columns = [
    {
      key: 'driver',
      label: 'Driver',
      render: (r) => (
        <NameCell primary={r.driverName} secondary={r.mobileNumber} isDeleted={r.isDeleted} />
      ),
    },
    {
      key: 'bills',
      label: 'Bills',
      align: 'right',
      render: (r) => <div className="cell-primary">{formatNum(r.totalRefuels)}</div>,
    },
    {
      key: 'diesel',
      label: 'Diesel',
      align: 'right',
      render: (r) => <div className="cell-primary">{formatLitres(r.totalDieselLiters)}</div>,
    },
    {
      key: 'adblue',
      label: 'AdBlue',
      align: 'right',
      render: (r) => <div className="cell-primary">{formatLitres(r.totalAdBlueLiters)}</div>,
    },
    {
      key: 'spend',
      label: 'Fuel spend',
      align: 'right',
      render: (r) => <div className="cell-primary">{formatINR(r.totalFuelCost)}</div>,
    },
    {
      key: 'distance',
      label: 'Distance',
      align: 'right',
      render: (r) => (
        <div className="cell-primary">{r.totalDistanceKm ? formatKm(r.totalDistanceKm) : '—'}</div>
      ),
    },
    {
      key: 'kmpl',
      label: 'Mileage',
      align: 'right',
      render: (r) => (
        <KmplCell
          value={r.avgMileageKmPerL}
          cycleCount={r.cycleCount}
          excludedCycleCount={r.excludedCycleCount}
          plausible={meta.plausibleKmPerL}
        />
      ),
    },
    {
      key: 'costPerKm',
      label: '₹/km',
      align: 'right',
      render: (r) => (
        <div className="cell-primary">
          {r.costPerKm != null ? formatINR(r.costPerKm, { decimals: 2 }) : '—'}
        </div>
      ),
    },
    {
      key: 'lastBill',
      label: 'Last bill',
      render: (r) => (
        <div className="cell-primary">{r.lastRefuelAt ? formatDateIST(r.lastRefuelAt) : '—'}</div>
      ),
    },
  ];

  const selectedDriverLabel = filters.driver !== 'all' && rows[0] ? rows[0].driverName : null;
  const exportEntityLabel =
    [selectedDriverLabel, requestParams.search ? `“${requestParams.search}”` : null]
      .filter(Boolean)
      .join(' · ') || null;

  const kpis = summary
    ? [
        { label: 'Fuel spend', value: formatINR(summary.totalFuelCost), icon: IndianRupee },
        {
          label: 'Diesel billed',
          value: formatLitres(summary.totalDieselLiters, { decimals: 0 }),
          icon: Fuel,
          tone: 'teal',
        },
        {
          label: 'Distance in cycles',
          value: formatKm(summary.totalDistanceKm),
          icon: Route,
          tone: 'violet',
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
      ]
    : null;

  return (
    <ReportFrame
      title="Driver Report"
      subtitle="Fuel billed by each driver, and mileage over the full-tank cycles they opened"
      filters={<ReportFilterBar searchPlaceholder="Search driver or phone" />}
      actions={
        <ExportButton
          rows={rows}
          columns={DRIVER_EXPORT_COLUMNS}
          filename="driver-report"
          buttonClass="rpt-btn"
          fetchAll={() =>
            ReportsService.fetchAllReportRows(ReportsService.getDriverReports, requestParams)
          }
          meta={{
            filters: exportFilterMeta({
              from: range.from,
              to: range.to,
              entityLabel: exportEntityLabel,
            }),
          }}
          disabled={!rows.length}
        />
      }
      notice={
        response && 'dataAsOf' in meta ? (
          <ReportDataNotice
            dataAsOf={meta.dataAsOf}
            label="Latest fuel bill"
            emptyText="No fuel bills have been logged yet."
            staleHint="Bills logged after that date will show here once they are entered."
          />
        ) : null
      }
      kpis={kpis}
      footer={
        <ReportFooter
          summary={`${rangeLabel(page, FLEET_REPORT_PAGE_SIZE, meta.total)} drivers`}
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
        emptyTitle="No driver fuel data"
        emptyHint="Try widening the date range, clearing the search or choosing All vehicles and All drivers."
      />
    </ReportFrame>
  );
};

export default DriverReport;
