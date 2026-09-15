/**
 * Overspeed query/params helpers — pure, unit-tested (audit §3).
 *
 * The page asks "over [60] km/h for more than [3] minutes" over a window;
 * the API wants speedKmh (clamped 20–160), durationSec (clamped 5–600) and
 * an explicit from/to (default last 24 h, max 7 days). The UI shows duration
 * in whole minutes (1–10), the wire sends seconds. Anything non-finite falls
 * back to the default — a blank input is absent, not a value of 0.
 */

import { coordKey } from '../services/PlaceService';

export const SPEED_DEFAULT = 60;
export const SPEED_MIN = 20;
export const SPEED_MAX = 160;

export const DURATION_DEFAULT_MINUTES = 3; // 180 s — the API default
export const DURATION_MIN_MINUTES = 1; // 60 s, inside the API's 5–600 s clamp
export const DURATION_MAX_MINUTES = 10; // 600 s

const HOURS_PER_DAY = 24;
export const MAX_WINDOW_HOURS = 7 * HOURS_PER_DAY;

export const WINDOW_OPTIONS = [
  { hours: 24, label: 'Last 24 hours' },
  { hours: 72, label: 'Last 3 days' },
  { hours: 168, label: 'Last 7 days' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Absent means "the field is empty", not "the field says zero".
 * `Number(null)`, `Number(undefined)` and `Number('')` are 0 — a finite number —
 * so testing `Number.isFinite` alone would silently clamp a blank input up to the
 * minimum instead of falling back to the default. A typed 0 still clamps to the
 * minimum, which is why this is a separate check and not a truthiness test.
 */
const isAbsent = (value) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/** Non-finite input falls back to the default — absent is not zero. */
export function clampSpeed(value) {
  if (isAbsent(value)) return SPEED_DEFAULT;
  const n = Number(value);
  if (!Number.isFinite(n)) return SPEED_DEFAULT;
  return clamp(Math.round(n), SPEED_MIN, SPEED_MAX);
}

/** Minutes in the UI, clamped to the 5–600 s API window at minute granularity. */
export function clampDurationMinutes(value) {
  if (isAbsent(value)) return DURATION_DEFAULT_MINUTES;
  const n = Number(value);
  if (!Number.isFinite(n)) return DURATION_DEFAULT_MINUTES;
  return clamp(Math.round(n), DURATION_MIN_MINUTES, DURATION_MAX_MINUTES);
}

/** Hours must be one of the offered windows; anything else falls back to 24 h. */
export function normaliseWindowHours(hours) {
  const n = Number(hours);
  return WINDOW_OPTIONS.some((w) => w.hours === n) ? n : 24;
}

/**
 * The [from, to] range for a window ending at `now` (ISO strings).
 * `now` is injectable so the mapping is unit-testable.
 */
export function windowRange(hours, now = new Date()) {
  const h = normaliseWindowHours(hours);
  const to = new Date(now);
  const from = new Date(now.getTime() - h * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function windowLabel(hours) {
  const opt = WINDOW_OPTIONS.find((w) => w.hours === normaliseWindowHours(hours));
  return opt ? opt.label : WINDOW_OPTIONS[0].label;
}

/**
 * Map the page's filter state to the GET /api/overspeed/events query.
 * Returns null when no vehicle is chosen — the endpoint 400s without one,
 * and "no vehicle" is a prompt state, not an error state.
 */
export function buildQuery(
  { vehicleId, speedKmh, durationMin, windowHours } = {},
  now = new Date(),
) {
  if (!vehicleId) return null;
  const { from, to } = windowRange(windowHours, now);
  return {
    vehicleId,
    from,
    to,
    speedKmh: clampSpeed(speedKmh),
    durationSec: clampDurationMinutes(durationMin) * 60,
  };
}

/** "NH-19 · near Dankuni" or the fallback — never a coordinate. */
export function placeText(place) {
  if (!place || typeof place !== 'object') return 'Location unavailable';
  const label = String(place.label || '').trim();
  const sub = String(place.sub || '').trim();
  if (!label) return 'Location unavailable';
  return sub ? `${label} · ${sub}` : label;
}

/**
 * Export rows for the computed-events table. `placesByKey` is the coordKey →
 * resolved place map; events without coords resolve to the unavailable label.
 */
export function eventsExportRows(events, placesByKey = {}) {
  if (!Array.isArray(events)) return [];
  return events.map((e) => {
    const hasCoords =
      e &&
      Number.isFinite(Number(e.startLat)) &&
      Number.isFinite(Number(e.startLng)) &&
      e.startLat != null &&
      e.startLng != null;
    const place = hasCoords ? placesByKey[coordKey(e.startLat, e.startLng)] : null;
    const durationSec = Number(e?.durationSec) || 0;
    return {
      startedAt: e?.startAt || null,
      maxSpeedKmh: e?.maxSpeedKmh ?? null,
      avgSpeedKmh: e?.avgSpeedKmh ?? null,
      durationMin: durationSec > 0 ? Math.round(durationSec / 60) : null,
      pingCount: e?.pingCount ?? null,
      place: hasCoords ? placeText(place) : 'Location unavailable',
    };
  });
}

/** Export meta rows — the file must survive being emailed without the screen. */
export function exportMeta({ registrationNumber, windowHours, speedKmh, durationMin }) {
  return [
    { label: 'Vehicle', value: registrationNumber || '—' },
    { label: 'Window', value: windowLabel(windowHours) },
    { label: 'Speed over', value: `${clampSpeed(speedKmh)} km/h` },
    { label: 'At least', value: `${clampDurationMinutes(durationMin)} min` },
    {
      label: 'Scope',
      value: 'Events recomputed from position history; device alerts are corroboration only',
    },
  ];
}
