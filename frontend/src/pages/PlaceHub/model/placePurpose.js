/**
 * Why a place is drawn the way it is — the colour on the map and the key in
 * the legend. A theft seen at a place outranks what the place is: that is the
 * story the fleet needs.
 */
import { RISK_COLOR } from '../placeHubStyle.js';

export const PURPOSE_COLOR = {
  theft: RISK_COLOR,
  pump: '#2563eb',
  general: '#eab308',
};

export const PURPOSE_LABEL = {
  theft: 'Theft seen',
  pump: 'Fuel pump',
  general: 'Other',
};

/** The site's own type: the facility's when it has one, the site's otherwise. */
function siteTypeOf(site) {
  return site?.facility?.siteType || site?.siteType || null;
}

/**
 * 'theft' when theft was seen there, 'pump' when it is a fuel pump and
 * 'general' for everything else. An unknown type is never read as a pump.
 */
export function purposeOf(site) {
  const incidents = Number(site?.risk?.theftIncidents) || 0;
  if (incidents > 0) return 'theft';
  if (siteTypeOf(site) === 'FUEL_PUMP') return 'pump';
  return 'general';
}

/** The colour a purpose is drawn in; anything unknown falls back to general. */
export function purposeColor(purpose) {
  return PURPOSE_COLOR[purpose] || PURPOSE_COLOR.general;
}
