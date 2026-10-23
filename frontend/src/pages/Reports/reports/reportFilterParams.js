/**
 * The shared report filter contract.
 *
 * Every consolidated report reads and writes the same flat filter schema, and
 * the URL is the only owner of it. A report therefore holds no filter state of
 * its own: it renders <ReportFilterBar/> and reads what this module hands back,
 * so a filtered report can be copied out of the address bar and shared as-is.
 *
 * The shape deliberately matches the Fuel & Mileage hub (/mileage), which
 * already keeps its range and search in the URL — one link grammar across the
 * two report surfaces. Preset keys come from there too, so a "30 days" link
 * means the same thing in both places.
 *
 *   loc     operating location id — the app-wide X-Branch-Id scope, pinned
 *   dates   a quick range: TODAY | YESTERDAY | 7DAYS | 30DAYS | MONTH | 90DAYS
 *   from    first calendar day, YYYY-MM-DD (IST); overrides `dates`
 *   to      last calendar day, YYYY-MM-DD (IST)
 *   search  free text
 *   vehicle vehicle id
 *   driver  driver / employee id
 *   status  report-specific enum (Mileage Report: COMPLETED | ONGOING)
 *
 * `vehicleLabel` / `driverLabel` carry the picker's text alongside the id.
 * They are presentation only — the id is what filters — but without them a
 * shared link would read "All vehicles" while filtering to one vehicle, because
 * the picker's options are fetched from the server as the user types.
 *
 * Every param is optional and absent means "not filtered" — including the
 * range, so a report opened bare still shows all time rather than silently
 * growing a default window. Unset entity filters surface as the 'all'
 * sentinel the existing pickers and compactParams() already understand.
 *
 * Pure: unit tests live next to it.
 */

import { HUB_DATE_PRESETS, presetRange } from '../../Mileage/mileageDates';
import { compactParams } from './reportFilters';

export const ALL = 'all';

/** Quick ranges offered above the date inputs. */
export const REPORT_RANGE_PRESETS = HUB_DATE_PRESETS;

/** Every param the shared bar owns. */
export const REPORT_FILTER_PARAMS = [
  'manufacturer',
  'loc',
  'dates',
  'from',
  'to',
  'search',
  'vehicle',
  'vehicleLabel',
  'driver',
  'driverLabel',
  'status',
];

export const EMPTY_FILTERS = {
  manufacturer: '',
  loc: '',
  dates: '',
  from: '',
  to: '',
  search: '',
  vehicle: ALL,
  vehicleLabel: '',
  driver: ALL,
  driverLabel: '',
  status: '',
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const asParams = (search) =>
  search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
const readDay = (raw) => (ISO_DAY.test(raw || '') ? raw : '');
const isPreset = (key) => REPORT_RANGE_PRESETS.some((preset) => preset.key === key);

/**
 * The filters a URL describes. Picked dates win over a quick range; anything
 * malformed falls back to unset rather than throwing, so a hand-edited link
 * still renders the report.
 */
export function readFilterParams(search) {
  const params = asParams(search);
  return {
    manufacturer: params.get('manufacturer') || '',
    loc: params.get('loc') || '',
    dates: isPreset(params.get('dates')) ? params.get('dates') : '',
    from: readDay(params.get('from')),
    to: readDay(params.get('to')),
    search: params.get('search') || '',
    vehicle: params.get('vehicle') || ALL,
    vehicleLabel: params.get('vehicleLabel') || '',
    driver: params.get('driver') || ALL,
    driverLabel: params.get('driverLabel') || '',
    status: params.get('status') || '',
  };
}

/**
 * `search` with `patch` merged in and every filter param serialised canonically.
 * Params that drop back to their unset value are deleted rather than written
 * empty, so the bar never leaves `?vehicle=all` behind in a shared link.
 *
 * Params outside REPORT_FILTER_PARAMS (`report`, and anything a host page
 * owns) are carried through untouched.
 */
export function writeFilterParams(search, patch) {
  const next = new URLSearchParams(asParams(search).toString());
  const merged = { ...readFilterParams(next), ...patch };

  // Picking dates retires the quick range, and choosing a quick range retires
  // the picked dates — same precedence the Fuel & Mileage hub uses.
  if ('from' in patch || 'to' in patch) {
    const range = { from: merged.from, to: merged.to };
    if (range.from || range.to) merged.dates = '';
  } else if ('dates' in patch) {
    merged.from = '';
    merged.to = '';
  }

  REPORT_FILTER_PARAMS.forEach((key) => {
    const value = merged[key];
    if (value === undefined || value === null || value === '' || value === ALL) next.delete(key);
    else next.set(key, String(value));
  });

  return next;
}

/**
 * The {from,to} the current filters select, or an empty range when nothing is
 * filtered. A half-picked range is ignored so a link never queries from
 * nowhere.
 */
export function resolveRange(filters, now = new Date()) {
  const { dates, from, to } = filters || {};
  if (from && to && from <= to) return { from, to };
  if (dates) return presetRange(dates, now);
  return { from: '', to: '' };
}

/** The quick-range key the current filters are showing, or null. */
export function activePresetId(filters) {
  const { dates, from, to } = filters || {};
  if (!dates || from || to) return null;
  return dates;
}

/** How many filters are narrowing the result — drives the "N filters" badge. */
export function countActiveFilters(filters, now = new Date()) {
  const { search, status, vehicle, driver, manufacturer } = filters || {};
  const range = resolveRange(filters, now);
  return (
    (manufacturer ? 1 : 0) +
    (range.from ? 1 : 0) +
    (search ? 1 : 0) +
    (status ? 1 : 0) +
    (vehicle && vehicle !== ALL ? 1 : 0) +
    (driver && driver !== ALL ? 1 : 0)
  );
}

/**
 * The API params a filter set stands for. Dates become IST day bounds with an
 * explicit offset, and unset filters are dropped, so the request is identical
 * to what a report built by hand would have sent.
 */
export function toRequestParams(filters, now = new Date()) {
  const { search, vehicle, driver, status, manufacturer } = filters || {};
  const { from, to } = resolveRange(filters, now);
  return compactParams({
    manufacturer: manufacturer || undefined,
    startDate: from ? `${from}T00:00:00.000+05:30` : undefined,
    endDate: to ? `${to}T23:59:59.999+05:30` : undefined,
    search: search || undefined,
    vehicleId: vehicle && vehicle !== ALL ? vehicle : undefined,
    driverId: driver && driver !== ALL ? driver : undefined,
    status: status || undefined,
  });
}
