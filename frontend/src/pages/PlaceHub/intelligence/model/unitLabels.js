export function minutesLabel(m) {
  if (m == null || !Number.isFinite(m)) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function hoursLabel(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const h = minutes / 60;
  return h < 100 ? `${Math.round(h * 10) / 10} h` : `${Math.round(h)} h`;
}

export function kmLabel(km) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}
