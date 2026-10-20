/**
 * Auto Trips — pure helpers for the list, detail and map. No React, no I/O.
 */
import { formatInIST, istDayString } from '../../utils/dateUtils';

// ─── Status ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL = {
  COMPLETE: 'Delivered',
  CONFIRMED: 'Confirmed',
  NEEDS_REVIEW: 'Needs a check',
  OPEN: 'On the road',
  DISMISSED: 'Rejected',
};

export const STATUS_CLASS = {
  COMPLETE: 'atx-status--delivered',
  CONFIRMED: 'atx-status--confirmed',
  NEEDS_REVIEW: 'atx-status--review',
  OPEN: 'atx-status--open',
  DISMISSED: 'atx-status--rejected',
};

/** The truck has left the plant and not reached a drop yet. */
export const notReachedYet = (trip) => trip?.status === 'OPEN' && !trip?.drop?.arrivedAt;

export function toDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─── Formatting (IST, whatever timezone the browser is in) ──────────────────

/** "8:30 pm" */
export function fmtClock(v) {
  return formatInIST(v, 'h:mm a') ?? '—';
}

/** "7 Oct" */
export function fmtDay(v) {
  return formatInIST(v, 'D MMM') ?? '—';
}

/** "7 Oct, 8:30 pm" — or "07 Oct, 8:30 pm" with padDay, as in the trip list. */
export function fmtDayTime(v, { padDay = false } = {}) {
  return formatInIST(v, padDay ? 'DD MMM, h:mm a' : 'D MMM, h:mm a') ?? '—';
}

/** "7–8 Oct 2026", "30 Sep – 1 Oct 2026", "7 Oct 2026". Empty when neither end is known. */
export function fmtDateRange(a, b) {
  const s = istDayString(a ?? '');
  const e = istDayString(b ?? '');
  if (!s || !e) return s || e ? formatInIST(s ? a : b, 'D MMM YYYY') : '';
  if (s.slice(0, 4) !== e.slice(0, 4)) {
    return `${formatInIST(a, 'D MMM YYYY')} – ${formatInIST(b, 'D MMM YYYY')}`;
  }
  if (s.slice(5, 7) !== e.slice(5, 7)) {
    return `${formatInIST(a, 'D MMM')} – ${formatInIST(b, 'D MMM YYYY')}`;
  }
  if (s !== e) return `${formatInIST(a, 'D')}–${formatInIST(b, 'D MMM YYYY')}`;
  return formatInIST(a, 'D MMM YYYY');
}

/** "15 h 3 min", "45 min", "2 h". */
export function fmtDuration(min) {
  if (min == null || Number.isNaN(Number(min))) return '—';
  const total = Math.max(0, Math.round(Number(min)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "1,270 km" */
export function fmtKm(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return `${Math.round(Number(v)).toLocaleString('en-IN')} km`;
}

/** The days a trip spans, from reaching the plant to its last drop. */
export function tripDateRange(trip) {
  const start = trip?.pickup?.arrivedAt || trip?.pickup?.departedAt;
  const arrivals = [trip?.drop, ...(trip?.extraDrops || [])]
    .map((d) => toDate(d?.arrivedAt))
    .filter(Boolean);
  if (!arrivals.length) {
    const since = fmtDateRange(start);
    return since ? `${since} · on the road` : 'On the road';
  }
  return fmtDateRange(start, new Date(Math.max(...arrivals.map((d) => d.getTime()))));
}

// ─── Stops on the way ────────────────────────────────────────────────────────

function joinOr(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "1 unknown stop · no fuel, rest or overnight stops" */
export function stopsOnWayText(summary) {
  if (!summary) return '—';
  const n = (k) => Number(summary[k]) || 0;
  const kinds = ['fuel', 'rest', 'overnight'];
  const parts = [];
  if (n('unexplained')) parts.push(plural(n('unexplained'), 'unknown stop'));
  kinds.filter((k) => n(k)).forEach((k) => parts.push(plural(n(k), `${k} stop`)));
  const none = kinds.filter((k) => !n(k));
  if (none.length) parts.push(`no ${joinOr(none)} stops`);
  return parts.join(' · ');
}
