import { ROAD_TILE_URL, ROAD_TILE_OPTIONS } from '../../components/map/leafletRoadTiles.js';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import useApi from '../../hooks/useApi';
import AutoTripService from '../../services/AutoTripService';
import { toFrames } from '../RouteReplay/routeReplay';
import { pathSegments } from './tripPathModel';
import 'leaflet/dist/leaflet.css';

export default function PlaceReviewMap({ point, sampleTrips = [] }) {
  const container = useRef(null);
  const [status, setStatus] = useState('loading');
  const [selection, setSelection] = useState(null);
  const samples = sampleTrips.flatMap(({ to, label }) => {
    const id = typeof to === 'string' && to.match(/^\/auto-trips\/([a-f0-9]{24})$/i)?.[1];
    return id ? [{ id, label }] : [];
  });
  const tripId = selection || samples[0]?.id;
  const route = useApi((signal) => AutoTripService.track(tripId, { signal }), [tripId], {
    enabled: Boolean(tripId),
    scopeKey: tripId,
  });
  const mapRef = useRef(null);
  const lat = point?.lat;
  const lng = point?.lng;
  const radiusM = point?.radiusM;
  const valid =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  useEffect(() => {
    if (!valid || !container.current) return undefined;
    let cancelled = false;
    let loaded = 0;
    setStatus('loading');
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([lat, lng], 15);
    mapRef.current = map;
    const tiles = L.tileLayer(ROAD_TILE_URL, ROAD_TILE_OPTIONS);
    tiles.on('tileload', () => {
      loaded += 1;
    });
    tiles.once('load', () => {
      if (!cancelled) setStatus(loaded ? 'ready' : 'error');
    });
    tiles.addTo(map);
    if (Number.isFinite(radiusM) && radiusM > 0) {
      const area = L.circle([lat, lng], {
        radius: radiusM,
        color: '#2563eb',
        fillOpacity: 0.12,
      }).addTo(map);
      map.fitBounds(area.getBounds(), { padding: [20, 20], maxZoom: 16 });
    }
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
      mapRef.current = null;
      map.remove();
    };
  }, [valid, lat, lng, radiusM]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route.data) return undefined;
    const paths = pathSegments(toFrames(route.data.points), [])
      .filter((part) => part.points.length > 1)
      .map((part) => part.points.map((p) => [p.lat, p.lng]));
    if (!paths.length) return undefined;
    const trail = L.polyline(paths, { color: '#4338ca', opacity: 0.75, weight: 3 }).addTo(map);
    const bounds = trail.getBounds().extend([lat, lng]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
    return () => {
      if (mapRef.current === map) trail.remove();
    };
  }, [route.data, lat, lng]);

  if (!valid)
    return (
      <div className="atx-place-review-map-empty">
        No location recorded for this stop. Review the linked trips for more context.
      </div>
    );
  return (
    <div>
      {samples.length > 0 ? (
        <div className="atx-place-sample-trips">
          <label>
            Trip on map
            <select value={tripId || ''} onChange={(event) => setSelection(event.target.value)}>
              {samples.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label?.split(' · ')[0] || 'Sample trip'}
                </option>
              ))}
            </select>
          </label>
          {route.loading ? <small role="status">Loading its GPS track…</small> : null}
          {route.error ? (
            <button type="button" className="atx-inline-link" onClick={route.refetch}>
              Retry GPS track
            </button>
          ) : null}
          {route.data && !route.data.points?.length ? (
            <small>No GPS track for this trip.</small>
          ) : null}
        </div>
      ) : null}
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
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open location in Google Maps
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
