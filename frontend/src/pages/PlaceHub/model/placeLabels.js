import { isNum } from './placeGeometry.js';

export function radiusLabel(m) {
  if (!isNum(m) || m <= 0) return '—';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export function durationLabel(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function hoursLabel(hours) {
  const h = Number(hours) || 0;
  return h < 10 ? `${h.toFixed(1)} h` : `${Math.round(h).toLocaleString('en-IN')} h`;
}

export function coordsLabel(lat, lng) {
  return isNum(lat) && isNum(lng) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '—';
}
