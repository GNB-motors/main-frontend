import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import SegmentedChips from './SegmentedChips';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import StatusChip from '../../../components/ui/StatusChip';
import { useApi } from '../../../hooks/useApi';
import { toISTDateString, toISTTimeString } from '../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import {
  ODOMETER_SOURCE,
  REFUEL_CHIPS,
  drawerFromLiveRow,
  fillExplanation,
  mapUnifiedRow,
} from '../mileageRows';
import InfoTip from './InfoTip';

const coordsText = (c) => `${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}`;

/** Where the fill happened: a saved place links to Place Hub, where it can be named. */
function PumpCell({ row }) {
  if (row.place) {
    return (
      <Link
        to={`/place-hub?place=${encodeURIComponent(row.place.hubId)}`}
        className="mhub-link"
        title="Open in Place Hub"
      >
        {row.place.name || row.location || 'Name this pump'}
      </Link>
    );
  }
  if (row.location) return <span>{row.location}</span>;
  if (row.coords) {
    return (
      <span>
        Unknown pump<span className="mhub-sub num">{coordsText(row.coords)}</span>
      </span>
    );
  }
  return <span className="mhub-dim">—</span>;
}

const columns = (onOpen) => [
  {
    key: 'truck',
    label: 'Truck',
    render: (r) => (
      <>
        <span className="mhub-plate">{r.vehicleNo || '—'}</span>
        <span className="mhub-sub">{r.model || ' '}</span>
      </>
    ),
  },
  {
    key: 'when',
    label: 'When',
    render: (r) =>
      r.at ? (
        <span className="num">
          {toISTDateString(r.at)}
          <span className="mhub-sub">{toISTTimeString(r.at)}</span>
        </span>
      ) : (
        '—'
      ),
  },
  {
    key: 'tank',
    label: 'Sensor',
    align: 'right',
    render: (r) =>
      r.result === 'GAUGE_JUMP' ? (
        <span className="mhub-dim">0 L</span>
      ) : r.sensorLitres != null ? (
        <span className="mhub-litres">{formatLitres(r.sensorLitres, { decimals: 0 })}</span>
      ) : (
        <span className="mhub-dim">—</span>
      ),
  },
  {
    key: 'bill',
    label: 'On bill',
    align: 'right',
    render: (r) =>
      r.slipLitres != null ? (
        <span className="mhub-litres">{formatLitres(r.slipLitres, { decimals: 0 })}</span>
      ) : (
        <span className="mhub-dim">no bill</span>
      ),
  },
  {
    key: 'result',
    label: 'Result',
    render: (r) => (
      <span className="mhub-cell">
        <StatusChip group="refuel" value={r.result} />
        <InfoTip explanation={fillExplanation(r)} />
      </span>
    ),
  },
  { key: 'pump', label: 'Pump', render: (r) => <PumpCell row={r} /> },
  {
    key: 'rate',
    label: 'Rate',
    align: 'right',
    render: (r) =>
      r.rate?.value != null ? (
        <span
          className="num"
          title={r.rate.provenance === 'CALCULATED' ? 'Amount ÷ litres' : 'From bill'}
        >
          {formatINR(r.rate.value, { decimals: 2 })}
          {r.rate.provenance === 'CALCULATED' ? <span className="mhub-sub">calc</span> : null}
        </span>
      ) : (
        <span className="mhub-dim">—</span>
      ),
  },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    render: (r) => <span className="num">{formatINR(r.totalAmount)}</span>,
  },
  {
    key: 'odometer',
    label: 'Odometer',
    align: 'right',
    render: (r) => {
      const src =
        r.odometerSource && r.odometerSource !== 'MANUAL' && r.odometerSource !== 'Typed in'
          ? ODOMETER_SOURCE[r.odometerSource]
          : null;
      return r.odometer != null ? (
        <span className="num">
          {formatKm(r.odometer)}
          {src ? <span className="mhub-sub">{src}</span> : null}
        </span>
      ) : (
        <span className="mhub-dim">—</span>
      );
    },
  },
  {
    key: 'open',
    label: '',
    render: (r) => (
      <button
        type="button"
        className="mhub-open"
        aria-label={`Open fill for ${r.vehicleNo || 'truck'}`}
        onClick={() => onOpen?.(drawerFromLiveRow(r))}
      >
        Open
      </button>
    ),
  },
];

/** GET /api/fuel-logs/unified — every fill in the hub's dates, bill and tank side by side. */
export default function LiveRefuelTab({
  range,
  searchQuery = '',
  fuelType = null,
  onOpenDrawer,
  refreshKey = 0,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [newestFirst, setNewestFirst] = useState(true);
  const [status, setStatus] = useState('all');

  // A new search or range is a new result set: back to page 1 in the same render.
  const [queryKey, setQueryKey] = useState(`${searchQuery}|${range.from}|${range.to}`);
  const nextKey = `${searchQuery}|${range.from}|${range.to}`;
  if (queryKey !== nextKey) {
    setQueryKey(nextKey);
    setPage(1);
  }

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      MileageApi.unifiedFeed(
        range,
        {
          page,
          limit: pageSize,
          search: searchQuery || undefined,
          fuelType: fuelType || undefined,
          status: status !== 'all' ? status : undefined,
          // desc is the API default; only the non-default goes on the wire.
          sort: newestFirst ? undefined : 'asc',
        },
        signal,
      ),
    [range.from, range.to, page, pageSize, searchQuery, fuelType, status, newestFirst, refreshKey],
  );

  const rows = (data?.data || []).map(mapUnifiedRow);
  const meta = data?.meta || null;
  const counts = meta
    ? {
        verified: meta.verified || 0,
        flagged: meta.flagged || 0,
        unverified: meta.unverified || 0,
        slipOnly: meta.slipOnly || 0,
        sensorGlitch: meta.sensorGlitch || 0,
      }
    : null;

  return (
    <div className="mhub">
      <div className="mhub-status-row">
        <SegmentedChips
          ariaLabel="Filter fills by status"
          options={REFUEL_CHIPS.map((c) => ({
            key: c.key,
            label: c.label,
            count: counts ? c.count(counts) : null,
          }))}
          value={status}
          onChange={(key) => {
            setStatus(key);
            setPage(1);
          }}
        />
        <button
          type="button"
          className="pshell-btn"
          onClick={() => {
            setNewestFirst((v) => !v);
            setPage(1);
          }}
        >
          <ArrowUpDown size={14} aria-hidden /> {newestFirst ? 'Newest first' : 'Oldest first'}
        </button>
      </div>
      <DataTable
        columns={columns(onOpenDrawer)}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading && !data}
        error={error ? 'Couldn’t load the fills.' : null}
        onRetry={refetch}
        showing={rows.length}
        total={meta?.total ?? rows.length}
        emptyTitle="No fills in these dates"
        emptyHint="Pick a wider date range."
        pagination={
          <EnterprisePagination
            page={page}
            totalPages={meta?.totalPages || 1}
            totalItems={meta?.total ?? 0}
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
