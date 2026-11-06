import { memo, useEffect } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { colorForPlace, mapPlaceIcon, layerForPlace } from './mapPlaceIcon.js';
import { resolveMapColor } from './mapColor.js';
import { openInGoogleMaps } from '../../utils/googleMapsLink.js';

const EMPTY = [];
const BATCH_SIZE = 80;

/** Build detached markers in small batches, then cluster once per category.
 * Live fleet updates must not rebuild thousands of unchanged POI markers. */
function MapPlacesLayer({ places = EMPTY, selectedId = null }) {
  const map = useGoogleMap();
  useEffect(() => {
    if (!map || !window.google?.maps || !places.length) return undefined;
    const groups = new Map();
    const clusters = [];
    const markers = [];
    const listeners = [];
    const icons = new Map();
    const maps = window.google.maps;
    let index = 0;
    let frame;
    let cancelled = false;

    const populate = () => {
      if (cancelled) return;
      const end = Math.min(index + BATCH_SIZE, places.length);
      for (; index < end; index += 1) {
        const place = places[index];
        if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) continue;
        const layer = layerForPlace(place);
        const selected = place.id === selectedId;
        const iconKey = `${layer}:${selected}`;
        if (!icons.has(iconKey)) icons.set(iconKey, mapPlaceIcon(place, { size: 26, selected }));
        // No map until the batch is complete: clustering owns visibility.
        const marker = new maps.Marker({ position: { lat: place.lat, lng: place.lng }, icon: icons.get(iconKey),
          title: place.name, clickable: true, zIndex: selected ? 900 : 20 });
        markers.push(marker);
        listeners.push(marker.addListener('click', () => openInGoogleMaps({ lat: place.lat, lng: place.lng, name: place.name })));
        if (!groups.has(layer)) groups.set(layer, { place, markers: [] });
        groups.get(layer).markers.push(marker);
      }
      if (index < places.length) {
        frame = requestAnimationFrame(populate);
        return;
      }
      for (const { place, markers: categoryMarkers } of groups.values()) {
        const color = resolveMapColor(colorForPlace(place));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="17" fill="white" stroke="${color}" stroke-width="3"/></svg>`;
        const clusterIcon = { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new maps.Size(40, 40), anchor: new maps.Point(20, 20) };
        clusters.push(new MarkerClusterer({ map, markers: categoryMarkers,
          algorithm: new SuperClusterAlgorithm({ radius: 45, maxZoom: 14, minPoints: 3 }),
          renderer: { render: ({ count, position }) => new maps.Marker({ position, icon: clusterIcon,
            label: { text: String(count), color, fontSize: '12px', fontWeight: '700' },
            title: `${count} places. Click to zoom in.`, zIndex: 600 }) },
        }));
      }
    };
    frame = requestAnimationFrame(populate);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clusters.forEach((cluster) => { cluster.clearMarkers(true); cluster.setMap(null); });
      listeners.forEach((listener) => listener.remove());
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, places, selectedId]);
  return null;
}

export default memo(MapPlacesLayer);
