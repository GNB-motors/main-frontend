import { ROAD_TILE_URL, ROAD_TILE_OPTIONS } from '../../components/map/leafletRoadTiles.js';

export const OSM_MAP_TYPE_ID = 'osm';

/** Google and OSM both use 256px Web Mercator tiles. Wrap X, never wrap Y. */
export function osmTileUrl({ x, y }, zoom) {
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > ROAD_TILE_OPTIONS.maxZoom) return null;
  const size = 2 ** zoom;
  if (!Number.isInteger(x) || !Number.isInteger(y) || y < 0 || y >= size) return null;
  const wrappedX = ((x % size) + size) % size;
  return ROAD_TILE_URL.replace('{z}', zoom).replace('{x}', wrappedX).replace('{y}', y);
}

/** Register imagery only; Google's map instance and overlay context stay intact. */
export function installOsmMapType(map, mapsApi) {
  const type = new mapsApi.ImageMapType({
    name: 'OpenStreetMap',
    alt: 'OpenStreetMap road map',
    tileSize: new mapsApi.Size(256, 256),
    minZoom: 0,
    maxZoom: ROAD_TILE_OPTIONS.maxZoom,
    getTileUrl: osmTileUrl,
  });
  map.mapTypes.set(OSM_MAP_TYPE_ID, type);
  return () => map.mapTypes.set(OSM_MAP_TYPE_ID, null);
}
