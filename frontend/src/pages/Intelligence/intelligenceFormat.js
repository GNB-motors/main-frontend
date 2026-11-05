/**
 * The words the Intelligence page uses for the API's numbers and moments.
 *
 * A big number gets Indian digit grouping, a moment at IST midnight keeps
 * only its day, an idle shorter than a minute is never shown as "0 min", and
 * a count that hit the API's cap says so instead of pretending it is exact.
 */
import { DASH, formatIst, formatIstDate } from '@/utils/redesign/format';

const IST_OFFSET_MIN = 330;

/** The API stops listing and counting events at 5,000. */
export const EVENT_CAP = 5000;

/** "1,40,701 L" — litres with Indian digit grouping. */
export function formatLitres(litres, { digits = 1 } = {}) {
  if (litres === null || litres === undefined || Number.isNaN(Number(litres))) return DASH;
  const n = Number(litres);
  const text = Number.isInteger(n) ? String(n) : n.toFixed(digits);
  return `${Number(text).toLocaleString('en-IN')} L`;
}

/**
 * The moment an event happened.
 *
 * At IST midnight only the day is shown: "12:00 am" reads like noon, and the
 * day is what the owner is looking for anyway.
 */
export function formatEventTime(value) {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
  const ist = new Date(date.getTime() + (IST_OFFSET_MIN + date.getTimezoneOffset()) * 60000);
  if (ist.getHours() === 0 && ist.getMinutes() === 0) return formatIstDate(value);
  return formatIst(value);
}

/** "<1 min", "40 min" — whole minutes, never "0 min" for a real idle. */
export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) return DASH;
  const n = Number(minutes);
  if (n <= 0) return '0 min';
  const whole = Math.round(n);
  return whole === 0 ? '<1 min' : `${whole} min`;
}

/** The minutes of a row: the length of the stop first, the measured value second. */
export function rowMinutes(row) {
  const candidates = [row?.durationMin, row?.value];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || Number.isNaN(Number(candidate))) continue;
    return Number(candidate);
  }
  return null;
}

const MINUTES_IN_TEXT = /(\d+(?:[.,]\d+)?)\s*min\b/;

/** The same minute figure inside the sentence the API wrote. */
export function withRoundedMinutes(text, minutes) {
  if (!text) return text;
  const label = formatMinutes(minutes);
  if (label === DASH) return text;
  return text.replace(MINUTES_IN_TEXT, label);
}

/**
 * The count of events, when it may not be the whole truth.
 * - more events than the API lists → "5,000+ events (showing the first 5,000)"
 * - exactly at the cap              → "5,000 or more events"
 */
export function eventCountLabel(count, listed) {
  const n = Number(count) || 0;
  const shown = Math.min(Number(listed) || 0, EVENT_CAP);
  const cap = EVENT_CAP.toLocaleString('en-IN');
  if (n > EVENT_CAP || (n >= EVENT_CAP && shown >= EVENT_CAP)) {
    return { value: `${cap}+`, label: `events (showing the first ${cap})` };
  }
  if (n >= EVENT_CAP) {
    return { value: cap, label: 'or more events' };
  }
  return { value: n.toLocaleString('en-IN'), label: 'in this period' };
}
