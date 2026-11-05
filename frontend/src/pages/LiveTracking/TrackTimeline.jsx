import { useMemo } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { PLAYBACK_SPEEDS, gapMinutes, isGapEvent } from './trackPlayback';
import { isLongRange } from './trackUrlModel';

/** The colour of a stop dot on the timeline. */
const STOP_DOT = '#7c3aed';
/** The colour of a “no GPS” dot on the timeline. */
const GAP_DOT = 'var(--rd-ink-3)';

/**
 * TrackTimeline — the bar at the bottom of the map in Track mode.
 *
 * The scrubber track is coloured by what the truck was doing, with the
 * events as ticks above it and the stops as blocks below. The owner can
 * play the drive, jump to an event, and see how far it went in one line.
 *
 * It is built with a native range input and absolutely positioned ticks —
 * no new dependency, and it works with a keyboard and a screen reader.
 */
/** The colour of a dot on the timeline, by what it stands for. */
function eventColor(kind) {
  switch (kind) {
    case 'OVERSPEED':
      return 'var(--rd-overspeed)';
    case 'DETOUR':
      return 'var(--rd-detour)';
    case 'FUEL_FILL':
      return 'var(--rd-leg-loaded)';
    case 'FUEL_DROP':
      return 'var(--rd-leg-reposition)';
    default:
      return 'var(--rd-ink-3)';
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

  const firstTime = points.length ? new Date(points[0].t).getTime() : null;
  const lastTime = points.length ? new Date(points[points.length - 1].t).getTime() : null;
  const span = firstTime !== null && lastTime !== null ? Math.max(1, lastTime - firstTime) : 1;

  // The coloured track: one strip per segment, sized by how long it lasted.
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

  // The dots above the bar: every event, every stop and every gap, each with a
  // label so the owner knows what they are looking at.
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

  // A stop is a purple dot: when the truck stopped, and where.
  const stopDots = useMemo(
    () =>
      stops.map((stop, index) => ({
        key: `stop-dot-${stop.startAt}-${index}`,
        kind: 'STOP',
        title: `${stop.place?.name ?? 'Stop'} · ${formatIst(stop.startAt)}`,
        left: ((new Date(stop.startAt).getTime() - firstTime) / span) * 100,
        color: STOP_DOT,
      })),
    [stops, firstTime, span],
  );

  const dots = useMemo(
    () => [...ticks, ...stopDots].sort((a, b) => a.left - b.left),
    [ticks, stopDots],
  );

  const stopBlocks = useMemo(
    () =>
      stops.map((stop, index) => ({
        key: `stop-${stop.startAt}-${index}`,
        title: `${stop.place?.name ?? 'Stop'} · ${formatDuration(stop.durationMin)}`,
        left: ((new Date(stop.startAt).getTime() - firstTime) / span) * 100,
        width: Math.max(
          1,
          ((new Date(stop.endAt).getTime() - new Date(stop.startAt).getTime()) / span) * 100,
        ),
      })),
    [stops, firstTime, span],
  );

  const playheadPercent = points.length
    ? (playheadIndex / Math.max(1, points.length - 1)) * 100
    : 0;

  const long = isLongRange({ from, to });

  // Click anywhere on the bar to send the truck to that moment.
  const handleScrubClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onSeek?.(fraction * 100);
  };

  // The arrows step one point at a time, for a keyboard.
  const handleScrubKey = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const last = Math.max(0, points.length - 1);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = Math.min(last, Math.max(0, playheadIndex + step));
    onSeek?.((next / Math.max(1, last)) * 100);
  };

  return (
    <div className="ov-track-bar flex flex-col gap-2 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3 shadow-[var(--rd-shadow-float)]">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--rd-accent)] text-white transition-colors hover:brightness-95"
        >
          {isPlaying ? (
            <Pause size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Playback speed">
          {PLAYBACK_SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSpeedChange(value)}
              aria-pressed={speed === value}
              className={`rounded-[var(--rd-radius-xs)] px-1.5 py-0.5 text-[12px] font-semibold transition-colors ${
                speed === value
                  ? 'bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]'
                  : 'text-[var(--rd-ink-2)] hover:bg-[var(--rd-card-2)]'
              }`}
            >
              {value}×
            </button>
          ))}
        </div>

        <span className="text-[12px] text-[var(--rd-ink-2)] tabular-nums">
          {points.length ? formatIst(points[0].t) : '—'}
        </span>

        {/* The scrubber */}
        <div className="relative min-w-[120px] flex-1">
          {dots.map((dot) => (
            <button
              key={dot.key}
              type="button"
              title={dot.title}
              aria-label={dot.title}
              onClick={() => onSeek?.(dot.left)}
              className="absolute -top-3 size-2 -translate-x-1/2 rounded-full"
              style={{
                left: `${dot.left}%`,
                backgroundColor: dot.color,
              }}
            />
          ))}

          <div
            role="slider"
            tabIndex={0}
            aria-label="Position in the drive"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, points.length - 1)}
            aria-valuenow={playheadIndex}
            onClick={handleScrubClick}
            onKeyDown={handleScrubKey}
            className="relative h-3.5 w-full cursor-pointer"
          >
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-[var(--rd-card-2)]">
              {strips.map((strip) => (
                <span
                  key={strip.key}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${strip.left}%`,
                    width: `${strip.width}%`,
                    backgroundColor:
                      strip.kind === 'LADEN'
                        ? 'var(--rd-leg-loaded)'
                        : strip.kind === 'EMPTY'
                          ? 'var(--rd-leg-empty)'
                          : strip.kind === 'REPOSITION'
                            ? 'var(--rd-leg-reposition)'
                            : 'var(--rd-leg-unknown)',
                    opacity: strip.kind === 'GAP' ? 0.5 : 1,
                  }}
                />
              ))}
              {/* How far the playhead has travelled, so the bar reads as progress. */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${playheadPercent}%`,
                  background: 'var(--rd-accent)',
                  opacity: 0.22,
                }}
              />
            </div>
            {/* The handle. A ringed dot so it reads as a scrubber, not a scrollbar. */}
            <span
              aria-hidden="true"
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--rd-card)] bg-[var(--rd-accent)] shadow"
              style={{ left: `${playheadPercent}%` }}
            />
          </div>

          {stopBlocks.map((block) => (
            <span
              key={block.key}
              title={block.title}
              className="absolute -bottom-2 h-1.5 rounded-full bg-[var(--rd-ink-3)]"
              style={{ left: `${block.left}%`, width: `${block.width}%` }}
            />
          ))}
        </div>

        {/* What the dots mean. */}
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-[var(--rd-ink-3)]">
          <span className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: STOP_DOT }}
            />
            Stop
          </span>
          <span className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: GAP_DOT }}
            />
            No GPS
          </span>
        </div>

        <span className="text-[12px] text-[var(--rd-ink-2)] tabular-nums">
          {points.length ? formatIst(points[points.length - 1].t) : '—'}
        </span>

        <button
          type="button"
          onClick={onExit}
          aria-label="Leave Track mode"
          className="shrink-0 rounded-[var(--rd-radius-sm)] p-1.5 text-[var(--rd-ink-3)] transition-colors hover:bg-[var(--rd-card-2)] hover:text-[var(--rd-ink-2)]"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      {long ? (
        <p className="m-0 text-[12px] text-[var(--rd-watch-ink)]">
          Long range: the path is simplified; zoom in on the timeline for detail.
        </p>
      ) : null}

      {summary ? (
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
          <span>
            {summary.km} km · {formatDuration(summary.driveMin)} driving ·{' '}
            {formatDuration(summary.stopMin)} stopped
            {summary.maxKmh ? ` · top ${summary.maxKmh} km/h` : ''}
          </span>
          {tollStatus}
        </p>
      ) : null}
    </div>
  );
}
