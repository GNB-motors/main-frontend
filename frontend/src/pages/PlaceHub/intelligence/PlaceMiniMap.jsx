import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const hasCoords = (lat, lng) =>
  [lat, lng].every((n) => typeof n === 'number' && Number.isFinite(n));

/**
 * One place on a small map — a circle marker with a permanent tooltip at the
 * point. circleMarker (not a pin) so no marker-icon asset is needed under the
 * bundler, matching DuplicateMap. Reused by the driver-home and facility modals.
 */
export default function PlaceMiniMap({ lat, lng, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!hasCoords(lat, lng) || !ref.current) return undefined;
    const map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.circleMarker([lat, lng], {
      radius: 9,
      color: '#2563eb',
      fillColor: '#2563eb',
      fillOpacity: 0.85,
      weight: 2,
    }).addTo(map);
    if (label) marker.bindTooltip(label, { permanent: true, direction: 'top' });
    map.setView([lat, lng], 15);
    // A dialog animates in (scale), so size the map once it has settled.
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(ref.current);
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      clearTimeout(t);
      resize.disconnect();
      map.remove();
    };
  }, [lat, lng, label]);

  if (!hasCoords(lat, lng)) {
    return (
      <div className="pi-mini-map pi-mini-map--empty">No location recorded for this place.</div>
    );
  }
  return <div ref={ref} className="pi-mini-map" />;
}
