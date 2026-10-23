import { Fuel, Gauge, IndianRupee, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.js';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import {
  FLEET_REPORT_PAGE_SIZE,
  VEHICLE_EXPORT_COLUMNS,
  exportFilterMeta,
} from './fleetReportUtils';
import { KmplCell, NameCell } from './fleetReportCells';
import ReportFrame, { ReportFooter } from './ReportFrame';
import ReportFilterBar from './ReportFilterBar';
import { rangeLabel } from './reportFilters';
import useReportFilterParams from './useReportFilterParams';
import useReportPage from './useReportPage';

const VehicleReport = () => {
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
      ReportsService.getVehicleReports(
        { ...requestParams, page, limit: FLEET_REPORT_PAGE_SIZE },
        signal,
      ),
    [filterKey, page],
    { scopeKey: filters.manufacturer },
  );

  const rows = response?.data || [];
  const meta = response?.meta || { total: 0, totalPages: 0 };
  const summary = response?.summary;

  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (r) => (
        <NameCell
          primary={r.registrationNumber}
          secondary={[r.vehicleType, r.model].filter((x) => x && x !== '-').join(' · ')}
          isDeleted={r.isDeleted}
        />
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
      render: (r) => (
        <>
          <div className="cell-primary">{formatLitres(r.totalDieselLiters)}</div>
          <div className="cell-secondary">{formatINR(r.totalDieselCost)}</div>
        </>
      ),
    },
    {
      key: 'adblue',
      label: 'AdBlue',
      align: 'right',
      render: (r) => (
        <>
          <div className="cell-primary">{formatLitres(r.totalAdBlueLiters)}</div>
          <div className="cell-secondary">{formatINR(r.totalAdBlueCost)}</div>
        </>
      ),
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
          value={r.averageEfficiencyKmpl}
          cycleCount={r.cycleCount}
          excludedCycleCount={r.excludedCycleCount}
          plausible={meta.plausibleKmPerL}
        />
      ),
    },
    {
      key: 'costPerKm',
      label: 'Diesel ₹/km',
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

  const selectedVehicleLabel =
    filters.vehicle !== 'all' && rows[0] ? rows[0].registrationNumber : null;

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
          label: 'Fleet mileage',
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
      title="Vehicle Report"
      subtitle="Fuel billed per vehicle, and mileage over completed full-tank cycles"
      filters={<ReportFilterBar searchPlaceholder="Search vehicle or model" showDriver={false} />}
      actions={
        <ExportButton
          rows={rows}
          columns={VEHICLE_EXPORT_COLUMNS}
          filename="vehicle-report"
          buttonClass="rpt-btn"
          fetchAll={() =>
            ReportsService.fetchAllReportRows(ReportsService.getVehicleReports, requestParams)
          }
          meta={{
            filters: exportFilterMeta({
              manufacturer: filters.manufacturer,
              from: range.from,
              to: range.to,
              entityLabel:
                selectedVehicleLabel || (requestParams.search ? `“${requestParams.search}”` : null),
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
          summary={`${rangeLabel(page, FLEET_REPORT_PAGE_SIZE, meta.total)} vehicles`}
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
        emptyTitle="No vehicle fuel data"
        emptyHint="Try widening the date range, clearing the search or choosing All vehicles."
      />
    </ReportFrame>
  );
};

export default VehicleReport;
