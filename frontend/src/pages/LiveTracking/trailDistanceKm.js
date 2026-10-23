import { haversineKm } from './geoMath.js';

/* Total path length (km) of an ordered [lat, lng] breadcrumb list — this is
   real distance derived from the backend trail, not a synthetic estimate. */
const trailDistanceKm = (points) => {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(points[i - 1], points[i]);
  }
  return sum;
};

export default trailDistanceKm;
