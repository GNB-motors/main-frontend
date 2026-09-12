import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extending dayjs is global and idempotent — safe to import from many modules.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const IST_ZONE = 'Asia/Kolkata';

export const toIST = (utcStr) => {
  if (!utcStr) return null;
  return dayjs.utc(utcStr).tz(IST_ZONE);
};

export const formatRelativeIST = (utcStr) => {
  const d = toIST(utcStr);
  if (!d) return null;
  return d.fromNow();
};

export const formatDateRange = (from, to) => {
  const f = from ? dayjs.utc(from).tz(IST_ZONE).format('DD MMM YY') : '—';
  const t = to ? dayjs.utc(to).tz(IST_ZONE).format('DD MMM YY') : '—';
  return `${f} → ${t}`;
};

export const formatClockIST = (iso) => {
  if (!iso) return null;
  return dayjs.utc(iso).tz(IST_ZONE).format('HH:mm');
};
