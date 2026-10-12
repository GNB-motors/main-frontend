import { useCallback, useEffect, useRef, useState } from 'react';
import PlaceHubService from '../PlaceHubService.js';
import { poiBucket } from '../placeHubStyle.js';

const POI_MIN_ZOOM = 10;

/** What the map data knows inside the visible box, refetched when the map settles. */
export default function usePoiLayer(map, on) {
  const [pois, setPois] = useState([]);
  const ctl = useRef(null);
  const load = useCallback(() => {
    if (!map || !on) return;
    const b = map.getBounds();
    if ((map.getZoom() || 0) < POI_MIN_ZOOM || !b) {
      setPois([]);
      return;
    }
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    ctl.current?.abort();
    ctl.current = new AbortController();
    PlaceHubService.loadPoi(
      { south: sw.lat(), west: sw.lng(), north: ne.lat(), east: ne.lng() },
      { signal: ctl.current.signal },
    )
      .then((items) => setPois(items.filter((p) => poiBucket(p.category))))
      // Aborted on every pan, and the POI layer is optional.
      .catch(() => {});
  }, [map, on]);
  useEffect(() => {
    if (on) load();
    else {
      ctl.current?.abort();
      setPois([]);
    }
  }, [on, load]);
  useEffect(() => () => ctl.current?.abort(), []);
  return { pois, load };
}
