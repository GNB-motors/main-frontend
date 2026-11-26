import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, ChevronDown, Plus, Search, ShieldCheck } from 'lucide-react';
import { canEditSap } from '../Sap/sapModel';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { useApi } from '../../hooks/useApi';
import TripPlanService from '../../services/TripPlanService';
import { fleetViewService } from '../../services/fleetViewService';
import TripPlansTable from './TripPlansTable';
import { formatNum } from '../../utils/formatters';
import ManualTripDialog from './ManualTripDialog';
import TripPlanDialog from './TripPlanDialog';
import TripRangePicker from './TripRangePicker';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useKnownEtas } from '../../hooks/useKnownEtas';
import { tripDetailHref } from './tripWorkspace';
import tripColumns, { hiddenColumnsNote } from './tripColumns';
import TripHistoryTab from './TripHistoryTab';
import PlaceQuestionsTab from './PlaceQuestionsTab';
import TripKpiStrip from './TripKpiStrip';
import NeedsAnswerBanner from './NeedsAnswerBanner';
import AutoTripCoverage from './AutoTripCoverage';
import { actualTripCount, typicalMileage, typicalRun } from './tripListModel';
import { listTripsWithCounts, resolveTabCounts } from './tripCounts';
import { rangeToParams, readRange, writeRange } from './tripRange';
import './AutoTrips.css';
import './TripsWorkspace.css';
import './TripsRedesign.css';
import './TripList.css';

/** The status filters. The first four are the KPI tiles; the rest live under "More". */
const TABS = [
  { key: '', label: 'All trips' },
  { key: 'COMPLETE', label: 'Delivered' },
  { key: 'OPEN', label: 'On the road' },
  // Only real questions belong here. If the backend still counts
  // PICKUP_TO_PICKUP in here, that is the backend's job (B4); we show what
  // it sends.
  { key: 'NEEDS_REVIEW', label: 'Needs your answer' },
  // A plant-to-plant run is normal: plants work like warehouses. It is its
  // own tab so the owner can see those runs, not so they can worry about
  // them (F8.1).
  {
    key: 'REPOSITION',
    label: 'Plant to plant',
    leg: 'REPOSITION',
    hideWhenEmpty: true,
    inMore: true,
  },
  { key: 'PLANNED', label: 'Planned trips', hideWhenEmpty: true, inMore: true },
  // Only a person moves a trip here (Confirm trip / Not a real trip on the trip page),
  // so these stay hidden until someone has.
  { key: 'CONFIRMED', label: 'Confirmed', hideWhenEmpty: true, inMore: true },
  { key: 'DISMISSED', label: 'Rejected', hideWhenEmpty: true, inMore: true },
];

const MORE_TABS = TABS.filter((t) => t.inMore);

/** The two views that are not a filter on the trip list. */
const VIEWS = [
  { key: 'history', label: 'History' },
  { key: 'questions', label: 'Review places' },
];

const PAGE_SIZE = 50;
/** How many of the latest trips the KPI strip and the banner measure. */
const SAMPLE_SIZE = 100;

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

  // Trip search (truck, driver or place), answered and paged by the server. Keeps the input
  // responsive while the URL (and the query it drives) only changes once the user pauses;
  // writing to ?search keeps it bookmarkable.
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

  const vehicleId = searchParams.get('vehicleId');
  const periodParams = {
    ...(vehicleId ? { vehicleId } : {}),
    ...rangeToParams({ range: rangeKind, from: rangeFrom, to: rangeTo }),
  };
  const params = {
    page: planned ? 1 : page,
    limit: planned ? 1 : PAGE_SIZE,
    ...(statusTab && !planned
      ? { status: statusTab === 'COMPLETE' ? 'DELIVERED' : statusTab }
      : {}),
    ...(legFilter && !planned ? { leg: legFilter } : {}),
    ...(searchParams.get('sapVerdict') ? { sapVerdict: searchParams.get('sapVerdict') } : {}),
    ...(searchParams.get('dropSiteId') ? { dropSiteId: searchParams.get('dropSiteId') } : {}),
    ...(urlSearch ? { search: urlSearch } : {}),
    ...periodParams,
  };

  const { data, loading, error, refetch } = useApi(
    (signal) => listTripsWithCounts(params, { signal }),
    [JSON.stringify(params)],
    { scopeKey: JSON.stringify(params) },
  );

  // The counts the backend answers with the list itself (`?withCounts=1`): one
  // key per tab status plus `total`, beside the list. While the current filter
  // is loading, the last ones are kept so the counts do not blank. Once it has
  // settled without counts, nothing is carried over: the counts of the
  // previous filter are not this filter's counts.
  const countsRef = useRef(null);
  if (data?.tabCounts) countsRef.current = data.tabCounts;
  const listCounts = data?.tabCounts ?? (loading ? countsRef.current : null);

  const planParams = {
    page: planned ? page : 1,
    limit: planned ? PAGE_SIZE : 1,
    status: 'PLANNED',
    ...(vehicleId ? { vehicleId } : {}),
    ...rangeToParams(range),
  };
  const plans = useApi(
    (signal) => TripPlanService.list(planParams, { signal }),
    [JSON.stringify(planParams)],
    {
      // On the planned tab this is the list itself; elsewhere it carries the
      // planned count, which the trips counts do not cover.
      enabled: true,
      scopeKey: JSON.stringify(planParams),
    },
  );

  // ── The KPI strip and the banner: small reads that follow the period only. ──
  const periodKey = JSON.stringify(periodParams);
  const todayParams = {
    page: 1,
    limit: 1,
    ...(vehicleId ? { vehicleId } : {}),
    ...rangeToParams({ range: 'today' }),
  };
  const today = useApi(
    (signal) => listTripsWithCounts(todayParams, { signal }),
    [JSON.stringify(todayParams)],
    {
      // The trips counts do not cover "today": that count needs its own read.
      enabled: rangeKind !== 'today',
      scopeKey: `today:${JSON.stringify(todayParams)}`,
    },
  );
  const deliveredSample = useApi(
    (signal) =>
      listTripsWithCounts(
        { page: 1, limit: SAMPLE_SIZE, status: 'DELIVERED', ...periodParams },
        { signal },
      ),
    [periodKey],
    { scopeKey: `delivered:${periodKey}` },
  );
  const waitingSample = useApi(
    (signal) =>
      listTripsWithCounts(
        { page: 1, limit: SAMPLE_SIZE, status: 'NEEDS_REVIEW', ...periodParams },
        { signal },
      ),
    [periodKey],
    { scopeKey: `waiting:${periodKey}` },
  );
  const questions = useApi(
    (signal) => fleetViewService.getPlaceQuestions({ ...periodParams, signal, limit: 200 }),
    [periodKey],
    { scopeKey: `questions:${periodKey}` },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  // The counts to show: the list's own, or the ones the other reads carry
  // where they are exact. What nobody answered is unknown ('—'), never a zero.
  const counts = resolveTabCounts({
    listCounts,
    deliveredTotal: deliveredSample.data?.total,
    waitingTotal: waitingSample.data?.total,
    waitingCounts: waitingSample.data?.tabCounts,
  });
  const allCount = counts.all;
  const deliveredCount = counts.delivered;
  const plannedCount = plans.data?.total ?? 0;
  const visibleTotal = planned ? (plans.data?.total ?? 0) : total;
  const totalPages = Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE));
  const countFor = (key) =>
    key === 'PLANNED'
      ? plannedCount
      : key === ''
        ? allCount
        : key === 'COMPLETE'
          ? deliveredCount
          : key === 'REPOSITION'
            ? counts.reposition
            : counts.tab(key);
  // A tab whose count nobody answered stays visible: hiding it would say
  // "there are none" when the truth is "we do not know".
  const moreTabs = MORE_TABS.filter(
    (t) =>
      !t.hideWhenEmpty || countFor(t.key) == null || countFor(t.key) > 0 || statusTab === t.key,
  );
  const activeMoreTab =
    VIEWS.find((v) => viewTab === v.key) || moreTabs.find((t) => statusTab === t.key) || null;
  const kpiTab = viewTab || moreTabs.some((t) => t.key === statusTab) ? null : statusTab;
  const todayCounts = today.data?.tabCounts;
  const todayCount = todayCounts ? actualTripCount(todayCounts) : null;
  const run = useMemo(() => typicalRun(deliveredSample.data?.items), [deliveredSample.data]);
  const mileage = useMemo(
    () => typicalMileage(deliveredSample.data?.items),
    [deliveredSample.data],
  );

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  useEffect(() => {
    if (!moreOpen) return undefined;
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  const canAnswerPlaces = ['OWNER', 'MANAGER'].includes(getUserRole());
  const { isEnabled } = useFeatureFlags();
  // SAP is contract data: owners and managers of an org with SAP only.
  const showSap = canEditSap(getUserRole()) && isEnabled('sapV2');
  // Destinations we know, with the arrival band (refreshed every 5 min).
  const knownEtas = useKnownEtas();
  const { columns, hidden } = tripColumns({
    showSap,
    refetch,
    searchParams,
    knownEtas,
    rows: items,
  });
  const note = loading ? null : hiddenColumnsNote(hidden, statusTab);

  const select = (status, view) => {
    const next = new URLSearchParams(searchParams);
    if (status) next.set('status', status);
    else next.delete('status');
    if (view) next.set('tab', view);
    else next.delete('tab');
    next.delete('page');
    setSearchParams(next);
  };
  const changeTab = (key) => select(key, '');
  const changeView = (key) => select(statusTab, key);

  const pagination = (
    <EnterprisePagination
      page={page}
      totalPages={totalPages}
      totalItems={visibleTotal || null}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  const reviewCount = counts.review;
  const showBanner =
    !viewTab && (statusTab === '' || statusTab === 'NEEDS_REVIEW') && reviewCount > 0;

  const moreMenu = (
    <div className="atx-more" ref={moreRef} role="tablist" aria-label="More trip views">
      <button
        type="button"
        role="tab"
        aria-selected={Boolean(activeMoreTab)}
        aria-haspopup="menu"
        aria-expanded={moreOpen}
        className={`atx-tool${activeMoreTab ? ' is-active' : ''}`}
        onClick={() => setMoreOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setMoreOpen(false);
        }}
      >
        {activeMoreTab ? activeMoreTab.label : 'More'}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {moreOpen ? (
        <div className="atx-more-menu" role="menu">
          {moreTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="menuitem"
              className={`atx-more-item${statusTab === t.key && !viewTab ? ' atx-more-item--active' : ''}`}
              onClick={() => {
                setMoreOpen(false);
                changeTab(t.key);
              }}
            >
              {t.label}
              <span className="atx-tab-count">{formatNum(countFor(t.key))}</span>
            </button>
          ))}
          {moreTabs.length ? <span className="atx-more-rule" aria-hidden="true" /> : null}
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="menuitem"
              className={`atx-more-item${viewTab === view.key ? ' atx-more-item--active' : ''}`}
              onClick={() => {
                setMoreOpen(false);
                changeView(view.key);
              }}
            >
              {view.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  const viewTitle =
    activeMoreTab?.label || TABS.find((t) => t.key === statusTab)?.label || 'All trips';
  const listCount = planned ? visibleTotal : total;

  const tools = (
    <div className="atx-tools">
      {!viewTab && !planned ? (
        <span className="atx-tools-title">
          {viewTitle}
          {!loading || data ? <span className="atx-num">{formatNum(listCount)}</span> : null}
        </span>
      ) : null}
      <span className="atx-tools-note">{note}</span>
      {moreMenu}
      {showSap && !planned && !viewTab ? (
        <div className="atx-tool atx-tool--select" role="group" aria-label="SAP filter">
          <SearchableSelect
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
          </SearchableSelect>
        </div>
      ) : null}
      {!planned && !viewTab ? (
        <div className="atx-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            className="atx-search-input"
            placeholder="Search truck, driver or place"
            aria-label="Search trips by truck, driver or place"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      ) : null}
      <Link className="atx-tool" to="/approvals?type=trips">
        <ShieldCheck size={14} aria-hidden="true" />
        Trip approvals
      </Link>
    </div>
  );

  return (
    <div className="atx-page atx-list">
      <div className="atx-wrap">
        <header className="atx-head">
          <div className="atx-head-main">
            <div className="atx-title-row">
              <h1 className="atx-title">Trips</h1>
              <AutoTripCoverage />
            </div>
            <p className="atx-sub">
              Every run from plant to drop, found from the trucks&apos; GPS. Open a trip to replay
              it.
            </p>
          </div>
          <div className="atx-actions">
            <TripRangePicker value={range} onChange={changeRange} />
            <button
              type="button"
              className="atx-btn atx-btn--sm"
              onClick={() => setDialog({ kind: 'plan' })}
            >
              <CalendarClock size={15} aria-hidden="true" />
              Schedule trip
            </button>
            <button
              type="button"
              className="atx-btn atx-btn--primary atx-btn--sm"
              onClick={() => setDialog({ kind: 'manual' })}
            >
              <Plus size={15} aria-hidden="true" />
              Add missed trip
            </button>
          </div>
        </header>

        <TripKpiStrip
          counts={{
            all: allCount,
            delivered: deliveredCount,
            open: counts.open,
            review: reviewCount,
          }}
          todayCount={todayCount}
          rangeIsToday={rangeKind === 'today'}
          selectedTab={kpiTab}
          onSelect={changeTab}
          run={run}
          mileage={mileage}
          runLoading={deliveredSample.loading}
          runFailed={Boolean(deliveredSample.error)}
        />

        {showBanner ? (
          <NeedsAnswerBanner
            total={reviewCount}
            questions={questions.data?.items}
            questionsTotal={questions.data?.total}
            questionsTrips={questions.data?.tripsAffected}
            questionsLoading={questions.loading}
            questionsFailed={Boolean(questions.error)}
            onAnswerPlaces={() => changeView('questions')}
            onShowTrips={() => changeTab(statusTab === 'NEEDS_REVIEW' ? '' : 'NEEDS_REVIEW')}
            showingTrips={statusTab === 'NEEDS_REVIEW'}
          />
        ) : null}

        {!viewTab && statusTab === 'NEEDS_REVIEW' && !showBanner ? (
          <nav className="atx-question-trip-nav" aria-label="Trips needing your answer">
            <button type="button" onClick={() => changeTab('')}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to all trips
            </button>
            <span>Showing trips that need your answer</span>
          </nav>
        ) : null}

        {!planned && searchParams.get('dropSiteId') && (
          <div className="atx-filter-chip">
            <span>Drop: {searchParams.get('dropName') || 'Selected place'}</span>
            <button
              type="button"
              className="atx-inline-link"
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

        {viewTab ? (
          <section className="atx-panel">
            <div className="atx-panel-head">
              <button
                type="button"
                className="trip-back-circle"
                onClick={() => changeView('')}
                aria-label={
                  statusTab === 'NEEDS_REVIEW' ? 'Back to affected trips' : 'Back to trips'
                }
                title={statusTab === 'NEEDS_REVIEW' ? 'Back to affected trips' : 'Back to trips'}
              >
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <h2 className="atx-panel-title">{viewTitle}</h2>
              {tools}
            </div>
            <div className="atx-panel-body">
              {viewTab === 'history' ? (
                <TripHistoryTab
                  minDwellMin={searchParams.get('minDwellMin')}
                  vehicle={searchParams.get('vehicle')}
                  site={searchParams.get('site')}
                  from={searchParams.get('from')}
                  to={searchParams.get('to')}
                />
              ) : (
                <PlaceQuestionsTab
                  key={periodKey}
                  query={questions}
                  canAnswer={canAnswerPlaces}
                  onAnswered={() => {
                    waitingSample.refetch();
                    deliveredSample.refetch();
                    refetch();
                  }}
                />
              )}
            </div>
          </section>
        ) : planned ? (
          <section className="atx-panel">
            <div className="atx-panel-head">
              <h2 className="atx-panel-title">{viewTitle}</h2>
              {tools}
            </div>
            <TripPlansTable
              data={plans.data}
              loading={plans.loading}
              error={plans.error}
              refetch={plans.refetch}
              pagination={pagination}
            />
          </section>
        ) : (
          <DataTable
            className="atx-table"
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
            toolbarExtra={tools}
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
                ? 'Search looks at truck numbers, driver names and pickup / drop places. Try a shorter term or a different spelling.'
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
