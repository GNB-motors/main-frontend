import { useApi } from '../../hooks/useApi';
import { normalisePumpLedger } from './pumpHonestyModel';
import ManufacturerFilter from '../../components/filters/ManufacturerFilter';
import useManufacturerFilter from '../../hooks/useManufacturerFilter';
import {
  daysBetween,
  istDayEndISO,
  istDayStartISO,
  istDayString,
  shiftDay,
} from '../../utils/dateUtils';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import { FuelIntegrityService } from './FuelIntegrityService.js';
import { getProfileField, setProfileField } from '../../utils/session.js';
import FuelWindowDrilldown from './FuelWindowDrilldown.jsx';
import EventInvestigationDrawer from './EventInvestigationDrawer.jsx';
import FuelIntegrityTables from './FuelIntegrityTables.jsx';
import VehicleDrilldownPanel from './VehicleDrilldownPanel.jsx';
import RefuelAdvisoryCard from './RefuelAdvisoryCard.jsx';
import PumpsWatchCard from './PumpsWatchCard.jsx';
import { formatRelativeIST } from './fiDates.js';
import {
  buildEvents,
  eventMatchesFilters,
  buildChartData,
  buildDrillChartData,
  buildAffected,
  buildRiskVehicles,
  buildChipDefs,
} from './fiData.js';
import MassBalancePipeline from './integrity/MassBalancePipeline';
import IntegrityBentoStrip from './integrity/IntegrityBentoStrip';
import IntegrityHeaderActions from './integrity/IntegrityHeaderActions';
import useIntegrityExport from './integrity/useIntegrityExport';
import './FuelIntegrity.css';

const FEED_LIMIT = 100;
const PAGE_SIZE = 12;
// The fuel sweep recomputes these hourly, so a 45 s poll only repeated the same
// three reads (the busiest routes on the server). Poll every 5 min while the tab
// is visible, and catch up when it is shown again after a missed poll.
const POLL_MS = 5 * 60 * 1000;
// The windows feed's largest page. A busy fleet has ~900 windows a week; past
// this the page says how many it is not showing instead of dropping them quietly.
const WINDOWS_LIMIT = 1000;

const FuelIntegrityPage = () => {
  const { manufacturer, setManufacturer } = useManufacturerFilter();
  // Backend Filters
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rangeDays, setRangeDays] = useState(null);

  // Data
  const [summary, setSummary] = useState(null);
  const [fills, setFills] = useState([]);
  const [fillsTotal, setFillsTotal] = useState(0);
  const [isLoadingMoreFills, setIsLoadingMoreFills] = useState(false);
  const [fillsError, setFillsError] = useState(null);
  const [windows, setWindows] = useState([]);
  const [windowsTotal, setWindowsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // Client-side table filters
  const [chartMetric, setChartMetric] = useState('volume');
  const [eventType, setEventType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chip, setChip] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Drawers & drill-down
  const [drillVehicle, setDrillVehicle] = useState(null);
  const [evidenceWindow, setEvidenceWindow] = useState(null);
  const [investigateEvent, setInvestigateEvent] = useState(null);
  const [reviewed, setReviewed] = useState(() => {
    try {
      return new Set(JSON.parse(getProfileField('fi-reviewed-events') || '[]'));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const markReviewed = useCallback((id) => {
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setProfileField('fi-reviewed-events', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const buildParams = useCallback(() => {
    const params = manufacturer ? { manufacturer } : {};
    if (vehicle) params.vehicle = vehicle;
    if (fromDate) params.from = istDayStartISO(fromDate);
    if (toDate) params.to = istDayEndISO(toDate);
    return params;
  }, [manufacturer, vehicle, fromDate, toDate]);

  // Pumps are a fleet ledger; the endpoint supports date and manufacturer scope.
  const pumpParams = {
    ...(manufacturer ? { manufacturer } : {}),
    ...(fromDate ? { from: istDayStartISO(fromDate) } : {}),
    ...(toDate ? { to: istDayEndISO(toDate) } : {}),
  };
  const pumpScope = JSON.stringify(pumpParams);
  const { refetch: refreshPumpLedger, ...pumpLedger } = useApi(
    (signal) =>
      FuelIntegrityService.getPumpLedger(pumpParams, { signal }).then(normalisePumpLedger),
    [pumpScope],
    { scopeKey: pumpScope },
  );

  const controllerRef = useRef(null);
  const moreFillsControllerRef = useRef(null);
  const fillsPageRef = useRef(1);
  const fillsWindowRef = useRef(null);
  const lastFetchRef = useRef(0);

  // A background poll ({ silent: true }) keeps the page as it is while it loads.
  // Each fetch aborts the one still in flight, so polls never overlap.
  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      controllerRef.current?.abort();
      moreFillsControllerRef.current?.abort();
      moreFillsControllerRef.current = null;
      setIsLoadingMoreFills(false);
      setFillsError(null);
      const controller = new AbortController();
      controllerRef.current = controller;
      const { signal } = controller;
      lastFetchRef.current = Date.now();
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const params = buildParams();
        const [summaryData, fillsData, windowsData] = await Promise.all([
          FuelIntegrityService.getSummary(params, signal),
          FuelIntegrityService.getFills({ ...params, page: 1, limit: FEED_LIMIT }, signal),
          FuelIntegrityService.getWindows({ ...params, limit: WINDOWS_LIMIT }, signal),
        ]);
        if (signal.aborted) return;
        // Refresh every page already loaded, keeping the same window across
        // those pages. A background poll must not drop the owner's extra fills.
        const fillWindow = fillsData.window || summaryData.window;
        const scopedParams = {
          ...params,
          ...(fillWindow?.from ? { from: fillWindow.from } : {}),
          ...(fillWindow?.to ? { to: fillWindow.to } : {}),
        };
        const totalFills = fillsData.total ?? (fillsData.records || []).length;
        const pageCount = Math.min(
          fillsPageRef.current,
          Math.max(1, Math.ceil(totalFills / FEED_LIMIT)),
        );
        const extraPages = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, i) =>
            FuelIntegrityService.getFills(
              { ...scopedParams, page: i + 2, limit: FEED_LIMIT },
              signal,
            ),
          ),
        );
        if (signal.aborted) return;
        fillsPageRef.current = pageCount;
        fillsWindowRef.current = fillWindow;
        setSummary(summaryData);
        setFills([
          ...new Map(
            [fillsData, ...extraPages]
              .flatMap((p) => p.records || [])
              .map((f) => [String(f._id), f]),
          ).values(),
        ]);
        setFillsTotal(totalFills);
        setWindows(windowsData.records || []);
        setWindowsTotal(windowsData.total ?? (windowsData.records || []).length);
        setLastSynced(new Date());
        setError(null);
      } catch (err) {
        if (signal.aborted || err?.code === 'ERR_CANCELED') return;
        setError(err.message || 'Could not load fuel integrity data.');
      } finally {
        // The newest fetch ends the loading state, whichever one started it.
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [buildParams],
  );

  const loadMoreFills = useCallback(async () => {
    if (controllerRef.current || moreFillsControllerRef.current) return;
    const controller = new AbortController();
    moreFillsControllerRef.current = controller;
    setIsLoadingMoreFills(true);
    setFillsError(null);
    const nextPage = fillsPageRef.current + 1;
    const window = fillsWindowRef.current;
    try {
      const data = await FuelIntegrityService.getFills(
        {
          ...buildParams(),
          ...(window?.from ? { from: window.from } : {}),
          ...(window?.to ? { to: window.to } : {}),
          page: nextPage,
          limit: FEED_LIMIT,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      fillsPageRef.current = nextPage;
      setFills((current) => [
        ...new Map([...current, ...(data.records || [])].map((f) => [String(f._id), f])).values(),
      ]);
      setFillsTotal((current) => data.total ?? current);
    } catch (err) {
      if (!controller.signal.aborted && err?.code !== 'ERR_CANCELED')
        setFillsError(err.message || 'Could not load more fills.');
    } finally {
      if (moreFillsControllerRef.current === controller) {
        moreFillsControllerRef.current = null;
        setIsLoadingMoreFills(false);
      }
    }
  }, [buildParams]);

  const handleSyncIoT = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await FuelIntegrityService.triggerSync();
      await fetchData();
      refreshPumpLedger();
    } catch (err) {
      setError(err.message || 'Could not reconcile FleetEdge telemetry.');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData, refreshPumpLedger]);

  useEffect(() => {
    setSummary(null);
    setFills([]);
    setFillsTotal(0);
    fillsPageRef.current = 1;
    fillsWindowRef.current = null;
    setWindows([]);
    setWindowsTotal(0);
    setDrillVehicle(null);
    setEvidenceWindow(null);
    setInvestigateEvent(null);
    setSelectedEventId(null);
    setPage(1);
    fetchData();
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchData({ silent: true });
        refreshPumpLedger();
      }
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchRef.current >= POLL_MS) {
        fetchData({ silent: true });
        refreshPumpLedger();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisible);
      controllerRef.current?.abort();
      moreFillsControllerRef.current?.abort();
    };
  }, [fetchData, refreshPumpLedger]);

  useEffect(() => {
    setPage(1);
  }, [eventType, statusFilter, chip, vehicle, fromDate, toDate]);

  const applyFilter = () => {
    setVehicle(vehicleQuery.trim());
    setFromDate(inputFromDate);
    setToDate(inputToDate);
    setRangeDays(null);
  };

  const applyRange = (days) => {
    const to = istDayString();
    const from = shiftDay(to, -days);
    setRangeDays(days);
    setInputFromDate(from);
    setInputToDate(to);
    setFromDate(from);
    setToDate(to);
  };

  const resetFilters = () => {
    setManufacturer('');
    setVehicleQuery('');
    setInputFromDate('');
    setInputToDate('');
    setVehicle('');
    setFromDate('');
    setToDate('');
    setRangeDays(null);
    setEventType('all');
    setStatusFilter('all');
    setChip('all');
  };

  const pricePerL = summary?.fuelPriceInrPerL ?? 95;
  const priceSource = summary?.fuelPriceSource ?? 'CONFIG';
  const totals = summary?.totals;
  // V2 adjusted review loss or legacy parked loss, according to mathVersion.
  // Null means unmeasured; it must not be displayed as zero.
  const lossL = totals?.siphonSuspectedLossL ?? null;
  const lossSigmaL = totals?.siphonSuspectedLossSigmaL ?? null;
  const v2Loss = summary?.mathVersion === 'v2';
  const lossLabel = v2Loss ? 'Fuel loss to review' : 'Fuel down while parked';
  const billCount = totals?.billFlagCount || 0;
  const defCount = totals?.defFlagCount || 0;
  const windowDays = summary ? daysBetween(summary.window?.from, summary.window?.to) : null;

  const totalFillsLitres = totals?.totalFillsLitres ?? totals?.fillsLitres ?? 0;
  const totalEngineBurnL = totals?.totalEngineBurnL ?? 0;
  const totalNetTankDeltaL = totals?.totalNetTankDeltaL ?? 0;

  const events = useMemo(() => buildEvents(fills, windows, pricePerL), [fills, windows, pricePerL]);

  const filteredEvents = useMemo(
    () => events.filter((ev) => eventMatchesFilters(ev, { eventType, statusFilter, chip })),
    [events, eventType, statusFilter, chip],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto-select first event if current selection is invalid
  useEffect(() => {
    if (pageEvents.length > 0) {
      if (!selectedEventId || !pageEvents.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(pageEvents[0].id);
      }
    }
  }, [pageEvents, selectedEventId]);

  const chartData = useMemo(() => buildChartData(fills, windows), [fills, windows]);
  const affected = useMemo(() => buildAffected(summary?.vehicles), [summary]);
  const riskVehicles = useMemo(() => buildRiskVehicles(summary?.vehicles), [summary]);

  const drillWindows = useMemo(
    () => windows.filter((w) => w.registrationNumber === drillVehicle),
    [windows, drillVehicle],
  );
  const drillChartData = useMemo(
    () => buildDrillChartData(fills, windows, drillVehicle),
    [fills, windows, drillVehicle],
  );

  const openEvent = (ev) => {
    if (ev.kind === 'fill') {
      const sameVeh = fills
        .filter((f) => f.registrationNumber === ev.vehicle)
        .sort((a, b) => new Date(b.at) - new Date(a.at));
      const idx = sameVeh.findIndex((f) => `fill-${f._id}` === ev.id);
      const previousFill = idx >= 0 && sameVeh[idx + 1] ? sameVeh[idx + 1].litres : null;
      const vals = sameVeh.map((f) => f.litres).filter((n) => n != null);
      const averageFill = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : null;
      setInvestigateEvent({
        ...ev,
        _ctx: {
          previousFill,
          averageFill,
          timestampLabel: formatRelativeIST(ev.at),
          fuelPriceInrPerL: pricePerL,
        },
      });
    } else {
      setEvidenceWindow(ev.window);
    }
  };

  const chipDefs = useMemo(() => buildChipDefs(events), [events]);

  const { exportColumns, exportRows } = useIntegrityExport(filteredEvents);

  return (
    <>
      <PageShell
        title={
          <div className="flex items-center gap-3">
            <span>Fuel Integrity</span>
            <span className="fi-live-badge">
              <span className="fi-live-dot" />
              <span>Telemetry checks on</span>
            </span>
          </div>
        }
        subtitle={
          v2Loss
            ? lossL == null
              ? 'Fuel loss could not be assessed in this period.'
              : lossL === 0
                ? 'No fuel loss exceeded the review threshold in this period.'
                : `${lossL.toFixed(1)} L of unexplained fuel loss needs review — inspect the windows below.`
            : lossL == null
              ? 'We could not measure whether any fuel went down while parked in this period'
              : lossL === 0
                ? 'No fuel went down while a truck was parked in this period'
                : `${lossL.toFixed(1)} L of fuel went down while parked — review the windows below. This is a measurement, not a conclusion.`
        }
        filters={
          <div className="manufacturer-scope-row">
            <ManufacturerFilter value={manufacturer} onChange={setManufacturer} />
          </div>
        }
        actions={
          <IntegrityHeaderActions
            exportColumns={exportColumns}
            exportRows={exportRows}
            fetchData={() => {
              refreshPumpLedger();
              return fetchData();
            }}
            filteredEvents={filteredEvents}
            handleSyncIoT={handleSyncIoT}
            isLoading={isLoading}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
          />
        }
      >
        <div className="fi-page-container">
          {/* Error Alert */}
          {error && (
            <div className="fi-banner fi-banner--crit">
              <span className="fi-banner-icon bg-red-100 dark:bg-red-950 text-red-600">
                <AlertTriangle size={18} />
              </span>
              <div>
                <div className="fi-banner-title">Could not refresh telemetry</div>
                <p className="text-xs text-slate-500">{error}</p>
              </div>
            </div>
          )}

          {windowsTotal > windows.length && (
            <div className="fi-banner fi-banner--warn">
              <span className="fi-banner-icon bg-amber-100 dark:bg-amber-950 text-amber-600">
                <AlertTriangle size={18} />
              </span>
              <div>
                <div className="fi-banner-title">
                  Showing the newest {windows.length.toLocaleString('en-IN')} of{' '}
                  {windowsTotal.toLocaleString('en-IN')} fuel windows
                </div>
                <p className="text-xs text-slate-500">
                  Narrow the date range or pick a vehicle to see the rest.
                </p>
              </div>
            </div>
          )}

          {(fillsTotal > FEED_LIMIT || fillsError) && (
            <div className="fi-banner fi-banner--warn" role="status">
              <div>
                <div className="fi-banner-title">
                  Showing {fills.length.toLocaleString('en-IN')} of{' '}
                  {fillsTotal.toLocaleString('en-IN')} fills
                </div>
                {fills.length < fillsTotal && (
                  <p className="text-xs text-slate-500">
                    The summary covers the whole window. Load more fills to include them in events,
                    charts and exports.
                  </p>
                )}
                {fillsError && <p role="alert">{fillsError}</p>}
              </div>
              {fills.length < fillsTotal && (
                <button
                  type="button"
                  className="ov-btn"
                  onClick={loadMoreFills}
                  disabled={isLoadingMoreFills || isLoading}
                >
                  {isLoadingMoreFills
                    ? 'Loading fills…'
                    : fillsError
                      ? 'Retry loading fills'
                      : 'Load more fills'}
                </button>
              )}
            </div>
          )}

          {/* ── HERO: MASS-BALANCE FLOW RECONCILIATION PIPELINE ──────────────── */}
          <MassBalancePipeline
            lossLabel={lossLabel}
            lossL={lossL}
            pricePerL={pricePerL}
            totalEngineBurnL={totalEngineBurnL}
            totalFillsLitres={totalFillsLitres}
            totalNetTankDeltaL={totalNetTankDeltaL}
            windowDays={windowDays}
          />

          {/* ── Executive 4-Card Bento Strip ─────────────────────────────────── */}
          <IntegrityBentoStrip
            lossLabel={lossLabel}
            billCount={billCount}
            defCount={defCount}
            lossL={lossL}
            lossSigmaL={lossSigmaL}
            priceSource={priceSource}
            pricePerL={pricePerL}
            setChip={setChip}
            totalFillsLitres={totalFillsLitres}
            windowDays={windowDays}
          />

          {/* ── Refuel advisory & pump honesty ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RefuelAdvisoryCard />
            <PumpsWatchCard ledger={pumpLedger} />
          </div>

          {/* ── Operational Mission Control Workspace ────────────────────────── */}
          <FuelIntegrityTables
            lossLabel={lossLabel}
            pumpLedger={pumpLedger}
            isLoading={isLoading}
            filteredCount={filteredEvents.length}
            pageEvents={pageEvents}
            page={page}
            totalPages={totalPages}
            reviewed={reviewed}
            onOpenEvent={openEvent}
            onPageChange={setPage}
            riskVehicles={riskVehicles}
            onDrill={setDrillVehicle}
            vehicle={vehicle}
            // Analytics & trends
            chartData={chartData}
            chartMetric={chartMetric}
            onMetricChange={setChartMetric}
            rangeDays={rangeDays}
            onRangeChange={applyRange}
            defCount={defCount}
            billCount={billCount}
            lossL={lossL}
            affected={affected}
            // Embedded search and filters
            chip={chip}
            onChipChange={setChip}
            chipDefs={chipDefs}
            vehicleQuery={vehicleQuery}
            onVehicleQueryChange={setVehicleQuery}
            eventType={eventType}
            onEventTypeChange={setEventType}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onApplyFilter={applyFilter}
            onResetFilters={resetFilters}
            // Split Inspector Controls
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            onMarkReviewed={markReviewed}
            pricePerL={pricePerL}
            fills={fills}
          />

          {/* ── Modal / Slideover Drawers ────────────────────────────────────── */}
          {drillVehicle && !isLoading && (
            <VehicleDrilldownPanel
              vehicle={drillVehicle}
              chartData={drillChartData}
              windows={drillWindows}
              onClose={() => setDrillVehicle(null)}
              onShowWorking={setEvidenceWindow}
            />
          )}

          <FuelWindowDrilldown
            open={!!evidenceWindow}
            onClose={() => setEvidenceWindow(null)}
            fuelWindow={evidenceWindow}
          />

          <EventInvestigationDrawer
            open={!!investigateEvent}
            onClose={() => setInvestigateEvent(null)}
            event={investigateEvent}
            context={investigateEvent?._ctx}
            reviewed={investigateEvent ? reviewed.has(investigateEvent.id) : false}
            onMarkReviewed={markReviewed}
          />
        </div>
      </PageShell>
    </>
  );
};

export default FuelIntegrityPage;
