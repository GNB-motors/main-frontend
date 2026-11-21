import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function PlaceReviewMap({ point }) {
  const container = useRef(null);
  const [status, setStatus] = useState('loading');
  const lat = point?.lat;
  const lng = point?.lng;
  const valid =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  useEffect(() => {
    if (!valid || !container.current) return undefined;
    let cancelled = false;
    let loaded = 0;
    setStatus('loading');
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([lat, lng], 15);
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    });
    tiles.on('tileload', () => {
      loaded += 1;
    });
    tiles.once('load', () => {
      if (!cancelled) setStatus(loaded ? 'ready' : 'error');
    });
    tiles.addTo(map);
    L.circleMarker([lat, lng], { radius: 9, color: '#2563eb', fillOpacity: 0.8 }).addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus(loaded ? 'ready' : 'error');
    }, 10000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      resize.disconnect();
      tiles.off();
      map.remove();
    };
  }, [valid, lat, lng]);
  if (!valid)
    return (
      <div className="atx-place-review-map-empty">
        No location recorded for this stop. Review the linked trips for more context.
      </div>
    );
  return (
    <div className="atx-place-review-map-wrap" aria-busy={status === 'loading'}>
      <div
        ref={container}
        className="atx-place-review-map"
        role="region"
        aria-label="Stop location map"
      />
      {status === 'loading' ? (
        <div
          className="atx-skel atx-place-map-overlay"
          role="status"
          aria-label="Loading stop location map"
        />
      ) : null}
      {status === 'error' ? (
        <div className="atx-place-map-overlay atx-place-map-error" role="status">
          Map could not load.
          <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer">
            Open location in Google Maps
          </a>
        </div>
      ) : null}
    </div>
  );
}
