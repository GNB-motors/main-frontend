import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/ui/DataTable';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import StatusChip from '../../../components/ui/StatusChip';
import { useApi } from '../../../hooks/useApi';
import { toISTDateString } from '../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import { mapIntervalRow, mileageBand } from '../mileageRows';
import FuelCyclesList from './FuelCyclesList';
import InfoTip from './InfoTip';

const between = (a, b) => `${a ? toISTDateString(a) : '—'} → ${b ? toISTDateString(b) : '—'}`;

const COLUMNS = [
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
    key: 'between',
    label: 'Between fills',
    render: (r) => <span className="num">{between(r.startDate, r.endDate)}</span>,
  },
  {
    key: 'km',
    label: 'Distance',
    align: 'right',
    render: (r) => <span className="mhub-litres">{formatKm(r.distanceKm)}</span>,
  },
  {
    key: 'fuel',
    label: 'Diesel',
    align: 'right',
    render: (r) => <span className="mhub-litres">{formatLitres(r.fuelL, { decimals: 0 })}</span>,
  },
  {
    key: 'mileage',
    label: 'Mileage',
    render: (r) => (
      <span className="mhub-cell">
        <span className="mhub-litres">
          {r.kmPerL != null ? `${r.kmPerL.toFixed(2)} km/L` : '—'}
        </span>
        <StatusChip group="mileageBand" value={mileageBand(r.kmPerL)} fallback="" />
        <InfoTip
          explanation={{
            title: 'Mileage for this round',
            text: 'Km on the odometer between the two full-tank fills, divided by all diesel put in between (the closing full tank plus any top-ups).',
            lines: [
              ['Odometer', `${formatKm(r.startOdo)} → ${formatKm(r.endOdo)}`],
              ['Distance', formatKm(r.distanceKm)],
              ['Diesel put in', formatLitres(r.fuelL)],
            ],
          }}
        />
      </span>
    ),
  },
  {
    key: 'cost',
    label: 'Cost',
    align: 'right',
    render: (r) => <span className="num">{formatINR(r.cost)}</span>,
  },
  {
    key: 'check',
    label: 'Tracker check',
    render: (r) => <StatusChip group="trackerCheck" value={r.check} />,
  },
];

function IntervalCycles({ searchQuery = '' }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchedFor, setSearchedFor] = useState(searchQuery);
  if (searchedFor !== searchQuery) {
    setSearchedFor(searchQuery);
    setPage(1);
  }

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      MileageApi.intervals(
        { page, limit: pageSize, status: 'COMPLETED', search: searchQuery || undefined },
        signal,
      ),
    [page, pageSize, searchQuery],
  );
  const rows = (data?.data || []).map(mapIntervalRow);
  const total = data?.meta?.total ?? rows.length;

  return (
    <div className="mhub">
      <p className="mhub-footnote">This list shows all dates. It can’t be narrowed by date yet.</p>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={total}
        onRowClick={(r) => navigate(`/mileage-tracking/${r.id}`)}
        emptyTitle="No full-tank rounds yet"
        emptyHint="A round closes when a truck fills a full tank again."
        pagination={
          <EnterprisePagination
            page={page}
            totalPages={data?.meta?.totalPages || 1}
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

/**
 * Bill-based rounds for orgs that upload bills (GNB). An org whose bills come
 * in the OIL REPORT register has none, so it gets the register's rounds from
 * /api/reports/fuel-cycles instead (autoTrips flag, OWNER/MANAGER).
 */
export default function CompletedCyclesSubtab({
  range,
  searchQuery = '',
  fuelCyclesAllowed = false,
}) {
  const probe = useApi(
    (signal) => MileageApi.intervals({ page: 1, limit: 1, status: 'COMPLETED' }, signal),
    [],
    { enabled: fuelCyclesAllowed },
  );
  let source = 'intervals';
  if (fuelCyclesAllowed) {
    if (probe.loading && !probe.data) {
      return <p className="mhub-note">Loading full-tank rounds…</p>;
    }
    source = probe.data?.meta?.total > 0 ? 'intervals' : 'fuelCycles';
  }
  return source === 'fuelCycles' ? (
    <FuelCyclesList range={range} searchQuery={searchQuery} />
  ) : (
    <IntervalCycles searchQuery={searchQuery} />
  );
}
