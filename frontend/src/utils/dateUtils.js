/**
 * dateUtils.js
 * Central date/time formatting utility for the main-frontend.
 *
 * WHY THIS EXISTS:
 * The backend stores all timestamps in UTC (ISO 8601 strings like
 * "2024-01-15T10:30:00.000Z"). Without an explicit timeZone option,
 * JS Date methods (toLocaleDateString, toLocaleString, toTimeString)
 * use the browser/OS local timezone. On a UTC server or UTC-configured
 * browser, every time would appear 5h 30min behind IST.
 *
 * ALL display formatting of dates/times should go through this file.
 * Never use new Date(x).toLocaleDateString() directly in components.
 */

const IST = 'Asia/Kolkata';

/**
 * Format a UTC timestamp to IST date only.
 * e.g. "15 Jan 2024"
 */
export const formatDateIST = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: IST,
  });
};

/**
 * Format a UTC timestamp to IST date with long month name.
 * e.g. "January 15, 2024"
 */
export const formatDateLongIST = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: IST,
  });
};

/**
 * Format a UTC timestamp to IST date + time.
 * e.g. "15 Jan 2024, 03:30 PM"
 */
export const formatDateTimeIST = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
};

/**
 * Format a UTC timestamp to IST date + time with long month.
 * e.g. "January 15, 2024 at 03:30 PM"
 * Used in TripDetailPage / WeightSlipTripDetailPage.
 */
export const formatDateTimeLongIST = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST,
  });
};

/**
 * Extract IST date string (YYYY-MM-DD) from a UTC ISO timestamp.
 * Used when splitting a UTC timestamp into a date-only value for display.
 * e.g. "2024-01-15T10:30:00.000Z" → "2024-01-15" (in IST, not UTC)
 */
export const toISTDateString = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  // Get IST parts
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const p = {};
  parts.forEach(({ type, value }) => {
    p[type] = value;
  });
  return `${p.year}-${p.month}-${p.day}`;
};

/**
 * Extract IST time string (HH:MM:SS) from a UTC ISO timestamp.
 * Replaces toTimeString() which uses the OS local timezone.
 */
export const toISTTimeString = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const p = {};
  parts.forEach(({ type, value }) => {
    p[type] = value;
  });
  return `${p.hour}:${p.minute}:${p.second}`;
};

// ── IST arithmetic and pattern formatting ─────────────────────────────────
// IST is UTC+05:30 all year (no DST), so shifting by the offset and reading
// the UTC fields gives the IST wall clock without a timezone library.

const IST_OFFSET = '+05:30';
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_STRING = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (n) => String(n).padStart(2, '0');

const toTime = (input) => {
  if (input === null || input === undefined || input === '') return NaN;
  return input instanceof Date ? input.getTime() : new Date(input).getTime();
};

/**
 * Format an instant in IST with a dayjs-style pattern. Tokens: YYYY YY MMM MM
 * DD D HH hh h mm ss A a, and [literal]. null for missing/invalid input.
 * e.g. formatInIST('2026-10-08T09:00:00Z', 'D MMM, h:mm a') → "8 Oct, 2:30 pm"
 */
export const formatInIST = (input, pattern) => {
  const t = toTime(input);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + IST_OFFSET_MS);
  const h24 = d.getUTCHours();
  const h12 = h24 % 12 || 12;
  const values = {
    YYYY: String(d.getUTCFullYear()),
    YY: String(d.getUTCFullYear()).slice(-2),
    MMM: MONTHS[d.getUTCMonth()],
    MM: pad2(d.getUTCMonth() + 1),
    DD: pad2(d.getUTCDate()),
    D: String(d.getUTCDate()),
    HH: pad2(h24),
    hh: pad2(h12),
    h: String(h12),
    mm: pad2(d.getUTCMinutes()),
    ss: pad2(d.getUTCSeconds()),
    A: h24 < 12 ? 'AM' : 'PM',
    a: h24 < 12 ? 'am' : 'pm',
  };
  return pattern.replace(/\[([^\]]*)]|YYYY|YY|MMM|MM|DD|D|HH|hh|h|mm|ss|A|a/g, (token, literal) =>
    literal !== undefined ? literal : values[token],
  );
};

/** The IST calendar date ("YYYY-MM-DD") of an instant; today when omitted. */
export const istDayString = (input = new Date()) => formatInIST(input, 'YYYY-MM-DD');

/** Calendar arithmetic on a "YYYY-MM-DD" day: shiftDay('2026-03-01', -1) → '2026-02-28'. */
export const shiftDay = (day, days) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** 0 = Sunday … 6 = Saturday, for a "YYYY-MM-DD" calendar day. */
export const weekdayOf = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();

/**
 * An IST wall-clock value — "YYYY-MM-DD", "YYYY-MM-DDTHH:mm" (datetime-local)
 * or with ":ss" — as a UTC ISO string. null when unreadable.
 */
export const istWallClockToISO = (value) => {
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value || '');
  if (!m) return null;
  const [, day, hh = '00', mm = '00', ss = '00'] = m;
  return new Date(`${day}T${hh}:${mm}:${ss}.000${IST_OFFSET}`).toISOString();
};

/** First instant of an IST calendar day, as ISO: '2026-10-08' → '2026-10-07T18:30:00.000Z'. */
export const istDayStartISO = (day) => (DAY_STRING.test(day || '') ? istWallClockToISO(day) : null);

/** Last millisecond of an IST calendar day, as ISO: '2026-10-08' → '2026-10-08T18:29:59.999Z'. */
export const istDayEndISO = (day) =>
  DAY_STRING.test(day || '') ? new Date(`${day}T23:59:59.999${IST_OFFSET}`).toISOString() : null;

/** Whole days from `from` to `to`, truncated toward zero. NaN if either is invalid. */
export const daysBetween = (from, to) => Math.trunc((toTime(to) - toTime(from)) / DAY_MS);
