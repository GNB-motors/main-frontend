import { effectiveType, typeLabel } from './siteType.js';

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

/** Status in plain words with its reserved tone. */
export function placeState(site) {
  if (!site) return { key: 'unknown', label: '—', tone: 'neutral' };
  if (site.status === 'REJECTED') return { key: 'rejected', label: 'Not a place', tone: 'neutral' };
  const conflict = site.engine?.evidenceLevel === 'CONFLICT';
  if (site.status === 'CONFIRMED')
    return conflict
      ? { key: 'confirmed', label: 'Confirmed · data disagrees', tone: 'warn' }
      : { key: 'confirmed', label: 'Confirmed', tone: 'ok' };
  return { key: 'review', label: 'Needs your answer', tone: 'warn' };
}

export function hasRisk(site) {
  const r = site?.risk || {};
  return (r.theftIncidents || 0) + (r.unauthRefuelIncidents || 0) > 0;
}

/** A name a person can read: the given name, else what it is and where. */
export function placeTitle(site) {
  if (site?.name) return site.name;
  const { type } = effectiveType(site);
  const locality = site?.address?.locality;
  const what = type === 'UNKNOWN' ? 'Unnamed stop' : typeLabel(type);
  return locality ? `${what}, ${locality}` : what;
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
  if (theft) parts.push(`${theft} fuel theft report${theft === 1 ? '' : 's'}`);
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
