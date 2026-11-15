/** Decode only explicitly polyline6 geometry. Invalid/truncated data draws nothing. */
export function decodeNavigationPolyline(encoded) {
  if (typeof encoded !== 'string' || !encoded || encoded.length > 4_000_000) return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const points = [];
  const read = () => {
    let value = 0;
    let shift = 0;
    while (index < encoded.length && shift <= 30) {
      const byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) return null;
      value += (byte & 31) * 2 ** shift;
      if (byte < 32) return value % 2 ? -(Math.floor(value / 2) + 1) : value / 2;
      shift += 5;
    }
    return null;
  };
  while (index < encoded.length) {
    const a = read();
    const b = read();
    if (a === null || b === null) return [];
    lat += a;
    lng += b;
    if (Math.abs(lat) > 90e6 || Math.abs(lng) > 180e6) return [];
    points.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }
  return points.length >= 2 ? points : [];
}

export function snapshotRoute(snapshot) {
  return snapshot?.route ?? snapshot?.bundle ?? snapshot;
}

export function plannedPath(snapshot) {
  const route = snapshotRoute(snapshot);
  // A segmented/gapped route must not be joined into a fictional straight road.
  if (route?.geometry?.gaps?.length || route?.geometry?.segments?.length > 1) return [];
  const encoded = route?.polyline6 ?? route?.geometry?.polyline6;
  if (encoded) return decodeNavigationPolyline(encoded);
  const geometry = route?.navigation?.payload?.routes?.[0]?.geometry;
  if (geometry?.type !== 'LineString' || !Array.isArray(geometry.coordinates)) return [];
  if (
    !geometry.coordinates.every(
      (p) =>
        Array.isArray(p) &&
        p.length >= 2 &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1]) &&
        Math.abs(p[0]) <= 180 &&
        Math.abs(p[1]) <= 90,
    )
  )
    return [];
  return geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export const routeVersionOf = (snapshot) => snapshot?.routeVersion ?? snapshot?.version;
export const rowId = (row) => String(row?._id ?? row?.id ?? row?.sessionId ?? '');

export function eligibilityLabel(corridor) {
  if (corridor?.status === 'SUSPENDED') return 'Suspended';
  if (corridor?.eligible === true) return 'Eligible for route validation';
  if (corridor?.eligible === false) return 'Not eligible';
  return 'Not assessed';
}

export function navigationError(error) {
  const status = error?.response?.status ?? error?.status;
  if (status === 401 || status === 403)
    return 'Navigation history is not available to this account.';
  if (status === 404) return 'Navigation history is not available on this server.';
  return 'Could not load navigation history. Try again.';
}
