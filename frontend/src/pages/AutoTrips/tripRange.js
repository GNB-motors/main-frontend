import { toISTDateString } from '../../utils/dateUtils';

/**
 * The Trip list's date range: which trips to show by the time the truck left the
 * pickup. Kept in the URL (?range=7d, or ?range=custom&from=YYYY-MM-DD&to=YYYY-MM-DD)
 * so Back from a trip lands on the same period.
 *
 * Days are IST calendar days whatever the browser's zone, the same days the
 * "Left plant" column prints.
 */

export const RANGE_PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '3m', label: 'Last 3 months' },
];

export const ALL_TIME = { range: 'all' };

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const PRESET_KEYS = new Set(RANGE_PRESETS.map((p) => p.key));

const istStart = (ymd) => new Date(`${ymd}T00:00:00+05:30`);
const istEnd = (ymd) => new Date(`${ymd}T23:59:59.999+05:30`);

const validYmd = (s) =>
  typeof s === 'string' && YMD.test(s) && !Number.isNaN(istStart(s).getTime());

/** Calendar arithmetic on a YYYY-MM-DD, in UTC so no zone can shift the day. */
export function shiftYmd(ymd, { days = 0, months = 0 } = {}) {
  const [y, m, d] = ymd.split('-').map(Number);
  if (months) {
    const first = new Date(Date.UTC(y, m - 1 + months, 1));
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate();
    first.setUTCDate(Math.min(d, lastDay));
    return first.toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** URL → range. Anything malformed reads as All time rather than a broken filter. */
export function readRange(searchParams) {
  const range = searchParams.get('range');
  if (range === 'custom') {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (validYmd(from) && validYmd(to) && from <= to) return { range, from, to };
    return ALL_TIME;
  }
  return PRESET_KEYS.has(range) ? { range } : ALL_TIME;
}

/** Range → URL, leaving every other param alone. All time is the bare URL. */
export function writeRange(searchParams, value) {
  const next = new URLSearchParams(searchParams);
  ['range', 'from', 'to'].forEach((k) => next.delete(k));
  if (value.range && value.range !== 'all') next.set('range', value.range);
  if (value.range === 'custom') {
    next.set('from', value.from);
    next.set('to', value.to);
  }
  return next;
}

/**
 * Range → the list API's { from, to } instants. Presets leave `to` open so a trip
 * that leaves while the page is open still belongs to "Today".
 */
export function rangeToParams(value, now = new Date()) {
  const today = toISTDateString(now);
  switch (value.range) {
    case 'today':
      return { from: istStart(today).toISOString() };
    case '7d':
      return { from: istStart(shiftYmd(today, { days: -6 })).toISOString() };
    case '30d':
      return { from: istStart(shiftYmd(today, { days: -29 })).toISOString() };
    case '3m':
      return { from: istStart(shiftYmd(today, { months: -3 })).toISOString() };
    case 'custom':
      return { from: istStart(value.from).toISOString(), to: istEnd(value.to).toISOString() };
    default:
      return {};
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const shortDay = (ymd, withYear) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
};

/** "Last 7 days", or "3 Oct – 9 Oct" for a custom range ("28 Dec 2025 – 4 Jan 2026" across years). */
export function rangeLabel(value, now = new Date()) {
  if (value.range !== 'custom') {
    return (RANGE_PRESETS.find((p) => p.key === value.range) || RANGE_PRESETS[0]).label;
  }
  if (value.from === value.to) return shortDay(value.from, true);
  const thisYear = toISTDateString(now).slice(0, 4);
  const sameYear = value.from.slice(0, 4) === value.to.slice(0, 4);
  const showYear = !sameYear || value.to.slice(0, 4) !== thisYear;
  return `${shortDay(value.from, showYear)} – ${shortDay(value.to, showYear)}`;
}

/** A local Date from the calendar → its YYYY-MM-DD as the person picked it. */
export function ymdOf(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** YYYY-MM-DD → a local Date at midnight, for handing back to the calendar. */
export function dateOf(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
