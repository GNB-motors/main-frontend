import { useEffect, useRef, useState } from 'react';
import { WeatherService } from './WeatherService.jsx';

/** Below this zoom the fleet weather layer is off — at a wide view a glyph over
 *  every truck is noise. Tunable. */
export const WEATHER_FLEET_MIN_ZOOM = 9;

/** ~0.25° ≈ 27 km, close to the ~33 km weather cell, so trucks in the same cell
 *  share one backend read instead of one each. */
const CELL = 0.25;
/** Safety cap on reads per pass. */
const MAX_CELLS = 40;
const roundCell = (n) => Math.round(n / CELL) * CELL;

/**
 * Weather for the whole visible fleet, not just the selected truck. Only active
 * when zoomed in past WEATHER_FLEET_MIN_ZOOM, and only reads cells for vehicles
 * currently in the viewport, deduped per ~cell+hour (cached). Returns a
 * `vehicleId -> weather` Map; the marker layer renders only the adverse ones.
 *
 * These are cheap reads over our own Mongo (`weathercells`), not paid weather
 * API calls, so fanning out over the in-view fleet is fine.
 */
export default function useFleetWeather({ vehicles, mapRef, mapZoom, enabled = true }) {
  const [fleetWeather, setFleetWeather] = useState(() => new Map());
  const cacheRef = useRef(new Map()); // `${cellKey}|${hour}` -> weather

  useEffect(() => {
    const map = mapRef.current;
    if (!enabled || !map || !window.google || mapZoom < WEATHER_FLEET_MIN_ZOOM) {
      setFleetWeather((prev) => (prev.size ? new Map() : prev));
      return undefined;
    }
    const bounds = map.getBounds();
    if (!bounds) return undefined;

    const hour = Math.floor(Date.now() / 3600000);
    const { LatLng } = window.google.maps;

    // Vehicles with a fix inside the current viewport, bucketed by ~cell.
    const buckets = new Map(); // cellKey -> { lat, lng, ids: [] }
    for (const v of vehicles) {
      if (!v.hasFix || !Number.isFinite(v.lat) || !Number.isFinite(v.lng)) continue;
      if (!bounds.contains(new LatLng(v.lat, v.lng))) continue;
      const ck = `${roundCell(v.lat)}|${roundCell(v.lng)}`;
      if (!buckets.has(ck)) buckets.set(ck, { lat: v.lat, lng: v.lng, ids: [] });
      buckets.get(ck).ids.push(v.id);
    }

    let alive = true;
    const cache = cacheRef.current;

    const apply = () => {
      if (!alive) return;
      const next = new Map();
      for (const [ck, b] of buckets) {
        const w = cache.get(`${ck}|${hour}`);
        if (w) for (const id of b.ids) next.set(id, w);
      }
      setFleetWeather(next);
    };

    const toFetch = [...buckets.entries()]
      .filter(([ck]) => !cache.has(`${ck}|${hour}`))
      .slice(0, MAX_CELLS);

    if (toFetch.length === 0) {
      apply();
      return () => {
        alive = false;
      };
    }

    Promise.all(
      toFetch.map(([ck, b]) =>
        WeatherService.getAt(b.lat, b.lng).then((w) => {
          if (w) cache.set(`${ck}|${hour}`, w);
        }),
      ),
    ).finally(apply);

    return () => {
      alive = false;
    };
  }, [enabled, mapZoom, vehicles, mapRef]);

  return fleetWeather;
}
