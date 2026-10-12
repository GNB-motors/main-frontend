import { useMemo } from 'react';
import { NOVA_STATUS } from './statusPalettes.js';
import { bearingDegrees } from './geoMath.js';
import trailDistanceKm from './trailDistanceKm.js';

export default function useTrailGeometry({ selectedVehicle, trailPoints, replayState }) {
  const selectedStatusColor = useMemo(() => {
    if (!selectedVehicle) return '#187A32';
    return (NOVA_STATUS[selectedVehicle.status] || NOVA_STATUS.moving).c;
  }, [selectedVehicle]);

  // Breadcrumb Trail points transformed to LatLng objects
  const trailCoords = useMemo(() => {
    return trailPoints.map(([lat, lng]) => ({ lat, lng }));
  }, [trailPoints]);

  // Total distance (km) of the currently loaded trail — real, from the trail
  const trailKm = useMemo(() => trailDistanceKm(trailPoints), [trailPoints]);

  // Replay base trail points transformed to LatLng objects
  const replayPtsCoords = useMemo(() => {
    if (!replayState.pts) return [];
    return replayState.pts.map(([lat, lng]) => ({ lat, lng }));
  }, [replayState.pts]);

  // Derived current replay position, animated trail slice, and heading
  const { replayCurrentPos, replayRunPath, replayBearing } = useMemo(() => {
    if (!replayState.on || !replayState.pts || replayState.pts.length < 2) {
      return { replayCurrentPos: null, replayRunPath: [], replayBearing: 0 };
    }
    const pts = replayState.pts;
    const t = Math.max(0, Math.min(1, replayState.t));
    const exact = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(exact));
    const frac = exact - i;
    const p0 = pts[i];
    const p1 = pts[i + 1] || p0;
    const curLat = p0[0] + (p1[0] - p0[0]) * frac;
    const curLng = p0[1] + (p1[1] - p0[1]) * frac;
    const cur = { lat: curLat, lng: curLng };
    const pathSlice = pts.slice(0, i + 1).map(([lat, lng]) => ({ lat, lng }));
    pathSlice.push(cur);
    const brg = bearingDegrees(p0, p1);
    return { replayCurrentPos: cur, replayRunPath: pathSlice, replayBearing: brg };
  }, [replayState.on, replayState.pts, replayState.t]);

  return {
    selectedStatusColor,
    trailCoords,
    trailKm,
    replayPtsCoords,
    replayCurrentPos,
    replayRunPath,
    replayBearing,
  };
}
