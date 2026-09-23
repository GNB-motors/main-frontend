import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { icoHTML } from './routeHubIconPaths';

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
/** Leaflet never loads a single tile until it has a view (center+zoom) —
 *  the mockup always had 5 hardcoded corridors so fitBounds always ran and
 *  masked this. An org with no routes/events yet would otherwise get a
 *  permanently blank pane with just the zoom control floating on it. */
const INDIA_CENTER = [22.5937, 78.9629];
const INDIA_ZOOM = 4;

/** Esri light-grey canvas basemap + labels, exactly as the mockup builds it. */
export function makeMap(el, opts = {}) {
  const map = L.map(el, {
    zoomControl: false,
    attributionControl: true,
    center: INDIA_CENTER,
    zoom: INDIA_ZOOM,
    ...opts,
  });
  L.tileLayer(ESRI + 'Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri · HERE, Garmin, © OpenStreetMap contributors',
    maxZoom: 16,
  }).addTo(map);
  L.tileLayer(ESRI + 'Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  return map;
}

export function pinIcon(color, glyph, size = 22) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="pinx" style="background:${color};width:${size}px;height:${size}px">${icoHTML(glyph, size * 0.55)}</div>`,
  });
}

export function truckIcon() {
  return L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<div class="rh-truck"><div>${icoHTML('truck', 19)}</div></div>`,
  });
}

/** Labelled city dots. `places` is [{ lat, lng, label }]. */
export function cityLayer(map, places) {
  places.forEach((p) => {
    L.marker([p.lat, p.lng], {
      icon: L.divIcon({
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        html: '<div class="cdot"></div>',
      }),
      interactive: false,
    })
      .bindTooltip(p.label, {
        permanent: true,
        direction: 'right',
        offset: [8, 0],
        className: 'city',
      })
      .addTo(map);
  });
}

/**
 * Owns one Leaflet instance for a div. Returns { containerRef, mapRef }.
 * Leaflet measures its container on creation, so the map is built after mount
 * and re-measured whenever the element resizes (bento cards reflow a lot).
 */
export function useLeafletMap(opts = {}, deps = []) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = makeMap(containerRef.current, optsRef.current);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      // Null the ref first: this hook is declared before useLayerGroup, so its
      // cleanup runs first, and the layer-group cleanup that follows must be
      // able to tell the map is already gone.
      mapRef.current = null;
      try {
        map.remove();
      } catch {
        // Leaflet can throw while tearing down paths whose renderer is already
        // detached. The map is being discarded either way.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, mapRef };
}

/**
 * Swaps the contents of a single overlay layer group without touching the
 * basemap — the mockup's `if (layer) map.removeLayer(layer)` pattern.
 */
export function useLayerGroup(mapRef, draw, deps) {
  const layerRef = useRef(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const drop = () => {
      if (!layerRef.current) return;
      // Only touch the map if it is still the live one — on unmount
      // useLeafletMap has already torn it down and nulled the ref.
      if (mapRef.current === map) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          // already detached
        }
      }
      layerRef.current = null;
    };

    drop();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;
    draw(group, map);
    return drop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export { L };
