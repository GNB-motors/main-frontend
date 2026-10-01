import { useMemo, useState } from 'react';
import { Fuel, Gauge, IndianRupee, Route } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import KpiCard from '../../../components/ui/KpiCard';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import useApi from '../../../hooks/useApi';
import { ReportsService } from '../ReportsService.jsx';
import { formatINR, formatKm, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { buildFilterParams, extractDriverOptions } from './mileageIntervalReportUtils';
import {
  DRIVER_EXPORT_COLUMNS,
  FLEET_REPORT_PAGE_SIZE,
  exportFilterMeta,
} from './fleetReportUtils';
import { KmplCell, NameCell } from './fleetReportCells';
import ReportPagination from './ReportPagination';

const DriverReport = () => {
  const [range, setRange] = useState({ from: '', to: '' });
  const [driverId, setDriverId] = useState('all');
  const [pager, setPager] = useState({ key: '', page: 1 });

  const { data: employees } = useApi(() => ReportsService.getEmployees({ limit: 1000 }), []);
  const driverOptions = useMemo(() => extractDriverOptions(employees || []), [employees]);

  const filters = useMemo(
    () => buildFilterParams({ startDate: range.from, endDate: range.to, driverId }),
    [range, driverId],
  );
  const filterKey = JSON.stringify(filters);
  // A filter change starts again at page 1 in the same render, so no request
  // ever goes out for an old page number under new filters.
  const page = pager.key === filterKey ? pager.page : 1;
  const setPage = (next) => setPager({ key: filterKey, page: next });

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi(
    (signal) =>
      ReportsService.getDriverReports({ ...filters, page, limit: FLEET_REPORT_PAGE_SIZE }, signal),
    [filterKey, page],
  );

  const rows = response?.data || [];
  const meta = response?.meta || { total: 0, totalPages: 0 };
  const summary = response?.summary;
  const selectedDriverLabel =
    driverId === 'all'
      ? 'All drivers'
      : driverOptions.find((d) => d.id === driverId)?.label || 'Driver';

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
      render: (r) => (
        <div className="cell-primary" style={{ fontWeight: 600 }}>
          {formatINR(r.totalFuelCost)}
        </div>
      ),
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

  const activeFilters = (range.from ? 1 : 0) + (range.to ? 1 : 0) + (driverId !== 'all' ? 1 : 0);

  return (
    <PageShell
      className="p-6"
      title="Driver Report"
      subtitle="Fuel billed by each driver, and mileage over the full-tank cycles they opened"
      count={meta.total}
      actions={
        <ExportButton
          rows={rows}
          columns={DRIVER_EXPORT_COLUMNS}
          filename="driver-report"
          fetchAll={() =>
            ReportsService.fetchAllReportRows(ReportsService.getDriverReports, filters)
          }
          meta={{
            filters: exportFilterMeta({
              ...range,
              entityLabel: driverId !== 'all' ? selectedDriverLabel : null,
            }),
          }}
          disabled={!rows.length}
        />
      }
      filters={
        <FilterBar
          from={range.from}
          to={range.to}
          onRangeChange={(patch) => setRange((prev) => ({ ...prev, ...patch }))}
          activeCount={activeFilters}
          onClear={() => {
            setRange({ from: '', to: '' });
            setDriverId('all');
          }}
          right={
            <div className="date-input-group">
              <label htmlFor="driver-report-driver">Driver</label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger id="driver-report-driver" className="h-9 w-[200px] text-sm">
                  <SelectValue>{selectedDriverLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">All drivers</SelectItem>
                  {driverOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      }
      footer={
        meta.totalPages > 1 ? (
          <div className="flex w-full items-center justify-end">
            <ReportPagination page={page} totalPages={meta.totalPages} onPage={setPage} />
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {response && 'dataAsOf' in meta ? (
          <ReportDataNotice
            dataAsOf={meta.dataAsOf}
            label="Latest fuel bill"
            emptyText="No fuel bills have been logged yet."
            staleHint="Bills logged after that date will show here once they are entered."
          />
        ) : null}
        {summary ? (
          <div className="flex flex-wrap gap-3">
            <KpiCard
              title="Fuel spend"
              value={formatINR(summary.totalFuelCost)}
              accent="#2563eb"
              icon={<IndianRupee size={18} />}
            />
            <KpiCard
              title="Diesel billed"
              value={formatLitres(summary.totalDieselLiters, { decimals: 0 })}
              accent="#0d9488"
              icon={<Fuel size={18} />}
            />
            <KpiCard
              title="Distance in cycles"
              value={formatKm(summary.totalDistanceKm)}
              accent="#7c3aed"
              icon={<Route size={18} />}
            />
            <KpiCard
              title="Average mileage"
              value={
                summary.averageKmPerL != null
                  ? `${formatNum(summary.averageKmPerL, { decimals: 2 })} km/L`
                  : '—'
              }
              accent="#c2410c"
              icon={<Gauge size={18} />}
            />
          </div>
        ) : null}
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
          emptyTitle="No driver fuel data"
          emptyHint="Try widening the date range or choosing All drivers."
        />
      </div>
    </PageShell>
  );
};

export default DriverReport;
