import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Fuel,
  ReceiptText,
  Droplets,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Gauge,
  Activity,
  Layers,
} from 'lucide-react';
import dayjs from 'dayjs';
import PageShell from '../../components/ui/PageShell';
import ExportButton from '../../components/ui/ExportButton';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { getProfileField, setProfileField } from '../../utils/session.js';
import EvidenceDrawer from '../../components/cluster/EvidenceDrawer.jsx';
import EventInvestigationDrawer from './EventInvestigationDrawer.jsx';
import FuelIntegrityTables from './FuelIntegrityTables.jsx';
import VehicleDrilldownPanel from './VehicleDrilldownPanel.jsx';
import { IST_ZONE, formatRelativeIST, formatIST } from './fiDates.js';
import { formatINR, formatLitres } from '../../utils/formatters';
import {
  buildEvents,
  eventMatchesFilters,
  buildChartData,
  buildDrillChartData,
  buildAffected,
  buildRiskVehicles,
  buildChipDefs,
} from './fiData.js';
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
    if (fromDate) params.from = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
    if (toDate) params.to = dayjs.tz(toDate, IST_ZONE).endOf('day').utc().toISOString();
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
      setLastSynced(dayjs());
    } catch (err) {
      setError(err.detail || 'Could not load fuel integrity data.');
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
      setError(err.detail || 'Could not reconcile FleetEdge telemetry.');
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
    const to = dayjs().format('YYYY-MM-DD');
    const from = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
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
  const windowDays = summary
    ? dayjs(summary.window?.to).diff(dayjs(summary.window?.from), 'day')
    : null;

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

  /* ── Export configuration for Excel (.xlsx) and CSV (.csv) ───────────────── */
  const exportColumns = useMemo(
    () => [
      { key: 'vehicle', label: 'Vehicle Registration', type: 'text' },
      { key: 'kind', label: 'Event Type', type: 'text' },
      { key: 'timestampIST', label: 'Timestamp (IST)', type: 'text' },
      { key: 'litres', label: 'Fuel Volume (L)', type: 'number' },
      { key: 'inr', label: 'Estimated Value (₹)', type: 'currency' },
      { key: 'status', label: 'Integrity Status', type: 'text' },
      { key: 'lat', label: 'Latitude', type: 'number' },
      { key: 'lng', label: 'Longitude', type: 'number' },
    ],
    [],
  );

  const exportRows = useMemo(
    () =>
      filteredEvents.map((ev) => ({
        vehicle: ev.vehicle || '',
        kind:
          ev.kind === 'fill' ? 'Refuel Fill' : ev.kind === 'loss' ? 'Siphon Loss' : 'DEF Anomaly',
        timestampIST: formatIST(ev.at),
        litres: ev.litres != null ? Number(Number(ev.litres).toFixed(1)) : null,
        inr: ev.inr != null ? Number(ev.inr) : null,
        status:
          ev.kind === 'fill'
            ? ev.billFlag
              ? 'Bill Mismatch'
              : ev.confirmationStatus || 'Estimated'
            : ev.kind === 'loss'
              ? 'Suspected Loss'
              : `DEF ${ev.defFlag || 'Anomaly'}`,
        lat: ev.lat != null ? Number(ev.lat) : null,
        lng: ev.lng != null ? Number(ev.lng) : null,
      })),
    [filteredEvents],
  );

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
        <div className="flex items-center gap-2">
          {lastSynced && (
            <span className="text-dim hidden text-xs sm:inline">Synced {lastSynced.fromNow()}</span>
          )}
          <ExportButton
            rows={exportRows}
            columns={exportColumns}
            filename="fuel-integrity-report"
            disabled={filteredEvents.length === 0}
          />
          <button
            type="button"
            className="pshell-btn text-indigo-600 dark:text-indigo-400 font-medium"
            onClick={handleSyncIoT}
            disabled={isSyncing || isLoading}
            title="Trigger on-demand reconciliation of recent FleetEdge telemetry"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Reconciling...' : 'Reconcile IoT'}</span>
          </button>
          <button
            type="button"
            className="pshell-btn"
            onClick={fetchData}
            disabled={isLoading || isSyncing}
            title="Refresh telemetry stream"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
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
        <div className="fi-flow-pipeline">
          <div className="fi-pipeline-header">
            <div className="fi-pipeline-title-group">
              <Layers size={15} className="text-blue-600 dark:text-blue-400" />
              <span className="fi-pipeline-title">Autonomous Mass-Balance Flow Reconciliation</span>
              <span className="fi-pipeline-formula">
                Pump Inflow − Engine Burn − ΔTank Level = Unaccounted Loss
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Window:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {windowDays ? `Last ${windowDays} Days` : 'Last 7 Days'}
              </span>
            </div>
          </div>

          <div className="fi-pipeline-steps">
            {/* Step 1: Dispensed Inflow */}
            <div className="fi-step-card">
              <div className="fi-step-head">
                <span className="fi-step-label">1. Pump Dispensed</span>
                <Fuel size={14} className="text-blue-500" />
              </div>
              <div className="fi-step-val text-blue-600 dark:text-blue-400">
                +{formatLitres(totalFillsLitres)}
              </div>
              <div className="fi-step-sub">
                ≈ {formatINR(totalFillsLitres * pricePerL)} invoiced
              </div>
            </div>

            <div className="fi-step-arrow">
              <ArrowRight size={16} />
            </div>

            {/* Step 2: Engine Consumed */}
            <div className="fi-step-card">
              <div className="fi-step-head">
                <span className="fi-step-label">2. Engine Consumed</span>
                <Activity size={14} className="text-emerald-500" />
              </div>
              <div className="fi-step-val text-slate-800 dark:text-slate-100">
                {formatLitres(totalEngineBurnL)}
              </div>
              <div className="fi-step-sub">
                {totalEngineBurnL > 0 ? 'CAN bus engine burn' : 'Awaiting CAN data'}
              </div>
            </div>

            <div className="fi-step-arrow">
              <ArrowRight size={16} />
            </div>

            {/* Step 3: Net Tank Delta */}
            <div className="fi-step-card">
              <div className="fi-step-head">
                <span className="fi-step-label">3. Net Tank Reserve</span>
                <Gauge size={14} className="text-indigo-500" />
              </div>
              <div className="fi-step-val text-indigo-600 dark:text-indigo-400">
                {totalNetTankDeltaL >= 0 ? '+' : ''}
                {formatLitres(totalNetTankDeltaL)}
              </div>
              <div className="fi-step-sub">Fleet tank level balance</div>
            </div>

            <div className="fi-step-arrow">
              <ArrowRight size={16} />
            </div>

            {/* Step 4: Siphon Loss Defense */}
            <div
              className="fi-step-card"
              style={{
                borderColor: lossL > 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.4)',
                background: lossL > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.06)',
              }}
            >
              <div className="fi-step-head">
                <span className="fi-step-label">4. Unaccounted Loss</span>
                {lossL > 0 ? (
                  <ShieldAlert size={14} className="text-red-500" />
                ) : (
                  <ShieldCheck size={14} className="text-emerald-500" />
                )}
              </div>
              <div
                className="fi-step-val"
                style={{
                  color: lossL > 0 ? 'var(--critical, #dc2626)' : 'var(--ok, #10b981)',
                }}
              >
                {lossL > 0 ? `−${formatLitres(lossL)}` : '0.0 L (₹0)'}
              </div>
              <div className="fi-step-sub">
                {lossL > 0
                  ? `Leakage: ${formatINR(lossL * pricePerL)}`
                  : '🛡️ 100% Intact · Zero Theft'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Executive 4-Card Bento Strip ─────────────────────────────────── */}
        <div className="fi-bento-grid">
          {/* Card 1: Audited Dispensed Fuel */}
          <div className="fi-bento-card fi-bento-card--blue">
            <div className="fi-bento-head">
              <span className="fi-bento-label">Audited Volume</span>
              <div className="fi-bento-icon fi-bento-icon--blue">
                <Fuel size={16} />
              </div>
            </div>
            <div className="fi-bento-body">
              <div className="fi-bento-val-row">
                <span className="fi-bento-val">
                  {totalFillsLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </span>
                <span className="fi-bento-unit">L</span>
              </div>
            </div>
            <div className="fi-bento-foot">
              <span className="fi-bento-sub">
                {windowDays ? `${windowDays} days` : 'Over 7 days'} · ~
                {windowDays && totalFillsLitres > 0
                  ? (totalFillsLitres / windowDays).toFixed(0)
                  : '0'}{' '}
                L/day
              </span>
              <span className="fi-bento-pill fi-bento-pill--ok">Audited</span>
            </div>
          </div>

          {/* Card 2: Unaccounted Fuel Loss */}
          <div
            className={`fi-bento-card ${lossL > 0 ? 'fi-bento-card--rose' : 'fi-bento-card--emerald'}`}
          >
            <div className="fi-bento-head">
              <span className="fi-bento-label">Mass-Balance Siphon Loss</span>
              <div
                className={`fi-bento-icon ${lossL > 0 ? 'fi-bento-icon--rose' : 'fi-bento-icon--emerald'}`}
              >
                {lossL > 0 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              </div>
            </div>
            <div className="fi-bento-body">
              <div className="fi-bento-val-row">
                <span
                  className="fi-bento-val"
                  style={{ color: lossL > 0 ? 'var(--critical, #dc2626)' : undefined }}
                >
                  {lossL.toFixed(1)}
                </span>
                <span className="fi-bento-unit">L</span>
                <span className="fi-bento-secondary-val">
                  · ₹{(lossL * pricePerL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="fi-bento-foot">
              <span className="fi-bento-sub">
                {lossL === 0 ? 'Mass balance physics intact' : 'Siphon suspected in window'}
              </span>
              <span
                className={`fi-bento-pill ${lossL === 0 ? 'fi-bento-pill--ok' : 'fi-bento-pill--crit'}`}
              >
                {lossL === 0 ? '100% Retained' : 'Theft Flagged'}
              </span>
            </div>
          </div>

          {/* Card 3: Billed vs Sensor Variance */}
          <div className="fi-bento-card fi-bento-card--purple">
            <div className="fi-bento-head">
              <span className="fi-bento-label">Bill vs Tank Mismatches</span>
              <div className="fi-bento-icon fi-bento-icon--purple">
                <ReceiptText size={16} />
              </div>
            </div>
            <div className="fi-bento-body">
              <div className="fi-bento-val-row">
                <span className="fi-bento-val">{billCount}</span>
                <span className="fi-bento-unit">Flags</span>
              </div>
            </div>
            <div className="fi-bento-foot">
              <span className="fi-bento-sub">Invoices match sensor tank jump</span>
              <span
                className={`fi-bento-pill ${billCount === 0 ? 'fi-bento-pill--ok' : 'fi-bento-pill--warn'}`}
              >
                {billCount === 0 ? 'Clean Slips' : `${billCount} Flagged`}
              </span>
            </div>
          </div>

          {/* Card 4: DEF / AdBlue Discrepancies */}
          <div
            className="fi-bento-card fi-bento-card--amber cursor-pointer"
            onClick={() => setChip((c) => (c === 'def' ? 'all' : 'def'))}
            title="Click to toggle DEF anomaly filter"
          >
            <div className="fi-bento-head">
              <span className="fi-bento-label">DEF / AdBlue Ratio</span>
              <div className="fi-bento-icon fi-bento-icon--amber">
                <Droplets size={16} />
              </div>
            </div>
            <div className="fi-bento-body">
              <div className="fi-bento-val-row">
                <span className="fi-bento-val" style={{ color: '#d97706' }}>
                  {defCount}
                </span>
                <span className="fi-bento-unit">Under Review</span>
              </div>
            </div>
            <div className="fi-bento-foot">
              <span className="fi-bento-sub">AdBlue telemetry anomaly</span>
              <span
                className={`fi-bento-pill ${defCount === 0 ? 'fi-bento-pill--ok' : 'fi-bento-pill--warn'}`}
              >
                {defCount === 0 ? 'Ratio Normal' : 'Tamper Alert'}
              </span>
            </div>
          </div>
        </div>

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
