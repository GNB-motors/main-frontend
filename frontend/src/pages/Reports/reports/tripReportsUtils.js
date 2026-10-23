// Shared helpers for the Trip Economics reports (oil & average, fuel cycles,
// non-business, running cost). Their APIs return every row (capped at 5,000)
// in one response and reject unknown params, so search and paging happen here
// over the loaded set. They take `from`/`to` (per the Trip Economics API
// contract), not `startDate`/`endDate`.
import { formatNumber, formatCurrency, formatDate } from './mileageIntervalReportUtils';
import {
  REPORT_PAGE_SIZE,
  compactParams,
  istDayEnd,
  istDayStart,
  istDaysAgo,
  istToday,
  rangeLabel,
} from './reportFilters';
import { ReportsService } from '../ReportsService.js';
import { exportFilteredReportCsv } from '../../../utils/reportCsvExport';

export { formatNumber, formatCurrency, formatDate };

export const fmtKm = (v) => (typeof v === 'number' ? `${v.toFixed(1)} km` : '—');
export const fmtL = (v) => (typeof v === 'number' ? `${v.toFixed(2)} L` : '—');
export const fmtPct = (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '—');

export const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export const buildTripFilterParams = ({
  from,
  to,
  vehicleId,
  status,
  groupBy,
  manufacturer,
} = {}) =>
  compactParams({
    from: istDayStart(from),
    to: istDayEnd(to),
    vehicleId,
    status,
    groupBy,
    manufacturer,
  });

export const EMPTY_RANGE = { from: '', to: '' };

/** The last 30 IST days — what these backends cover anyway when no dates are sent. */
export const defaultTripRange = () => ({ from: istDaysAgo(30), to: istToday() });

export const rangeFilterCount = (range, defaults = EMPTY_RANGE) =>
  (range.from !== defaults.from ? 1 : 0) + (range.to !== defaults.to ? 1 : 0);

/** A copy of `rows`, newest `dateOf(row)` first; undated rows go last. */
export function newestFirst(rows, dateOf) {
  const timed = (Array.isArray(rows) ? rows : []).map((row) => {
    const value = dateOf(row);
    const t = value ? new Date(value).getTime() : NaN;
    return { row, t: Number.isFinite(t) ? t : -Infinity };
  });
  timed.sort((a, b) => (a.t === b.t ? 0 : b.t > a.t ? 1 : -1));
  return timed.map(({ row }) => row);
}

/** Sum of `valueOf(row)`; null when no row carries a number. */
export function sumOf(rows, valueOf) {
  let total = null;
  rows.forEach((row) => {
    const v = numOrNull(valueOf(row));
    if (v != null) total = (total ?? 0) + v;
  });
  return total;
}

const ROW_CAP = 5000;

/**
 * "11–20 of 54 trips", plus a note when the API stopped at its 5,000-record
 * cap. `capNoun` names what was capped (running cost caps trips, not groups).
 */
export function tripReportSummary({ page, total, noun, truncated = false, capNoun = 'rows' }) {
  const base = `${rangeLabel(page, REPORT_PAGE_SIZE, total)} ${noun}`;
  return truncated
    ? `${base} · capped at ${formatNumber(ROW_CAP)} ${capNoun} — narrow the dates to see the rest`
    : base;
}

/**
 * Export through the report's server /export endpoint, or from `clientRows`
 * when the table is narrowed by something only the browser applies (the
 * search box, a client-only status), so the file matches what is on screen.
 * `columns` are [header, (row) => value] pairs for the client-side file.
 * exportFilteredReportCsv owns the success / failure toasts.
 */
export function exportTripReport({
  extension,
  clientRows = null,
  columns,
  endpoint,
  params,
  filenamePrefix,
  errorMessage,
}) {
  const common = { filenamePrefix, extension, errorMessage };
  if (clientRows) {
    return exportFilteredReportCsv({
      ...common,
      headers: columns.map(([header]) => header),
      rows: clientRows,
      mapRow: (row) => columns.map(([, valueOf]) => valueOf(row) ?? ''),
    });
  }
  return exportFilteredReportCsv({
    ...common,
    fetchExport: (filters) => ReportsService.exportReportCsv(endpoint, filters),
    filters: params,
  });
}
