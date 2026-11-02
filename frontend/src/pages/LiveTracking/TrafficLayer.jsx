import { useEffect } from 'react';

/**
 * TrafficLayer — Google's live traffic, as a display layer.
 *
 * It adds no judgement of our own: the colours and the slow-road lines are
 * Google's. The ETA congestion that the owner acts on comes from the
 * backend's own road network, not from this layer.
 */
export default function TrafficLayer({ map, enabled = false }) {
  useEffect(() => {
    if (!enabled || !map || !window.google?.maps?.TrafficLayer) return undefined;
    const layer = new window.google.maps.TrafficLayer();
    layer.setMap(map);
    return () => {
      layer.setMap(null);
    };
  }, [map, enabled]);

  return null;
}
