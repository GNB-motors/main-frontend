// Work in Web Mercator world pixels so the fit follows the area on screen,
// rather than a zoom threshold that treats every place as the same size.
const project = ({ lat, lng }) => {
  const sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return [((lng + 180) / 360) * 256, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 256];
};
const unproject = ([x, y]) => ({
  lng: (x / 256) * 360 - 180,
  lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 256))) * 180) / Math.PI,
});

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

function edgeDistance(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t =
    dx || dy
      ? Math.max(
          0,
          Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)),
        )
      : 0;
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}

function clearance(point, rings) {
  const inside = inRing(point, rings[0]) && !rings.slice(1).some((ring) => inRing(point, ring));
  let distance = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      distance = Math.min(distance, edgeDistance(point, ring[i], ring[(i + 1) % ring.length]));
    }
  }
  return inside ? distance : -distance;
}

function interior(part) {
  const rings = part
    .map((ring) =>
      ring.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(project),
    )
    .filter((ring) => ring.length >= 3);
  if (!rings.length) return null;
  const xs = rings[0].map((p) => p[0]);
  const ys = rings[0].map((p) => p[1]);
  let left = Math.min(...xs);
  let top = Math.min(...ys);
  let width = Math.max(...xs) - left;
  let height = Math.max(...ys) - top;
  let best = { point: [left, top], radius: -Infinity };
  // Refine a small grid around the clearest interior point. An imperfect
  // search only keeps a pin longer; the clearance check always fails closed.
  for (let pass = 0; pass < 4; pass++) {
    for (let x = 0; x <= 8; x++) {
      for (let y = 0; y <= 8; y++) {
        const point = [left + (width * x) / 8, top + (height * y) / 8];
        const radius = clearance(point, rings);
        if (radius > best.radius) best = { point, radius };
      }
    }
    left = best.point[0] - width / 8;
    top = best.point[1] - height / 8;
    width /= 4;
    height /= 4;
  }
  return best.radius > 0 ? { position: unproject(best.point), radius: best.radius } : null;
}

export function placeLabelArea(place) {
  const parts = place.polygonParts?.length
    ? place.polygonParts
    : place.polygon?.length
      ? [[place.polygon]]
      : place.coreParts || [];
  if (parts.length) {
    return (
      parts
        .map(interior)
        .filter(Boolean)
        .sort((a, b) => b.radius - a.radius)[0] || null
    );
  }
  if (!(place.radiusM > 0) || !Number.isFinite(place.lat) || !Number.isFinite(place.lng))
    return null;
  return {
    position: { lat: place.lat, lng: place.lng },
    radius: (place.radiusM * 256) / (40075016.686 * Math.cos((place.lat * Math.PI) / 180)),
    circle: true,
  };
}

export function fitPlaceLabel(place, area, zoom, circleVisible) {
  // Clusters disappear above zoom 12. Keep the usual overview below that.
  if (!area || zoom <= 12 || !place.name?.trim() || (area.circle && !circleVisible)) return null;
  const name = place.name.trim();
  const radius = area.radius * 2 ** zoom;
  for (const width of [160, 128, 96, 72]) {
    const textWidth = Math.min(width, Math.max(40, name.length * 7.5));
    const lines = Math.min(3, Math.ceil((name.length * 7.5) / textWidth));
    const height = lines * 17;
    // The entire label's bounding circle fits inside the polygon, with an
    // extra margin for the white text outline, holes and boundary strokes.
    if (Math.hypot(textWidth / 2 + 8, height / 2 + 8) <= radius) {
      return { position: area.position, width: textWidth, height };
    }
  }
  return null;
}
