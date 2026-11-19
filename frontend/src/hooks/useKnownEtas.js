import { useEffect, useRef, useState } from 'react';
import { getKnownEtas } from '../services/etaService';
import { useVisibleInterval } from './useVisibleInterval';

/** Known destinations move slowly — a five minute refresh is plenty. */
export const KNOWN_ETA_REFRESH_MS = 5 * 60 * 1000;

/**
 * The known-destination board, refreshed while the page is open.
 *
 * A failed refresh keeps the last good list: a network blip must not blank a
 * destination a driver is already steering by. The refresh only runs while the
 * tab is looked at — a hidden tab reads again the moment it is looked at.
 */
export function useKnownEtas({ enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const loadRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await getKnownEtas({ signal: controller.signal });
        if (alive) setRows(data);
      } catch {
        /* keep the last known list */
      }
    };

    loadRef.current = load;
    load();
    return () => {
      alive = false;
      loadRef.current = null;
      controller.abort();
    };
  }, [enabled]);

  useVisibleInterval(() => loadRef.current?.(), KNOWN_ETA_REFRESH_MS, { enabled });

  return rows;
}

export default useKnownEtas;
