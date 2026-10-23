import { formatInIST } from '../../utils/dateUtils';
import { timeAgo } from '../../utils/formatters';

export const formatIST = (utcStr) => formatInIST(utcStr, 'DD MMM YYYY, hh:mm A [IST]') ?? '—';

export const formatRelativeIST = (utcStr) => (utcStr ? timeAgo(utcStr) : null);

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
