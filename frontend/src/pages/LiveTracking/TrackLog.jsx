import { useMemo, useEffect, useRef, useState } from 'react';
import { MapPin, Clock, Zap, Radio, Fuel, CornerUpRight, Calendar, Truck } from 'lucide-react';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { journeyLogRows } from './journeyLogRows';

/** Clean and humanize backend reason text */
function humanizeReasonText(text) {
  if (!text) return '';
  const str = String(text).trim();

  // "No purpose signal; stood 612 min" -> "Halt on route · 10 h 12 min"
  const stoodMatch = str.match(/No purpose signal;\s*stood\s*(\d+)\s*min/i);
  if (stoodMatch) {
    const mins = Number(stoodMatch[1]);
    return `Halt on route · ${formatDuration(mins)}`;
  }

  const stoppedPlant = str.match(/Stopped inside a plant gate/i);
  if (stoppedPlant) {
    return 'Plant gate entry · Loading / Unloading';
  }

  return str;
}

/** Icon and style configuration per kind */
function getEventStyle(kind) {
  switch (kind) {
    case 'START':
      return {
        label: 'Start',
        badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        dotColor: '#2563eb',
        icon: <MapPin size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />,
      };
    case 'MOVING':
      return {
        label: 'Moving',
        badgeClass:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        dotColor: '#10b981',
        icon: <Truck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
      };
    case 'IDLING':
      return {
        label: 'Idling',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        dotColor: '#f59e0b',
        icon: <Clock size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />,
      };
    case 'OVERSPEED':
      return {
        label: 'Overspeed',
        badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
        dotColor: '#ef4444',
        icon: <Zap size={13} className="text-red-600 dark:text-red-400 shrink-0" />,
      };
    case 'DETOUR':
      return {
        label: 'Detour',
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        dotColor: '#ef4444',
        icon: <CornerUpRight size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />,
      };
    case 'FUEL_FILL':
      return {
        label: 'Fuel Fill',
        badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        dotColor: '#2563eb',
        icon: <Fuel size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />,
      };
    case 'FUEL_DROP':
      return {
        label: 'Fuel Drop',
        badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
        dotColor: '#ea580c',
        icon: <Fuel size={13} className="text-orange-600 dark:text-orange-400 shrink-0" />,
      };
    case 'GPS_GAP':
      return {
        label: 'No GPS',
        badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        dotColor: '#94a3b8',
        icon: <Radio size={13} className="text-slate-500 shrink-0" />,
      };
    case 'STOP':
    default:
      return {
        label: 'Stop',
        badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
        dotColor: '#7c3aed',
        icon: <MapPin size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />,
      };
  }
}

/**
 * TrackLog — the trip log in the rail during Track mode.
 *
 * Displays a connected vertical journey timeline with:
 * - Live Journey Progress bar at the top with timestamps
 * - Summary metric cards (Distance, Driving, Stopped)
 * - Continuous, full-span connector line between event boxes that smoothly
 *   animates in website blue (#2563eb) from one box to another as the vehicle travels
 * - Active event indicator with glowing pulse ring
 * - Human-friendly formatted cards for Stops, Overspeed, and GPS gaps
 */
export default function TrackLog({
  query = '',
  track,
  points = [],
  playheadTime = null,
  playheadIndex = 0,
  isPlaying = false,
  onSeek = null,
  onOpenPlace = null,
}) {
  const summary = track?.summary ?? null;

  const effectivePoints = useMemo(() => {
    if (Array.isArray(points) && points.length > 0) return points;
    if (Array.isArray(track?.points) && track.points.length > 0) return track.points;
    return [];
  }, [points, track?.points]);

  const rows = useMemo(() => {
    return journeyLogRows(track, effectivePoints);
  }, [track, effectivePoints]);

  const [clickedRow, setClickedRow] = useState(null);
  const normalizedQuery = query.trim().toLowerCase();
  const matchesSearch = (row) =>
    [row.title, row.text, getEventStyle(row.kind).label, row.isStart ? 'Starting point' : ''].some(
      (value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalizedQuery),
    );
  const activeItemRef = useRef(null);
  const listContainerRef = useRef(null);

  // Time calculations
  const firstTime = effectivePoints.length
    ? new Date(effectivePoints[0].t).getTime()
    : rows.length
      ? new Date(rows[0].at).getTime()
      : null;
  const lastTime = effectivePoints.length
    ? new Date(effectivePoints[effectivePoints.length - 1].t).getTime()
    : rows.length
      ? new Date(rows[rows.length - 1].at).getTime()
      : null;

  const currentTimeMs = useMemo(() => {
    if (playheadTime) return new Date(playheadTime).getTime();
    if (effectivePoints[playheadIndex]?.t)
      return new Date(effectivePoints[playheadIndex].t).getTime();
    return firstTime;
  }, [playheadTime, effectivePoints, playheadIndex, firstTime]);

  // Overall journey progress percentage
  const progressPercent = useMemo(() => {
    if (firstTime === null || lastTime === null || lastTime <= firstTime) return 0;
    if (currentTimeMs === null) return 0;
    const clamped = Math.min(lastTime, Math.max(firstTime, currentTimeMs));
    return ((clamped - firstTime) / (lastTime - firstTime)) * 100;
  }, [firstTime, lastTime, currentTimeMs]);

  // Active event index: latest row at or before currentTimeMs
  const activeRowIndex = useMemo(() => {
    if (!rows.length || currentTimeMs === null) return -1;
    if (!isPlaying && clickedRow && clickedRow.at === currentTimeMs) {
      const selected = rows.findIndex((row) => row.key === clickedRow.key);
      if (selected !== -1) return selected;
    }
    if (!isPlaying) {
      const exact = rows.findIndex((row) => Date.parse(row.at) === currentTimeMs);
      if (exact !== -1) return exact;
    }
    let idx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      if (new Date(rows[i].at).getTime() <= currentTimeMs) {
        idx = i;
      } else {
        break;
      }
    }
    return idx >= 0 ? idx : 0;
  }, [rows, currentTimeMs, clickedRow, isPlaying]);

  // Auto-scroll active item into view during playback
  useEffect(() => {
    if (isPlaying && activeItemRef.current && listContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeRowIndex, isPlaying]);

  return (
    <div className="railview track-log flex flex-col h-full overflow-hidden" aria-live="polite">
      {/* 1. HEADER & SUMMARY METRICS */}
      <div className="track-log-header border-b border-slate-200 dark:border-slate-800 p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="track-log-title text-base font-bold text-slate-900 dark:text-white m-0">
            Trip log
          </h3>
          {rows.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {rows.length} {rows.length === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>

        {/* Journey Progress Bar with Live Timestamps */}
        {firstTime !== null && lastTime !== null && (
          <div className="mb-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span
                  className={`size-2 rounded-full ${
                    isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-blue-600'
                  }`}
                />
                {isPlaying ? 'Replay Progress' : 'Journey Progress'}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {Math.round(progressPercent)}%
              </span>
            </div>

            {/* Glowing animated progress track */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-150 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Progress Timestamps */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              <span>{formatIst(firstTime, { withDate: false })}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentTimeMs ? formatIst(currentTimeMs) : ''}
              </span>
              <span>{formatIst(lastTime, { withDate: false })}</span>
            </div>
          </div>
        )}

        {/* 3 Metric Cards */}
        {summary ? (
          <dl className="track-log-summary grid grid-cols-3 gap-2 m-0 p-0 list-none">
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-2.5 text-center shadow-xs">
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Distance
              </dt>
              <dd className="text-sm font-bold text-slate-900 dark:text-white tabular-nums m-0">
                {summary.km} <span className="text-xs font-normal text-slate-400">km</span>
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-2.5 text-center shadow-xs">
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Driving
              </dt>
              <dd className="text-sm font-bold text-slate-900 dark:text-white tabular-nums m-0">
                {formatDuration(summary.driveMin)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-2.5 text-center shadow-xs">
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Stopped
              </dt>
              <dd className="text-sm font-bold text-slate-900 dark:text-white tabular-nums m-0">
                {formatDuration(summary.stopMin)}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      {/* 2. THE CONNECTED VERTICAL TIMELINE LIST */}
      {rows.length === 0 || !rows.some(matchesSearch) ? (
        <p className="track-log-message p-6 text-center text-sm text-slate-500 dark:text-slate-400 m-0">
          {rows.length ? 'No matching journey records.' : 'Nothing was recorded on this drive.'}
        </p>
      ) : (
        <div
          ref={listContainerRef}
          className="track-log-list-wrapper flex-1 overflow-y-auto px-4 py-3 relative"
        >
          <ul className="track-log-list m-0 p-0 list-none space-y-3 relative">
            {rows.map((row, index) => {
              if (!matchesSearch(row)) return null;
              const rowTimeMs = new Date(row.at).getTime();
              const isPast = currentTimeMs !== null && currentTimeMs >= rowTimeMs;
              const isActive = index === activeRowIndex;
              const style = getEventStyle(row.kind);
              const cleanedDetail = humanizeReasonText(row.text);

              // Smooth progression of the connecting line to the next box
              const nextRow = rows[index + 1];
              const itemStart = rowTimeMs;
              const eventDurationMs =
                (row.kind === 'STOP' || row.kind === 'GPS_GAP') && row.durationMin
                  ? Number(row.durationMin) * 60000
                  : row.gapEndAt
                    ? Math.max(0, new Date(row.gapEndAt).getTime() - itemStart)
                    : 0;
              const nextStart = nextRow ? new Date(nextRow.at).getTime() : itemStart;

              // For a stop/gap: truck stays until departTime, then travels to nextStart
              const departTime = Math.min(itemStart + eventDurationMs, nextStart);
              const arriveTime = nextStart;

              let segmentProgress = 0;
              if (currentTimeMs !== null && nextRow) {
                if (currentTimeMs <= itemStart) {
                  segmentProgress = 0;
                } else if (currentTimeMs >= arriveTime) {
                  segmentProgress = 100;
                } else if (arriveTime > departTime) {
                  if (currentTimeMs <= departTime) {
                    segmentProgress = 0;
                  } else {
                    segmentProgress = Math.min(
                      100,
                      Math.max(0, ((currentTimeMs - departTime) / (arriveTime - departTime)) * 100),
                    );
                  }
                } else if (arriveTime > itemStart) {
                  segmentProgress = Math.min(
                    100,
                    Math.max(0, ((currentTimeMs - itemStart) / (arriveTime - itemStart)) * 100),
                  );
                } else {
                  segmentProgress = 100;
                }
              }

              return (
                <li
                  key={row.key}
                  ref={isActive ? activeItemRef : null}
                  className="track-log-item relative flex items-start gap-3"
                >
                  {/* Full-Span Connecting Line to the Next Circle */}
                  {index < rows.length - 1 && (
                    <div
                      className="absolute left-[10px] -translate-x-1/2 top-[32px] bottom-[-24px] w-[3px] bg-slate-200 dark:bg-slate-800 pointer-events-none rounded-full overflow-hidden z-0"
                      aria-hidden="true"
                    >
                      <div
                        className="w-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-150 ease-linear shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                        style={{ height: `${segmentProgress.toFixed(1)}%` }}
                      />
                    </div>
                  )}

                  {/* Timeline Node Column */}
                  <div className="relative pt-3 shrink-0 flex items-center justify-center w-5 z-10">
                    {/* Node circle */}
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive
                          ? 'border-blue-600 bg-white dark:bg-slate-900 ring-4 ring-blue-500/30 scale-110 shadow-sm'
                          : isPast
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 shadow-xs'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: isPast ? '#2563eb' : style.dotColor }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Event Card Button */}
                  <button
                    type="button"
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => {
                      setClickedRow({ key: row.key, at: Date.parse(row.at) });
                      onSeek?.(row.at);
                      if (row.stopId || row.fixAt || row.place?.id)
                        onOpenPlace?.({ ...row, unidentified: !row.place?.name?.trim() });
                    }}
                    className={`track-log-row flex-1 text-left rounded-xl p-3 border transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-1 ring-blue-500/30'
                        : isPast
                          ? 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                          : 'border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Card Top Row: Badge, Time, Duration */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {row.isStart && row.kind !== 'START' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                            <MapPin size={13} aria-hidden="true" />
                            Start
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.badgeClass}`}
                        >
                          {style.icon}
                          {style.label}
                        </span>

                        {isActive && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                            <span className="size-1 rounded-full bg-white animate-ping" />
                            Here
                          </span>
                        )}
                      </div>

                      {row.durationMin != null && (
                        <span className="track-log-duration flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Clock size={11} className="text-slate-400" aria-hidden="true" />
                          {formatDuration(row.durationMin)}
                        </span>
                      )}
                    </div>

                    {/* Card Title */}
                    <div className="track-log-name font-bold text-[13px] text-slate-900 dark:text-white leading-snug">
                      {row.title}
                    </div>

                    {(row.stopId || row.fixAt) && !row.place?.name?.trim() && onOpenPlace ? (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <MapPin size={13} aria-hidden="true" /> Name this place
                      </span>
                    ) : null}
                    {/* Card Timestamp */}
                    <div className="track-log-time mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      <Calendar size={11} className="text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{formatIst(row.at)}</span>
                    </div>

                    {/* Humanized Details / Reason */}
                    {cleanedDetail ? (
                      <div className="track-log-detail mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5 leading-relaxed font-medium">
                        {cleanedDetail}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
