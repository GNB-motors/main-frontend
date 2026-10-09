import React, { useState } from 'react';
import DataTable from '../../../components/ui/DataTable';
import SegmentedChips from './SegmentedChips';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import StatusChip from '../../../components/ui/StatusChip';
import { useApi } from '../../../hooks/useApi';
import { toISTDateString, toISTTimeString } from '../../../utils/dateUtils';
import { formatLitres } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import {
  RECONCILIATION_RESULT,
  drawerFromReconciliationRow,
  reconciliationExplanation,
} from '../mileageRows';
import InfoTip from './InfoTip';

const CHIPS = [
  { key: 'all', label: 'All bills' },
  { key: 'flagged', label: 'Bill too high' },
  { key: 'review', label: 'Bill too low' },
  { key: 'clean', label: 'Bill matches' },
];

const columns = (onOpen) => [
  {
    key: 'truck',
    label: 'Truck',
    render: (r) => (
      <>
        <span className="mhub-plate">{r.vehicleNumber || '—'}</span>
        <span className="mhub-sub">{r.model || ' '}</span>
      </>
    ),
  },
  {
    key: 'when',
    label: 'Bill time',
    render: (r) =>
      r.billDate ? (
        <span className="num">
          {toISTDateString(r.billDate)}
          <span className="mhub-sub">{toISTTimeString(r.billDate)}</span>
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'pump',
    label: 'Pump',
    render: (r) => r.fuelPumpName || <span className="mhub-dim">—</span>,
  },
  {
    key: 'bill',
    label: 'On bill',
    align: 'right',
    render: (r) => (
      <span className="mhub-litres">{formatLitres(r.billLitres, { decimals: 0 })}</span>
    ),
  },
  {
    key: 'tank',
    label: 'Tank rose',
    align: 'right',
    render: (r) => (
      <span className="mhub-litres">{formatLitres(r.telemetryLitres, { decimals: 0 })}</span>
    ),
  },
  {
    key: 'result',
    label: 'Result',
    render: (r) => (
      <span className="mhub-cell">
        <StatusChip group="refuel" value={RECONCILIATION_RESULT[r.status]} />
        <InfoTip explanation={reconciliationExplanation(r)} />
      </span>
    ),
  },
  {
    key: 'open',
    label: '',
    render: (r) => (
      <button
        type="button"
        className="mhub-open"
        aria-label={`Open bill for ${r.vehicleNumber || 'truck'}`}
        onClick={() => onOpen?.(drawerFromReconciliationRow(r))}
      >
        Open
      </button>
    ),
  },
];

/** GET /api/fuel-comparison/records — each bill matched to a tank rise, in the hub's dates. */
export default function ReconciliationTab({ range, searchQuery = '', onOpenDrawer }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [queryKey, setQueryKey] = useState(`${searchQuery}|${range.from}|${range.to}`);
  const nextKey = `${searchQuery}|${range.from}|${range.to}`;
  if (queryKey !== nextKey) {
    setQueryKey(nextKey);
    setPage(1);
  }

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      MileageApi.billVsTank(
        range,
        {
          page,
          limit: pageSize,
          search: searchQuery || undefined,
          status: status !== 'all' ? status : undefined,
        },
        signal,
      ),
    [range.from, range.to, page, pageSize, searchQuery, status],
  );
  const rows = data?.data?.records || [];
  const total = data?.meta?.total ?? rows.length;

  return (
    <div className="mhub">
      <div className="mhub-status-row">
        <SegmentedChips
          ariaLabel="Filter bills by status"
          options={CHIPS}
          value={status}
          onChange={(key) => {
            setStatus(key);
            setPage(1);
          }}
        />
      </div>
      <DataTable
        columns={columns(onOpenDrawer)}
        rows={rows}
        rowKey={(r) => r._id}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={total}
        emptyTitle="No bills to compare in these dates"
        emptyHint="Bills appear here once they are matched to a tank rise."
        pagination={
          <EnterprisePagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / pageSize))}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      />
    </div>
  );
}
