import apiClient from '../utils/axiosConfig';

/**
 * PlaceService — batches coordinate→place resolution through POST
 * /api/places/resolve so a table of 50 rows costs one request, not 50.
 *
 * Results are cached per org-agnostic rounded coordinate (~11 m grid).
 * A failed resolution caches as null and renders as "unavailable",
 * never as a raw coordinate.
 */

export const CACHE_LIMIT = 5000;
const FLUSH_MS = 50;

export function coordKey(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
    throw new Error(`coordKey: non-finite coordinate (${lat}, ${lng})`);
  }
  return `${nLat.toFixed(4)},${nLng.toFixed(4)}`;
}

/** Pure: dedupe [{key,lat,lng}] by key, first occurrence wins. */
export function dedupePoints(points) {
  const seen = new Set();
  const out = [];
  for (const p of points) {
    if (!p || seen.has(p.key)) continue;
    seen.add(p.key);
    out.push(p);
  }
  return out;
}

const cache = new Map();
let queue = [];
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_MS);
}

async function flush() {
  const batch = queue;
  queue = [];
  const pending = dedupePoints(batch.map((b) => ({ key: b.key, lat: b.lat, lng: b.lng }))).filter(
    (p) => !cache.has(p.key),
  );
  if (pending.length > 0) {
    try {
      const response = await apiClient.post('api/places/resolve', { points: pending });
      const places = response.data?.data?.places ?? response.data?.places ?? {};
      for (const p of pending) {
        setCached(p.key, places[p.key] ?? null);
      }
    } catch {
      // Negative-cache so a table doesn't retry-storm; PlaceLabel renders
      // the unavailable state, never the coordinate.
      for (const p of pending) setCached(p.key, null);
    }
  }
  for (const b of batch) b.resolve(cache.get(b.key) ?? null);
}

function setCached(key, value) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, value);
}

/**
 * Resolve one coordinate to a place object
 * ({ label, sub, kind, confidence, source }) or null when unavailable.
 */
export function resolvePlace(lat, lng) {
  const key = coordKey(lat, lng);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  return new Promise((resolve) => {
    queue.push({ key, lat, lng, resolve });
    scheduleFlush();
  });
}

/** Test hook — reset module-level state. */
export function __resetPlaceCache() {
  cache.clear();
  queue = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
