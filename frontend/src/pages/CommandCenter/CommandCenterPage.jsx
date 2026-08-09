import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Truck,
  Users,
  Route,
  Gauge,
  Fuel,
  Receipt,
  Banknote,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CommandCenterService } from './CommandCenterService.jsx';

/* ─────────────────────────────────────────────────────────────────────────────
   Palette

   Categorical slots are validated (lightness band, chroma floor, adjacent-pair
   CVD separation, normal-vision floor, contrast vs surface) — do not swap a hue
   here without re-running the check. `signal.*` is the reserved status scale and
   is never reused as a series color; every status mark also carries a text label
   so identity is never colour-alone.

   `pipeline` is a sequential ramp (one hue, light → dark) because the trip
   stages are ordered. It is not a categorical set.

   The lead hue is the app primary (--primary-color, #4f46e5) so this page reads
   as part of the product rather than as the separate teal "console" language.
   It is hardcoded rather than read from the themeable CSS variable on purpose:
   these are data marks, and an arbitrary user-picked hue cannot be checked for
   CVD separation against its neighbours ahead of time.
   ────────────────────────────────────────────────────────────────────────── */
const C = {
  ink: '#0e1726',
  inkSoft: '#1b2535',
  muted: '#8b93a7',
  grid: '#e8ecf3',
  cat: ['#4f46e5', '#b0479b'],
  catSoft: '#eeecfd',
  signal: { good: '#0f8b6c', warn: '#f2a413', critical: '#e5484d' },
  pipeline: ['#c7c3f7', '#a9a3f2', '#8b83ed', '#6f68e9', '#544be6', '#3f37c4'],
};

const PIPELINE_STAGES = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'TRIP_CLOSED', label: 'Trip closed' },
  { key: 'POD_RECEIVED', label: 'POD received' },
  { key: 'UNLOADED', label: 'Unloaded' },
  { key: 'BILLED', label: 'Billed' },
];

/* ── Formatters ───────────────────────────────────────────────────────────── */
const inr = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

// Hero numbers only: full precision stays in the tooltips and the detail rows.
const compactInr = (v) => {
  const n = Math.abs(v || 0);
  if (n >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(v / 1e3).toFixed(1)}k`;
  return inr(v);
};

const num = (v) => new Intl.NumberFormat('en-IN').format(v || 0);

const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

/* ── Primitives ───────────────────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 pb-3">
    <h2 className="console-eyebrow shrink-0">{children}</h2>
    <div className="h-px flex-1" style={{ background: C.grid }} />
  </div>
);

/**
 * Header bar *inside* a panel card.
 *
 * The two body columns previously carried their headings outside the cards, as
 * grid siblings — so the rules and the corner links ran together into one line
 * ("ORDER TO CASH — ERP Home  FLEET — Fleet Operations") and it was impossible
 * to tell which link belonged to which column. Bounding each heading inside its
 * own card makes the ownership obvious.
 */
const PanelHeader = ({ title, to, linkLabel }) => (
  <div
    className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
    style={{ borderColor: C.grid }}
  >
    <h2 className="console-eyebrow">{title}</h2>
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold hover:underline"
      style={{ color: C.cat[0] }}
    >
      {linkLabel}
      <ArrowRight size={13} />
    </Link>
  </div>
);

/**
 * One trip stage.
 *
 * This replaced a horizontal bar chart. At real ERP volumes the counts are 0–3,
 * and a bar chart fails badly there: a zero-count stage draws no mark at all
 * (so four of six stages looked like empty rows), while a max of 1 makes the
 * surviving bars span the full width, reading as "everything is placed". A
 * count this small is a number, not a length — so show the number, and keep the
 * sequential ramp as a stage-order cue on the rule above it.
 */
const StageCell = ({ label, count, color }) => (
  <div
    className="rounded-lg border px-3 py-2.5"
    style={{ borderColor: C.grid, background: count > 0 ? '#fff' : '#fafbfd' }}
  >
    <div
      className="h-[3px] w-7 rounded-full"
      style={{ background: count > 0 ? color : C.grid }}
    />
    <div
      className="num pt-2 text-[22px] font-semibold leading-none"
      style={{ color: count > 0 ? C.ink : '#c3cad8' }}
    >
      {count}
    </div>
    <div className="whitespace-nowrap pt-1 text-[11.5px] font-medium" style={{ color: C.muted }}>
      {label}
    </div>
  </div>
);

/**
 * Headline metric.
 *
 * Prominence comes from the type scale and a thin status accent, not from a
 * heavy filled panel — a near-black slab dominated the page and fought the
 * white cards below it. `tone` is only set when the metric actually carries a
 * status (money overdue, approvals waiting); otherwise the accent stays the
 * neutral house teal so colour keeps meaning something.
 */
const HeroMetric = ({ icon: Icon, label, value, sub, tone }) => (
  <div className="relative flex-1 px-5 py-4 sm:px-6">
    <span
      className="absolute left-5 top-0 h-[3px] w-8 rounded-b sm:left-6"
      style={{ background: tone || C.cat[0] }}
      aria-hidden="true"
    />
    <div className="flex items-center gap-2 pb-2 pt-1">
      {Icon && <Icon size={14} strokeWidth={2.5} style={{ color: tone || C.cat[0] }} />}
      <span
        className="font-display text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: C.muted }}
      >
        {label}
      </span>
    </div>
    <div
      className="num text-[26px] font-semibold leading-none sm:text-[30px]"
      style={{ color: C.ink }}
    >
      {value}
    </div>
    {sub && (
      <div className="num pt-1.5 text-[12px]" style={{ color: tone || C.muted }}>
        {sub}
      </div>
    )}
  </div>
);

/** Small stat tile on a white surface. */
const Tile = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border p-3.5" style={{ borderColor: C.grid, background: '#fff' }}>
    <div className="flex items-center gap-1.5 pb-1.5">
      {Icon && <Icon size={13} strokeWidth={2.5} style={{ color: C.muted }} />}
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
        {label}
      </span>
    </div>
    <div className="num text-[20px] font-semibold leading-none" style={{ color: C.ink }}>
      {value}
    </div>
    {sub && (
      <div className="num pt-1 text-[11.5px]" style={{ color: C.muted }}>
        {sub}
      </div>
    )}
  </div>
);

/**
 * Segmented proportion bar + legend.
 *
 * Segments are separated by a 2px surface gap rather than sitting flush, so
 * adjacent fills stay readable. Each legend row states its own label and value,
 * so the split is never communicated by colour alone.
 */
const ProportionBar = ({ segments, total, formatValue = num, emptyLabel = 'Nothing outstanding' }) => {
  const sum = total ?? segments.reduce((a, s) => a + (s.value || 0), 0);

  if (!sum) {
    return (
      <div className="py-2">
        <div className="h-2.5 w-full rounded-full" style={{ background: C.grid }} />
        <p className="pt-3 text-[12.5px]" style={{ color: C.muted }}>
          {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              title={`${s.label}: ${formatValue(s.value)}`}
              style={{ width: `${pct(s.value, sum)}%`, background: s.color, minWidth: 3 }}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-col gap-1.5 pt-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span style={{ color: C.inkSoft }}>{s.label}</span>
            <span className="num ml-auto font-semibold" style={{ color: C.ink }}>
              {formatValue(s.value)}
            </span>
            <span className="num w-11 text-right" style={{ color: C.muted }}>
              {pct(s.value, sum).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Action-queue row: a count that links to where the work gets done. */
const QueueChip = ({ label, count, to, urgent }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-slate-50"
    style={{ borderColor: C.grid }}
  >
    <span
      className="num inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-[13px] font-bold"
      style={{
        // A pending count is not a "good" outcome, so it wears the brand hue,
        // not the status-green. Green here is reserved for genuine good state.
        background: count > 0 ? (urgent ? '#fdecec' : C.catSoft) : '#f1f3f7',
        color: count > 0 ? (urgent ? C.signal.critical : C.cat[0]) : C.muted,
      }}
    >
      {num(count)}
    </span>
    <span className="text-[13px] font-medium" style={{ color: C.inkSoft }}>
      {label}
    </span>
    <ArrowRight
      size={14}
      className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      style={{ color: C.muted }}
    />
  </Link>
);

const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';

const VarianceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg"
      style={{ background: C.ink, border: `1px solid ${C.inkSoft}` }}
    >
      <p
        className="font-display text-[11px] uppercase tracking-wider"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        {shortDate(label)}
      </p>
      <p className="num text-[15px] font-semibold text-white">
        {(payload[0].value || 0).toFixed(2)} km/L
      </p>
    </div>
  );
};

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
const PageSkeleton = () => (
  <div className="space-y-6 p-3 sm:p-5">
    <Skeleton className="h-9 w-64" />
    <Skeleton className="h-28 w-full rounded-2xl" />
    <div className="grid gap-5 xl:grid-cols-2">
      <Skeleton className="h-80 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-52 w-full rounded-2xl" />
      ))}
    </div>
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────────────── */

const RANGE_OPTIONS = [
  { value: 7, label: '7D' },
  { value: 14, label: '14D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

const CommandCenterPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedOnce = useRef(false);

  const fetchData = useCallback(async () => {
    if (!hasLoadedOnce.current) setIsLoading(true);
    else setIsFetching(true);
    setError(null);
    try {
      const result = await CommandCenterService.load({ days });
      setData(result);
      setLastUpdated(new Date());
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err?.detail || 'Could not load the overview. Please try again.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={30} className="text-red-500" />
        </div>
        <p className="text-lg font-bold" style={{ color: C.ink }}>
          Something went wrong
        </p>
        <p className="max-w-md text-sm" style={{ color: C.muted }}>
          {error}
        </p>
        <button
          onClick={fetchData}
          className="mt-1 rounded-lg px-5 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: C.cat[0] }}
        >
          Try again
        </button>
      </div>
    );
  }

  const erp = data?.erp;
  const fleet = data?.fleet;
  const fuel = data?.fuel;
  const fin = data?.financials?.summary;

  const pending = erp?.pendingCounts;
  const money = erp?.financials;
  const activeTrips = pending?.activeTrips || {};

  const pipelineData = PIPELINE_STAGES.map((s) => ({
    label: s.label,
    count: activeTrips[s.key] || 0,
  }));

  // "In flight" = everything raised but not yet billed out.
  const tripsInFlight = PIPELINE_STAGES.filter((s) => s.key !== 'BILLED').reduce(
    (a, s) => a + (activeTrips[s.key] || 0),
    0,
  );

  const hasVarianceTrend = (fuel?.dailyVariance?.length || 0) > 1;

  const receivablesOutstanding = money?.receivablesOutstanding || 0;
  const receivablesOverdue = money?.receivablesOverdue || 0;
  const receivablesCurrent = Math.max(0, receivablesOutstanding - receivablesOverdue);
  const podAgeing = pending?.podAgeing || {};

  return (
    <div className="min-h-screen w-full space-y-6 p-3 font-sans antialiased sm:p-5">
      {isFetching && (
        <div className="fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden">
          <div
            className="h-full w-full animate-pulse"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, #4f46e5 30%, #8b83ed 50%, #4f46e5 70%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold leading-tight" style={{ color: C.ink }}>
            Overview
          </h1>
          <p className="pt-1 text-[13.5px]" style={{ color: C.muted }}>
            Order-to-cash and the fleet behind it, in one view
            {lastUpdated && (
              <>
                {' · '}
                <span className="num" style={{ color: C.cat[0] }}>
                  as of{' '}
                  {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <CalendarDays size={16} strokeWidth={2.5} className="shrink-0" style={{ color: C.muted }} />
          {isFetching && <RefreshCw size={13} className="animate-spin" style={{ color: C.cat[0] }} />}
          <div
            className="flex items-center gap-0.5 rounded-lg p-0.5"
            style={{ background: '#eef1f6' }}
            role="group"
            aria-label="Date range for fleet metrics"
          >
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setDays(o.value)}
                aria-pressed={days === o.value}
                className="num rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                style={
                  days === o.value
                    ? { background: '#fff', color: C.ink, boxShadow: '0 1px 2px rgba(15,23,42,0.08)' }
                    : { color: C.muted }
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="rounded-lg border p-2 transition-colors hover:bg-slate-50"
            style={{ borderColor: C.grid }}
            aria-label="Refresh"
          >
            <RefreshCw size={14} style={{ color: C.muted }} />
          </button>
        </div>
      </div>

      {/* ── Hero band: the four numbers worth interrupting someone for ── */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ background: '#fff', borderColor: C.grid, boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col divide-y divide-slate-100 sm:flex-row sm:divide-x sm:divide-y-0">
          <HeroMetric
            icon={Receipt}
            label="Receivables"
            value={compactInr(receivablesOutstanding)}
            sub={
              receivablesOverdue > 0
                ? `${compactInr(receivablesOverdue)} overdue`
                : 'Nothing overdue'
            }
            tone={receivablesOverdue > 0 ? C.signal.critical : undefined}
          />
          <HeroMetric
            icon={Banknote}
            label="Payables due"
            value={compactInr(money?.payablesDue)}
            sub={`${compactInr(money?.unadjustedReceipts)} unadjusted receipts`}
          />
          <HeroMetric
            icon={Route}
            label="Trips in flight"
            value={num(tripsInFlight)}
            sub={`${num(pending?.pendingApprovals)} approvals waiting`}
            tone={pending?.pendingApprovals > 0 ? C.signal.warn : undefined}
          />
          <HeroMetric
            icon={Truck}
            label="Vehicles on trip"
            value={num(fleet?.vehicles?.onTrip)}
            sub={`of ${num(fleet?.vehicles?.total)} in fleet`}
          />
        </div>
      </div>

      {/* ── Two-column body ──
          h-full + flex-col on the cards so each one fills its stretched grid
          cell; otherwise the shorter column ends early and leaves a large dead
          gap under it. */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* ERP / order-to-cash */}
        <Card className="flex h-full flex-col gap-0 border-0 py-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <PanelHeader title="Order to cash" to="/erp" linkLabel="ERP Home" />
          <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
            {data?.erpFailed ? (
              <p className="py-8 text-center text-[13px]" style={{ color: C.muted }}>
                ERP figures are unavailable for this account.
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between pb-2.5">
                  <p
                    className="text-[12px] font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}
                  >
                    Trips by stage
                  </p>
                  <p className="num text-[12px]" style={{ color: C.muted }}>
                    {num(tripsInFlight)} in flight
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {pipelineData.map((d, i) => (
                    <StageCell key={d.label} label={d.label} count={d.count} color={C.pipeline[i]} />
                  ))}
                </div>

                <p
                  className="pb-2.5 pt-5 text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}
                >
                  Waiting on you
                </p>
                <div className="grid flex-1 content-start gap-2 sm:grid-cols-2">
                  <QueueChip label="Approvals" count={pending?.pendingApprovals || 0} to="/erp/approvals" urgent />
                  <QueueChip label="Open delivery orders" count={pending?.dos || 0} to="/erp/pipeline" />
                  <QueueChip label="CNs to update" count={pending?.pendingCns || 0} to="/erp/pipeline" />
                  <QueueChip label="Trips to close" count={pending?.pendingTripClose || 0} to="/erp/pipeline" />
                  <QueueChip label="PODs pending" count={pending?.pendingPods || 0} to="/erp/pipeline" />
                  <QueueChip label="Unloadings" count={pending?.pendingUnloadings || 0} to="/erp/pipeline" />
                  <QueueChip label="Bills to submit" count={pending?.pendingBillSubmissions || 0} to="/erp/billing" />
                  <QueueChip label="Placements today" count={pending?.placementsToday || 0} to="/erp/pipeline" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fleet */}
        <Card className="flex h-full flex-col gap-0 border-0 py-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <PanelHeader
            title={`Fleet · last ${days} days`}
            to="/overview"
            linkLabel="Fleet Operations"
          />
          <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
            {data?.fleetFailed ? (
              <p className="py-8 text-center text-[13px]" style={{ color: C.muted }}>
                Fleet figures are unavailable for this account.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <Tile
                    icon={Truck}
                    label="Vehicles"
                    value={num(fleet?.vehicles?.total)}
                    sub={`${num(fleet?.vehicles?.active)} active`}
                  />
                  <Tile
                    icon={Users}
                    label="Drivers"
                    value={num(fleet?.drivers?.total)}
                    sub={`${num(fleet?.drivers?.active)} active`}
                  />
                  <Tile
                    icon={Route}
                    label="Trips"
                    value={num(fleet?.trips?.total)}
                    sub={`${num(fleet?.trips?.ongoing)} ongoing`}
                  />
                  <Tile
                    icon={Gauge}
                    label="Distance"
                    value={`${num(fleet?.kilometers?.total)} km`}
                  />
                </div>

                <p
                  className="pb-2.5 pt-4 text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}
                >
                  Fuel
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <Tile
                    icon={Fuel}
                    label="Consumed"
                    value={`${num(fleet?.fuel?.totalLitres)} L`}
                    sub={inr(fleet?.fuel?.totalCost)}
                  />
                  <Tile
                    label="Avg efficiency"
                    value={`${(fleet?.fuel?.avgKmpl || 0).toFixed(2)}`}
                    sub="km/L"
                  />
                  <Tile
                    label="Avg variance"
                    value={`${(fuel?.summary?.averageVariance || 0).toFixed(2)}`}
                    sub="km/L vs benchmark"
                  />
                  <Tile
                    label="Outliers"
                    value={num(fuel?.summary?.outlierCount)}
                    sub={`of ${num(fuel?.summary?.totalTrips)} trips`}
                  />
                </div>

                {/* Single series, so the heading names it and no legend box is
                    needed. Fills the column that used to run short. */}
                {hasVarianceTrend && (
                  <div className="flex flex-1 flex-col pt-4">
                    <p
                      className="pb-1 text-[12px] font-semibold uppercase tracking-wider"
                      style={{ color: C.muted }}
                    >
                      Efficiency variance trend
                    </p>
                    <div className="min-h-[132px] flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={fuel.dailyVariance}
                          margin={{ top: 8, right: 8, bottom: 0, left: -22 }}
                        >
                          <CartesianGrid stroke={C.grid} vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={shortDate}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: C.muted }}
                            minTickGap={24}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: C.muted }}
                            width={52}
                          />
                          <Tooltip
                            content={<VarianceTooltip />}
                            cursor={{ stroke: C.muted, strokeDasharray: '3 3' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="averageVariance"
                            stroke={C.cat[0]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Money detail ── */}
      <section>
        <SectionLabel>Where the money is sitting</SectionLabel>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-baseline justify-between pb-1">
                <h3 className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                  Receivables
                </h3>
                <span className="num text-[15px] font-semibold" style={{ color: C.ink }}>
                  {inr(receivablesOutstanding)}
                </span>
              </div>
              <ProportionBar
                total={receivablesOutstanding}
                formatValue={inr}
                emptyLabel="No outstanding receivables"
                segments={[
                  { label: 'Current', value: receivablesCurrent, color: C.signal.good },
                  { label: 'Overdue', value: receivablesOverdue, color: C.signal.critical },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-baseline justify-between pb-1">
                <h3 className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                  Payables
                </h3>
                <span className="num text-[15px] font-semibold" style={{ color: C.ink }}>
                  {inr(money?.payablesDue)}
                </span>
              </div>
              <ProportionBar
                total={money?.payablesDue}
                formatValue={inr}
                emptyLabel="No approved payables"
                segments={[
                  { label: 'Vendors', value: money?.vendorPayables || 0, color: C.cat[0] },
                  { label: 'Suppliers', value: money?.supplierPayables || 0, color: C.cat[1] },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-baseline justify-between pb-1">
                <h3 className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                  POD ageing
                </h3>
                <span className="num text-[15px] font-semibold" style={{ color: C.ink }}>
                  {num(pending?.pendingPods)}
                </span>
              </div>
              <ProportionBar
                total={pending?.pendingPods}
                emptyLabel="No PODs pending"
                segments={[
                  { label: 'Under 7 days', value: podAgeing.under7d || 0, color: C.signal.good },
                  { label: '7–14 days', value: podAgeing.from7to14d || 0, color: C.signal.warn },
                  { label: 'Over 14 days', value: podAgeing.over14d || 0, color: C.signal.critical },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Fleet P&L (only when the endpoint returned something) ── */}
      {fin && (
        <section>
          <SectionLabel>Fleet P&amp;L · last {days} days</SectionLabel>
          <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardContent className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:p-5">
              <Tile icon={TrendingUp} label="Revenue" value={inr(fin.totalRevenue)} />
              <Tile icon={TrendingDown} label="Expenses" value={inr(fin.totalExpenses)} />
              <div
                className="rounded-xl border p-3.5"
                style={{ borderColor: C.grid, background: '#fff' }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}
                >
                  Net profit
                </span>
                <div
                  className="num pt-1.5 text-[20px] font-semibold leading-none"
                  style={{ color: (fin.netProfit || 0) >= 0 ? C.signal.good : C.signal.critical }}
                >
                  {inr(fin.netProfit)}
                </div>
              </div>
              <Tile label="Margin" value={`${(fin.profitMargin || 0).toFixed(1)}%`} />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default CommandCenterPage;
