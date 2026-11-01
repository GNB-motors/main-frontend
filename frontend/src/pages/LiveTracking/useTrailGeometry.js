import { useMemo } from 'react';
import { NOVA_STATUS } from './statusPalettes.js';
import trailDistanceKm from './trailDistanceKm.js';
import { tripColor, tripColorForId } from './tripPalette.js';
import liveReplay from './liveReplay.js';
import { toLayers, positionAt, clipLayersAt, summaryOf } from '../../lib/roadTrail.js';

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
    if (current == null || tid !== currentTripId || liveReplay.breakBefore(p)) {
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

export default function useTrailGeometry({
  selectedVehicle,
  trailPoints,
  rawTrailPoints,
  trips = [],
  replayState,
  roadTrail,
}) {
  const selectedStatusColor = useMemo(() => {
    if (!selectedVehicle) return '#187A32';
    return (NOVA_STATUS[selectedVehicle.status] || NOVA_STATUS.moving).c;
  }, [selectedVehicle]);

  // Breadcrumb Trail points transformed to LatLng objects
  const trailCoords = useMemo(() => {
    return trailPoints.map(([lat, lng]) => ({ lat, lng }));
  }, [trailPoints]);

  // Total distance (km) of the currently loaded trail — real, from the trail
  const model = useMemo(() => liveReplay.build(rawTrailPoints), [rawTrailPoints]);
  const roadLayers = useMemo(
    () => (roadTrail?.mode === 'MATCHED' ? toLayers(roadTrail) : []),
    [roadTrail],
  );
  const trailKm = useMemo(
    () =>
      summaryOf(roadTrail)?.km ??
      model.segments.reduce(
        (km, s) => km + trailDistanceKm(s.coords.map((p) => [p.lat, p.lng])),
        0,
      ),
    [roadTrail, model],
  );

  /* Per-trip polyline segments + a quick lookup table for the legend. */
  const { trailSegments, tripLegend } = useMemo(() => {
    const { segments, tripIds } = buildTrailSegments(model.fixes);
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
  }, [model, trips]);

  /* When the trail response has exactly one trip we still want the segment
     polyline to draw, even if no tripId was attached. Fall back to the
     legacy single-polyline color. */
  const fallbackSingleColor = tripColor(0);

  // Replay base trail points transformed to LatLng objects
  const replayPtsCoords = useMemo(() => {
    return model.fixes.map((p) => ({ lat: p.latitude, lng: p.longitude }));
  }, [model]);

  // Derived current replay position, animated trail slice, and heading
  const frame = useMemo(
    () => (replayState.on ? liveReplay.sample(model, replayState.t) : null),
    [model, replayState.on, replayState.t],
  );
  const onRoad = frame ? positionAt(roadLayers, frame.at) : null;
  const replayCurrentPos = onRoad || frame?.position || null;
  const replayRoadLayers = frame
    ? clipLayersAt(roadLayers, frame.at).filter((l) => l.kind !== 'RAW')
    : [];

  // Weather follows the same historical clock as the animated truck.
  const replayCurrentTs = frame ? new Date(frame.at).toISOString() : null;

  return {
    selectedStatusColor,
    trailCoords,
    trailKm,
    trailSegments,
    tripLegend,
    fallbackSingleColor,
    replayPtsCoords,
    replayCurrentPos,
    replayRunPaths: frame?.paths || [],
    replayRoadLayers,
    replayBaseLayers: roadLayers,
    replaySpeed: frame?.speed || 0,
    replayCurrentTs,
  };
}
