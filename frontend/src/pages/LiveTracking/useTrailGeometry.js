import { useMemo } from 'react';
import { NOVA_STATUS } from './statusPalettes.js';
import { bearingDegrees } from './geoMath.js';
import trailDistanceKm from './trailDistanceKm.js';
import { tripColor, tripColorForId } from './tripPalette.js';

/* Build per-trip polyline segments from the raw trail payload.

   The backend `/livetracking/positions/{reg}/trail` response carries:
     - points[]      — every GPS fix with { latitude, longitude, tripId, break }
     - trips[]       — trip metadata (number, origin, destination, distance)
     - planStops[]   — dispatch plan stops (origin / destination)

   Earlier versions of the page ignored all of that and rendered a single
   straight polyline of raw lat/lng — so even though telematics already told
   us where each trip starts/ends and where breaks/halts fall, the UI never
   surfaced it. Splitting the trail into per-trip segments keeps multi-trip
   traces legible and unlocks the Trips legend. */
function buildTrailSegments(rawTrailPoints) {
  if (!Array.isArray(rawTrailPoints) || rawTrailPoints.length === 0) {
    return { segments: [], tripIds: [] };
  }
  // Each segment belongs to a trip + may end on a break. We key by tripId
  // (string) and start a fresh segment when tripId changes or when the
  // incoming point is flagged as a break — break points intentionally fall
  // between segments, so the eye can read the inter-trip silence.
  const segments = [];
  const tripIds = [];
  let current = null;
  let currentTripId = null;

  rawTrailPoints.forEach((p) => {
    if (p.latitude == null || p.longitude == null) return;
    const tid = p.tripId != null ? String(p.tripId) : null;
    if (current == null || tid !== currentTripId) {
      if (current && current.coords.length > 0) segments.push(current);
      current = {
        tripId: tid,
        coords: [{ lat: p.latitude, lng: p.longitude }],
        endedByBreak: false,
      };
      currentTripId = tid;
      if (tid != null && !tripIds.includes(tid)) tripIds.push(tid);
    } else {
      current.coords.push({ lat: p.latitude, lng: p.longitude });
    }
    if (p.break) current.endedByBreak = true;
  });
  if (current && current.coords.length > 0) segments.push(current);
  return { segments, tripIds };
}

export default function useTrailGeometry({ selectedVehicle, trailPoints, rawTrailPoints, trips = [], replayState }) {
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

  /* Per-trip polyline segments + a quick lookup table for the legend. */
  const { trailSegments, tripLegend } = useMemo(() => {
    const { segments, tripIds } = buildTrailSegments(rawTrailPoints);
    const legend = tripIds.map((tid, idx) => {
      const seg = segments.find((s) => s.tripId === tid);
      // A point's tripId is the ERP trip's _id; the trail response's trips[]
      // carries the names (fromLocation / toLocation / tripNumber) for it.
      const meta = (Array.isArray(trips) ? trips : []).find((t) => String(t.tripId) === tid);
      return {
        tripId: tid,
        tripNumber: meta?.tripNumber || null,
        index: idx,
        color: tripColorForId(tid, idx),
        coords: seg ? seg.coords.length : 0,
        startName: meta?.fromLocation || null,
        endName: meta?.toLocation || null,
      };
    });
    // Color each segment deterministically by tripId via tripColorForId
    const colored = segments.map((s, i) => ({
      ...s,
      color: tripColorForId(s.tripId, i),
    }));
    return { trailSegments: colored, tripLegend: legend };
  }, [rawTrailPoints, trips]);

  /* When the trail response has exactly one trip we still want the segment
     polyline to draw, even if no tripId was attached. Fall back to the
     legacy single-polyline color. */
  const fallbackSingleColor = tripColor(0);

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
    trailSegments,
    tripLegend,
    fallbackSingleColor,
    replayPtsCoords,
    replayCurrentPos,
    replayRunPath,
    replayBearing,
  };
}
