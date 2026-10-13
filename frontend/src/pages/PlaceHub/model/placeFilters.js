import { num } from '../../../utils/formatMoney.js';
import { SET_ASIDE, placeTypeLabel } from './placeGroups.js';

function inGroup(p, group) {
  if (group === 'all') return !SET_ASIDE.has(p.group);
  if (group === 'risk') return Boolean(p.risk) && p.group !== 'rejected';
  return p.group === group;
}

/**
 * "All" means every confirmed place. Suggestions waiting for an answer can run
 * into the hundreds, so they live only under "To review" and never crowd it;
 * places answered "not a place" wait under their own chip, to be undone.
 */
export function filterPlaces(places, { group = 'all', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return places.filter((p) => {
    if (!inGroup(p, group)) return false;
    if (!q) return true;
    return [p.name, p.subtitle, placeTypeLabel(p.type)]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
}

export function countByGroup(places) {
  const counts = { all: 0, risk: 0 };
  for (const p of places) {
    counts[p.group] = (counts[p.group] || 0) + 1;
    if (!SET_ASIDE.has(p.group)) counts.all += 1;
    if (inGroup(p, 'risk')) counts.risk += 1;
  }
  return counts;
}

/**
 * The line above a suggestion list: what Low evidence means, and when only the
 * busiest are loaded, how many there are in all. `sizes` maps group → [loaded, total].
 */
export function reviewNoteFor(group, sizes = {}) {
  const [loaded = 0, total = 0] = sizes[group] || [];
  const more =
    total > loaded ? `Showing the ${num(loaded)} busiest of ${num(total)} suggestions.` : '';
  if (group === 'review') return more || null;
  if (group !== 'low') return null;
  return [
    'Nothing names these places yet and no trip ends at them: seen too rarely, or a drop town no truck has stopped at.',
    'One moves to To review by itself once it can be named or a trip ends there.',
    more,
  ]
    .filter(Boolean)
    .join(' ');
}

export function placeTotals(places) {
  const confirmed = places.filter((p) => p.status === 'CONFIRMED');
  return {
    places: confirmed.length,
    warehouses: confirmed.filter((p) => p.group === 'warehouse').length,
    zones: confirmed.filter((p) => p.group === 'zone').length,
    toReview: places.filter((p) => p.status === 'PROPOSED').length,
  };
}
