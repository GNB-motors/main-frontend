import { provenanceOf } from '../../../services/HotspotService.js';
import { isNum, toNum } from './placeGeometry.js';

export function fromHotspot(h) {
  const provenance = provenanceOf(h);
  const name = h.name?.replace(/\s*\(\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*\)\s*$/, '').trim();
  const coordinateOnly = /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(name || '');
  return {
    id: `hotspot:${h._id}`,
    sourceId: String(h._id),
    name:
      !name || coordinateOnly || /^(?:siphoning|fuel risk|fuel drain) hotspot$/i.test(name)
        ? 'Unnamed fuel hotspot'
        : name,
    lat: toNum(h.centerLat),
    lng: toNum(h.centerLng),
    radiusM: Number(h.radiusM) || 500,
    provenance,
    category: h.category || 'THEFT',
    active: h.active !== false,
    incidentCount: Number(h.incidentCount) || 0,
    lastIncidentAt: h.lastIncidentAt || null,
    readOnly: provenance === 'network',
    raw: h,
  };
}

export const PROVENANCE_LABEL = {
  'own-manual': 'Marked by your team',
  'own-learned': 'Learned from your fleet',
  network: 'Seen across the network',
};

export function drainCellsOf(map) {
  return (map?.buckets || [])
    .filter((b) => isNum(toNum(b.centerLat)) && isNum(toNum(b.centerLng)))
    .map((b) => ({
      id: `drain:${b.cell}`,
      lat: Number(b.centerLat),
      lng: Number(b.centerLng),
      events: Number(b.count) || 0,
      litres: Number(b.totalLitres) || 0,
      rupees: Number(b.estimatedInr) || 0,
      vehicles: b.vehicles || [],
    }));
}

export function fuelTotals(hotspots = [], cells = []) {
  return {
    active: hotspots.filter((h) => h.active && h.provenance !== 'network').length,
    network: hotspots.filter((h) => h.active && h.provenance === 'network').length,
    drainRupees: cells.reduce((s, c) => s + c.rupees, 0),
    drainEvents: cells.reduce((s, c) => s + c.events, 0),
  };
}
