import { formatInIST, istDayEndISO, istDayStartISO, istDayString } from '../../../utils/dateUtils';

export const COLUMN_COUNT = 15;
export const PAGE_SIZE = 10;

export const formatNumber = (value, digits = 0) =>
  typeof value === 'number'
    ? value.toLocaleString('en-IN', { maximumFractionDigits: digits })
    : '—';

export const formatCurrency = (value) =>
  typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : '—';

export const formatDate = (value) => (value && formatInIST(value, 'DD MMM YYYY')) || '—';

// Filters hand over "YYYY-MM-DD"; anything else is read as an instant and
// reduced to its IST calendar day.
const asIstDay = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : istDayString(value));

export const toStartOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return istDayStartISO(asIstDay(dateStr)) ?? undefined;
};

export const toEndOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return istDayEndISO(asIstDay(dateStr)) ?? undefined;
};
