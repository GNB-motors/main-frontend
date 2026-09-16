import { useMemo, useState } from 'react';
import IdlingConsoleService from './IdlingConsoleService';
import { formatDurationMin, matchesRegistration } from './idlingConsole.utils.js';
import useApi from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import StatusChip from '../../components/ui/StatusChip';
import PlaceLabel from '../../components/ui/PlaceLabel';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import { formatINR, formatLitres } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';

const PAGE_SIZE = 20;

const CLOSED_REASON_LABEL = {
  MOVEMENT: 'Started moving',
  STALE_FEED: 'Vehicle stopped reporting',
};

const COLUMNS = [
  {
    key: 'registrationNumber',
    label: 'Vehicle',
    render: (row) => <span className="reg-plate">{row.registrationNumber || '—'}</span>,
  },
  { key: 'startAt', label: 'Started', render: (row) => formatDateTimeIST(row.startAt) },
  { key: 'endAt', label: 'Ended', render: (row) => formatDateTimeIST(row.endAt) },
  {
    key: 'durationMin',
    label: 'Duration',
    align: 'right',
    render: (row) => <span className="num">{formatDurationMin(row.durationMin)}</span>,
  },
  {
    key: 'location',
    label: 'Location',
    render: (row) => <PlaceLabel lat={row.lat} lng={row.lng} />,
  },
  {
    key: 'legitimacy',
    label: 'Status',
    render: (row) => <StatusChip group="legitimacy" value={row.legitimacy} />,
  },
  {
    key: 'cost',
    label: 'Cost',
    align: 'right',
    render: (row) => (
      <span className="num">
        {formatINR(row.rupees)}
        <span className="text-dim ml-1 text-[11px]">({formatLitres(row.litres)})</span>
      </span>
    ),
  },
  {
    key: 'closedReason',
    label: 'Ended because',
    render: (row) => (
      <span className="text-dim text-[11px]">{CLOSED_REASON_LABEL[row.closedReason] || '—'}</span>
    ),
  },
];

/** Past (closed) idle segments — paginated server-side, filtered by vehicle client-side. */
export default function IdlingHistoryPanel() {
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);

  const {
    data: result,
    loading,
    error,
    refetch,
  } = useApi(
    (signal) =>
      IdlingConsoleService.getHistory(
        { from: range.from || undefined, to: range.to || undefined, page, limit: PAGE_SIZE },
        { signal },
      ),
    [range.from, range.to, page],
  );

  const meta = result?.meta || { total: 0, totalPages: 1 };

  const rows = useMemo(() => {
    const records = result?.data || [];
    return records.filter((row) => matchesRegistration(vehicleQuery, row.registrationNumber));
  }, [result, vehicleQuery]);

  const handleRangeChange = (patch) => {
    setRange((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        searchValue={vehicleQuery}
        onSearchChange={setVehicleQuery}
        searchPlaceholder="Filter by vehicle"
        from={range.from}
        to={range.to}
        onRangeChange={handleRangeChange}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        paginated
        showing={rows.length}
        total={meta.total}
        emptyTitle="No past idle segments in this window"
        emptyHint="Closed idle segments — a vehicle that stopped and then started moving again — show up here."
      />
      {meta.totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-40' : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-dim px-2 text-xs">
                Page {page} of {meta.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                aria-disabled={page >= meta.totalPages}
                className={page >= meta.totalPages ? 'pointer-events-none opacity-40' : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
