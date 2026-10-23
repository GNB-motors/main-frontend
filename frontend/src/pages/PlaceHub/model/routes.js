import { decodePolyline6 } from '../../../lib/polyline6.js';
import { placeTitle } from '../intelligence/model/siteSummary.js';

export const RUN_COLORS = {
  light: ['#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  dark: ['#1c5cab', '#2a78d6', '#5598e7', '#86b6ef', '#b7d3f6'],
};
export const routeWidth = (runs, max) => 2 + 6 * Math.sqrt(Math.max(0, runs) / Math.max(1, max));
export const routeColor = (runs, dark) =>
  RUN_COLORS[dark ? 'dark' : 'light'][
    runs <= 3 ? 0 : runs <= 6 ? 1 : runs <= 12 ? 2 : runs <= 24 ? 3 : 4
  ];
export const legTitle = (leg, sites) =>
  `${sites.get(String(leg.fromSiteId)) ? placeTitle(sites.get(String(leg.fromSiteId))) : 'Unknown place'} → ${sites.get(String(leg.toSiteId)) ? placeTitle(sites.get(String(leg.toSiteId))) : 'Unknown place'}`;

export function linkArc(a, b) {
  if (!a || !b || ![a.lat, a.lng, b.lat, b.lng].every(Number.isFinite)) return [];
  const cos = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const x = (b.lng - a.lng) * cos;
  const y = b.lat - a.lat;
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    const bow = 4 * t * (1 - t) * 0.15;
    return {
      lat: a.lat + t * y - bow * x,
      lng: a.lng + t * (b.lng - a.lng) + (bow * y) / Math.max(0.01, cos),
    };
  });
}

export function decodeRoutes(data) {
  const sites = new Map((data?.sites || []).map((s) => [String(s._id), s]));
  const legs = (data?.legs || []).map((leg) => {
    const segments = (leg.path?.overviewSegments || [])
      .map(decodePolyline6)
      .filter((p) => p.length > 1);
    return {
      ...leg,
      segments: segments.length
        ? segments
        : [linkArc(sites.get(String(leg.fromSiteId)), sites.get(String(leg.toSiteId)))].filter(
            (p) => p.length > 1,
          ),
      title: legTitle(leg, sites),
    };
  });
  return { legs, sites };
}

export function filterRoutes(
  legs,
  { chip = 'all', query = '', siteId = null, sort = 'runs' } = {},
) {
  const q = query.trim().toLocaleLowerCase();
  const values = {
    runs: (l) => l.traversals,
    distance: (l) => l.stats?.km?.p50,
    time: (l) => l.stats?.minutes?.p50,
    fuel: (l) => l.fuelCostP50,
    spread: (l) => (l.stats?.minutes?.p50 > 0 ? l.stats.minutes.p90 / l.stats.minutes.p50 : null),
  };
  const value = values[sort] || values.runs;
  return legs
    .filter((l) => {
      if (Boolean(l.inPlant) !== (chip === 'plant')) return false;
      if (q && !l.title.toLocaleLowerCase().includes(q)) return false;
      if (siteId && String(l.fromSiteId) !== siteId && String(l.toSiteId) !== siteId) return false;
      if (chip === 'busy' && l.traversals < 10) return false;
      if (chip === 'long' && !(l.stats?.km?.p50 >= 150)) return false;
      if (
        chip === 'slow' &&
        !(l.stats?.minutes?.p90 != null && l.latestRunMinutes > l.stats.minutes.p90)
      )
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        (value(b) ?? -Infinity) - (value(a) ?? -Infinity) ||
        b.traversals - a.traversals ||
        String(a._id).localeCompare(String(b._id)),
    );
}

export function drawableRoutes(legs) {
  const pairs = new Map();
  const lines = [];
  for (const leg of legs) {
    const existing = leg.sameRoadAsReverse && leg.pairKey && pairs.get(leg.pairKey);
    if (existing && existing.legs.every((l) => l.sameRoadAsReverse)) {
      existing.legs.push(leg);
      existing.runs += leg.traversals;
    } else {
      const line = {
        id: String(leg._id),
        legs: [leg],
        segments: leg.segments,
        source: leg.path?.source || 'NONE',
        runs: leg.traversals,
      };
      lines.push(line);
      if (leg.sameRoadAsReverse && leg.pairKey) pairs.set(leg.pairKey, line);
    }
  }
  return lines.sort((a, b) => a.runs - b.runs);
}

export function routeFitPoints(legs) {
  return legs.filter((l) => !l.inPlant).flatMap((l) => l.segments.flat());
}
