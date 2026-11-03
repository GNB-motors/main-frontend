/**
 * Toll plazas on the Places map — pure. The plazas this org's trucks visited are always shown; every
 * other plaza in view only when the "All tolls" toggle is on. One marker per plaza either way.
 */
import { inr } from '../../../utils/formatMoney';
import { fmtDay } from '../../AutoTrips/autoTripFormat';

/** How each visit signal reads in the popup. */
const SIGNAL_TEXT = {
  STOP: 'stopped here',
  TRIP: 'drove through on a trip',
  ROUTE: 'on a route the fleet drives',
  SITE: 'one of your places',
};
/** Where a plaza is known from. TOLLGURU: found by asking TollGuru, on no map or list. */
const SOURCE_LABEL = {
  NHAI: 'NHAI',
  STATE: 'State list',
  OSM: 'OpenStreetMap only',
  TOLLGURU: 'Found via TollGuru',
};
const FARE_LABEL = [
  ['multiaxle', '3-axle'],
  ['axle_4_6', '4–6 axle'],
  ['axle_7_plus', '7+ axle'],
  ['bus', '2-axle truck'],
  ['lcv', 'LCV'],
];

/** Visited plazas, plus the not-visited ones in view when `showAll`. Never the same plaza twice. */
export function tollLayerPlazas(visited, inView, showAll) {
  const seen = new Set((visited || []).map((p) => p.id));
  const others = showAll ? (inView || []).filter((p) => !seen.has(p.id)) : [];
  return [...(visited || []), ...others.map((p) => ({ ...p, visited: false }))];
}

/** The popup's lines for one plaza, in reading order. */
export function tollPopupLines(p) {
  const lines = [];
  if (p.visited && p.visits) {
    const how = (p.visits.signals || []).map((s) => SIGNAL_TEXT[s]).filter(Boolean);
    const stops = p.visits.stops
      ? `${p.visits.stops} stop${p.visits.stops === 1 ? '' : 's'}`
      : null;
    const last = p.visits.lastAt ? `last ${fmtDay(p.visits.lastAt)}` : null;
    lines.push(['Your trucks', [how.join(', '), stops, last].filter(Boolean).join(' · ')]);
  } else {
    lines.push(['Your trucks', 'not visited yet']);
  }
  const where = [p.nhNo ? `NH ${p.nhNo}` : null, p.state].filter(Boolean).join(' · ');
  if (where) lines.push(['Road', where]);
  const source = SOURCE_LABEL[p.source] || 'NHAI';
  lines.push(['Source', p.corroborated ? `${source} · gate confirmed on the map` : source]);
  const fares = FARE_LABEL.filter(([k]) => p.fares && p.fares[k] != null).map(
    ([k, label]) => `${label} ${inr(p.fares[k])}`,
  );
  const quoted = p.fares && p.fares.source === 'TOLLGURU';
  lines.push([
    quoted ? 'One way (quote)' : 'One way',
    fares.length ? fares.join(' · ') : 'no fare yet',
  ]);
  return lines;
}
