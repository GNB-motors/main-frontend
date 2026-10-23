import { formatInIST, istDayString, shiftDay } from '../../utils/dateUtils';

/**
 * One date range for the whole hub. Quick choices plus any from–to; the
 * unified feed scans every bill and fill in the range, so it is never
 * unbounded.
 */
export const HUB_DATE_PRESETS = [
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: '7DAYS', label: '7 days' },
  { key: '30DAYS', label: '30 days' },
  { key: 'MONTH', label: 'This month' },
  { key: '90DAYS', label: '90 days' },
];

export const DEFAULT_PRESET = '30DAYS';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Preset → inclusive { from, to } IST calendar dates (YYYY-MM-DD). */
export function presetRange(key, now = new Date()) {
  const to = istDayString(now);
  switch (key) {
    case 'TODAY':
      return { from: to, to };
    case 'YESTERDAY': {
      const y = shiftDay(to, -1);
      return { from: y, to: y };
    }
    case '7DAYS':
      return { from: shiftDay(to, -6), to };
    case 'MONTH':
      return { from: `${to.slice(0, 8)}01`, to };
    case '90DAYS':
      return { from: shiftDay(to, -89), to };
    case '30DAYS':
    default:
      return { from: shiftDay(to, -29), to };
  }
}

/**
 * URL → the hub's range. `?dates=7DAYS`, or `?from=…&to=…` for picked dates;
 * anything unreadable falls back to the default 30 days.
 */
export function hubRangeFromParams(params, now = new Date()) {
  const from = params.get('from');
  const to = params.get('to');
  if (ISO_DAY.test(from || '') && ISO_DAY.test(to || '') && from <= to) {
    return { preset: null, range: { from, to } };
  }
  const key = params.get('dates');
  const preset = HUB_DATE_PRESETS.some((p) => p.key === key) ? key : DEFAULT_PRESET;
  return { preset, range: presetRange(preset, now) };
}

/** "9 Oct 2026", or "10 Sep – 9 Oct 2026". */
export function rangeLabel({ from, to }) {
  if (from === to) return formatInIST(to, 'D MMM YYYY');
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${formatInIST(from, sameYear ? 'D MMM' : 'D MMM YYYY')} – ${formatInIST(to, 'D MMM YYYY')}`;
}

/** Calendar range → API params: start and end of the IST day, as ISO. */
export function rangeToParams({ from, to, manufacturer }) {
  const params = manufacturer ? { manufacturer } : {};
  if (from) params.from = new Date(`${from}T00:00:00.000+05:30`).toISOString();
  if (to) params.to = new Date(`${to}T23:59:59.999+05:30`).toISOString();
  return params;
}
