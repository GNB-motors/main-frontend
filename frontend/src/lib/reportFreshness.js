/**
 * How far behind a report's newest source record is.
 *
 * Reports read records people enter by hand (fuel bills, cycles), which can
 * stop arriving without any error — the page then keeps showing the last
 * numbers it had. `meta.dataAsOf` from the API is the newest record in scope;
 * once it is `staleAfterDays` old the page must say so loudly.
 *
 * Pure: unit tests live next to it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const REPORT_STALE_AFTER_DAYS = 3;

/**
 * @param {string|Date|null} dataAsOf newest record time from the API
 * @param {number} [now]
 * @param {number} [staleAfterDays]
 * @returns {{ level: 'none'|'fresh'|'stale', days: number|null }}
 */
export function reportDataAge(
  dataAsOf,
  now = Date.now(),
  staleAfterDays = REPORT_STALE_AFTER_DAYS,
) {
  if (!dataAsOf) return { level: 'none', days: null };
  const t = new Date(dataAsOf).getTime();
  if (Number.isNaN(t)) return { level: 'none', days: null };
  const days = Math.max(0, Math.floor((now - t) / DAY_MS));
  return { level: days >= staleAfterDays ? 'stale' : 'fresh', days };
}

/** "today" / "1 day ago" / "21 days ago" */
export function daysAgoLabel(days) {
  if (days == null) return '';
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
