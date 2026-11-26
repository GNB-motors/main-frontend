import { useMemo } from 'react';
import PlacePreviewMap from '../map/PlacePreviewMap.jsx';

const hasCoords = (lat, lng) =>
  [lat, lng].every((n) => typeof n === 'number' && Number.isFinite(n));

/** Shared Live Tracking map for the driver-home and facility modals. */
export default function PlaceMiniMap({ lat, lng, label }) {
  const points = useMemo(() => [{ lat, lng, label }], [lat, lng, label]);

  if (!hasCoords(lat, lng)) {
    return (
      <div className="pi-mini-map pi-mini-map--empty">No location recorded for this place.</div>
    );
  }
  return (
    <PlacePreviewMap points={points} className="pi-mini-map" label={label || 'Place location'} />
  );
}
