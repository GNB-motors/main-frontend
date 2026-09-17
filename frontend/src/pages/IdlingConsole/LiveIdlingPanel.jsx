import { useEffect, useMemo, useState } from 'react';
import IdlingConsoleService from './IdlingConsoleService';
import { formatDurationMin, matchesRegistration } from './idlingConsole.utils.js';
import useApi from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import StatusChip from '../../components/ui/StatusChip';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { formatINR, formatLitres, timeAgo } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';

const REFRESH_MS = 60_000;

const COLUMNS = [
  {
    key: 'registrationNumber',
    label: 'Vehicle',
    render: (row) => <span className="reg-plate">{row.registrationNumber || '—'}</span>,
  },
  {
    key: 'startAt',
    label: 'Idling since',
    render: (row) => <span title={formatDateTimeIST(row.startAt)}>{timeAgo(row.startAt)} ago</span>,
  },
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
    render: (row) => (
      <span className="flex items-center gap-1.5">
        <StatusChip group="legitimacy" value={row.legitimacy} />
        {row.legitimacy === 'legit' && row.zoneName ? (
          <span className="text-dim text-[11px]">{row.zoneName}</span>
        ) : null}
      </span>
    ),
  },
  {
    key: 'cost',
    label: 'Est. cost so far',
    align: 'right',
    render: (row) => (
      <span className="num">
        {formatINR(row.rupees)}
        <span className="text-dim ml-1 text-[11px]">({formatLitres(row.litres)})</span>
      </span>
    ),
  },
];

/**
 * Vehicles currently idling, refreshed every 60s. Backed by the last
 * FleetEdge status pull — typically ≤5 min stale, never sub-minute real-time.
 */
export default function LiveIdlingPanel() {
  const [vehicleQuery, setVehicleQuery] = useState('');

  const { data, loading, error, refetch } = useApi(
    (signal) => IdlingConsoleService.getLive({ signal }),
    [],
  );

  useEffect(() => {
    const id = setInterval(refetch, REFRESH_MS);
    return () => clearInterval(id);
  }, [refetch]);

  const rows = useMemo(() => {
    const list = data || [];
    return list.filter((row) => matchesRegistration(vehicleQuery, row.registrationNumber));
  }, [data, vehicleQuery]);

  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        searchValue={vehicleQuery}
        onSearchChange={setVehicleQuery}
        searchPlaceholder="Filter by vehicle"
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={data?.length ?? 0}
        emptyTitle="No vehicle is idling right now"
        emptyHint="This list refreshes every minute as the FleetEdge status feed updates — a vehicle appears here the moment it comes to a stop."
      />
    </div>
  );
}
