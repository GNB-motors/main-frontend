import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extending dayjs is global and idempotent — safe to import from many modules.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const IST_ZONE = 'Asia/Kolkata';

export const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);

export const formatIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—';
};

export const formatRelativeIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.fromNow() : null;
};

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
