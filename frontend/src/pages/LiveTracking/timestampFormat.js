import { formatInIST } from '../../utils/dateUtils';
import { timeAgo } from '../../utils/formatters';

export const formatIST = (utcStr) => formatInIST(utcStr, 'DD MMM YYYY, hh:mm A [IST]') ?? '—';

export const formatRelativeIST = (utcStr) => (utcStr ? timeAgo(utcStr) : null);

export const formatCardTime = (utcStr) => formatInIST(utcStr, 'h:mmA, DD MMM YYYY') ?? '—';

export const formatISTTime = (d) => {
  if (!d) return '—';
  const dateObj = d instanceof Date ? d : new Date(d);
  return dateObj
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase()
    .replace(' ', '');
};

export const formatISTDate = (d) => {
  if (!d) return '—';
  const dateObj = d instanceof Date ? d : new Date(d);
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
