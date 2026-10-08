import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ShieldCheck, TriangleAlert } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { useApi } from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { dropLabel } from '../PlaceIntelligence/facilityText';
import AutoTripCoverage from './AutoTripCoverage';
import RegisterMatchCard from './RegisterMatchCard';
import { STATUS_CLASS, STATUS_LABEL, fmtDayTime, fmtKm, notReachedYet } from './autoTripModel';
import './AutoTrips.css';

const TABS = [
  { key: '', label: 'All' },
  { key: 'COMPLETE', label: 'Delivered' },
  { key: 'NEEDS_REVIEW', label: 'Needs a check' },
  { key: 'OPEN', label: 'On the road' },
  // Only a person moves a trip here (Confirm trip / Not a real trip on the trip page),
  // so these stay hidden until someone has.
  { key: 'CONFIRMED', label: 'Confirmed', hideWhenEmpty: true },
  { key: 'DISMISSED', label: 'Rejected', hideWhenEmpty: true },
];

const PAGE_SIZE = 50;

function StatusPill({ status }) {
  return (
    <span className={`atx-status ${STATUS_CLASS[status] || 'atx-status--open'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function AutoTripsPage() {
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, ...(statusTab ? { status: statusTab } : {}) }),
    [page, statusTab],
  );

  const { data, loading, error, refetch } = useApi(
    (signal) => AutoTripService.list(params, { signal }),
    [JSON.stringify(params)],
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const tabCounts = data?.tabCounts ?? {};
  const allCount = Object.values(tabCounts).reduce((a, b) => a + (b || 0), 0) || total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countFor = (key) => (key === '' ? allCount : (tabCounts[key] ?? 0));
  const tabs = TABS.filter((t) => !t.hideWhenEmpty || countFor(t.key) > 0 || statusTab === t.key);

  const columns = useMemo(
    () => [
      {
        key: 'registrationNumber',
        label: 'Truck',
        render: (r) => <span className="atx-plate">{r.registrationNumber || '—'}</span>,
      },
      {
        key: 'route',
        label: 'Loaded at → Unloaded at',
        render: (r) => (
          <>
            {r.pickup?.name || '—'} →{' '}
            {notReachedYet(r) ? (
              <span className="atx-muted">not reached yet</span>
            ) : (
              dropLabel(r.drop)
            )}
          </>
        ),
      },
      {
        key: 'departedAt',
        label: 'Left plant',
        render: (r) => fmtDayTime(r.pickup?.departedAt, { padDay: true }),
      },
      {
        key: 'laden',
        label: 'Loaded km',
        align: 'right',
        render: (r) =>
          r.km?.laden == null ? <span className="atx-muted">—</span> : fmtKm(r.km.laden),
      },
      { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (r) => (
          <Link
            to={`/auto-trips/${r._id}?play=1`}
            className="atx-replay-link"
            onClick={(e) => e.stopPropagation()}
          >
            ▶ Replay
          </Link>
        ),
      },
    ],
    [],
  );

  const changeTab = (key) => {
    setStatusTab(key);
    setPage(1);
  };

  const pagination =
    totalPages > 1 ? (
      <div className="atx-pager">
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="atx-btn atx-btn--sm"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="atx-btn atx-btn--sm"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    ) : null;

  return (
    <div className="atx-page atx-list">
      <div className="atx-wrap">
        <div className="atx-head">
          <div className="atx-head-main">
            <div className="atx-title-row">
              <h1 className="atx-title">Trip</h1>
              <span className="atx-count">{formatNum(allCount)} trips</span>
            </div>
            <p className="atx-sub">
              Every trip rebuilt from GPS — where the truck loaded, where it unloaded, and how long
              each part took. No ERP needed.
            </p>
          </div>
          <div className="atx-actions">
            <button
              type="button"
              className="atx-btn"
              onClick={() => navigate('/auto-trips/excursions')}
            >
              <TriangleAlert size={16} strokeWidth={2} aria-hidden="true" />
              Route deviations
            </button>
            <button
              type="button"
              className="atx-btn"
              onClick={() => navigate('/auto-trips/approvals')}
            >
              <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />
              Pending approvals
            </button>
            <button
              type="button"
              className="atx-btn"
              onClick={() => navigate('/reports?report=oilAverage')}
            >
              <FileText size={16} strokeWidth={2} aria-hidden="true" />
              Fuel &amp; mileage report
            </button>
          </div>
        </div>

        <RegisterMatchCard />
        <AutoTripCoverage />

        <div role="tablist" aria-label="Filter trips" className="atx-tabs">
          {tabs.map((t) => (
            <button
              key={t.key || 'all'}
              type="button"
              role="tab"
              aria-selected={statusTab === t.key}
              className="atx-tab"
              onClick={() => changeTab(t.key)}
            >
              {t.label}
              <span className="atx-tab-count">{formatNum(countFor(t.key))}</span>
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={items}
          rowKey={(r) => r._id}
          loading={loading}
          error={error}
          onRetry={refetch}
          showing={items.length}
          total={total}
          pagination={pagination}
          onRowClick={(r) => navigate(`/auto-trips/${r._id}`)}
          emptyTitle="No trips in this view"
          emptyHint={
            statusTab
              ? 'Try another tab, or confirm pickup / drop places so more trips are detected.'
              : 'Trips appear once GPS stops are detected at confirmed pickup places.'
          }
        />
      </div>
    </div>
  );
}
