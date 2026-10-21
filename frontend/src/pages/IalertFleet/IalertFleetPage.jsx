import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import StatusChip from '../../components/ui/StatusChip';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { useApi } from '../../hooks/useApi';
import { formatNum, timeAgo } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { fetchIalertVehicles } from './ialertFleetApi.js';
import {
  exportRows,
  filterVehicles,
  newestPull,
  sortVehicles,
  statusChips,
  statusFor,
  statusKey,
  statusLabel,
} from './ialertFleetModel.js';
import './IalertFleetPage.css';

// iALERT is pulled every few minutes; re-reading once a minute keeps the page live
// without hammering the API.
const REFRESH_MS = 60 * 1000;

function VehicleCell({ v }) {
  const facts = [v.type, v.isBs6 === true ? 'BS-VI' : null].filter(Boolean);
  return (
    <div className="iaf-vehicle">
      <span className="iaf-plate">{v.registration || v.vin}</span>
      {facts.length ? <span className="iaf-sub">{facts.join(' · ')}</span> : null}
    </div>
  );
}

function StatusCell({ v, now }) {
  const key = statusKey(v, now);
  const since = key === 'NOT_REPORTING' || key === 'NO_DATA' ? null : statusFor(v, now);
  return (
    <div className="iaf-status">
      <StatusChip group="ialertStatus" value={key} />
      {since ? <span className="iaf-sub">for {since}</span> : null}
    </div>
  );
}

function IgnitionCell({ on }) {
  if (on == null) return <span className="text-dim">—</span>;
  return (
    <span className={`iaf-ign ${on ? 'iaf-ign--on' : ''}`}>
      <span className="iaf-ign-dot" aria-hidden="true" />
      {on ? 'On' : 'Off'}
    </span>
  );
}

function LastUpdateCell({ at, now }) {
  if (!at) return <span className="text-dim">No update yet</span>;
  return (
    <span className="iaf-when" title={formatDateTimeIST(at)}>
      {timeAgo(at, now)}
    </span>
  );
}

const EXPORT_COLUMNS = [
  { key: 'registration', label: 'Registration' },
  { key: 'vin', label: 'VIN' },
  { key: 'type', label: 'Type' },
  { key: 'bs6', label: 'BS-VI' },
  { key: 'status', label: 'Status' },
  { key: 'statusFor', label: 'In this status for' },
  { key: 'ignition', label: 'Ignition' },
  { key: 'lastUpdateAt', label: 'Last update' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'alert', label: 'iALERT alert' },
  { key: 'account', label: 'iALERT account' },
  { key: 'inFleet', label: 'In your fleet' },
];

export default function IalertFleetPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi((signal) => fetchIalertVehicles(signal), []);
  const [q, setQ] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      refetch();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [refetch]);

  // PageShell owns its padding.
  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const vehicles = useMemo(() => data?.vehicles || [], [data]);
  const chips = useMemo(() => statusChips(vehicles, now), [vehicles, now]);
  const rows = useMemo(
    () => sortVehicles(filterVehicles(vehicles, { q, statuses }, now), now),
    [vehicles, q, statuses, now],
  );
  const notInFleet = vehicles.filter((v) => !v.vehicleId).length;
  const showAccount = new Set(vehicles.map((v) => v.accountName || '')).size > 1;
  const activeFilters = (q.trim() ? 1 : 0) + statuses.length;

  const toggleStatus = (key) =>
    setStatuses((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const columns = [
    { key: 'registration', label: 'Vehicle', render: (v) => <VehicleCell v={v} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusCell v={v} now={now} /> },
    { key: 'ignition', label: 'Ignition', render: (v) => <IgnitionCell on={v.live?.ignitionOn} /> },
    {
      key: 'location',
      label: 'Location',
      render: (v) => <PlaceLabel lat={v.live?.latitude} lng={v.live?.longitude} />,
    },
    {
      key: 'lastUpdate',
      label: 'Last update',
      render: (v) => <LastUpdateCell at={v.live?.lastUpdateAt} now={now} />,
    },
    {
      key: 'alert',
      label: 'iALERT alert',
      render: (v) =>
        v.live?.alert ? (
          <StatusChip group="severity" value={v.live.alert} tone="caution" />
        ) : (
          <span className="text-dim">None</span>
        ),
    },
    ...(showAccount
      ? [
          {
            key: 'account',
            label: 'Account',
            render: (v) => v.accountName || <span className="text-dim">—</span>,
          },
        ]
      : []),
    {
      key: 'inFleet',
      label: 'Fleet',
      render: (v) =>
        v.vehicleId ? (
          <span className="iaf-fleet iaf-fleet--in">In your fleet</span>
        ) : (
          <span className="iaf-fleet">Not added</span>
        ),
    },
  ];

  const firstPullPending = data?.firstPullPending;

  return (
    <PageShell
      title="iALERT vehicles"
      subtitle="Live status from your Ashok Leyland iALERT account, refreshed every minute."
      count={vehicles.length || null}
      freshnessAt={newestPull(vehicles)}
      actions={
        <div className="iaf-actions">
          <button type="button" className="pshell-btn" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'iaf-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
          <ExportButton
            rows={exportRows(rows, now)}
            columns={EXPORT_COLUMNS}
            filename="ialert-vehicles"
            meta={{
              filters: [
                { label: 'Search', value: q.trim() || '—' },
                {
                  label: 'Status',
                  value: statuses.length ? statuses.map(statusLabel).join(', ') : 'All',
                },
              ],
              generatedAt: new Date(now),
            }}
          />
        </div>
      }
      filters={
        vehicles.length ? (
          <FilterBar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search plate, VIN or account"
            chips={chips}
            selectedKeys={statuses}
            onToggleChip={toggleStatus}
            activeCount={activeFilters}
            onClear={() => {
              setQ('');
              setStatuses([]);
            }}
          />
        ) : null
      }
      footer={
        vehicles.length
          ? `Showing ${formatNum(rows.length)} of ${formatNum(vehicles.length)} vehicles`
          : null
      }
    >
      {notInFleet > 0 ? (
        <div className="iaf-callout" role="note">
          <span>
            <strong>
              {formatNum(notInFleet)} {notInFleet === 1 ? 'vehicle is' : 'vehicles are'} not in your
              fleet yet.
            </strong>{' '}
            Trips, mileage and alerts start once {notInFleet === 1 ? 'it is' : 'they are'} added.
          </span>
          <Link to="/fleet-coverage" className="iaf-callout-link">
            Review and add <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(v) => v.vin}
        loading={loading && !data}
        error={error && !data ? error : null}
        onRetry={refetch}
        showing={rows.length}
        total={vehicles.length}
        activeFilters={activeFilters}
        selectable={false}
        onRowClick={(v) =>
          v.vehicleId && v.registration
            ? navigate(`/vehicles/${encodeURIComponent(v.registration)}`)
            : undefined
        }
        rowClassName={(v) => (v.vehicleId ? 'iaf-row--link' : '')}
        emptyTitle={
          activeFilters
            ? 'No vehicles match these filters'
            : firstPullPending
              ? 'Waiting for the first iALERT update'
              : 'No iALERT vehicles yet'
        }
        emptyHint={
          activeFilters
            ? 'Clear a filter or try another registration.'
            : firstPullPending
              ? 'Your iALERT account is connected. Vehicles appear here after the first update, usually within a few minutes.'
              : 'Connect iALERT from the GNB browser extension. Vehicles appear here within a few minutes.'
        }
        emptyAction={
          activeFilters ? null : (
            <Link to="/settings/ialert-accounts" className="pshell-btn pshell-btn--primary">
              iALERT accounts
            </Link>
          )
        }
      />
    </PageShell>
  );
}
