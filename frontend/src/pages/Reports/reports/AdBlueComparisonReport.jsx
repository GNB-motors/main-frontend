import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Droplets, Gauge, Info } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import DataTable from '../../../components/ui/DataTable';
import ExportButton from '../../../components/ui/ExportButton';
import ReportDataNotice from '../../../components/ui/ReportDataNotice';
import { formatInIST } from '../../../utils/dateUtils';
import { ReportsService } from '../ReportsService.js';
import ReportFrame, { ReportFooter } from './ReportFrame';
import ReportFilterBar from './ReportFilterBar';
import { exportFilterMeta } from './fleetReportUtils';
import { rangeLabel } from './reportFilters';
import useReportFilterParams from './useReportFilterParams';
import useReportPage from './useReportPage';
import './AdBlueComparisonReport.css';

const PAGE_SIZE = 20;

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

const AdBlueComparisonReport = () => {
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
      ReportsService.getAdBlueComparison({ ...requestParams, page, limit: PAGE_SIZE }, signal),
    [filterKey, page],
    { scopeKey: filters.manufacturer },
  );

  const body = response || {};
  const rows = body.data || [];
  const summary = body.summary || {};
  const meta = body.meta || { page: 1, total: 0, totalPages: 1 };
  const methodology = body.methodology || {};

  return (
    <ReportFrame
      title="AdBlue Telemetry Comparison"
      subtitle="Logged AdBlue top-ups compared with FleetEdge DEF consumption and the live tank level."
      filters={<ReportFilterBar searchPlaceholder="Search vehicle" showDriver={false} />}
      actions={
        <ExportButton
          rows={rows}
          columns={EXPORT_COLUMNS}
          filename="adblue-comparison"
          buttonClass="rpt-btn"
          fetchAll={() =>
            ReportsService.fetchAllReportRows(ReportsService.getAdBlueComparison, requestParams)
          }
          meta={{
            filters: exportFilterMeta({
              from: range.from,
              to: range.to,
              manufacturer: filters.manufacturer,
              entityLabel: requestParams.search ? `“${requestParams.search}”` : null,
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
          value:
            summary.totalRecordedLitres != null ? `${number(summary.totalRecordedLitres)} L` : '—',
          icon: Droplets,
        },
        {
          label: 'FleetEdge consumed',
          value:
            summary.totalTelemetryConsumedLitres != null
              ? `${number(summary.totalTelemetryConsumedLitres)} L`
              : '—',
          icon: Gauge,
        },
        {
          label: 'Average current DEF',
          value:
            summary.averageCurrentDefLevel != null
              ? `${number(summary.averageCurrentDefLevel)}%`
              : '—',
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
        activeFilters={activeCount}
        emptyTitle="No AdBlue or FleetEdge DEF data"
        emptyHint="Try widening the date range or clearing the search."
      />
      {methodology.warning ? <p className="adblue-method-note">{methodology.warning}</p> : null}
    </ReportFrame>
  );
};

export default AdBlueComparisonReport;
