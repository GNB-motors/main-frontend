import { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  Globe,
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import RouteIntelligenceService from './RouteIntelligenceService';
import EmptyState from '../../components/cluster/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import {
  indexBuckets,
  colorForValue,
  opacityForSamples,
  p50Range,
  formatMinutes,
  formatHour12,
  formatHour24,
  istToUtc,
  computeCorridorInsights,
  SEQUENTIAL_RAMP,
  NO_DATA_COLOR,
  DOW_LABELS,
  DOW_FULL_LABELS,
} from './corridorTimeHeatmap.utils.js';

const HOURS_24 = Array.from({ length: 24 }, (_, h) => h);

const DAY_PARTS = [
  { name: 'Night', range: '00:00 – 06:00', icon: Moon, span: 6 },
  { name: 'Morning', range: '06:00 – 12:00', icon: Sunrise, span: 6 },
  { name: 'Afternoon', range: '12:00 – 18:00', icon: Sun, span: 6 },
  { name: 'Evening', range: '18:00 – 24:00', icon: Sunset, span: 6 },
];

/**
 * Enhanced Corridor Time-of-Day Heatmap & Operational Dispatch Intelligence.
 *
 * Visualizes travel-time distributions across hour-of-departure × day-of-week,
 * defaults to Indian Standard Time (IST, UTC+5:30) for dispatchers, and
 * surfaces optimal departure windows, congestion penalties, and planning buffers.
 */
export default function CorridorTimeHeatmap({ corridorId }) {
  const [timezone, setTimezone] = useState('IST'); // 'IST' | 'UTC'
  const [hourFormat, setHourFormat] = useState('12h'); // '12h' | '24h'
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const { data, loading, error } = useApi(
    (signal) => RouteIntelligenceService.corridorTimeProfile(corridorId, { signal }),
    [corridorId],
    { enabled: Boolean(corridorId) },
  );

  const buckets = useMemo(() => data?.buckets || [], [data]);
  const byKey = useMemo(() => indexBuckets(buckets), [buckets]);
  const { min, max } = useMemo(() => p50Range(buckets), [buckets]);
  const insights = useMemo(() => computeCorridorInsights(buckets), [buckets]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-800 flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
        <span>
          Hourly corridor time profile unavailable — the intelligence feed did not respond.
        </span>
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <EmptyState
        title="Insufficient corridor telemetry"
        hint="The travel-time profile populates automatically as vehicles complete transit trips along this corridor at different hours of the week."
        className="py-6"
      />
    );
  }

  // Active cell for the inspector: hovered cell takes priority, then clicked/selected, or defaults to optimal slot
  const activeInspector = hoveredCell || selectedCell;

  // Format hours for the window display in the active timezone
  const formatWindow = (windowObj) => {
    if (!windowObj) return '—';
    if (timezone === 'IST') {
      const startIst = (windowObj.startUtc + 6) % 24;
      const endIst = (windowObj.endUtc + 6) % 24;
      return `${formatHour12(startIst)} – ${formatHour12(endIst)} IST`;
    }
    return `${formatHour12(windowObj.startUtc)} – ${formatHour12(windowObj.endUtc)} UTC`;
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-900">
      {/* 1. Operational Insights Cards */}
      {insights.hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Optimal Departure Window */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 to-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Optimal Departure
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Fastest Slot
              </span>
            </div>
            <div className="mt-2 text-base font-extrabold text-slate-900 font-mono tracking-tight">
              {formatWindow(insights.optimalWindow)}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Avg {formatMinutes(insights.optimalWindow?.avgDurationMin)} ·{' '}
              <span className="font-semibold text-emerald-700">
                Save ~{formatMinutes(insights.optimalWindow?.savingsMin)}
              </span>{' '}
              vs peak
            </p>
          </div>

          {/* Peak Congestion Window */}
          <div className="relative overflow-hidden rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Peak Congestion
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                Bottleneck Risk
              </span>
            </div>
            <div className="mt-2 text-base font-extrabold text-slate-900 font-mono tracking-tight">
              {formatWindow(insights.peakWindow)}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Avg {formatMinutes(insights.peakWindow?.avgDurationMin)} ·{' '}
              <span className="font-semibold text-rose-700">
                +{insights.peakWindow?.penaltyPct}% delay risk
              </span>
            </p>
          </div>

          {/* SLA Buffer Spread */}
          <div className="relative overflow-hidden rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 to-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                Recommended SLA Buffer
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
                Traffic Delay Buffer
              </span>
            </div>
            <div className="mt-2 text-base font-extrabold text-slate-900 font-mono tracking-tight">
              +{formatMinutes(insights.avgBufferMin)}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Buffer recommended for{' '}
              <span className="font-semibold text-indigo-700">90% on-time</span> delivery SLA during
              peak hours
            </p>
          </div>

          {/* Weekly Reliability */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-slate-600" />
                Weekly Reliability
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                {insights.totalSamples} Trips
              </span>
            </div>
            <div className="mt-2 text-base font-extrabold text-slate-900 font-mono tracking-tight truncate">
              {insights.fastestDay || '—'}
            </div>
            <p className="mt-1 text-xs text-slate-600 truncate">
              Fastest overall day · Heavy traffic on{' '}
              <span className="font-semibold text-slate-800">{insights.slowestDay || '—'}</span>
            </p>
          </div>
        </div>
      )}

      {/* 2. Controls Toolbar: Timezone & Hour Format */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mr-1">
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span>Timezone:</span>
          </div>
          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTimezone('IST')}
              className={`px-3 py-1 rounded-md transition-all ${
                timezone === 'IST'
                  ? 'bg-white font-bold text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              IST (UTC+5:30){' '}
              <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 ml-1">
                Local
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTimezone('UTC')}
              className={`px-3 py-1 rounded-md transition-all ${
                timezone === 'UTC'
                  ? 'bg-white font-bold text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              UTC
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mr-1">
            <span>Clock:</span>
          </div>
          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setHourFormat('12h')}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                hourFormat === '12h'
                  ? 'bg-white font-bold text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setHourFormat('24h')}
              className={`px-2.5 py-0.5 rounded-md transition-all ${
                hourFormat === '24h'
                  ? 'bg-white font-bold text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24h
            </button>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Grid with Day-Part Header */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="min-w-[700px]">
          {/* Day Part Super-Headers */}
          <div className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 mb-1.5 items-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right pr-2">
              Slot
            </div>
            {DAY_PARTS.map((part) => {
              const Icon = part.icon;
              return (
                <div
                  key={part.name}
                  className="col-span-6 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-slate-100/80 border border-slate-200 text-[10px] font-semibold text-slate-700"
                >
                  <Icon className="h-3 w-3 text-slate-500" />
                  <span>{part.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono hidden md:inline">
                    ({part.range})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hour Column Labels */}
          <div className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 mb-1 text-center">
            <div />
            {HOURS_24.map((h) => {
              const label =
                hourFormat === '12h'
                  ? h === 0 || h === 12
                    ? h === 0
                      ? '12A'
                      : '12P'
                    : h < 12
                      ? `${h}A`
                      : `${h - 12}P`
                  : String(h).padStart(2, '0');
              return (
                <div
                  key={h}
                  className={`text-[9px] font-mono ${
                    h % 6 === 0 ? 'font-bold text-slate-700' : 'text-slate-400'
                  }`}
                  title={`${timezone === 'IST' ? 'IST' : 'UTC'} Hour ${h}:00`}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Heatmap Rows (DOW) */}
          <div className="flex flex-col gap-1">
            {DOW_LABELS.map((dayLabel, dow) => (
              <div
                key={dayLabel}
                className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 items-center"
              >
                <span className="text-right pr-2 text-xs font-semibold text-slate-700 font-mono">
                  {dayLabel}
                </span>
                {HOURS_24.map((colHour) => {
                  // If timezone is IST, calculate the corresponding UTC bucket
                  let bucketKey;
                  let displayUtcHour;
                  let displayUtcDOW;
                  if (timezone === 'IST') {
                    const mapped = istToUtc(colHour, dow);
                    displayUtcHour = mapped.utcHour;
                    displayUtcDOW = mapped.utcDow;
                    bucketKey = `${mapped.utcHour}_${mapped.utcDow}`;
                  } else {
                    displayUtcHour = colHour;
                    displayUtcDOW = dow;
                    bucketKey = `${colHour}_${dow}`;
                  }

                  const bucket = byKey.get(bucketKey);
                  const color = colorForValue(bucket?.p50Min ?? null, min, max);
                  const opacity = opacityForSamples(bucket?.samples);
                  const isSelected = selectedCell?.dow === dow && selectedCell?.colHour === colHour;
                  const isHovered = hoveredCell?.dow === dow && hoveredCell?.colHour === colHour;

                  const istLabel =
                    timezone === 'IST'
                      ? `${dayLabel} ${formatHour12(colHour)} IST`
                      : `${DOW_LABELS[displayUtcDOW]} ${formatHour12(displayUtcHour)} UTC`;

                  const title = bucket
                    ? `${istLabel} — p50: ${formatMinutes(bucket.p50Min)}, p90: ${formatMinutes(
                        bucket.p90Min,
                      )} (${bucket.samples} trip${bucket.samples === 1 ? '' : 's'})`
                    : `${istLabel} — No historical traversals`;

                  return (
                    <button
                      type="button"
                      key={colHour}
                      onClick={() =>
                        setSelectedCell({
                          dow,
                          colHour,
                          displayUtcHour,
                          displayUtcDOW,
                          bucket,
                          timezone,
                        })
                      }
                      onMouseEnter={() =>
                        setHoveredCell({
                          dow,
                          colHour,
                          displayUtcHour,
                          displayUtcDOW,
                          bucket,
                          timezone,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      title={title}
                      aria-label={title}
                      className={`h-7 rounded-[4px] border transition-all relative ${
                        isSelected
                          ? 'ring-2 ring-blue-600 ring-offset-1 z-10 scale-105'
                          : isHovered
                            ? 'ring-2 ring-blue-400 z-10 scale-110 shadow-md'
                            : 'border-white/20 hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: color,
                        opacity,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Interactive Detail Inspector Card */}
      {activeInspector && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white p-4 shadow-sm transition-all animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-slate-900 text-sm">
                {DOW_FULL_LABELS[activeInspector.dow]} ·{' '}
                {activeInspector.timezone === 'IST'
                  ? `${formatHour12(activeInspector.colHour)} IST`
                  : `${formatHour12(activeInspector.colHour)} UTC`}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {activeInspector.timezone === 'IST'
                  ? `(${formatHour24(activeInspector.displayUtcHour)} UTC)`
                  : `(${formatHour12((activeInspector.colHour + 6) % 24)} IST)`}
              </span>
            </div>

            {activeInspector.bucket ? (
              <div className="flex items-center gap-2">
                {(() => {
                  const p50 = activeInspector.bucket.p50Min;
                  const delta = max - min;
                  let badge = {
                    text: 'Free Flow',
                    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  };
                  if (delta > 0) {
                    const ratio = (p50 - min) / delta;
                    if (ratio >= 0.75) {
                      badge = {
                        text: 'Heavy Congestion',
                        cls: 'bg-rose-100 text-rose-800 border-rose-300',
                      };
                    } else if (ratio >= 0.45) {
                      badge = {
                        text: 'Moderate Traffic',
                        cls: 'bg-amber-100 text-amber-800 border-amber-300',
                      };
                    } else if (ratio >= 0.2) {
                      badge = {
                        text: 'Normal Flow',
                        cls: 'bg-blue-100 text-blue-800 border-blue-300',
                      };
                    }
                  }
                  return (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.cls}`}
                    >
                      {badge.text}
                    </span>
                  );
                })()}
                <span className="text-xs text-slate-600 font-medium">
                  {activeInspector.bucket.samples} recorded trip
                  {activeInspector.bucket.samples === 1 ? '' : 's'}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">No historical samples</span>
            )}
          </div>

          {activeInspector.bucket ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 items-center">
              <div>
                <span
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block"
                  title="Typical transit duration during normal conditions"
                >
                  Expected Travel Time (Typical)
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {formatMinutes(activeInspector.bucket.p50Min)}
                </span>
                {min != null && activeInspector.bucket.p50Min > min && (
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    +{formatMinutes(activeInspector.bucket.p50Min - min)} vs free-flow
                  </span>
                )}
              </div>

              <div>
                <span
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block"
                  title="Worst-case transit time expected during heavy traffic (90% confidence)"
                >
                  Worst-Case Travel Time (Peak)
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {formatMinutes(activeInspector.bucket.p90Min)}
                </span>
                <span className="text-[11px] text-indigo-700 block mt-0.5">
                  +{formatMinutes(activeInspector.bucket.p90Min - activeInspector.bucket.p50Min)}{' '}
                  traffic buffer
                </span>
              </div>

              <div className="rounded-lg bg-white/80 p-2.5 border border-blue-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  Operational Advisory:
                </span>
                {(() => {
                  const p50 = activeInspector.bucket.p50Min;
                  const delta = max - min;
                  if (delta > 0 && (p50 - min) / delta >= 0.7) {
                    return `Peak delay risk on this corridor. Recommend delaying departure to the night window or buffering at least ${formatMinutes(activeInspector.bucket.p90Min - activeInspector.bucket.p50Min)} for on-time delivery.`;
                  }
                  if (delta > 0 && (p50 - min) / delta <= 0.25) {
                    return 'Clear transit conditions. Excellent slot for high-priority dispatches, offering minimal transit time and lowest fuel consumption.';
                  }
                  return 'Predictable corridor transit conditions. Normal dispatch scheduling recommended.';
                })()}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 pt-2.5">
              No historical vehicle traversals recorded at this specific hour. As fleet trips are
              driven on this corridor, travel-time estimates and confidence intervals will appear
              here automatically.
            </p>
          )}
        </div>
      )}

      {/* 5. Continuous Color Legend & Calibration Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            {min != null ? formatMinutes(min) : 'Faster'}
          </span>
          <div
            className="h-2.5 w-32 rounded-full border border-slate-300/80 shadow-inner"
            style={{
              background: `linear-gradient(to right, ${SEQUENTIAL_RAMP.join(', ')})`,
            }}
          />
          <span className="font-semibold text-slate-700">
            {max != null ? formatMinutes(max) : 'Slower'}
          </span>
          <div className="flex items-center gap-1.5 ml-4">
            <span
              className="inline-block h-3 w-3 rounded-[3px] border border-slate-300"
              style={{ background: NO_DATA_COLOR }}
            />
            <span className="text-slate-500">No data</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            <span>Solid cells: ≥5 samples (High confidence)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-300" />
            <span>Faded cells: 1–2 samples</span>
          </div>
        </div>
      </div>
    </div>
  );
}
