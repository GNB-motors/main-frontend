import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarClock, Plus, Search, ShieldCheck } from 'lucide-react';
import { canEditSap } from '../Sap/sapModel';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';
import TripPlanService from '../../services/TripPlanService';
import TripPlansTable from './TripPlansTable';
import { formatNum } from '../../utils/formatters';
import ManualTripDialog from './ManualTripDialog';
import TripPlanDialog from './TripPlanDialog';
import TripRangePicker from './TripRangePicker';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { tripDetailHref } from './tripWorkspace';
import tripColumns from './tripColumns';
import TripHistoryTab from './TripHistoryTab';
import PlaceQuestionsTab from './PlaceQuestionsTab';
import { rangeToParams, readRange, writeRange } from './tripRange';
import './AutoTrips.css';
import './TripsWorkspace.css';
import './TripList.css';

const TABS = [
  { key: '', label: 'All' },
  { key: 'COMPLETE', label: 'Delivered' },
  { key: 'OPEN', label: 'On the road' },
  // A plant-to-plant run is normal: plants work like warehouses. It is its
  // own tab so the owner can see those runs, not so they can worry about
  // them (F8.1).
  { key: 'REPOSITION', label: 'Plant to plant', leg: 'REPOSITION' },
  // Only real questions belong here. If the backend still counts
  // PICKUP_TO_PICKUP in here, that is the backend's job (B4); we show what
  // it sends.
  { key: 'NEEDS_REVIEW', label: 'Needs your answer' },
  { key: 'PLANNED', label: 'Planned trips' },
  // Only a person moves a trip here (Confirm trip / Not a real trip on the trip page),
  // so these stay hidden until someone has.
  { key: 'CONFIRMED', label: 'Confirmed', hideWhenEmpty: true },
  { key: 'DISMISSED', label: 'Rejected', hideWhenEmpty: true },
];

/** The two views that are not a filter on the trip list. */
const VIEWS = [
  { key: 'history', label: 'History' },
  { key: 'questions', label: 'Questions' },
];

const PAGE_SIZE = 50;

export default function AutoTripsPage() {
  const navigate = useNavigate();

  // { kind: 'manual' } | { kind: 'plan' } | null. ?new=manual|plan opens one on arrival
  // (the old "Start New Trip" buttons and /trip/new land here).
  const [searchParams, setSearchParams] = useSearchParams();
  const statusTab = TABS.some((tab) => tab.key === searchParams.get('status'))
    ? searchParams.get('status') || ''
    : '';
  // History and Questions are their own views, not a filter on the list.
  const viewTab = VIEWS.some((view) => view.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : '';
  const planned = statusTab === 'PLANNED';
  // A plant-to-plant run is its own filter on the backend: leg=REPOSITION.
  const legFilter = TABS.find((tab) => tab.key === statusTab)?.leg ?? null;
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const setPage = (value) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value > 1) next.set('page', value);
      else next.delete('page');
      return next;
    });
  const [dialog, setDialogState] = useState(() => {
    const kind = searchParams.get('new');
    return kind === 'manual' || kind === 'plan' ? { kind } : null;
  });
  const setDialog = (next) => {
    setDialogState(next);
    if (!next && searchParams.has('new')) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete('new');
          return next;
        },
        { replace: true },
      );
    }
  };

  const range = readRange(searchParams);
  const { range: rangeKind, from: rangeFrom, to: rangeTo } = range;
  const changeRange = (next) => {
    const updated = writeRange(searchParams, next);
    updated.delete('page');
    setSearchParams(updated, { replace: true });
  };

  // Place search. Keeps the input responsive while the URL (and the query it drives)
  // only changes once the user pauses; writing to ?search keeps it bookmarkable.
  const urlSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 350);
  useEffect(() => {
    if (debouncedSearch === (searchParams.get('search') || '')) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, searchParams, setSearchParams]);

  const params = {
    page: planned ? 1 : page,
    limit: planned ? 1 : PAGE_SIZE,
    ...(statusTab && !planned ? { status: statusTab } : {}),
    ...(legFilter && !planned ? { leg: legFilter } : {}),
    ...(searchParams.get('vehicleId') ? { vehicleId: searchParams.get('vehicleId') } : {}),
    ...(searchParams.get('sapVerdict') ? { sapVerdict: searchParams.get('sapVerdict') } : {}),
    ...(searchParams.get('dropSiteId') ? { dropSiteId: searchParams.get('dropSiteId') } : {}),
    ...(urlSearch ? { search: urlSearch } : {}),
    ...rangeToParams({ range: rangeKind, from: rangeFrom, to: rangeTo }),
  };

  const { data, loading, error, refetch } = useApi(
    (signal) => AutoTripService.list(params, { signal }),
    [JSON.stringify(params)],
  );

  const planParams = {
    page: planned ? page : 1,
    limit: planned ? PAGE_SIZE : 1,
    status: 'PLANNED',
    ...(searchParams.get('vehicleId') ? { vehicleId: searchParams.get('vehicleId') } : {}),
    ...rangeToParams(range),
  };
  const plans = useApi(
    (signal) => TripPlanService.list(planParams, { signal }),
    [JSON.stringify(planParams)],
    { scopeKey: JSON.stringify(planParams) },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const tabCounts = data?.tabCounts ?? {};
  const allCount = Object.values(tabCounts).reduce((a, b) => a + (b || 0), 0) || total;
  const visibleTotal = planned ? (plans.data?.total ?? 0) : total;
  const totalPages = Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE));
  const countFor = (key) =>
    key === 'PLANNED' ? (plans.data?.total ?? 0) : key === '' ? allCount : (tabCounts[key] ?? 0);
  const tabs = TABS.filter((t) => !t.hideWhenEmpty || countFor(t.key) > 0 || statusTab === t.key);

  const { isEnabled } = useFeatureFlags();
  // SAP is contract data: owners and managers of an org with SAP only.
  const showSap = canEditSap(getUserRole()) && isEnabled('sapV2');
  const columns = tripColumns({ showSap, refetch, searchParams });

  const changeTab = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set('status', key);
    else next.delete('status');
    next.delete('page');
    setSearchParams(next);
  };

  const changeView = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set('tab', key);
    else next.delete('tab');
    next.delete('status');
    next.delete('page');
    setSearchParams(next);
  };

  const pagination = (
    <EnterprisePagination
      page={page}
      totalPages={totalPages}
      totalItems={visibleTotal || null}
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
              Pickup, delivery and the driver behind every trip. Open a trip to review its journey.
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
        <div className="atx-toolbar">
          <div className="atx-toolbar-start">
            <div role="tablist" aria-label="Filter trips" className="atx-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={statusTab === t.key && !viewTab}
                  className="atx-tab"
                  onClick={() => {
                    changeView('');
                    changeTab(t.key);
                  }}
                >
                  {t.label}
                  <span className="atx-tab-count">{formatNum(countFor(t.key))}</span>
                </button>
              ))}
              {VIEWS.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  role="tab"
                  aria-selected={viewTab === view.key}
                  className="atx-tab"
                  onClick={() => changeView(view.key)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="atx-filter-row">
            {showSap && !planned && (
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
                    next.delete('page');
                    setSearchParams(next, { replace: true });
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
            {!planned && (
              <div className="atx-search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  className="atx-search-input"
                  placeholder="Search a place, e.g. Buxar"
                  aria-label="Search trips by place"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            )}
            <Link className="atx-toolbar-link" to="/auto-trips/approvals">
              <ShieldCheck size={14} aria-hidden="true" />
              Pending approvals
            </Link>
            <TripRangePicker value={range} onChange={changeRange} />
          </div>
        </div>

        {!planned && searchParams.get('dropSiteId') && (
          <div className="sap-row">
            <span>Drop: {searchParams.get('dropName') || 'Selected place'}</span>
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('dropSiteId');
                next.delete('dropName');
                next.delete('page');
                setSearchParams(next, { replace: true });
              }}
            >
              Show all drops
            </button>
          </div>
        )}
        {viewTab === 'history' ? (
          <TripHistoryTab
            vehicle={searchParams.get('vehicle')}
            site={searchParams.get('site')}
            from={searchParams.get('from')}
            to={searchParams.get('to')}
          />
        ) : viewTab === 'questions' ? (
          <PlaceQuestionsTab />
        ) : planned ? (
          <TripPlansTable
            data={plans.data}
            loading={plans.loading}
            error={plans.error}
            refetch={plans.refetch}
            pagination={pagination}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            paginated={true}
            rowKey={(r) => r._id}
            loading={loading}
            error={error}
            onRetry={refetch}
            showing={items.length}
            total={total}
            pagination={pagination}
            onRowClick={(r) => navigate(tripDetailHref(r._id, searchParams))}
            emptyTitle={
              urlSearch
                ? `No trips match “${urlSearch}”`
                : range.range === 'all'
                  ? 'No trips in this view'
                  : 'No trips in this period'
            }
            emptyHint={
              urlSearch
                ? 'Search looks at pickup and drop place names. Try a shorter term or a different spelling.'
                : range.range !== 'all'
                  ? 'No truck left a pickup in this period. Try a longer range.'
                  : statusTab
                    ? 'Try another tab, or confirm pickup / drop places so more trips are detected.'
                    : 'Trips appear once GPS stops are detected at confirmed pickup places.'
            }
          />
        )}
      </div>

      <ManualTripDialog
        open={dialog?.kind === 'manual'}
        onOpenChange={(o) => setDialog(o ? { kind: 'manual' } : null)}
        onAdded={refetch}
      />
      <TripPlanDialog
        open={dialog?.kind === 'plan'}
        onOpenChange={(o) => setDialog(o ? { kind: 'plan' } : null)}
        onCreated={() => {
          changeTab('PLANNED');
          plans.refetch();
        }}
      />
    </div>
  );
}
