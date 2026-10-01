/**
 * Encoded polylines at precision 6 — the format our road engine (Valhalla) returns
 * (ROAD_INTELLIGENCE plan Task P4.8; pitfall L1). Google's format is precision 5; decoding a
 * precision-6 string as precision 5 puts every point 10x too far from the equator.
 */
export function decodePolyline6(encoded) {
  if (typeof encoded !== 'string' || !encoded.length) return [];
  const out = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (let axis = 0; axis < 2; axis += 1) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    out.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }
  return out;
}

export function encodePolyline6(points) {
  let out = '';
  let pLat = 0;
  let pLng = 0;
  const enc = (v) => {
    let x = v < 0 ? ~(v << 1) : v << 1;
    let s = '';
    while (x >= 0x20) {
      s += String.fromCharCode((0x20 | (x & 0x1f)) + 63);
      x >>= 5;
    }
    return s + String.fromCharCode(x + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e6);
    const lng = Math.round(p.lng * 1e6);
    out += enc(lat - pLat) + enc(lng - pLng);
    pLat = lat;
    pLng = lng;
  }
  return out;
}
