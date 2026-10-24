import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import PlaceHubService from '../PlaceHubService.js';
import { tollLayerPlazas } from '../model/tollPlazas.js';

/** Below this zoom "every plaza in view" is a whole state's worth of markers. */
const ALL_MIN_ZOOM = 7;
/** The server caps a box at 6° a side. */
const MAX_SIDE_DEG = 6;

/**
 * Toll plazas for the map. The ones this org's trucks visited load once and are always shown; with
 * `showAll` the others inside the visible box are fetched as the map settles, like the POI layer.
 */
export default function useTollLayer(map, showAll) {
  const { data: visited } = useApi(
    (signal) => PlaceHubService.loadTollPlazas({ scope: 'visited' }, { signal }),
    [],
  );
  const [inView, setInView] = useState([]);
  const ctl = useRef(null);

  const load = useCallback(() => {
    if (!map || !showAll) return;
    const b = map.getBounds();
    if ((map.getZoom() || 0) < ALL_MIN_ZOOM || !b) {
      setInView([]);
      return;
    }
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    const box = {
      south: sw.lat(),
      west: sw.lng(),
      north: Math.min(ne.lat(), sw.lat() + MAX_SIDE_DEG),
      east: Math.min(ne.lng(), sw.lng() + MAX_SIDE_DEG),
    };
    ctl.current?.abort();
    ctl.current = new AbortController();
    PlaceHubService.loadTollPlazas({ scope: 'all', ...box }, { signal: ctl.current.signal })
      .then(setInView)
      // Aborted on every pan, and the extra plazas are optional.
      .catch(() => {});
  }, [map, showAll]);

  useEffect(() => {
    if (showAll) load();
    else {
      ctl.current?.abort();
      setInView([]);
    }
  }, [showAll, load]);
  useEffect(() => () => ctl.current?.abort(), []);

  return { plazas: tollLayerPlazas(visited, inView, showAll), load };
}
