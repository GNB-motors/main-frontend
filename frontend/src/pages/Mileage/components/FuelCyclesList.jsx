import React, { useState } from 'react';
import DataTable from '../../../components/ui/DataTable';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import StatusChip from '../../../components/ui/StatusChip';
import { useApi } from '../../../hooks/useApi';
import { toISTDateString } from '../../../utils/dateUtils';
import { formatKm, formatLitres } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import { mapFuelCycleRow, mileageBand } from '../mileageRows';
import InfoTip from './InfoTip';

const compact = (s) =>
  String(s || '')
    .replace(/[\s\-_]/g, '')
    .toUpperCase();
const kmPerL = (v) => (v != null ? `${v.toFixed(2)} km/L` : '—');
const pct = (v) => (v != null ? `${Math.round(v)}%` : '—');

const COLUMNS = [
  {
    key: 'truck',
    label: 'Truck',
    render: (r) => <span className="mhub-plate">{r.vehicleNo || '—'}</span>,
  },
  {
    key: 'between',
    label: 'Between fills',
    render: (r) => (
      <span className="num">
        {r.openAt ? toISTDateString(r.openAt) : '—'} →{' '}
        {r.closeAt ? toISTDateString(r.closeAt) : 'still running'}
      </span>
    ),
  },
  {
    key: 'km',
    label: 'Distance',
    align: 'right',
    render: (r) => <span className="mhub-litres">{formatKm(r.km)}</span>,
  },
  {
    key: 'bills',
    label: 'Diesel',
    align: 'right',
    render: (r) => (
      <span className="mhub-litres">{formatLitres(r.fuelBills, { decimals: 0 })}</span>
    ),
  },
  {
    key: 'mileage',
    label: 'Mileage',
    render: (r) => (
      <span className="mhub-cell">
        <span className="mhub-litres">{kmPerL(r.kmPerLTankToTank)}</span>
        <StatusChip group="mileageBand" value={mileageBand(r.kmPerLTankToTank)} fallback="" />
        <InfoTip
          explanation={{
            title: 'Mileage for this round',
            text: 'Odometer km between the two full-tank fills, divided by the diesel put in. The engine’s own figure is shown for comparison.',
            lines: [
              ['Distance', formatKm(r.km)],
              ['Diesel (bills)', formatLitres(r.fuelBills)],
              ['Engine burned', formatLitres(r.fuelEcu)],
              ['Mileage by engine', kmPerL(r.kmPerLEcu)],
              ['Km seen by tracker', pct(r.kmCoveragePct)],
              ['Diesel seen by engine', pct(r.fuelCoveragePct)],
            ],
          }}
        />
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusChip group="fuelCycle" value={r.status} />,
  },
];

/**
 * GET /api/reports/fuel-cycles — fill-to-fill rounds built nightly from bills
 * and the OIL REPORT register. The endpoint returns every round in the range
 * (newest first, capped at 5,000), so search and paging happen here.
 */
export default function FuelCyclesList({ range, searchQuery = '' }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [queryKey, setQueryKey] = useState(`${searchQuery}|${range.from}|${range.to}`);
  const nextKey = `${searchQuery}|${range.from}|${range.to}`;
  if (queryKey !== nextKey) {
    setQueryKey(nextKey);
    setPage(1);
  }

  const { data, loading, error, refetch } = useApi(
    (signal) => MileageApi.fuelCycles(range, signal),
    [range.from, range.to],
  );
  const rows = (data?.data?.rows || []).map(mapFuelCycleRow);
  const needle = compact(searchQuery);
  const filtered = needle ? rows.filter((r) => compact(r.vehicleNo).includes(needle)) : rows;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DataTable
      columns={COLUMNS}
      rows={pageRows}
      rowKey={(r) => r.id}
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      showing={pageRows.length}
      total={filtered.length}
      emptyTitle="No full-tank rounds in these dates"
      emptyHint="Pick a wider date range."
      pagination={
        <EnterprisePagination
          page={page}
          totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      }
    />
  );
}
