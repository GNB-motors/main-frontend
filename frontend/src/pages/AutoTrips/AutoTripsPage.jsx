import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  FileText,
  Plus,
  ShieldCheck,
  TriangleAlert,
  Play,
  ClipboardList,
} from 'lucide-react';
import SapPill from '../Sap/SapPill';
import { BASIS_LABEL, canEditSap } from '../Sap/sapModel';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import { FLAG_LABEL } from './autoTripPlaces';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { dropLabel } from '../PlaceHub/intelligence/facilityText';
import ManualTripDialog from './ManualTripDialog';
import TripPlanDialog from './TripPlanDialog';
import TripRangePicker from './TripRangePicker';
import { STATUS_CLASS, STATUS_LABEL, fmtDayTime, fmtKm, notReachedYet } from './autoTripFormat';
import { rangeToParams, readRange, writeRange } from './tripRange';
import './AutoTrips.css';
import './TripsWorkspace.css';

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
  // { kind: 'manual' } | { kind: 'plan' } | null. ?new=manual|plan opens one on arrival
  // (the old "Start New Trip" buttons and /trip/new land here).
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialogState] = useState(() => {
    const kind = searchParams.get('new');
    return kind === 'manual' || kind === 'plan' ? { kind } : null;
  });
  const setDialog = (next) => {
    setDialogState(next);
    if (!next && searchParams.has('new')) {
      const rest = new URLSearchParams(searchParams);
      rest.delete('new');
      setSearchParams(rest, { replace: true });
    }
  };

  const range = readRange(searchParams);
  const { range: rangeKind, from: rangeFrom, to: rangeTo } = range;
  const changeRange = (next) => {
    setSearchParams(writeRange(searchParams, next), { replace: true });
    setPage(1);
  };

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(statusTab ? { status: statusTab } : {}),
      ...(searchParams.get('sapVerdict') ? { sapVerdict: searchParams.get('sapVerdict') } : {}),
      ...(searchParams.get('dropSiteId') ? { dropSiteId: searchParams.get('dropSiteId') } : {}),
      ...rangeToParams({ range: rangeKind, from: rangeFrom, to: rangeTo }),
    }),
    [page, statusTab, rangeKind, rangeFrom, rangeTo, searchParams],
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

  const { isEnabled } = useFeatureFlags();
  // SAP is contract data: owners and managers of an org with SAP only.
  const showSap = canEditSap(getUserRole()) && isEnabled('sapV2');
  const columns = useMemo(
    () =>
      [
        {
          key: 'registrationNumber',
          width: 115,
          label: 'Truck',
          render: (r) => <span className="atx-plate">{r.registrationNumber || '—'}</span>,
        },
        {
          key: 'route',
          width: 230,
          label: 'Route',
          render: (r) => (
            <span className="atx-route-cell">
              <strong>{r.pickup?.name || '—'}</strong>
              <span>
                →{' '}
                {notReachedYet(r) ? (
                  <span className="atx-muted">not reached yet</span>
                ) : (
                  dropLabel(r.drop)
                )}
              </span>
            </span>
          ),
        },
        {
          key: 'departedAt',
          width: 125,
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
        {
          key: 'sap',
          label: 'SAP km',
          render: (r) => (
            <div className="sap-stack">
              <span title={r.sap?.basis ? BASIS_LABEL[r.sap.basis] : undefined}>
                {r.sap?.status === 'MATCHED' ? `${r.sap.sapKm} km` : '—'}
              </span>
              {r.sap ? (
                <SapPill sap={r.sap} />
              ) : (
                <span className="sap-muted">Not computed yet</span>
              )}
            </div>
          ),
        },
        {
          key: 'flags',
          width: 190,
          label: 'Checks',
          render: (r) =>
            (r.flags || []).map((f) => (
              <span className="atx-chip" key={f}>
                {FLAG_LABEL[f] || f}
              </span>
            )),
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
              <Play size={12} aria-hidden="true" /> Replay
            </Link>
          ),
        },
      ].filter((c) => showSap || c.key !== 'sap'),
    [showSap],
  );

  const changeTab = (key) => {
    setStatusTab(key);
    setPage(1);
  };

  const pagination = (
    <EnterprisePagination
      page={page}
      totalPages={totalPages}
      totalItems={total || null}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <div className="atx-page atx-list">
      <div className="atx-wrap">
        <div className="atx-head">
          <div className="atx-head-main">
            <div className="atx-title-row">
              <h1 className="atx-title">Trips</h1>
              <span className="atx-count">{formatNum(allCount)} trips</span>
            </div>
            <p className="atx-sub">
              Track trips from pickup to delivery. Review GPS distance, SAP comparisons and
              exceptions.
            </p>
          </div>
          <div className="atx-actions">
            <Button onClick={() => setDialog({ kind: 'manual' })}>
              <Plus size={15} aria-hidden="true" />
              Add missed trip
            </Button>
            <Button variant="outline" onClick={() => setDialog({ kind: 'plan' })}>
              <CalendarClock size={15} aria-hidden="true" />
              Schedule trip
            </Button>
          </div>
        </div>
        <nav className="atx-shortcuts" aria-label="Trip tools">
          <Link to="/auto-trips/plans">
            <ClipboardList size={14} />
            Planned trips
          </Link>
          <Link to="/auto-trips/excursions">
            <TriangleAlert size={14} />
            Route deviations
          </Link>
          <Link to="/auto-trips/approvals">
            <ShieldCheck size={14} />
            Pending approvals
          </Link>
          <Link to="/reports?report=oilAverage">
            <FileText size={14} />
            Fuel &amp; mileage report
          </Link>
        </nav>

        <div className="atx-toolbar">
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
          <div className="atx-filter-row">
            {showSap && (
              <label className="sap-row">
                SAP
                <select
                  className="sap-filter"
                  aria-label="SAP"
                  value={searchParams.get('sapVerdict') || ''}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    if (e.target.value) next.set('sapVerdict', e.target.value);
                    else next.delete('sapVerdict');
                    setSearchParams(next, { replace: true });
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  <option value="OVER">Over SAP</option>
                  <option value="UNDER">Under SAP</option>
                  <option value="WITHIN">Within</option>
                  <option value="NO_SAP">No SAP</option>
                </select>
              </label>
            )}
            <TripRangePicker value={range} onChange={changeRange} />
          </div>
        </div>

        {searchParams.get('dropSiteId') && (
          <div className="sap-row">
            <span>Drop: {searchParams.get('dropName') || 'Selected place'}</span>
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('dropSiteId');
                next.delete('dropName');
                setSearchParams(next, { replace: true });
                setPage(1);
              }}
            >
              Show all drops
            </button>
          </div>
        )}
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
          emptyTitle={range.range === 'all' ? 'No trips in this view' : 'No trips in this period'}
          emptyHint={
            range.range !== 'all'
              ? 'No truck left a pickup in this period. Try a longer range.'
              : statusTab
                ? 'Try another tab, or confirm pickup / drop places so more trips are detected.'
                : 'Trips appear once GPS stops are detected at confirmed pickup places.'
          }
        />
      </div>

      <ManualTripDialog
        open={dialog?.kind === 'manual'}
        onOpenChange={(o) => setDialog(o ? { kind: 'manual' } : null)}
        onAdded={refetch}
      />
      <TripPlanDialog
        open={dialog?.kind === 'plan'}
        onOpenChange={(o) => setDialog(o ? { kind: 'plan' } : null)}
        onCreated={() => navigate('/auto-trips/plans')}
      />
    </div>
  );
}
