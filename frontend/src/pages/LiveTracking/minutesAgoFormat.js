import { formatISTDate, formatISTTime } from './timestampFormat.js';

export const formatAgoText = (m) => {
  if (m == null || isNaN(m)) return '—';
  if (m < 1) return 'just now';
  if (m < 60) return `${Math.round(m)} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} hr ago`;
  if (m < 43200) return `${Math.floor(m / 1440)} day${m >= 2880 ? 's' : ''} ago`;
  return `${Math.floor(m / 43200)} months ago`;
};

export const formatDayText = (m) => {
  const d = new Date(Date.now() - (m || 0) * 60000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatFullStamp = (m) => {
  const d = new Date(Date.now() - (m || 0) * 60000);
  return `${formatISTTime(d)}, ${formatISTDate(d)} ${d.getFullYear()}`;
};

export const formatHrsText = (m) => {
  if (!m || isNaN(m)) return '0h 00m';
  return `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;
};
