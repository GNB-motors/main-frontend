import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, CalendarClock, ChevronDown, Plus, Search, ShieldCheck } from 'lucide-react';
import { canEditSap } from '../Sap/sapModel';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { useApi } from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';
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
import BulkPlaceConfirmDialog from './BulkPlaceConfirmDialog';
import { suggestedPlaceAnswer } from './placeQuestionCategories';
import TripKpiStrip from './TripKpiStrip';
import NeedsAnswerBanner from './NeedsAnswerBanner';
import AutoTripCoverage from './AutoTripCoverage';
import { actualTripCount, deliveredTripCount, typicalRun } from './tripListModel';
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
  { key: 'questions', label: 'Place questions' },
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
    (signal) => AutoTripService.list(params, { signal }),
    [JSON.stringify(params)],
    { scopeKey: JSON.stringify(params) },
  );

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
    { scopeKey: JSON.stringify(planParams) },
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
    (signal) => AutoTripService.list(todayParams, { signal }),
    [JSON.stringify(todayParams)],
    { enabled: rangeKind !== 'today', scopeKey: `today:${JSON.stringify(todayParams)}` },
  );
  const deliveredSample = useApi(
    (signal) =>
      AutoTripService.list(
        { page: 1, limit: SAMPLE_SIZE, status: 'DELIVERED', ...periodParams },
        { signal },
      ),
    [periodKey],
    { scopeKey: `delivered:${periodKey}` },
  );
  const waitingSample = useApi(
    (signal) =>
      AutoTripService.list(
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
  const tabCounts = data?.tabCounts ?? {};
  const allCount = actualTripCount(tabCounts);
  const deliveredCount = deliveredTripCount(tabCounts);
  const visibleTotal = planned ? (plans.data?.total ?? 0) : total;
  const totalPages = Math.max(1, Math.ceil(visibleTotal / PAGE_SIZE));
  const countFor = (key) =>
    key === 'PLANNED'
      ? (plans.data?.total ?? 0)
      : key === ''
        ? allCount
        : key === 'COMPLETE'
          ? deliveredCount
          : key === 'REPOSITION'
            ? (tabCounts.reposition ?? tabCounts.REPOSITION ?? 0)
            : (tabCounts[key] ?? 0);
  const moreTabs = MORE_TABS.filter(
    (t) => !t.hideWhenEmpty || countFor(t.key) > 0 || statusTab === t.key,
  );
  const activeMoreTab =
    moreTabs.find((t) => statusTab === t.key) || VIEWS.find((v) => viewTab === v.key) || null;
  const kpiTab = viewTab || moreTabs.some((t) => t.key === statusTab) ? null : statusTab;
  const todayCounts = today.data?.tabCounts;
  const todayCount = todayCounts ? actualTripCount(todayCounts) : null;
  const run = useMemo(() => typicalRun(deliveredSample.data?.items), [deliveredSample.data]);

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
  const [closingAll, setClosingAll] = useState({ busy: false, done: 0, total: 0 });
  const closingAllRef = useRef(false);
  const [bulkReview, setBulkReview] = useState(null);
  const reviewBulkPlaces = () => {
    if (!canAnswerPlaces || closingAllRef.current || questions.loading) return;
    const entries = (questions.data?.items ?? [])
      .filter((question) => question.suggestion?.name?.trim())
      .map((question) => ({
        id: question.id,
        tripsAffected: question.tripsAffected,
        payload: suggestedPlaceAnswer(question),
      }));
    if (!entries.length) {
      toast.info(
        'No suggested names to confirm yet. Review the places and add their names individually.',
      );
      return;
    }
    setBulkReview({ entries });
  };
  const closeAllPlaces = async () => {
    if (!canAnswerPlaces || closingAllRef.current || !bulkReview?.entries.length) return;
    const entries = bulkReview.entries;
    closingAllRef.current = true;
    setClosingAll({ busy: true, done: 0, total: entries.length });
    let named = 0;
    let failed = 0;
    let tripsUpdated = 0;
    try {
      for (const [index, entry] of entries.entries()) {
        try {
          const result = await fleetViewService.answerPlaceQuestion(entry.id, entry.payload);
          if (result?.placeId) {
            named += 1;
            tripsUpdated += Number(result.tripsUpdated) || 0;
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
        setClosingAll({ busy: true, done: index + 1, total: entries.length });
      }
      const message =
        `Confirmed ${named} place${named === 1 ? '' : 's'}; ${tripsUpdated} trips updated` +
        (failed ? `. ${failed} places could not be confirmed; review them individually.` : '.');
      if (named) toast.success(message);
      else toast.info(message);
      questions.refetch?.();
      waitingSample.refetch();
      refetch();
    } finally {
      closingAllRef.current = false;
      setClosingAll({ busy: false, done: 0, total: 0 });
      setBulkReview(null);
    }
  };

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
  const changeView = (key) => select('', key);

  const pagination = (
    <EnterprisePagination
      page={page}
      totalPages={totalPages}
      totalItems={visibleTotal || null}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  const reviewCount = waitingSample.data?.tabCounts?.NEEDS_REVIEW ?? 0;
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
            placeholder="Search a place, e.g. Buxar"
            aria-label="Search trips by place"
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
            open: tabCounts.OPEN ?? 0,
            review: reviewCount,
          }}
          todayCount={todayCount}
          rangeIsToday={rangeKind === 'today'}
          selectedTab={kpiTab}
          onSelect={changeTab}
          run={run}
          runLoading={deliveredSample.loading}
          runFailed={Boolean(deliveredSample.error)}
        />

        {showBanner ? (
          <NeedsAnswerBanner
            total={reviewCount}
            sample={waitingSample.data?.items}
            sampleLoading={waitingSample.loading}
            questions={questions.data?.items}
            questionsTotal={questions.data?.total}
            questionsTrips={questions.data?.tripsAffected}
            questionsLoading={questions.loading}
            questionsFailed={Boolean(questions.error)}
            onAnswerPlaces={() => changeView('questions')}
            onAnswerAllPlaces={canAnswerPlaces ? reviewBulkPlaces : null}
            closingAll={closingAll}
            onShowTrips={() => changeTab('NEEDS_REVIEW')}
            showingTrips={statusTab === 'NEEDS_REVIEW'}
          />
        ) : null}

        {!viewTab && statusTab === 'NEEDS_REVIEW' ? (
          <nav className="atx-question-trip-nav" aria-label="Trips needing your answer">
            <button type="button" onClick={() => changeTab('')}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to all trips
            </button>
            <span>Showing trips that need your answer</span>
            <button type="button" onClick={() => changeView('questions')}>
              Review place questions
            </button>
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
                aria-label="Back to trips"
                title="Back to trips"
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
                <PlaceQuestionsTab query={questions} />
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

      <BulkPlaceConfirmDialog
        review={bulkReview}
        progress={closingAll}
        onOpenChange={(open) => {
          if (!open) setBulkReview(null);
        }}
        onConfirm={closeAllPlaces}
      />

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
