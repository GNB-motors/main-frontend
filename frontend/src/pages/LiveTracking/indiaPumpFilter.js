import boundaryUrl from './indiaPumpBoundary.json?url';

let load;

/** Bounding boxes avoid testing every island edge for every pump. */
export function indiaContains(rings) {
  const indexed = rings.map((ring) => ({
    ring,
    west: Math.min(...ring.map(([lng]) => lng)),
    east: Math.max(...ring.map(([lng]) => lng)),
    south: Math.min(...ring.map(([, lat]) => lat)),
    north: Math.max(...ring.map(([, lat]) => lat)),
  }));
  return ({ lat, lng }) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    let inside = false;
    for (const { ring, west, east, south, north } of indexed) {
      if (lng < west || lng > east || lat < south || lat > north) continue;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
          inside = !inside;
      }
    }
    return inside;
  };
}

/** Country-filter the requested place layers. Other layers keep their data. */
export async function filterIndianPumps(items, layers = ['pumps']) {
  if (!items.some((item) => layers.includes(item.layer))) return items;
  if (!load)
    load = fetch(boundaryUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load the India pump boundary.');
        return response.json();
      })
      .then(indiaContains)
      .catch((error) => {
        load = null;
        throw error;
      });
  const contains = await load;
  return items.filter((item) => !layers.includes(item.layer) || contains(item));
}
