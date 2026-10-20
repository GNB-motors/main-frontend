/**
 * Filter and paging helpers shared by every Reports-page report.
 *
 * Dates are whole IST calendar days, sent with an explicit +05:30 offset so
 * the result does not depend on the browser's time zone.
 *
 * Pure: unit tests live next to it.
 */

const IST_OFFSET_MS = 330 * 60 * 1000;

export const REPORT_PAGE_SIZE = 10;

export const istDayStart = (day) => (day ? `${day}T00:00:00.000+05:30` : undefined);
export const istDayEnd = (day) => (day ? `${day}T23:59:59.999+05:30` : undefined);

/** Today's IST calendar day as YYYY-MM-DD. */
export function istToday(now = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The IST calendar day `days` before today, as YYYY-MM-DD. */
export function istDaysAgo(days, now = new Date()) {
  return istToday(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
}

/** Drops unset values so a request never carries an empty filter. */
export function compactParams(params) {
  const out = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    out[key] = value;
  });
  return out;
}

const compact = (s) => s.replace(/[^a-z0-9]/g, '');

/**
 * Case-insensitive substring match of `query` against any of `fields`. Plates
 * also match with spaces and dashes ignored, so "WB 25" finds "WB25R9540".
 */
export function matchesSearch(query, fields) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const qCompact = compact(q);
  return fields.some((field) => {
    if (field === null || field === undefined) return false;
    const value = String(field).toLowerCase();
    return value.includes(q) || (qCompact && compact(value).includes(qCompact));
  });
}

export function pageCount(total, pageSize = REPORT_PAGE_SIZE) {
  return Math.max(1, Math.ceil((total || 0) / pageSize));
}

/** The rows of one page, with the page clamped into range. */
export function pageSlice(rows, page, pageSize = REPORT_PAGE_SIZE) {
  const list = Array.isArray(rows) ? rows : [];
  const safePage = Math.min(Math.max(1, page || 1), pageCount(list.length, pageSize));
  const start = (safePage - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

/** "11–20 of 54" for a page of a list. */
export function rangeLabel(page, pageSize, total) {
  if (!total) return '0';
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}–${end} of ${total.toLocaleString('en-IN')}`;
}
