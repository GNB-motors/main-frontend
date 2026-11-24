const IST_OFFSET = '+05:30';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_MS = 7 * 24 * 3600 * 1000;

/**
 * The selected dates as instants the idle history endpoint reads the same way
 * as /intelligence/instances: a date-only `from` is the start of that IST day
 * and a date-only `to` is its last millisecond. Sent bare, the history
 * endpoint reads them as UTC midnight and drops most of the last day.
 */
export function istWindow(from, to, now = Date.now()) {
  const start = from
    ? DATE_ONLY.test(from)
      ? `${from}T00:00:00.000${IST_OFFSET}`
      : from
    : new Date(now - WEEK_MS).toISOString();
  const end = to ? (DATE_ONLY.test(to) ? `${to}T23:59:59.999${IST_OFFSET}` : to) : undefined;
  return { from: start, to: end };
}

/**
 * Idles still running that started inside the window. The history endpoint
 * returns finished stops only, while the idle-moments log also lists running
 * ones; adding these makes the summary and the log count the same stops.
 */
export function openIdlesInWindow(live, window) {
  const start = new Date(window.from).getTime();
  const end = window.to ? new Date(window.to).getTime() : Infinity;
  return (live || []).filter((row) => {
    if (row?.endAt) return false;
    const at = new Date(row?.startAt).getTime();
    return Number.isFinite(at) && at >= start && at <= end;
  });
}
