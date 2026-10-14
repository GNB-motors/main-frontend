import { useMemo, useState } from 'react';
import { Fuel, Gauge, IndianRupee, Route } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { ReportsService } from '../ReportsService.js';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import {
  FLEET_REPORT_PAGE_SIZE,
  VEHICLE_EXPORT_COLUMNS,
  exportFilterMeta,
} from './fleetReportUtils';
import { KmplCell, NameCell } from './fleetReportCells';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
} from './ReportFrame';
import { VehiclePicker } from './ReportEntityPicker';
import { compactParams, istDayEnd, istDayStart, rangeLabel } from './reportFilters';
import useReportPage from './useReportPage';

const VehicleReport = () => {
  const [range, setRange] = useState({ from: '', to: '' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [vehicleId, setVehicleId] = useState('all');

  const filters = useMemo(
    () =>
      compactParams({
        startDate: istDayStart(range.from),
        endDate: istDayEnd(range.to),
        vehicleId,
        search: debouncedSearch,
      }),
    [range, vehicleId, debouncedSearch],
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
      ReportsService.getVehicleReports({ ...filters, page, limit: FLEET_REPORT_PAGE_SIZE }, signal),
    [filterKey, page],
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

  const activeFilters =
    (range.from ? 1 : 0) + (range.to ? 1 : 0) + (vehicleId !== 'all' ? 1 : 0) + (search ? 1 : 0);
  const selectedVehicleLabel = vehicleId !== 'all' && rows[0] ? rows[0].registrationNumber : null;

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
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ReportSearch value={search} onChange={setSearch} placeholder="Search vehicle or model" />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange({ from: '', to: '' });
              setSearch('');
              setVehicleId('all');
            }}
          />
        </>
      }
      actions={
        <ExportButton
          rows={rows}
          columns={VEHICLE_EXPORT_COLUMNS}
          filename="vehicle-report"
          buttonClass="rpt-btn"
          fetchAll={() =>
            ReportsService.fetchAllReportRows(ReportsService.getVehicleReports, filters)
          }
          meta={{
            filters: exportFilterMeta({
              ...range,
              entityLabel:
                selectedVehicleLabel || (debouncedSearch ? `“${debouncedSearch}”` : null),
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
        activeFilters={activeFilters}
        emptyTitle="No vehicle fuel data"
        emptyHint="Try widening the date range, clearing the search or choosing All vehicles."
      />
    </ReportFrame>
  );
};

export default VehicleReport;
