import { decodePolyline6 } from '../../lib/polyline6.js';
import { placeTitle } from '../PlaceHub/intelligence/model/siteSummary.js';

const point = (site) => site && Number.isFinite(site.lat) && Number.isFinite(site.lng) ? { lat: site.lat, lng: site.lng } : null;

export function routeFocusModel(leg, sites = new Map(), detail = null) {
  if (!leg) return null;
  const data = String(detail?._id) === String(leg._id) ? detail : null;
  const path = data?.path || leg.path;
  // A straight link between two sites is not a matched road.
  const encoded = ['DRIVEN', 'ENGINE'].includes(path?.source)
    ? path.geomSegments?.length ? path.geomSegments : path.overviewSegments || leg.path?.overviewSegments || [] : [];
  let segments = encoded.map(decodePolyline6).filter((segment) => segment.length > 1);
  const from = sites.get(String(leg.fromSiteId));
  const to = sites.get(String(leg.toSiteId));
  const origin = point(from);
  const destination = point(to);
  if (segments.length && origin && destination) {
    const distance = (a, b) => (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;
    const first = segments[0][0];
    const last = segments.at(-1).at(-1);
    if (distance(first, origin) + distance(last, destination) > distance(last, origin) + distance(first, destination)) {
      segments = [...segments].reverse().map((segment) => [...segment].reverse());
    }
  }
  const names = leg.title?.split(' → ') || [];
  const start = { name: from ? placeTitle(from) : names[0] || 'Start place', position: point(from) || segments[0]?.[0] || null };
  const end = { name: to ? placeTitle(to) : names[1] || 'End place', position: point(to) || segments.at(-1)?.at(-1) || null };
  return { id: String(leg._id), segments, start, end, source: segments.length ? path.source : 'NONE',
    points: [...segments.flat(), start.position, end.position].filter(Boolean) };
}
