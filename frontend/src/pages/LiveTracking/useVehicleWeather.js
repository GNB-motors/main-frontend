import { useEffect, useRef, useState } from 'react';
import { WeatherService } from './WeatherService.jsx';

/** ~0.1° ≈ 11 km, well inside the ~33 km weather cell, so a gliding or replaying
 *  marker refetches only when it actually crosses a cell or an hour. */
const round = (n) => Math.round(n * 10) / 10;

/**
 * Weather for one moving point. Returns the backend's `/api/weather/at` payload
 * (state OK / NO_ROW) and a loading flag. The fetch is keyed on the cell and the
 * hour, so following a live truck or scrubbing a replay does not spam the API.
 *
 * @param {object} p
 * @param {number|null} p.lat
 * @param {number|null} p.lng
 * @param {Date|string|null} p.at - historical instant (replay); null = live/now
 * @param {boolean} p.enabled
 */
export default function useVehicleWeather({ lat, lng, at = null, enabled = true }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const keyRef = useRef(null);

  useEffect(() => {
    if (!enabled || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      keyRef.current = null;
      setWeather(null);
      return undefined;
    }
    const atMs = at ? new Date(at).getTime() : Date.now();
    const hourBucket = Math.floor(atMs / 3600000);
    const key = `${round(lat)}|${round(lng)}|${hourBucket}`;
    if (key === keyRef.current) return undefined;
    keyRef.current = key;

    const controller = new AbortController();
    let alive = true;
    setLoading(true);
    WeatherService.getAt(lat, lng, at, { signal: controller.signal })
      .then((data) => {
        if (alive) setWeather(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [lat, lng, at, enabled]);

  return { weather, loading };
}
