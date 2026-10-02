/**
 * Leaflet version of the road trail drawing (ROAD_INTELLIGENCE plan Task P4.9) for the RouteHub maps.
 * Same styles as RoadTrailLayer: solid, dashed, dotted by provenance; gaps draw nothing.
 */
import { toLatLngPairs } from './roadTrail';

const TONE_COLOR = { raw: '#64748b', inferred: '#94a3b8' };

export function leafletStyle(layer, { color = '#2F58EE', fleetColor = '#7c3aed' } = {}) {
  const base = {
    color: layer.tone === 'fleet' ? fleetColor : TONE_COLOR[layer.tone] || color,
    weight: layer.pattern === 'dotted' ? 3 : 4,
    opacity: 0.9,
    lineCap: 'round',
  };
  if (layer.pattern === 'dashed') return { ...base, dashArray: '8 8' };
  if (layer.pattern === 'dotted') return { ...base, dashArray: '1 8' };
  return base;
}

/** Add every layer to a Leaflet layer group. `L` is passed in so this file needs no Leaflet import. */
export function addRoadLayers(L, group, layers, opts) {
  return layers.map((l) => L.polyline(toLatLngPairs(l.path), leafletStyle(l, opts)).addTo(group));
}
