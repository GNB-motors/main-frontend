import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Fuel, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Search, MapPin,
  FileWarning, Droplets, ArrowLeft, ShieldCheck, ShieldAlert, ChevronRight,
  Wallet, X,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { formatINR, formatLitres } from '../../utils/formatters';
import EvidenceDrawer from '../../components/cluster/EvidenceDrawer.jsx';
import EventInvestigationDrawer from './EventInvestigationDrawer.jsx';
import { Panel, StatusPill } from '../Overview/components/overview.primitives.jsx';
import VehicleLink from '../../components/Fleet/VehicleLink.jsx';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_ZONE = 'Asia/Kolkata';
const FEED_LIMIT = 100;
const PAGE_SIZE = 12;
const REVIEWED_KEY = 'fi-reviewed-events';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);
const formatIST = (utcStr) => { const d = toIST(utcStr); return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—'; };
const formatRelativeIST = (utcStr) => { const d = toIST(utcStr); return d ? d.fromNow() : null; };
const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

const RISK_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1, Healthy: 0 };
const RISK_TONE = { Critical: 'critical', High: 'critical', Medium: 'caution', Low: 'caution', Healthy: 'ok' };
function computeRisk(v) {
  if ((v.siphonSuspectedLossL || 0) > 0) return 'Critical';
  if ((v.defFlagCount || 0) >= 15 || (v.billFlagCount || 0) >= 3) return 'High';
  if ((v.defFlagCount || 0) >= 5 || (v.billFlagCount || 0) >= 1) return 'Medium';
  if ((v.defFlagCount || 0) >= 1) return 'Low';
  return 'Healthy';
}

const METRICS = [
  { key: 'volume', label: 'Fuel volume', color: 'var(--gnb-400)', unit: ' L' },
  { key: 'loss', label: 'Loss', color: 'var(--critical)', unit: ' L' },
  { key: 'events', label: 'Events', color: 'var(--gnb-300)', unit: '' },
  { key: 'def', label: 'DEF', color: 'var(--caution)', unit: '' },
];

// ─── Compact KPI ──────────────────────────────────────────────────────────────
const Kpi = ({ icon: Icon, label, value, sub, accent, emphasis }) => (
  <div className="ov-kpi" style={emphasis ? { borderLeft: `3px solid ${accent}` } : undefined}>
    <span className="ov-kpi-label">
      {Icon ? <Icon size={13} style={{ color: accent }} /> : null}
      {label}
    </span>
    <span className="ov-kpi-value" style={emphasis ? { color: accent } : undefined}>{value}</span>
    {sub && <span className="ov-kpi-sub">{sub}</span>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FuelIntegrityPage = ({ embedded = false }) => {
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
    try { return new Set(JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]')); } catch { return new Set(); }
  });

  const markReviewed = useCallback((id) => {
    setReviewed((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(REVIEWED_KEY, JSON.stringify([...next]));
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

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [eventType, statusFilter, chip, vehicle, fromDate, toDate]);

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
    setInputFromDate(from); setInputToDate(to);
    setFromDate(from); setToDate(to);
  };

  const resetFilters = () => {
    setVehicleQuery(''); setInputFromDate(''); setInputToDate('');
    setVehicle(''); setFromDate(''); setToDate(''); setRangeDays(null);
    setEventType('all'); setStatusFilter('all'); setChip('all');
  };

  const pricePerL = summary?.fuelPriceInrPerL ?? 95;
  const totals = summary?.totals;
  const lossL = totals?.siphonSuspectedLossL || 0;
  const billCount = totals?.billFlagCount || 0;
  const defCount = totals?.defFlagCount || 0;

  // Merged events feed: fills + siphon-suspected losses + DEF-flag windows
  const events = useMemo(() => {
    const fillEvents = fills.map((f) => ({
      id: `fill-${f._id}`, kind: 'fill', vehicle: f.registrationNumber,
      litres: f.litres, inr: f.litres != null ? f.litres * pricePerL : null,
      at: f.at, lat: f.lat, lng: f.lng,
      confirmationStatus: f.confirmationStatus, billFlag: f.billFlag, billVarianceL: f.billVarianceL,
      smoothedJumpL: f.smoothedJumpL, odometer: f.odometer, claimedLitres: f.claimedLitres,
    }));
    const lossEvents = windows.filter((w) => w.siphonSuspected).map((w) => ({
      id: `loss-${w._id}`, kind: 'loss', vehicle: w.registrationNumber,
      litres: w.unaccountedLossL, inr: w.unaccountedLossL != null ? Math.max(0, w.unaccountedLossL) * pricePerL : null,
      at: w.windowTo, windowFrom: w.windowFrom, windowTo: w.windowTo, confidence: w.siphonConfidence, window: w,
    }));
    const defEvents = windows.filter((w) => w.defRatioFlag).map((w) => ({
      id: `def-${w._id}`, kind: 'def', vehicle: w.registrationNumber,
      at: w.windowTo, windowFrom: w.windowFrom, windowTo: w.windowTo,
      defPct: w.defToFuelRatioPct, defFlag: w.defRatioFlag, window: w,
    }));
    return [...fillEvents, ...lossEvents, ...defEvents].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [fills, windows, pricePerL]);

  const matchesChip = (ev) => {
    switch (chip) {
      case 'needs-review': return ev.kind === 'loss' || ev.kind === 'def' || ev.billFlag || ev.confirmationStatus === 'ESTIMATED';
      case 'def': return ev.kind === 'def';
      case 'bill': return !!ev.billFlag;
      case 'loss': return ev.kind === 'loss';
      default: return true;
    }
  };

  const filteredEvents = useMemo(() => events.filter((ev) => {
    if (eventType !== 'all' && ev.kind !== eventType) return false;
    if (statusFilter !== 'all') {
      if (ev.kind !== 'fill' || ev.confirmationStatus !== statusFilter) return false;
    }
    return matchesChip(ev);
  }), [events, eventType, statusFilter, chip]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chart buckets (IST daily)
  const chartData = useMemo(() => {
    const buckets = {};
    const key = (ts) => toIST(ts)?.format('DD MMM');
    const b = (ts) => { const k = key(ts); if (!k) return null; if (!buckets[k]) buckets[k] = { day: k, volume: 0, loss: 0, events: 0, def: 0, _t: toIST(ts).valueOf() }; return buckets[k]; };
    fills.forEach((f) => { const x = b(f.at); if (x) { x.volume += f.litres || 0; x.events += 1; } });
    windows.forEach((w) => {
      if (w.siphonSuspected) { const x = b(w.windowTo); if (x) { x.loss += Math.max(0, w.unaccountedLossL || 0); x.events += 1; } }
      if (w.defRatioFlag) { const x = b(w.windowTo); if (x) x.def += 1; }
    });
    return Object.values(buckets)
      .sort((a, z) => a._t - z._t)
      .map((x) => ({ ...x, volume: Math.round(x.volume * 10) / 10, loss: Math.round(x.loss * 10) / 10 }));
  }, [fills, windows]);

  // Anomaly breakdown — most affected vehicles
  const affected = useMemo(() => {
    const list = (summary?.vehicles || [])
      .map((v) => ({ reg: v.registrationNumber, anomalies: (v.defFlagCount || 0) + (v.billFlagCount || 0), def: v.defFlagCount || 0, bill: v.billFlagCount || 0 }))
      .filter((v) => v.anomalies > 0)
      .sort((a, z) => z.anomalies - a.anomalies)
      .slice(0, 5);
    const max = list[0]?.anomalies || 1;
    return { list, max };
  }, [summary]);

  // Vehicle risk table (sorted highest risk first)
  const riskVehicles = useMemo(() => {
    return (summary?.vehicles || [])
      .map((v) => ({ ...v, risk: computeRisk(v) }))
      .sort((a, z) => RISK_RANK[z.risk] - RISK_RANK[a.risk] || (z.defFlagCount || 0) - (a.defFlagCount || 0));
  }, [summary]);

  const metric = METRICS.find((m) => m.key === chartMetric) || METRICS[0];

  // Drill-down data
  const drillWindows = useMemo(() => windows.filter((w) => w.registrationNumber === drillVehicle), [windows, drillVehicle]);
  const drillFills = useMemo(() => fills.filter((f) => f.registrationNumber === drillVehicle), [fills, drillVehicle]);
  const drillChartData = useMemo(() => {
    const buckets = {};
    const bucketFor = (ts) => { const k = toIST(ts)?.format('DD MMM'); if (!k) return null; if (!buckets[k]) buckets[k] = { day: k, fills: 0, loss: 0 }; return buckets[k]; };
    drillFills.forEach((f) => { const x = bucketFor(f.at); if (x) x.fills += f.litres || 0; });
    drillWindows.forEach((w) => { if (!w.siphonSuspected) return; const x = bucketFor(w.windowTo); if (x) x.loss += Math.max(0, w.unaccountedLossL || 0); });
    return Object.values(buckets).map((x) => ({ ...x, fills: Math.round(x.fills * 10) / 10, loss: Math.round(x.loss * 10) / 10 }));
  }, [drillFills, drillWindows]);

  const openEvent = (ev) => {
    if (ev.kind === 'fill') {
      const sameVeh = fills.filter((f) => f.registrationNumber === ev.vehicle).sort((a, b) => new Date(b.at) - new Date(a.at));
      const idx = sameVeh.findIndex((f) => `fill-${f._id}` === ev.id);
      const previousFill = idx >= 0 && sameVeh[idx + 1] ? sameVeh[idx + 1].litres : null;
      const vals = sameVeh.map((f) => f.litres).filter((n) => n != null);
      const averageFill = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : null;
      setInvestigateEvent({ ...ev, _ctx: { previousFill, averageFill, timestampLabel: formatRelativeIST(ev.at), fuelPriceInrPerL: pricePerL } });
    } else {
      setEvidenceWindow(ev.window);
    }
  };

  // Banner state
  const bannerState = lossL > 0 ? 'crit' : billCount > 0 ? 'warn' : 'ok';
  const bannerMeta = {
    ok: { Icon: ShieldCheck, title: 'Fuel integrity healthy', msg: 'No unexplained fuel loss detected in the selected period.' },
    warn: { Icon: ShieldAlert, title: 'Fuel integrity — needs attention', msg: `${billCount} bill mismatch${billCount === 1 ? '' : 'es'} require review.` },
    crit: { Icon: AlertTriangle, title: 'Fuel integrity — critical', msg: `${formatLitres(lossL)} unexplained loss (~${formatINR(lossL * pricePerL)}) — investigate now.` },
  }[bannerState];
  const bannerColor = bannerState === 'crit' ? 'var(--critical)' : bannerState === 'warn' ? 'var(--caution)' : 'var(--ok)';

  const chipDefs = [
    { key: 'all', label: 'All', count: events.length },
    { key: 'needs-review', label: 'Needs review', count: events.filter((e) => e.kind === 'loss' || e.kind === 'def' || e.billFlag || e.confirmationStatus === 'ESTIMATED').length },
    { key: 'def', label: 'DEF flags', count: events.filter((e) => e.kind === 'def').length },
    { key: 'bill', label: 'Bill mismatch', count: events.filter((e) => e.billFlag).length },
    { key: 'loss', label: 'Unexplained loss', count: events.filter((e) => e.kind === 'loss').length },
  ];

  return (
    <div className={embedded ? 'fleet-embedded' : 'page-white'}>
    <div className="space-y-5" style={embedded ? undefined : { maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Embedded: FuelHub owns the title; Refresh and last-synced stay. */}
        {!embedded && (
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--gnb-400) 12%, transparent)', color: 'var(--gnb-400)' }}>
              <Fuel size={22} />
            </span>
            <div>
              <h1 className="cluster-title text-2xl">Fuel Integrity</h1>
              <p className="text-dim text-sm">Monitor fuel usage, anomalies and suspected losses</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {lastSynced && <span className="text-dim hidden text-xs sm:inline">Last synced {lastSynced.fromNow()}</span>}
          <button className="ov-btn" onClick={fetchData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="fi-banner fi-banner--crit">
          <span className="fi-banner-icon" style={{ background: 'color-mix(in srgb, var(--critical) 12%, transparent)', color: 'var(--critical)' }}><AlertTriangle size={20} /></span>
          <div><div className="fi-banner-title">Could not load data</div><p className="text-dim text-sm">{error}</p></div>
        </div>
      )}

      {/* Fleet integrity status banner */}
      <div className={`fi-banner fi-banner--${bannerState}`}>
        <span className="fi-banner-icon" style={{ background: `color-mix(in srgb, ${bannerColor} 12%, transparent)`, color: bannerColor }}>
          <bannerMeta.Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="fi-banner-title">{bannerMeta.title}</div>
          <p className="text-dim mt-0.5 text-sm">
            {bannerMeta.msg}
            {defCount > 0 && <span> · <span style={{ color: 'var(--caution)', fontWeight: 600 }}>{defCount} DEF-related anomalies require review.</span></span>}
          </p>
        </div>
        {defCount > 0 && (
          <button className="ov-btn shrink-0" onClick={() => { setChip('def'); document.getElementById('fi-events')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Review DEF flags <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi icon={Fuel} label="Total Fills" value={formatLitres(totals?.fillsLitres)} sub={summary ? `over ${dayjs(summary.window?.to).diff(dayjs(summary.window?.from), 'day')} days` : ''} accent="var(--gnb-400)" />
        <Kpi icon={TrendingDown} label="Unexplained Loss" value={formatLitres(lossL)} sub="please review" accent="var(--critical)" emphasis={lossL > 0} />
        <Kpi icon={Wallet} label="Est. Loss Value" value={formatINR(totals?.siphonSuspectedLossInr)} sub={`at ₹${pricePerL}/L (est.)`} accent="var(--critical)" emphasis={(totals?.siphonSuspectedLossInr || 0) > 0} />
        <Kpi icon={FileWarning} label="Flagged Bills" value={billCount} sub="bill vs tank mismatch" accent="var(--caution)" emphasis={billCount > 0} />
        <Kpi icon={Droplets} label="DEF Flags" value={defCount} sub="AdBlue ratio off" accent="var(--caution)" emphasis={defCount > 0} />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          eyebrow="Fuel activity"
          question="Volume, loss and anomalies over time"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="ov-seg" role="group" aria-label="Metric">
                {METRICS.map((m) => (
                  <button key={m.key} type="button" aria-pressed={chartMetric === m.key} onClick={() => setChartMetric(m.key)}>{m.label}</button>
                ))}
              </div>
              <div className="ov-seg" role="group" aria-label="Range">
                {[7, 30, 90].map((d) => (
                  <button key={d} type="button" aria-pressed={rangeDays === d} onClick={() => applyRange(d)}>{d}D</button>
                ))}
              </div>
            </div>
          }
        >
          {isLoading ? (
            <div className="ov-inset h-[260px] animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="text-dim flex h-[260px] items-center justify-center text-sm">No fuel activity in this window.</div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={metric.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} stroke="var(--cluster-text-dim)" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--cluster-text-dim)" unit={metric.unit} width={44} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--hairline)', background: 'var(--cluster-panel)', fontSize: 12 }}
                    formatter={(v) => [`${v}${metric.unit}`, metric.label]}
                  />
                  <Area type="monotone" dataKey={metric.key} stroke={metric.color} strokeWidth={2} fill="url(#fiGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Anomaly breakdown" question="What kind of anomaly, and where?">
          <div className="grid grid-cols-3 gap-2">
            <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
              <span className="num text-xl font-bold" style={{ color: defCount > 0 ? 'var(--caution)' : 'var(--cluster-text)' }}>{defCount}</span>
              <span className="text-dim text-[10px] uppercase tracking-wide">DEF flags</span>
            </div>
            <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
              <span className="num text-xl font-bold" style={{ color: billCount > 0 ? 'var(--caution)' : 'var(--cluster-text)' }}>{billCount}</span>
              <span className="text-dim text-[10px] uppercase tracking-wide">Bill mism.</span>
            </div>
            <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
              <span className="num text-xl font-bold" style={{ color: lossL > 0 ? 'var(--critical)' : 'var(--cluster-text)' }}>{formatLitres(lossL)}</span>
              <span className="text-dim text-[10px] uppercase tracking-wide">Loss</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-dim mb-1 text-[11px] font-semibold uppercase tracking-wide">Most affected vehicles</div>
            {affected.list.length === 0 ? (
              <div className="text-dim py-4 text-center text-xs">No anomalies attributed to any vehicle.</div>
            ) : (
              affected.list.map((v) => (
                <button key={v.reg} className="fi-affected w-full text-left" onClick={() => setDrillVehicle(v.reg)} title={`${v.def} DEF · ${v.bill} bill`}>
                  <VehicleLink reg={v.reg} />
                  <span className="fi-affected-track">
                    <span className="fi-affected-fill" style={{ width: `${(v.anomalies / affected.max) * 100}%`, background: 'var(--caution)' }} />
                  </span>
                  <span className="num w-6 text-right text-sm font-bold" style={{ color: 'var(--caution)' }}>{v.anomalies}</span>
                </button>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Investigation toolbar */}
      <div className="fi-toolbar flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="fi-field fi-field--grow">
            <Search size={16} className="text-dim" />
            <input
              type="text" placeholder="Search vehicle (e.g. WB25R9540)…"
              value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              style={{ flex: 1 }}
            />
          </div>
          <div className="fi-field"><input type="date" title="From" value={inputFromDate} onChange={(e) => setInputFromDate(e.target.value)} /></div>
          <span className="text-dim">–</span>
          <div className="fi-field"><input type="date" title="To" value={inputToDate} onChange={(e) => setInputToDate(e.target.value)} /></div>
          <div className="fi-field"><select value={eventType} onChange={(e) => setEventType(e.target.value)} aria-label="Event type">
            <option value="all">All events</option><option value="fill">Fills</option><option value="loss">Losses</option><option value="def">DEF anomalies</option>
          </select></div>
          <div className="fi-field"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
            <option value="all">Any status</option><option value="ESTIMATED">Estimated</option><option value="CONFIRMED">Confirmed</option><option value="REJECTED">Rejected</option>
          </select></div>
          <button className="ov-btn ov-btn--primary" onClick={applyFilter}>Apply</button>
          <button className="ov-btn" onClick={resetFilters}><X size={14} /> Reset</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chipDefs.map((c) => (
            <button key={c.key} className="fi-chip" aria-pressed={chip === c.key} onClick={() => setChip(c.key)}>
              {c.label}<span className="fi-chip-count">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent fuel events */}
      <Panel id="fi-events" eyebrow="Recent fuel events" question="Which event should I investigate first?" action={<span className="text-dim text-xs">{filteredEvents.length} events · newest first</span>}>
        {isLoading ? (
          <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <div key={i} className="ov-inset h-11 animate-pulse" />)}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-dim py-10 text-center text-sm">No events match these filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="ov-table">
                <thead>
                  <tr>
                    <th>Vehicle</th><th>Event</th><th>Time</th>
                    <th className="text-right">Fuel volume</th><th className="text-right">Est. value</th>
                    <th>Location</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageEvents.map((ev) => {
                    const flagged = ev.kind === 'loss' || ev.kind === 'def' || ev.billFlag;
                    const crit = ev.kind === 'loss';
                    const isRev = reviewed.has(ev.id);
                    return (
                      <tr key={ev.id} className={`fi-row-click ${crit ? 'fi-row-crit' : flagged ? 'fi-row-flag' : ''}`} onClick={() => openEvent(ev)}>
                        <td><VehicleLink reg={ev.vehicle} /></td>
                        <td>
                          {ev.kind === 'fill' && <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--ok)' }}><TrendingUp size={13} /> Fill</span>}
                          {ev.kind === 'loss' && <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--critical)' }}><TrendingDown size={13} /> Loss</span>}
                          {ev.kind === 'def' && <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--caution)' }}><Droplets size={13} /> DEF</span>}
                        </td>
                        <td className="num text-dim" title={formatIST(ev.at)}>{formatRelativeIST(ev.at) || '—'}</td>
                        <td className="num text-right font-semibold" style={{ color: ev.kind === 'loss' ? 'var(--critical)' : ev.kind === 'fill' ? 'var(--ok)' : 'var(--cluster-text-dim)' }}>
                          {ev.kind === 'def' ? (ev.defPct != null ? `${ev.defPct}%` : '—') : `${ev.kind === 'loss' ? '−' : '+'}${formatLitres(Math.abs(ev.litres ?? 0))}`}
                        </td>
                        <td className="num text-right text-dim">{ev.inr != null ? formatINR(ev.inr) : '—'}</td>
                        <td>
                          {ev.lat != null && ev.lng != null ? (
                            <a href={mapsLink(ev.lat, ev.lng)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--gnb-400)' }}><MapPin size={12} /> Map</a>
                          ) : <span className="text-dim text-xs">—</span>}
                        </td>
                        <td>
                          {isRev ? <StatusPill tone="ok">Reviewed</StatusPill>
                            : ev.kind === 'fill' ? (
                              ev.billFlag ? <StatusPill tone="caution">Review</StatusPill>
                                : ev.confirmationStatus === 'CONFIRMED' ? <StatusPill tone="ok">Confirmed</StatusPill>
                                  : ev.confirmationStatus === 'REJECTED' ? <StatusPill tone="inert">Rejected</StatusPill>
                                    : <StatusPill tone="caution">Estimated</StatusPill>
                            ) : ev.kind === 'loss' ? <StatusPill tone="critical">Suspected</StatusPill>
                              : <StatusPill tone="caution">DEF {ev.defFlag?.toLowerCase?.() || 'flag'}</StatusPill>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-dim text-xs">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button className="ov-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={page === 1 ? { opacity: 0.5 } : undefined}>Prev</button>
                  <button className="ov-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={page === totalPages ? { opacity: 0.5 } : undefined}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>

      {/* Vehicle integrity */}
      <Panel eyebrow="Vehicle integrity" question="Which vehicles carry the most risk?" action={<span className="text-dim text-xs">sorted by risk</span>}>
        {isLoading ? (
          <div className="ov-inset h-40 animate-pulse" />
        ) : riskVehicles.length === 0 ? (
          <div className="text-dim py-10 text-center text-sm">No fuel data in this window.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Vehicle</th><th className="text-right">Fuel</th><th className="text-right">Unexpl. loss</th>
                  <th className="text-right">Est. loss</th><th className="text-right">DEF flags</th><th className="text-right">Bill issues</th>
                  <th>Risk</th><th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {riskVehicles.map((v) => (
                  <tr key={v.registrationNumber} className="fi-row-click" onClick={() => setDrillVehicle(v.registrationNumber)}>
                    <td><VehicleLink reg={v.registrationNumber} /></td>
                    <td className="num text-right">{formatLitres(v.fillsLitres)}</td>
                    <td className="num text-right" style={{ color: v.siphonSuspectedLossL > 0 ? 'var(--critical)' : 'var(--cluster-text-dim)' }}>{formatLitres(v.siphonSuspectedLossL)}</td>
                    <td className="num text-right" style={{ color: v.siphonSuspectedLossInr > 0 ? 'var(--critical)' : 'var(--cluster-text-dim)' }}>{formatINR(v.siphonSuspectedLossInr)}</td>
                    <td className="text-right">
                      {v.defFlagCount > 0 ? <span className="ov-pill ov-pill--caution">{v.defFlagCount}</span> : <span className="num text-dim">0</span>}
                    </td>
                    <td className="text-right">
                      {v.billFlagCount > 0 ? <span className="ov-pill ov-pill--caution">{v.billFlagCount}</span> : <span className="num text-dim">0</span>}
                    </td>
                    <td><StatusPill tone={RISK_TONE[v.risk]}>{v.risk}</StatusPill></td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--gnb-400)' }}>Drill down <ChevronRight size={13} /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Per-vehicle drill-down */}
      {drillVehicle && !isLoading && (
        <Panel
          eyebrow={`${drillVehicle} — fuel timeline`}
          question="Daily fills vs suspected losses"
          action={<button className="ov-btn" onClick={() => setDrillVehicle(null)}><ArrowLeft size={14} /> Close</button>}
        >
          {drillChartData.length > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drillChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--cluster-text-dim)" />
                  <YAxis tick={{ fontSize: 12 }} unit=" L" stroke="var(--cluster-text-dim)" />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--hairline)', background: 'var(--cluster-panel)', fontSize: 12 }} formatter={(value, name) => [`${value} L`, name === 'fills' ? 'Fills ▲' : 'Suspected loss ▼']} />
                  <Legend formatter={(value) => (value === 'fills' ? 'Fills ▲' : 'Suspected loss ▼')} />
                  <Bar dataKey="fills" fill="var(--ok)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loss" fill="var(--critical)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-dim py-6 text-center text-sm">No chart data for this vehicle in the window.</div>
          )}

          <div className="mt-4">
            <div className="text-dim mb-2 text-[11px] font-semibold uppercase tracking-wide">Mass-balance windows</div>
            <div className="overflow-x-auto">
              <table className="ov-table">
                <thead>
                  <tr>
                    <th>Window</th><th className="text-right">Fills</th><th className="text-right">Engine burn</th>
                    <th className="text-right">Tank Δ</th><th className="text-right">Unaccounted</th><th>Review</th><th className="text-right">DEF %</th><th aria-label="Working" />
                  </tr>
                </thead>
                <tbody>
                  {drillWindows.map((w) => (
                    <tr key={w._id}>
                      <td className="num text-dim">{toIST(w.windowFrom)?.format('DD MMM') || '—'} → {toIST(w.windowTo)?.format('DD MMM YY') || '—'}</td>
                      <td className="num text-right">{w.fillsLitres ?? '—'}</td>
                      <td className="num text-right">{w.engineBurnL ?? '—'}</td>
                      <td className="num text-right">{w.tankDeltaL ?? '—'}</td>
                      <td className="num text-right" style={{ color: w.unaccountedLossL > 0 ? 'var(--critical)' : 'var(--cluster-text-dim)' }}>
                        {w.unaccountedLossL ?? '—'}{w.unaccountedLossPct != null && <span className="text-dim"> ({w.unaccountedLossPct}%)</span>}
                      </td>
                      <td>{w.siphonSuspected ? <StatusPill tone="caution">Review · {(w.siphonConfidence || 'low').toLowerCase()}</StatusPill> : <StatusPill tone="ok">OK</StatusPill>}</td>
                      <td className="text-right">
                        {w.defRatioFlag ? <span className="ov-pill ov-pill--caution">{w.defToFuelRatioPct ?? '—'}%</span> : <span className="num text-dim">{w.defToFuelRatioPct != null ? `${w.defToFuelRatioPct}%` : '—'}</span>}
                      </td>
                      <td className="text-right">
                        <button className="ov-btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setEvidenceWindow(w); }}>Show working</button>
                      </td>
                    </tr>
                  ))}
                  {drillWindows.length === 0 && <tr><td colSpan="8" className="text-dim py-6 text-center text-sm">No mass-balance windows for this vehicle.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      <EvidenceDrawer open={!!evidenceWindow} onClose={() => setEvidenceWindow(null)} window={evidenceWindow} context={{ fuelPriceInrPerL: pricePerL }} />
      <EventInvestigationDrawer
        open={!!investigateEvent}
        onClose={() => setInvestigateEvent(null)}
        event={investigateEvent}
        context={investigateEvent?._ctx || {}}
        reviewed={investigateEvent ? reviewed.has(investigateEvent.id) : false}
        onMarkReviewed={markReviewed}
      />
    </div>
    </div>
  );
};

export default FuelIntegrityPage;
