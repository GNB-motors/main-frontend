import { effectiveType, typeLabel } from './siteType.js';
import { kmLabel } from './unitLabels.js';

/**
 * The question an auto-trip drop puts to a person: trucks loaded somewhere, drove out
 * and turned around here, so it is probably a drop place. Null when no trip did.
 */
export function tripDropNote(site) {
  const t = site?.tripDrops;
  if (!t?.trips) return null;
  const from = (t.from || []).filter(Boolean);
  const where = from.length ? ` from ${from.join(', ')}` : '';
  return `${t.trips} trip${t.trips === 1 ? '' : 's'}${where} turned around here — is this a drop?`;
}

/**
 * Why the system asks about a place a manager already answered: the evidence
 * disagrees, or two answers can't both hold. Null when nothing is open.
 */
export function labelReviewNote(site) {
  const r = site?.labelReview;
  return r?.kind && r.reason ? r.reason : null;
}

/**
 * Status in plain words with its reserved tone.
 *
 * "Confirmed" means a person answered for this place. "Proposed" is the
 * system's own reading — nobody has answered it — so it says so instead of
 * borrowing the word "confirmed". Any other status still asks for an answer.
 */
export function placeState(site) {
  if (!site) return { key: 'unknown', label: '—', tone: 'neutral' };
  if (site.status === 'REJECTED') return { key: 'rejected', label: 'Not a place', tone: 'neutral' };
  const conflict = site.engine?.evidenceLevel === 'CONFLICT';
  if (site.status === 'CONFIRMED')
    return conflict
      ? { key: 'confirmed', label: 'Confirmed · data disagrees', tone: 'warn' }
      : { key: 'confirmed', label: 'Confirmed', tone: 'ok' };
  if (site.status === 'PROPOSED') return { key: 'review', label: 'Proposed', tone: 'warn' };
  return { key: 'review', label: 'Needs your answer', tone: 'warn' };
}

export function hasRisk(site) {
  const r = site?.risk || {};
  return (r.theftIncidents || 0) + (r.unauthRefuelIncidents || 0) > 0;
}

/** Great-circle distance in metres, or null when a point is missing. */
export function distanceM(a, b) {
  const lat1 = Number(a?.lat);
  const lng1 = Number(a?.lng);
  const lat2 = Number(b?.lat);
  const lng2 = Number(b?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** A point in either shape: a merged place or a raw site. */
function pointOf(p) {
  const lat = Number(p?.lat ?? p?.centroidLat);
  const lng = Number(p?.lng ?? p?.centroidLng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** The closest place the fleet can name, as { name, distanceM }. Null when none. */
export function nearestKnownPlace(place, places) {
  const from = pointOf(place);
  if (!from) return null;
  let best = null;
  for (const other of places || []) {
    if (!other?.name || other === place) continue;
    const to = pointOf(other);
    if (!to) continue;
    const d = distanceM(from, to);
    if (d == null) continue;
    if (!best || d < best.distanceM) best = { name: other.name, distanceM: d };
  }
  return best;
}

/**
 * A name a person can read: the given name, else what it is and where. An own
 * yard with no name and no locality says nothing, so it says how far it sits
 * from the nearest place we do know.
 */
export function placeTitle(site, nearest = null) {
  if (site?.name) return site.name;
  const { type } = effectiveType(site);
  const locality = site?.address?.locality;
  const what = type === 'UNKNOWN' ? 'Unnamed stop' : typeLabel(type);
  if (locality) return `${what}, ${locality}`;
  if (type === 'YARD' && nearest?.name)
    return `${what} · ${kmLabel(nearest.distanceM / 1000)} from ${nearest.name}`;
  return what;
}

export function coordsLabel(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function placeSubtitle(site) {
  return (
    site?.address?.formatted ||
    site?.address?.locality ||
    coordsLabel(site?.centroidLat, site?.centroidLng)
  );
}

/** Fuel-risk reports at a place as one sentence, or null when there are none. */
export function riskSentence(risk, formatDate = (d) => d) {
  const theft = risk?.theftIncidents || 0;
  const refuel = risk?.unauthRefuelIncidents || 0;
  if (!theft && !refuel) return null;
  const parts = [];
  // A report is a report. It is not proof, and we do not accuse.
  if (theft) parts.push(`${theft} fuel-loss report${theft === 1 ? '' : 's'}`);
  if (refuel) parts.push(`${refuel} unauthorised refuel${refuel === 1 ? '' : 's'}`);
  const last = risk.lastIncidentAt ? `, last on ${formatDate(risk.lastIncidentAt)}` : '';
  return `${parts.join(' and ')} here${last}. Watch fills and night halts at this spot.`;
}

/** A place's numbers, engine first, legacy fields as the fallback. */
export function placeStats(site) {
  const st = site?.engine?.stats || {};
  return {
    visits: st.visits ?? site?.visitCount ?? null,
    trucks: st.trucks ?? site?.distinctVehicleCount ?? null,
    medianDwellMin: st.medianDwellMin ?? site?.medianDwellMin ?? null,
    p90DwellMin: st.p90DwellMin ?? site?.p90DwellMin ?? null,
    firstSeenAt: st.firstSeenAt ?? site?.firstSeenAt ?? null,
    lastSeenAt: st.lastSeenAt ?? site?.lastSeenAt ?? null,
  };
}
