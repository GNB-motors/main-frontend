/**
 * animateCamera — a smooth glide from where the map looks now to a target
 * (center + zoom), instead of the instant jump `moveCamera`/`setZoom` give on a
 * raster map.
 *
 * It interpolates center and zoom together over `duration` ms with an
 * ease-in-out curve, driving the map each animation frame. Fractional zoom
 * (set `isFractionalZoomEnabled` in the map options) keeps the zoom itself
 * continuous rather than snapping through whole levels.
 *
 * A fresh call supersedes any animation already in flight on the same map, so
 * rapid clicks never fight each other. If the map has no projection yet it
 * falls back to a direct jump.
 */
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function animateCamera(map, target, { duration = 500 } = {}) {
  if (!map || typeof target?.zoom !== 'number') return;
  const here = map.getCenter?.();
  const fromZoom = map.getZoom?.();
  // A zoom-only step may omit the center: hold wherever the map looks now.
  const toCenter =
    typeof target.center?.lat === 'number'
      ? target.center
      : here
        ? { lat: here.lat(), lng: here.lng() }
        : null;
  const jump = () => {
    if (!toCenter) {
      map.setZoom?.(target.zoom);
      return;
    }
    if (typeof map.moveCamera === 'function')
      map.moveCamera({ center: toCenter, zoom: target.zoom });
    else {
      map.setCenter(toCenter);
      map.setZoom(target.zoom);
    }
  };
  if (!here || !toCenter || typeof fromZoom !== 'number' || duration <= 0) {
    jump();
    return;
  }

  const start = { lat: here.lat(), lng: here.lng(), zoom: fromZoom };
  const end = { lat: toCenter.lat, lng: toCenter.lng, zoom: target.zoom };
  // Already there — nothing to animate.
  if (start.lat === end.lat && start.lng === end.lng && start.zoom === end.zoom) return;

  const token = {};
  map.__cameraAnim = token;
  const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
  const step = (now) => {
    if (map.__cameraAnim !== token) return; // a newer call took over
    const elapsed = (typeof now === 'number' ? now : Date.now()) - t0;
    const p = Math.min(1, elapsed / duration);
    const k = easeInOutQuad(p);
    const center = {
      lat: start.lat + (end.lat - start.lat) * k,
      lng: start.lng + (end.lng - start.lng) * k,
    };
    const zoom = start.zoom + (end.zoom - start.zoom) * k;
    if (typeof map.moveCamera === 'function') map.moveCamera({ center, zoom });
    else {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    if (p < 1) requestAnimationFrame(step);
    else if (map.__cameraAnim === token) map.__cameraAnim = null;
  };
  requestAnimationFrame(step);
}

export default animateCamera;
