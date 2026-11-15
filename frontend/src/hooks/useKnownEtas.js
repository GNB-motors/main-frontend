import { useEffect, useState } from 'react';
import { getKnownEtas } from '../services/etaService';

/** Known destinations move slowly — a five minute refresh is plenty. */
export const KNOWN_ETA_REFRESH_MS = 5 * 60 * 1000;

/**
 * The known-destination board, refreshed while the page is open.
 *
 * A failed refresh keeps the last good list: a network blip must not blank a
 * destination a driver is already steering by.
 */
export function useKnownEtas({ enabled = true } = {}) {
  const [rows, setRows] = useState([]);

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

    load();
    const timer = setInterval(load, KNOWN_ETA_REFRESH_MS);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [enabled]);

  return rows;
}

export default useKnownEtas;
