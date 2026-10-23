import { fmtT, haversineKm, hm } from '../../routeHubFormat';
import { toLayers, distanceAtTime } from '../../../../lib/roadTrail';

/**
 * Turns the trail's irregular fixes into something the player can scrub:
 * a positioned, cumulative-distance-tagged frame list keyed on real elapsed
 * time (the mockup could assume one fix per minute; live data cannot).
 */
export default function buildTrip(
  points,
  overspeedEvents,
  deviationEvents,
  anchors = null,
  road = null,
) {
  const fixes = (points || [])
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      ll: [p.latitude, p.longitude],
      at: new Date(p.eventDateTime),
      speed: p.speed == null ? null : Math.round(p.speed),
      gapType: p.gapType || null,
    }))
    .sort((a, b) => a.at - b.at);

  if (fixes.length < 2) return null;

  // Road distance when the road engine has this window (plan P4.11; maths R2); otherwise straight lines.
  const matched = road && road.mode === 'MATCHED';
  const timeline =
    matched && Array.isArray(road.timeline) && road.timeline.length > 1 ? road.timeline : null;
  const base = timeline ? distanceAtTime(timeline, fixes[0].at.getTime()) : 0;
  let acc = 0;
  fixes.forEach((f, i) => {
    if (timeline) acc = (distanceAtTime(timeline, f.at.getTime()) - base) / 1000;
    else if (i > 0) acc += haversineKm(fixes[i - 1].ll, f.ll);
    f.km = acc;
  });

  const t0 = fixes[0].at.getTime();
  const t1 = fixes[fixes.length - 1].at.getTime();
  const span = Math.max(1, t1 - t0);
  fixes.forEach((f) => {
    f.t = (f.at.getTime() - t0) / span;
  });

  const path = fixes.map((f) => f.ll);
  const speeds = fixes.map((f) => f.speed).filter((s) => s != null);
  const moving = speeds.filter((s) => s > 0);

  const atTime = (ms) => {
    const target = t0 + ms;
    let i = fixes.findIndex((f) => f.at.getTime() >= target);
    if (i < 0) i = fixes.length - 1;
    return Math.max(0, i);
  };

  // Start/end labelling.
  //
  // `fixes[0]` is only the oldest fix in the SELECTED RANGE — it is not a trip start.
  // Pick a different range and the same vehicle gets a different "trip start"; a truck
  // already doing 38 km/h when the window opens still got labelled as starting there.
  // So without anchors we say exactly what we know: first/last fix in range.
  //
  // With `anchors` (an ERP trip's warehouse geofence crossings) we know the real
  // thing: when the vehicle left its yard and when it returned to one.
  const startAnchored = anchors?.exitedAt ? new Date(anchors.exitedAt) : null;
  const endAnchored = anchors?.arrivedAt ? new Date(anchors.arrivedAt) : null;

  const events = [
    startAnchored
      ? {
          type: 'start',
          t: 0,
          at: startAnchored,
          title: 'Trip start',
          sub: `Left ${anchors.startWarehouseName || 'the yard'} at ${fmtT(startAnchored)}`,
        }
      : {
          type: 'start',
          t: 0,
          at: fixes[0].at,
          title: 'First fix in range',
          sub: `Oldest position at ${fmtT(fixes[0].at)} — not a confirmed trip start`,
        },
  ];

  // A run of 'stationary' gap fixes is the trail's own way of saying the vehicle
  // sat still through a reporting silence — that's a halt.
  //
  // Consecutive stationary gaps are MERGED. Emitting one event per gap fix split a
  // single 50-minute park into three 17-minute "halts" whose `until` times chained
  // into each other, which both misreported every stop and inflated the trip-log
  // count. One unbroken stationary run is one halt.
  let runStart = null;
  let runEnd = null;
  const flushHalt = () => {
    if (runStart == null) return;
    const mins = (runEnd.at - runStart.at) / 60000;
    if (mins >= 15) {
      events.push({
        type: 'stop',
        t: runStart.t,
        at: runStart.at,
        title: `Halt · ${hm(mins)}`,
        sub: `Stationary until ${fmtT(runEnd.at)}`,
      });
    }
    runStart = null;
    runEnd = null;
  };

  fixes.forEach((f, i) => {
    if (i === 0) return;
    if (f.gapType === 'stationary') {
      // The halt began at the PREVIOUS fix — that is when the vehicle stopped
      // moving; `f` is only the first report after the silence.
      if (runStart == null) runStart = fixes[i - 1];
      runEnd = f;
      return;
    }
    flushHalt();
  });
  flushHalt();

  (overspeedEvents || []).forEach((e) => {
    const at = new Date(e.startAt);
    const ms = at.getTime() - t0;
    if (ms < 0 || ms > span) return;
    const mins = Math.round((e.durationSec || 0) / 60);
    events.push({
      type: 'os',
      t: ms / span,
      at,
      idx: atTime(ms),
      title: `Overspeed · ${e.maxSpeedKmh} km/h`,
      sub: `${mins || '<1'} min above the limit${e.distanceKm != null ? ` · ${e.distanceKm} km` : ''}`,
    });
  });

  (deviationEvents || []).forEach((d) => {
    const at = new Date(d.detectedAt || d.startedAt);
    const ms = at.getTime() - t0;
    if (Number.isNaN(ms) || ms < 0 || ms > span) return;
    events.push({
      type: 'dev',
      t: ms / span,
      at,
      title: `Deviation · ${Number(d.maxOffKm || 0).toFixed(2)} km off`,
      sub: `+${d.extraKmEstimate ?? '—'} km estimated detour`,
    });
  });

  events.push(
    endAnchored
      ? {
          type: 'end',
          t: 1,
          at: endAnchored,
          title: anchors.warehouseMismatch ? 'Trip end · different yard' : 'Trip end',
          sub: anchors.warehouseMismatch
            ? `Returned to ${anchors.arrivalWarehouseName || 'another yard'}, not ${anchors.endWarehouseName || 'the designated yard'}`
            : `Returned to ${anchors.arrivalWarehouseName || 'the yard'} at ${fmtT(endAnchored)}`,
        }
      : {
          type: 'end',
          t: 1,
          at: fixes[fixes.length - 1].at,
          title: 'Last fix in range',
          sub: `Newest position at ${fmtT(fixes[fixes.length - 1].at)} — not a confirmed trip end`,
        },
  );
  events.sort((a, b) => a.t - b.t);

  return {
    fixes,
    path,
    events,
    overspeed: overspeedEvents || [],
    km: acc,
    distanceSource: timeline ? 'road' : 'straight-line',
    roadLayers: matched ? toLayers(road) : [],
    durationMin: span / 60000,
    peak: speeds.length ? Math.max(...speeds) : 0,
    avg: moving.length ? Math.round(moving.reduce((a, b) => a + b, 0) / moving.length) : 0,
    startAt: fixes[0].at,
  };
}
