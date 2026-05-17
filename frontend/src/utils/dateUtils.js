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
  parts.forEach(({ type, value }) => { p[type] = value; });
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
  parts.forEach(({ type, value }) => { p[type] = value; });
  return `${p.hour}:${p.minute}:${p.second}`;
};