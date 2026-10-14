import {
  daysBetween,
  istDayEndISO,
  istDayStartISO,
  istDayString,
  shiftDay,
} from '../../utils/dateUtils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import { FuelIntegrityService } from './FuelIntegrityService.js';
import { getProfileField, setProfileField } from '../../utils/session.js';
import EvidenceDrawer from '../../components/cluster/EvidenceDrawer.jsx';
import EventInvestigationDrawer from './EventInvestigationDrawer.jsx';
import FuelIntegrityTables from './FuelIntegrityTables.jsx';
import VehicleDrilldownPanel from './VehicleDrilldownPanel.jsx';
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

const FuelIntegrityPage = () => {
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
  const [windows, setWindows] = useState([]);
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
    const params = {};
    if (vehicle) params.vehicle = vehicle;
    if (fromDate) params.from = istDayStartISO(fromDate);
    if (toDate) params.to = istDayEndISO(toDate);
    return params;
  }, [vehicle, fromDate, toDate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = buildParams();
      const [summaryData, fillsData, windowsData] = await Promise.all([
        FuelIntegrityService.getSummary(params),
        FuelIntegrityService.getFills({ ...params, page: 1, limit: FEED_LIMIT }),
        FuelIntegrityService.getWindows(params),
      ]);
      setSummary(summaryData);
      setFills(fillsData.records || []);
      setWindows(windowsData.records || []);
      setLastSynced(new Date());
    } catch (err) {
      setError(err.message || 'Could not load fuel integrity data.');
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const handleSyncIoT = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await FuelIntegrityService.triggerSync();
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not reconcile FleetEdge telemetry.');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 45 seconds for live telemetry sync
    const pollInterval = setInterval(fetchData, 45000);
    return () => clearInterval(pollInterval);
  }, [fetchData]);

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
  const totals = summary?.totals;
  const lossL = totals?.siphonSuspectedLossL || 0;
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
    <PageShell
      title={
        <div className="flex items-center gap-3">
          <span>Fuel Integrity & Anti-Theft AI</span>
          <span className="fi-live-badge">
            <span className="fi-live-dot" />
            <span>AI Telemetry Active</span>
          </span>
        </div>
      }
      subtitle={
        lossL === 0
          ? 'Autonomous mass-balance reconciled: 0 L unexplained loss · 100% fuel retained across fleet'
          : `Alert: ${lossL.toFixed(1)} L unexplained siphon loss detected across fleet — review immediately`
      }
      actions={
        <IntegrityHeaderActions
          exportColumns={exportColumns}
          exportRows={exportRows}
          fetchData={fetchData}
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

        {/* ── HERO: MASS-BALANCE FLOW RECONCILIATION PIPELINE ──────────────── */}
        <MassBalancePipeline
          lossL={lossL}
          pricePerL={pricePerL}
          totalEngineBurnL={totalEngineBurnL}
          totalFillsLitres={totalFillsLitres}
          totalNetTankDeltaL={totalNetTankDeltaL}
          windowDays={windowDays}
        />

        {/* ── Executive 4-Card Bento Strip ─────────────────────────────────── */}
        <IntegrityBentoStrip
          billCount={billCount}
          defCount={defCount}
          lossL={lossL}
          pricePerL={pricePerL}
          setChip={setChip}
          totalFillsLitres={totalFillsLitres}
          windowDays={windowDays}
        />

        {/* ── Operational Mission Control Workspace ────────────────────────── */}
        <FuelIntegrityTables
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

        <EvidenceDrawer
          open={!!evidenceWindow}
          onClose={() => setEvidenceWindow(null)}
          window={evidenceWindow}
          context={{ fuelPriceInrPerL: pricePerL }}
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
  );
};

export default FuelIntegrityPage;
