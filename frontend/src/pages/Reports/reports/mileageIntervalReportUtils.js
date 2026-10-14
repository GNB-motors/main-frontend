import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST_ZONE = 'Asia/Kolkata';
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

export const formatDate = (value) =>
  value ? dayjs.utc(value).tz(IST_ZONE).format('DD MMM YYYY') : '—';

export const toStartOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).startOf('day').toISOString();
};

export const toEndOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).endOf('day').toISOString();
};
