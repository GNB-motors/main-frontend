import { memo, useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { colorForPlace, mapPlaceIcon, layerForPlace } from './mapPlaceIcon.js';
import { resolveMapColor } from './mapColor.js';
import { openInGoogleMaps } from '../../utils/googleMapsLink.js';

const EMPTY = [];
const BATCH_SIZE = 80;
const keyOf = (place) => `${layerForPlace(place)}:${place.id}`;
const signatureOf = (place, selected) =>
  JSON.stringify([place.lat, place.lng, place.name, selected]);

/** Reuse unchanged markers and clusterers. Build additions off-map in small
 * batches, then publish the diff once; previous markers remain during work. */
function MapPlacesLayer({ places = EMPTY, selectedId = null }) {
  const map = useGoogleMap();
  const live = useRef({ markers: new Map(), groups: new Map(), icons: new Map() });

  useEffect(() => {
    const current = live.current;
    return () => {
      current.groups.forEach((cluster) => {
        cluster.clearMarkers(true);
        cluster.setMap(null);
      });
      current.markers.forEach(({ marker, listener }) => {
        listener.remove();
        marker.setMap(null);
      });
      current.groups.clear();
      current.markers.clear();
      current.icons.clear();
    };
  }, [map]);

  useEffect(() => {
    if (!map || !window.google?.maps) return undefined;
    const current = live.current;
    const maps = window.google.maps;
    const desired = new Map(
      places
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => [keyOf(p), p]),
    );
    const additions = [];
    const staged = new Map();
    for (const [key, place] of desired) {
      const signature = signatureOf(place, place.id === selectedId);
      if (current.markers.get(key)?.signature !== signature)
        additions.push({ key, place, signature });
    }
    let index = 0;
    let frame;
    let published = false;
    const publish = () => {
      const changed = new Set();
      for (const [key, entry] of current.markers) {
        if (desired.has(key) && !staged.has(key)) continue;
        current.groups.get(entry.layer)?.removeMarker(entry.marker, true);
        entry.listener.remove();
        entry.marker.setMap(null);
        current.markers.delete(key);
        changed.add(entry.layer);
      }
      for (const [key, entry] of staged) {
        if (!current.groups.has(entry.layer)) {
          const color = resolveMapColor(colorForPlace(entry.place));
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="17" fill="white" stroke="${color}" stroke-width="3"/></svg>`;
          const icon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new maps.Size(40, 40),
            anchor: new maps.Point(20, 20),
          };
          current.groups.set(
            entry.layer,
            new MarkerClusterer({
              map,
              markers: [],
              algorithm: new SuperClusterAlgorithm({ radius: 45, maxZoom: 14, minPoints: 3 }),
              renderer: {
                render: ({ count, position }) =>
                  new maps.Marker({
                    position,
                    icon,
                    label: { text: String(count), color, fontSize: '12px', fontWeight: '700' },
                    title: `${count} places. Click to zoom in.`,
                    zIndex: 600,
                  }),
              },
            }),
          );
        }
        current.groups.get(entry.layer).addMarker(entry.marker, true);
        current.markers.set(key, entry);
        changed.add(entry.layer);
      }
      for (const layer of changed) {
        const cluster = current.groups.get(layer);
        if ([...current.markers.values()].some((entry) => entry.layer === layer)) cluster.render();
        else {
          cluster.clearMarkers(true);
          cluster.setMap(null);
          current.groups.delete(layer);
        }
      }
      published = true;
    };
    const populate = () => {
      const end = Math.min(index + BATCH_SIZE, additions.length);
      for (; index < end; index += 1) {
        const { key, place, signature } = additions[index];
        const layer = layerForPlace(place);
        const selected = place.id === selectedId;
        const iconKey = `${layer}:${selected}`;
        if (!current.icons.has(iconKey))
          current.icons.set(iconKey, mapPlaceIcon(place, { size: 26, selected }));
        const marker = new maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          icon: current.icons.get(iconKey),
          title: place.name,
          clickable: true,
          zIndex: selected ? 900 : 20,
        });
        const listener = marker.addListener('click', () =>
          openInGoogleMaps({ lat: place.lat, lng: place.lng, name: place.name }),
        );
        staged.set(key, { marker, listener, signature, layer, place });
      }
      if (index < additions.length) frame = requestAnimationFrame(populate);
      else publish();
    };
    if (additions.length) frame = requestAnimationFrame(populate);
    else publish();
    return () => {
      cancelAnimationFrame(frame);
      if (!published)
        staged.forEach(({ marker, listener }) => {
          listener.remove();
          marker.setMap(null);
        });
    };
  }, [map, places, selectedId]);
  return null;
}

export default memo(MapPlacesLayer);
