import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Droplets, Gauge, Info } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import { formatInIST } from '../../../utils/dateUtils';
import { ReportsService } from '../ReportsService.js';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
} from './ReportFrame';
import { VehiclePicker } from './ReportEntityPicker';
import { exportFilterMeta } from './fleetReportUtils';
import {
  compactParams,
  istDayEnd,
  istDayStart,
  istDaysAgo,
  istToday,
  rangeLabel,
} from './reportFilters';
import useReportPage from './useReportPage';
import './AdBlueComparisonReport.css';

const PAGE_SIZE = 20;
// The comparison endpoint's largest page.
const EXPORT_PAGE_SIZE = 100;

const number = (value, digits = 1) =>
  typeof value === 'number'
    ? value.toLocaleString('en-IN', { maximumFractionDigits: digits })
    : '—';

const currency = (value) =>
  typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : '—';

const STATUS = {
  OK: { icon: CheckCircle2, label: 'OK', className: 'ok' },
  REVIEW: { icon: AlertTriangle, label: 'Review', className: 'review' },
  STALE: { icon: Clock3, label: 'Stale feed', className: 'stale' },
  NO_DATA: { icon: Info, label: 'No data', className: 'no-data' },
};

const StatusBadge = ({ status, reason }) => {
  const config = STATUS[status] || { icon: Info, label: status, className: 'no-data' };
  const Icon = config.icon;
  return (
    <span className={`adblue-status ${config.className}`} title={reason}>
      <Icon size={13} /> {config.label}
    </span>
  );
};

const COLUMNS = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (row) => (
      <>
        <div className="cell-primary">{row.registrationNumber}</div>
        <div className="cell-secondary">
          {row.vehicleType}
          {row.model !== '-' ? ` · ${row.model}` : ''}
        </div>
      </>
    ),
  },
  {
    key: 'recorded',
    label: 'Recorded added',
    render: (row) => (
      <>
        <div className="cell-primary">{number(row.recordedLitres)} L</div>
        <div className="cell-secondary">
          {row.additionCount} top-up{row.additionCount === 1 ? '' : 's'}
        </div>
      </>
    ),
  },
  { key: 'amount', label: 'Amount', render: (row) => currency(row.recordedAmount) },
  {
    key: 'consumed',
    label: 'FleetEdge consumed',
    render: (row) => (
      <>
        <div className="cell-primary">
          {row.telemetryConsumedLitres == null ? '—' : `${number(row.telemetryConsumedLitres)} L`}
        </div>
        <div className="cell-secondary">
          {row.telemetryHours ? `${row.telemetryHours} h of data` : 'No DEF data'}
        </div>
      </>
    ),
  },
  {
    key: 'variance',
    label: 'Unreconciled',
    render: (row) => (
      <span
        className={row.varianceLitres != null && row.varianceLitres > 0 ? 'variance-positive' : ''}
      >
        {row.varianceLitres == null ? '—' : `${number(row.varianceLitres)} L`}
      </span>
    ),
  },
  {
    key: 'def',
    label: 'Current DEF',
    render: (row) => (
      <>
        <div className="cell-primary">
          {row.currentDefLevel == null ? '—' : `${number(row.currentDefLevel)}%`}
        </div>
        <div className="cell-secondary">
          {row.currentDefLitres != null ? `${number(row.currentDefLitres)} L · ` : ''}
          {row.currentDefLevel == null ? 'No level' : row.isFresh ? 'Fresh' : 'Not fresh'}
        </div>
      </>
    ),
  },
  {
    key: 'sync',
    label: 'Last live sync',
    render: (row) =>
      row.lastSyncedAt ? formatInIST(row.lastSyncedAt, 'DD MMM YYYY, hh:mm A') : '—',
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <StatusBadge status={row.status} reason={row.statusReason} />,
  },
];

const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'vehicleType', label: 'Type' },
  { key: 'model', label: 'Model' },
  { key: 'recordedLitres', label: 'Recorded added (L)', type: 'number' },
  { key: 'additionCount', label: 'Top-ups', type: 'number' },
  { key: 'recordedAmount', label: 'Amount (₹)', type: 'currency' },
  { key: 'telemetryConsumedLitres', label: 'FleetEdge consumed (L)', type: 'number' },
  { key: 'telemetryHours', label: 'Hours of DEF data', type: 'number' },
  { key: 'varianceLitres', label: 'Unreconciled (L)', type: 'number' },
  { key: 'currentDefLevel', label: 'Current DEF (%)', type: 'number' },
  { key: 'currentDefLitres', label: 'Current DEF (L)', type: 'number' },
  { key: 'lastSyncedAt', label: 'Last live sync', type: 'date' },
  { key: 'status', label: 'Status' },
];

const fetchComparison = (params, signal) => ReportsService.getAdBlueComparison(params, { signal });

const defaultRange = () => ({ from: istDaysAgo(30), to: istToday() });

const AdBlueComparisonReport = () => {
  const [range, setRange] = useState(defaultRange);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [vehicleId, setVehicleId] = useState('all');

  const filters = useMemo(
    () =>
      compactParams({
        startDate: istDayStart(range.from),
        endDate: istDayEnd(range.to),
        search: debouncedSearch,
        vehicleId,
      }),
    [range, debouncedSearch, vehicleId],
  );
  const filterKey = JSON.stringify(filters);
  const [page, setPage] = useReportPage(filterKey);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi(
    (signal) => fetchComparison({ ...filters, page, limit: PAGE_SIZE }, signal),
    [filterKey, page],
  );

  const body = response || {};
  const rows = body.data || [];
  const summary = body.summary || {};
  const meta = body.meta || { page: 1, total: 0, totalPages: 1 };
  const methodology = body.methodology || {};

  const fetchAll = async () => {
    const all = [];
    let next = 1;
    let totalPages = 1;
    do {
      const res = await fetchComparison({ ...filters, page: next, limit: EXPORT_PAGE_SIZE });
      all.push(...(res?.data || []));
      totalPages = res?.meta?.totalPages || 1;
      next += 1;
    } while (next <= totalPages);
    return all;
  };

  const defaults = defaultRange();
  const activeFilters =
    (range.from !== defaults.from ? 1 : 0) +
    (range.to !== defaults.to ? 1 : 0) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0);

  return (
    <ReportFrame
      title="AdBlue Telemetry Comparison"
      subtitle="Logged AdBlue top-ups compared with FleetEdge DEF consumption and the live tank level."
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ReportSearch value={search} onChange={setSearch} placeholder="Search vehicle" />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange(defaultRange());
              setSearch('');
              setVehicleId('all');
            }}
          />
        </>
      }
      actions={
        <ExportButton
          rows={rows}
          columns={EXPORT_COLUMNS}
          filename="adblue-comparison"
          buttonClass="rpt-btn"
          fetchAll={fetchAll}
          meta={{
            filters: exportFilterMeta({
              ...range,
              entityLabel: debouncedSearch ? `“${debouncedSearch}”` : null,
            }),
          }}
          disabled={!rows.length}
        />
      }
      notice={
        response && 'dataAsOf' in meta ? (
          <ReportDataNotice
            dataAsOf={meta.dataAsOf}
            label="Latest DEF telemetry"
            emptyText="No FleetEdge DEF telemetry for these vehicles in this period."
            staleHint="The FleetEdge feed has not reported since — reconnect the account if this persists."
          />
        ) : null
      }
      kpis={[
        {
          label: 'Recorded additions',
          value: `${number(summary.totalRecordedLitres)} L`,
          icon: Droplets,
        },
        {
          label: 'FleetEdge consumed',
          value: `${number(summary.totalTelemetryConsumedLitres)} L`,
          icon: Gauge,
        },
        {
          label: 'Average current DEF',
          value: `${number(summary.averageCurrentDefLevel)}%`,
          icon: Droplets,
        },
        {
          label: 'Vehicles to review',
          value: summary.reviewCount ?? 0,
          icon: AlertTriangle,
          tone: 'orange',
        },
      ]}
      footer={
        <ReportFooter
          summary={`${rangeLabel(page, PAGE_SIZE, meta.total || 0)} vehicles · Live feed fresh for ${
            summary.freshLiveVehicleCount || 0
          }${methodology.freshnessHours ? ` (≤ ${methodology.freshnessHours}h)` : ''}`}
          page={page}
          totalPages={meta.totalPages}
          onPage={setPage}
        />
      }
    >
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row.vehicleId}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={meta.total}
        activeFilters={activeFilters}
        emptyTitle="No AdBlue or FleetEdge DEF data"
        emptyHint="Try widening the date range or clearing the search."
      />
      {methodology.warning ? <p className="adblue-method-note">{methodology.warning}</p> : null}
    </ReportFrame>
  );
};

export default AdBlueComparisonReport;
