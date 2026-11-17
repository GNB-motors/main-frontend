import { animateCamera } from './mapCameraAnimate.js';

// Frame against the actual map canvas; its sibling details panel is already excluded.
// Compute the camera explicitly so an earlier pan animation cannot undo fitBounds.
export function fitRouteOnMap(map, points = []) {
  const valid = points.filter(
    (point) =>
      Number.isFinite(point?.lat) &&
      Number.isFinite(point?.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180,
  );
  const rect = map?.getDiv?.()?.getBoundingClientRect?.();
  if (!valid.length || !rect?.width || !rect?.height) return false;
  const mercatorY = (lat) => {
    const sine = Math.sin((Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180);
    return 0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI);
  };
  let west = Infinity;
  let east = -Infinity;
  let north = Infinity;
  let south = -Infinity;
  for (const point of valid) {
    const x = (point.lng + 180) / 360;
    const y = mercatorY(point.lat);
    west = Math.min(west, x);
    east = Math.max(east, x);
    north = Math.min(north, y);
    south = Math.max(south, y);
  }
  const side = Math.min(64, rect.width * 0.12);
  const top = Math.min(84, rect.height * 0.15);
  const bottom = Math.min(64, rect.height * 0.12);
  const width = Math.max(1, rect.width - 2 * side);
  const height = Math.max(1, rect.height - top - bottom);
  const zoom = Math.max(
    0,
    Math.min(
      16,
      Math.floor(
        Math.min(
          Math.log2(width / (256 * Math.max(east - west, 1e-9))),
          Math.log2(height / (256 * Math.max(south - north, 1e-9))),
        ),
      ),
    ),
  );
  const worldSize = 256 * 2 ** zoom;
  const y = (north + south) / 2 - (top - bottom) / (2 * worldSize);
  const center = {
    lat: (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI,
    lng: ((west + east) / 2) * 360 - 180,
  };
  // Cancel a previous camera movement even when the target is already visible.
  map.__cameraAnim = null;
  animateCamera(map, { center, zoom });
  return true;
}
