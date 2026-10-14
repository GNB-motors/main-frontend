export const getIntervalSource = (r) => {
  if (!r) return null;
  const s =
    r.routeSource?.name ||
    r.routeSource?.city ||
    (typeof r.routeSource === 'string' ? r.routeSource : null) ||
    r.source?.name ||
    r.source?.city ||
    (typeof r.source === 'string' ? r.source : null) ||
    r.startFuelLogId?.routeSource?.name ||
    r.startFuelLogId?.routeSource?.city ||
    (typeof r.startFuelLogId?.routeSource === 'string' ? r.startFuelLogId.routeSource : null) ||
    r.endFuelLogId?.routeSource?.name ||
    r.endFuelLogId?.routeSource?.city ||
    (typeof r.endFuelLogId?.routeSource === 'string' ? r.endFuelLogId.routeSource : null) ||
    r.tripId?.routeSource?.name ||
    (typeof r.tripId?.routeSource === 'string' ? r.tripId.routeSource : null) ||
    r.trip?.routeSource?.name ||
    (typeof r.trip?.routeSource === 'string' ? r.trip.routeSource : null);
  return s ? String(s).trim() : null;
};

export const getIntervalDestination = (r) => {
  if (!r) return null;
  const d =
    r.routeDestination?.name ||
    r.routeDestination?.city ||
    (typeof r.routeDestination === 'string' ? r.routeDestination : null) ||
    r.destination?.name ||
    r.destination?.city ||
    (typeof r.destination === 'string' ? r.destination : null) ||
    r.endFuelLogId?.routeDestination?.name ||
    r.endFuelLogId?.routeDestination?.city ||
    (typeof r.endFuelLogId?.routeDestination === 'string'
      ? r.endFuelLogId.routeDestination
      : null) ||
    r.startFuelLogId?.routeDestination?.name ||
    r.startFuelLogId?.routeDestination?.city ||
    (typeof r.startFuelLogId?.routeDestination === 'string'
      ? r.startFuelLogId.routeDestination
      : null) ||
    r.tripId?.routeDestination?.name ||
    (typeof r.tripId?.routeDestination === 'string' ? r.tripId.routeDestination : null) ||
    r.trip?.routeDestination?.name ||
    (typeof r.trip?.routeDestination === 'string' ? r.trip.routeDestination : null);
  return d ? String(d).trim() : null;
};

export const formatIntervalRoute = (r) => {
  const src = getIntervalSource(r);
  const dest = getIntervalDestination(r);

  if (src && dest) return `${src} → ${dest}`;
  if (src) return `${src} → —`;
  if (dest) return `— → ${dest}`;

  // Never fall back to pump location!
  return '—';
};
