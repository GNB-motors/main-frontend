import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import useApi from '../../../hooks/useApi';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import 'leaflet/dist/leaflet.css';
const hasCoords = (site) =>
  [site?.lat, site?.lng].every((n) => typeof n === 'number' && Number.isFinite(n));
export default function DuplicateMap({ a: first, b: second }) {
  const firstQ = useApi(
    (signal) => PlaceIntelligenceService.getSite(first._id, { signal }),
    [first._id],
    { enabled: !hasCoords(first) },
  );
  const secondQ = useApi(
    (signal) => PlaceIntelligenceService.getSite(second._id, { signal }),
    [second._id],
    { enabled: !hasCoords(second) },
  );
  const a = useMemo(() => {
    const site = hasCoords(first) ? first : firstQ.data?.site;
    return site
      ? { ...site, lat: site.lat ?? site.centroidLat, lng: site.lng ?? site.centroidLng }
      : null;
  }, [first, firstQ.data]);
  const b = useMemo(() => {
    const site = hasCoords(second) ? second : secondQ.data?.site;
    return site
      ? { ...site, lat: site.lat ?? site.centroidLat, lng: site.lng ?? site.centroidLng }
      : null;
  }, [second, secondQ.data]);
  const ref = useRef(null);
  useEffect(() => {
    if (!hasCoords(a) || !hasCoords(b)) return;
    const map = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    [a, b].forEach((s, i) => {
      const label = document.createElement('span');
      label.textContent = `${i === 0 ? 'A' : 'B'}: ${s.name || 'Unnamed place'}`;
      L.circleMarker([s.lat, s.lng], { radius: 8, color: i ? '#db2777' : '#2563eb' })
        .addTo(map)
        .bindTooltip(label, { permanent: true, direction: i ? 'bottom' : 'top' });
    });
    map.fitBounds(
      [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      { padding: [35, 35], maxZoom: 17 },
    );
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(ref.current);
    return () => {
      resize.disconnect();
      map.remove();
    };
  }, [a, b]);
  if (!hasCoords(a) || !hasCoords(b))
    return (
      <p className="sap-muted">
        {firstQ.loading || secondQ.loading
          ? 'Loading map…'
          : 'Map coordinates unavailable for this pair.'}
      </p>
    );
  return (
    <div
      ref={ref}
      className="sap-mini-map"
      role="img"
      aria-label={`Map of ${a.name || 'place A'} and ${b.name || 'place B'}`}
    />
  );
}
