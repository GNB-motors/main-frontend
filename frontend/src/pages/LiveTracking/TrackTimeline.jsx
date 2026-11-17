import { useMemo, useState, useRef } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  X,
  Calendar,
  Clock,
  Activity,
  Zap,
  Gauge,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { formatDuration, formatIst, formatIstDate } from '../../utils/redesign/format';
import { PLAYBACK_SPEEDS, gapMinutes, isGapEvent } from './trackPlayback';
import { isLongRange } from './trackUrlModel';

/** The colour of a stop dot on the timeline. */
const STOP_DOT = '#7c3aed';
/** The colour of a “no GPS” dot on the timeline. */
const GAP_DOT = '#94a3b8';

/** The colour of a dot on the timeline, by what it stands for. */
function eventColor(kind) {
  switch (kind) {
    case 'OVERSPEED':
      return '#ef4444';
    case 'DETOUR':
      return '#ef4444';
    case 'FUEL_FILL':
      return '#2563eb';
    case 'FUEL_DROP':
      return '#ea580c';
    default:
      return '#64748b';
  }
}

/** The plain name of an event, when the backend did not write one. */
const EVENT_LABEL = {
  OVERSPEED: 'Over 60 km/h',
  DETOUR: 'Detour',
  FUEL_FILL: 'Fuel fill',
  FUEL_DROP: 'Fuel drop',
  HARSH: 'Harsh driving',
};

/** The label of a dot: what happened and, for a gap, how long it lasted. */
function eventTitle(event) {
  if (isGapEvent(event)) {
    const minutes = gapMinutes(event);
    return minutes ? `No GPS ${formatDuration(minutes)}` : 'No GPS';
  }
  return event.text || EVENT_LABEL[event.kind] || 'Event';
}

export default function TrackTimeline({
  track,
  points = [],
  playheadIndex = 0,
  playheadTime = null,
  isPlaying = false,
  speed = 1,
  onTogglePlay,
  onSpeedChange,
  onSeek,
  onExit,
  from = null,
  to = null,
  tollStatus = null,
}) {
  const summary = track?.summary ?? null;
  const segments = useMemo(() => (Array.isArray(track?.segments) ? track.segments : []), [track]);
  const events = useMemo(() => (Array.isArray(track?.events) ? track.events : []), [track]);
  const stops = useMemo(() => (Array.isArray(track?.stops) ? track.stops : []), [track]);

  const [hoverFraction, setHoverFraction] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const scrubTrackRef = useRef(null);

  const firstTime = points.length ? new Date(points[0].t).getTime() : null;
  const lastTime = points.length ? new Date(points[points.length - 1].t).getTime() : null;
  const span = firstTime !== null && lastTime !== null ? Math.max(1, lastTime - firstTime) : 1;

  // Current playhead point & telemetry
  const currentPoint = points[playheadIndex] || (points.length ? points[0] : null);
  const currentTime = useMemo(() => {
    if (playheadTime) return new Date(playheadTime);
    if (currentPoint?.t) return new Date(currentPoint.t);
    return null;
  }, [playheadTime, currentPoint]);

  const currentSpeed = currentPoint?.speedKmh != null ? Number(currentPoint.speedKmh) : 0;
  const isIgnitionOn = currentPoint?.ign === true;
  const isOverLimit = currentSpeed > 60;

  // Visible stops on timeline
  const visibleStops = useMemo(() => {
    if (firstTime === null || lastTime === null) return [];
    return stops.flatMap((stop) => {
      const start = Math.max(firstTime, new Date(stop.startAt).getTime());
      const end = Math.min(lastTime, new Date(stop.endAt).getTime());
      if (!(end > start)) return [];
      return [
        { stop, left: ((start - firstTime) / span) * 100, right: ((end - firstTime) / span) * 100 },
      ];
    });
  }, [stops, firstTime, lastTime, span]);

  // Coloured track strips
  const strips = useMemo(
    () =>
      segments.map((segment) => ({
        key: `${segment.fromT}-${segment.toT}`,
        kind: segment.kind,
        left: ((new Date(segment.fromT).getTime() - firstTime) / span) * 100,
        width: ((new Date(segment.toT).getTime() - new Date(segment.fromT).getTime()) / span) * 100,
      })),
    [segments, firstTime, span],
  );

  // Dots above the bar
  const ticks = useMemo(
    () =>
      events.map((event) => ({
        key: `${event.kind}-${event.at}`,
        kind: event.kind,
        title: eventTitle(event),
        left: ((new Date(event.at).getTime() - firstTime) / span) * 100,
        color: isGapEvent(event) ? GAP_DOT : eventColor(event.kind),
      })),
    [events, firstTime, span],
  );

  // Stop dots
  const stopDots = useMemo(
    () =>
      visibleStops.map(({ stop, left }, index) => ({
        key: `stop-dot-${stop.startAt}-${index}`,
        kind: 'STOP',
        title: `${stop.place?.name ?? 'Stop'} · ${formatIst(stop.startAt)}`,
        left,
        color: STOP_DOT,
      })),
    [visibleStops],
  );

  const dots = useMemo(
    () => [...ticks, ...stopDots].sort((a, b) => a.left - b.left),
    [ticks, stopDots],
  );

  // Stop blocks below track
  const stopBlocks = useMemo(
    () =>
      visibleStops.map(({ stop, left, right }, index) => ({
        key: `stop-${stop.startAt}-${index}`,
        title: `${stop.place?.name ?? 'Stop'} · ${formatDuration(stop.durationMin)}`,
        left,
        width: Math.min(100 - left, Math.max(1, right - left)),
      })),
    [visibleStops],
  );

  const playheadPercent = points.length
    ? (playheadIndex / Math.max(1, points.length - 1)) * 100
    : 0;

  const long = isLongRange({ from, to });

  // Distance covered so far
  const totalKm = summary?.km != null ? Number(summary.km) : null;
  const coveredKm = totalKm != null ? ((totalKm * playheadPercent) / 100).toFixed(1) : null;

  // Click anywhere on scrubber to seek
  const handleScrubClick = (event) => {
    const rect = scrubTrackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return;
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onSeek?.(fraction * 100);
  };

  const handleMouseMove = (event) => {
    const rect = scrubTrackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || firstTime === null) return;
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHoverFraction(fraction * 100);
    setHoverTime(new Date(firstTime + span * fraction));
  };

  const handleMouseLeave = () => {
    setHoverFraction(null);
    setHoverTime(null);
  };

  const handleScrubKey = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const last = Math.max(0, points.length - 1);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = Math.min(last, Math.max(0, playheadIndex + step));
    onSeek?.((next / Math.max(1, last)) * 100);
  };

  // Status badge config
  const statusConfig = useMemo(() => {
    if (isOverLimit) {
      return {
        bg: 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400',
        dot: 'bg-red-500 animate-pulse',
        label: `Overspeed · ${Math.round(currentSpeed)} km/h`,
        icon: <Zap size={13} className="text-red-500" />,
      };
    }
    if (currentSpeed > 3) {
      return {
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
        label: `Moving · ${Math.round(currentSpeed)} km/h`,
        icon: <Gauge size={13} className="text-emerald-500" />,
      };
    }
    if (isIgnitionOn) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500',
        label: 'Idling · Engine ON',
        icon: <Activity size={13} className="text-amber-500" />,
      };
    }
    return {
      bg: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-400',
      dot: 'bg-purple-500',
      label: 'Stopped · 0 km/h',
      icon: <Radio size={13} className="text-purple-500" />,
    };
  }, [isOverLimit, currentSpeed, isIgnitionOn]);

  return (
    <div className="ov-track-bar track-replay-console flex flex-col gap-2.5 rounded-2xl border border-slate-300/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-2xl shadow-slate-900/15 dark:shadow-black/50">
      {/* 1. TOP TELEMETRY HUD STRIP */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-2 flex-nowrap overflow-x-auto">
        <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
          {/* Prominent Live Replay Date & Time Badge */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-white shadow-sm dark:bg-slate-800 font-medium shrink-0">
            <Calendar size={13} className="text-blue-400 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-200">
              {currentTime ? formatIstDate(currentTime) : '—'}
            </span>
            <span className="text-slate-500 font-bold">·</span>
            <Clock size={13} className="text-blue-400 shrink-0" aria-hidden="true" />
            <span className="tabular-nums text-[13px] font-bold text-white tracking-wide">
              {currentTime ? formatIst(currentTime, { withDate: false }) : '—'}
            </span>
            {isPlaying && (
              <span className="ml-1 flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            )}
          </div>

          {/* Current Vehicle State & Speed Badge */}
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold shrink-0 ${statusConfig.bg}`}
          >
            {statusConfig.icon}
            <span className="tabular-nums">{statusConfig.label}</span>
          </div>

          {/* Distance Covered Telemetry */}
          {coveredKm !== null && (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800/70 dark:text-slate-300 shrink-0">
              <Activity size={13} className="text-indigo-500 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {coveredKm} km
                </strong>{' '}
                covered
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-bold tabular-nums">
                ({Math.round(playheadPercent)}%)
              </span>
            </div>
          )}

          {/* Legend Indicators — Stays to the right of km covered at all times */}
          <div className="flex items-center gap-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 pl-1 shrink-0">
            <span className="flex items-center gap-1 shrink-0">
              <span
                className="size-2 rounded-full shadow-sm"
                style={{ backgroundColor: STOP_DOT }}
                aria-hidden="true"
              />
              Stop
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="size-2 rounded-full shadow-sm bg-red-500" aria-hidden="true" />
              Overspeed
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span
                className="size-2 rounded-full shadow-sm"
                style={{ backgroundColor: GAP_DOT }}
                aria-hidden="true"
              />
              No GPS
            </span>
          </div>
        </div>

        {/* Close Button at the far right */}
        <button
          type="button"
          onClick={onExit}
          aria-label="Leave Track mode"
          title="Leave Track mode"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* 2. MEDIA CONTROLS & INTERACTIVE PROGRESS SCRUBBER */}
      <div className="flex items-center gap-3 pt-0.5">
        {/* Media Controls Group */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Rewind to Start */}
          <button
            type="button"
            onClick={() => onSeek?.(0)}
            title="Rewind to start"
            aria-label="Rewind to start"
            className="flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>

          {/* Primary High-Tech Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" aria-hidden="true" />
            )}
          </button>

          {/* Segmented Speed Controller */}
          <div
            className="flex items-center rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 ml-1"
            role="group"
            aria-label="Playback speed"
          >
            {PLAYBACK_SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSpeedChange(value)}
                aria-pressed={speed === value}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  speed === value
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>

        {/* Start Time Stamp */}
        <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          {points.length ? formatIst(points[0].t) : '—'}
        </span>

        {/* The Scrubber Bar Container */}
        <div
          ref={scrubTrackRef}
          role="presentation"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative min-w-[140px] flex-1 py-3 group select-none"
        >
          {/* Event Dots positioned above track */}
          {dots.map((dot) => (
            <button
              key={dot.key}
              type="button"
              title={dot.title}
              aria-label={dot.title}
              onClick={(e) => {
                e.stopPropagation();
                onSeek?.(dot.left);
              }}
              className="absolute -top-1.5 size-3 -translate-x-1/2 rounded-full border-2 border-white dark:border-slate-900 shadow-sm transition-transform hover:scale-150 z-20 cursor-pointer"
              style={{
                left: `${dot.left}%`,
                backgroundColor: dot.color,
              }}
            />
          ))}

          {/* Native Slider container */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Position in the drive"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, points.length - 1)}
            aria-valuenow={playheadIndex}
            onClick={handleScrubClick}
            onKeyDown={handleScrubKey}
            className="relative h-6 w-full flex items-center"
          >
            {/* Base Channel */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/80 shadow-inner">
              {/* Colored Segments */}
              {strips.map((strip) => (
                <span
                  key={strip.key}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${strip.left}%`,
                    width: `${strip.width}%`,
                    backgroundColor:
                      strip.kind === 'LADEN'
                        ? '#3b82f6'
                        : strip.kind === 'EMPTY'
                          ? '#93c5fd'
                          : strip.kind === 'REPOSITION'
                            ? '#a855f7'
                            : '#94a3b8',
                    opacity: strip.kind === 'GAP' ? 0.45 : 1,
                  }}
                />
              ))}

              {/* Glowing High-Definition Progress Fill */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                style={{
                  width: `${playheadPercent}%`,
                }}
              />
            </div>

            {/* Hover preview tooltip */}
            {hoverFraction !== null && hoverTime !== null && (
              <div
                className="pointer-events-none absolute -top-9 -translate-x-1/2 z-30"
                style={{ left: `${hoverFraction}%` }}
              >
                <div className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl whitespace-nowrap">
                  {formatIst(hoverTime)}
                </div>
                <div className="mx-auto size-1.5 -translate-y-0.5 rotate-45 bg-slate-900" />
              </div>
            )}

            {/* Draggable Playhead Knob with glowing halo */}
            <span
              aria-hidden="true"
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 shadow-lg ring-4 ring-blue-500/25 transition-transform group-hover:scale-115 z-20"
              style={{ left: `${playheadPercent}%` }}
            />
          </div>

          {/* Stop blocks below scrubber */}
          {stopBlocks.map((block) => (
            <span
              key={block.key}
              title={block.title}
              className="absolute -bottom-1 h-1.5 rounded-full bg-purple-600/80 dark:bg-purple-400/80"
              style={{ left: `${block.left}%`, width: `${block.width}%` }}
            />
          ))}
        </div>

        {/* End Time Stamp */}
        <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          {points.length ? formatIst(points[points.length - 1].t) : '—'}
        </span>
      </div>

      {/* 3. BOTTOM SUMMARY & TOLL FOOTER */}
      {long ? (
        <p className="m-0 text-xs text-amber-600 dark:text-amber-400 font-medium">
          Long range: the path is simplified; zoom in on the timeline for detail.
        </p>
      ) : null}

      {summary ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 font-medium tabular-nums">
          <span className="flex flex-wrap items-center gap-1.5">
            <strong>{summary.km} km</strong> · {formatDuration(summary.driveMin)} driving ·{' '}
            {formatDuration(summary.stopMin)} stopped
            {summary.maxKmh ? ` · top ${summary.maxKmh} km/h` : ''}
          </span>
          {tollStatus}
        </div>
      ) : null}
    </div>
  );
}
