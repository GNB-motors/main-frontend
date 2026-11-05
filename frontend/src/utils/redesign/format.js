/**
 * Formatting helpers for the 3 Nov 2026 redesign.
 *
 * Words: transporters, not statisticians. Every number carries its unit and
 * uses Indian digit grouping. An unknown value is never 0 — it is null, and
 * the helpers print an em dash or the honest empty-state word.
 */

/** The one em dash used for "we do not know this number". */
export const DASH = '—';

const IST_OFFSET_MIN = 330;

/** Shift a Date into IST regardless of the machine's own timezone. */
function toIst(date) {
  return new Date(date.getTime() + (IST_OFFSET_MIN + date.getTimezoneOffset()) * 60000);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * "356.5 L" — litres with one decimal, or an em dash.
 * `digits` lets a whole-number reading drop the ".0".
 */
export function formatL(litres, { digits = 1 } = {}) {
  if (litres === null || litres === undefined || Number.isNaN(Number(litres))) return DASH;
  const n = Number(litres);
  const text = Number.isInteger(n) ? String(n) : n.toFixed(digits);
  return `${text} L`;
}

/** "60.8%" — percentage with one decimal, or an em dash. */
export function formatPct(pct, { digits = 1 } = {}) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) return DASH;
  const n = Number(pct);
  const text = Number.isInteger(n) ? String(n) : n.toFixed(digits);
  return `${text}%`;
}

/** "43,478 km" — whole kilometres with Indian digit grouping. */
export function formatKm(km, { digits = 0 } = {}) {
  if (km === null || km === undefined || Number.isNaN(Number(km))) return DASH;
  const n = Number(km);
  const rounded = digits > 0 ? Number(n.toFixed(digits)) : Math.round(n);
  return `${rounded.toLocaleString('en-IN')} km`;
}

/** "26 km/h" — speed, or an em dash. */
export function formatKmh(kmh, { digits = 0 } = {}) {
  if (kmh === null || kmh === undefined || Number.isNaN(Number(kmh))) return DASH;
  const n = Number(kmh);
  const rounded = digits > 0 ? Number(n.toFixed(digits)) : Math.round(n);
  return `${rounded.toLocaleString('en-IN')} km/h`;
}

/**
 * "2 h 10 min", "45 min", "1 h". Hours only appear when there are hours;
 * minutes alone never becomes "0 h 45 min".
 */
export function formatDuration(min) {
  if (min === null || min === undefined || Number.isNaN(Number(min))) return DASH;
  const total = Math.max(0, Math.round(Number(min)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

/**
 * IST wall-clock time.
 * - same day as today → "12:48 am"
 * - otherwise        → "3 Nov, 12:48 am"
 * - with a date-only flag → "3 Nov"
 */
export function formatIst(value, { withDate = 'auto' } = {}) {
  if (!value) return DASH;
  const date = new Date(value);
  if (!isValidDate(date)) return DASH;
  const ist = toIst(date);
  const hours24 = ist.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const meridiem = hours24 < 12 ? 'am' : 'pm';
  const time = `${hours12}:${minutes} ${meridiem}`;

  if (withDate === false) return time;
  if (withDate === true) return `${formatIstDate(value)}, ${time}`;

  const now = new Date();
  const sameDay =
    ist.getFullYear() === now.getFullYear() &&
    ist.getMonth() === now.getMonth() &&
    ist.getDate() === now.getDate();
  return sameDay ? time : `${formatIstDate(value)}, ${time}`;
}

/** "3 Nov" — the IST calendar day of a timestamp. */
export function formatIstDate(value) {
  if (!value) return DASH;
  const date = new Date(value);
  if (!isValidDate(date)) return DASH;
  const ist = toIst(date);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${ist.getDate()} ${months[ist.getMonth()]}`;
}

/**
 * "12 min ago", "3 h ago", "just now". Used for the age of a reading.
 */
export function formatAgo(value, { now = new Date() } = {}) {
  if (!value) return DASH;
  const date = new Date(value);
  if (!isValidDate(date)) return DASH;
  const mins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (mins < 0) return 'just now';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
}

/**
 * "₹1,240" — rupees with Indian digit grouping. null → em dash, never ₹0
 * for an unknown value.
 */
export function formatInr(inr) {
  if (inr === null || inr === undefined || Number.isNaN(Number(inr))) return DASH;
  const n = Math.round(Number(inr));
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * Plain-English likelihood.
 * - with a count → "18 of 24 times"
 * - else probability ≥ 0.6 → "likely"
 * - 0.3–0.6 → "possible"
 * - below 0.3 → null, so the caller hides the line instead of showing a guess
 */
export function formatProbability(probability, { count = null, total = null } = {}) {
  if (count !== null && total !== null) return `${count} of ${total} times`;
  if (probability === null || probability === undefined) return null;
  const p = Number(probability);
  if (Number.isNaN(p)) return null;
  if (p >= 0.6) return 'likely';
  if (p >= 0.3) return 'possible';
  return null;
}

/** "1,240" — a plain grouped number with no unit. */
export function formatNumber(value, { digits = 0 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return DASH;
  const n = Number(value);
  const rounded = digits > 0 ? Number(n.toFixed(digits)) : Math.round(n);
  return rounded.toLocaleString('en-IN');
}

/** "Not measured yet" — the honest words for a missing number. */
export const NOT_MEASURED = 'Not measured yet';

/** "Not received" — when a sensor has never sent a value. */
export const NOT_RECEIVED = 'Not received';

/* The one place a raw code becomes words. Re-exported here so the redesign
   surfaces reach for the same helper. */
export { humanizeCode } from '../format.js';
