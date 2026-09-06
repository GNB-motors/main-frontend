import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import dayjs from 'dayjs';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { getProfileField, setProfileField } from '../../utils/session.js';
import EvidenceDrawer from '../../components/cluster/EvidenceDrawer.jsx';
import EventInvestigationDrawer from './EventInvestigationDrawer.jsx';
import FleetStatusBanner from './FleetStatusBanner.jsx';
import KpiStrip from './KpiStrip.jsx';
import FuelActivityPanel from './FuelActivityPanel.jsx';
import AnomalyBreakdownPanel from './AnomalyBreakdownPanel.jsx';
import EventsFeedPanel from './EventsFeedPanel.jsx';
import VehicleRiskPanel from './VehicleRiskPanel.jsx';
import VehicleDrilldownPanel from './VehicleDrilldownPanel.jsx';
import { IST_ZONE, formatRelativeIST } from './fiDates.js';
import {
  buildEvents,
  eventMatchesFilters,
  buildChartData,
  buildDrillChartData,
  buildAffected,
  buildRiskVehicles,
  buildChipDefs,
  buildBanner,
} from './fiData.js';

const FEED_LIMIT = 100;
const PAGE_SIZE = 12;

const FuelIntegrityPage = () => {
  // Filters (backend)
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
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // Client-side filters
  const [chartMetric, setChartMetric] = useState('volume');
  const [eventType, setEventType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chip, setChip] = useState('all');
  const [page, setPage] = useState(1);

  // Drawers / drill-down
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

  // PageShell owns its padding — drop .page-content's default padding while mounted.
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
      next.add(id);
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

  useEffect(() => {
    fetchData();
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

  const events = useMemo(() => buildEvents(fills, windows, pricePerL), [fills, windows, pricePerL]);

  const filteredEvents = useMemo(
    () => events.filter((ev) => eventMatchesFilters(ev, { eventType, statusFilter, chip })),
    [events, eventType, statusFilter, chip],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const banner = buildBanner(lossL, billCount, pricePerL);

  const chipDefs = useMemo(() => buildChipDefs(events), [events]);

  const activeFilterCount =
    (vehicle ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0) +
    (eventType !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (chip !== 'all' ? 1 : 0);

  return (
    <PageShell
      title="Fuel Integrity"
      subtitle="Monitor fuel usage, anomalies and suspected losses"
      count={events.length}
      actions={
        <>
          {lastSynced && (
            <span className="text-dim hidden text-xs sm:inline">
              Last synced {lastSynced.fromNow()}
            </span>
          )}
          <button className="ov-btn" onClick={fetchData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </>
      }
      filters={
        <FilterBar
          searchValue={vehicleQuery}
          onSearchChange={setVehicleQuery}
          searchPlaceholder="Search vehicle (e.g. WB25R9540)…"
          from={inputFromDate}
          to={inputToDate}
          onRangeChange={(patch) => {
            if (patch.from !== undefined) setInputFromDate(patch.from);
            if (patch.to !== undefined) setInputToDate(patch.to);
          }}
          chips={chipDefs}
          selectedKeys={[chip]}
          onToggleChip={setChip}
          activeCount={activeFilterCount}
          onClear={resetFilters}
          right={
            <>
              <div className="fi-field">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  aria-label="Event type"
                >
                  <option value="all">All events</option>
                  <option value="fill">Fills</option>
                  <option value="loss">Losses</option>
                  <option value="def">DEF anomalies</option>
                </select>
              </div>
              <div className="fi-field">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Status"
                >
                  <option value="all">Any status</option>
                  <option value="ESTIMATED">Estimated</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <button className="ov-btn ov-btn--primary" onClick={applyFilter}>
                Apply
              </button>
              <button className="ov-btn" onClick={resetFilters}>
                <X size={14} /> Reset
              </button>
            </>
          }
        />
      }
    >
      {error && (
        <div className="fi-banner fi-banner--crit">
          <span
            className="fi-banner-icon"
            style={{
              background: 'color-mix(in srgb, var(--critical) 12%, transparent)',
              color: 'var(--critical)',
            }}
          >
            <AlertTriangle size={20} />
          </span>
          <div>
            <div className="fi-banner-title">Could not load data</div>
            <p className="text-dim text-sm">{error}</p>
          </div>
        </div>
      )}

      <FleetStatusBanner
        banner={banner}
        defCount={defCount}
        onReviewDef={() => {
          setChip('def');
          document.getElementById('fi-events')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <KpiStrip
        totals={totals}
        windowDays={windowDays}
        lossL={lossL}
        billCount={billCount}
        defCount={defCount}
        pricePerL={pricePerL}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FuelActivityPanel
          isLoading={isLoading}
          chartData={chartData}
          chartMetric={chartMetric}
          onMetricChange={setChartMetric}
          rangeDays={rangeDays}
          onRangeChange={applyRange}
        />
        <AnomalyBreakdownPanel
          defCount={defCount}
          billCount={billCount}
          lossL={lossL}
          affected={affected}
          onDrill={setDrillVehicle}
        />
      </div>

      <EventsFeedPanel
        isLoading={isLoading}
        filteredCount={filteredEvents.length}
        pageEvents={pageEvents}
        page={page}
        totalPages={totalPages}
        reviewed={reviewed}
        onOpenEvent={openEvent}
        onPageChange={setPage}
      />

      <VehicleRiskPanel
        isLoading={isLoading}
        riskVehicles={riskVehicles}
        onDrill={setDrillVehicle}
      />

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
        context={investigateEvent?._ctx || {}}
        reviewed={investigateEvent ? reviewed.has(investigateEvent.id) : false}
        onMarkReviewed={markReviewed}
      />
    </PageShell>
  );
};

export default FuelIntegrityPage;
