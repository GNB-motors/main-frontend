import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { createVehicleMarkerIcon } from './liveTracking.shared.js';

/**
 * AnimatedVehicleMarkers — the moving fleet layer for Live Tracking.
 *
 * Positions arrive as ~20s SSE diffs (p99 gap up to 5 min), so binding them to
 * <MarkerF position={...}> made every marker TELEPORT on each update. Here the
 * markers are managed imperatively on the Google Map instance and glided from
 * their current on-screen point to the new one with a single requestAnimationFrame
 * loop — so React never re-renders per frame (critical at ~126 vehicles) and the
 * trucks appear to drive rather than jump.
 *
 * Heading comes from the feed's courseDegrees (already baked into the icon by
 * createVehicleMarkerIcon), so a frame only moves the marker — it never rebuilds
 * the SVG icon. The icon is recomputed only when status / heading / selection /
 * zoom actually change (tracked by a small signature string).
 *
 * Teleport guard: a jump larger than SNAP_METERS (offline gap or GPS glitch) is
 * placed instantly instead of crawling slowly across the map.
 */

const GLIDE_MS = 1500; // ease to each new fix; short enough to stay near real-time
const SNAP_METERS = 8000; // beyond this, snap instead of glide

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

const zIndexFor = (v, isSelected) => (isSelected ? 1000 : v.live ? 500 : 100);

const AnimatedVehicleMarkers = ({ vehicles = [], selectedId = null, onSelect, mapZoom = 12 }) => {
  const map = useGoogleMap();
  // id -> { marker, from, to, start, dur, iconSig }
  const markersRef = useRef(new Map());
  // Keep click handler current without re-binding the per-marker listener.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Reconcile markers with the latest vehicle set: add/remove, refresh icons,
  // and arm a glide when a vehicle's target position moves.
  useEffect(() => {
    if (!map || !window.google) return;
    const g = window.google.maps;
    const markers = markersRef.current;
    const seen = new Set();

    for (const v of vehicles) {
      if (!v.hasFix || v.lat == null || v.lng == null) continue;
      seen.add(v.id);
      const target = { lat: Number(v.lat), lng: Number(v.lng) };
      const isSelected = v.id === selectedId;
      const iconSig = `${v.status}|${v.courseDegrees ?? ''}|${isSelected}|${Math.round(mapZoom)}`;

      let rec = markers.get(v.id);
      if (!rec) {
        const marker = new g.Marker({
          map,
          position: target,
          icon: createVehicleMarkerIcon(v, isSelected, false, mapZoom),
          zIndex: zIndexFor(v, isSelected),
        });
        marker.addListener('click', () => onSelectRef.current && onSelectRef.current(v.id));
        markers.set(v.id, { marker, from: target, to: target, start: 0, dur: 0, iconSig });
        continue;
      }

      if (rec.iconSig !== iconSig) {
        rec.marker.setIcon(createVehicleMarkerIcon(v, isSelected, false, mapZoom));
        rec.marker.setZIndex(zIndexFor(v, isSelected));
        rec.iconSig = iconSig;
      }

      if (rec.to.lat !== target.lat || rec.to.lng !== target.lng) {
        const pos = rec.marker.getPosition();
        const cur = pos ? { lat: pos.lat(), lng: pos.lng() } : target;
        if (haversineMeters(cur, target) > SNAP_METERS) {
          rec.marker.setPosition(target);
          rec.from = target;
          rec.to = target;
          rec.dur = 0;
        } else {
          rec.from = cur;
          rec.to = target;
          rec.start = performance.now();
          rec.dur = GLIDE_MS;
        }
      }
    }

    for (const [id, rec] of markers) {
      if (!seen.has(id)) {
        rec.marker.setMap(null);
        markers.delete(id);
      }
    }
  }, [map, vehicles, selectedId, mapZoom]);

  // One rAF loop drives every active glide; markers at rest cost nothing.
  useEffect(() => {
    if (!map) return undefined;
    let raf;
    const tick = (now) => {
      for (const rec of markersRef.current.values()) {
        if (rec.dur > 0) {
          const t = Math.min(1, (now - rec.start) / rec.dur);
          const e = easeInOutQuad(t);
          rec.marker.setPosition({
            lat: rec.from.lat + (rec.to.lat - rec.from.lat) * e,
            lng: rec.from.lng + (rec.to.lng - rec.from.lng) * e,
          });
          if (t >= 1) {
            rec.dur = 0;
            rec.from = rec.to;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [map]);

  // Drop every marker on unmount so leaving the page leaves no orphans.
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const rec of markers.values()) rec.marker.setMap(null);
      markers.clear();
    };
  }, []);

  return null;
};

export default AnimatedVehicleMarkers;
