/**
 * gapRepair — honest gap handling for breadcrumb trails.
 *
 * Three genuinely different things hide inside "the map jumped", and they
 * must never be conflated:
 *
 *  - STATIONARY gaps: the truck did not move (A ≈ B). Draw nothing; label
 *    it. Inventing geometry here would fabricate a trip that never happened.
 *  - INTER-TRIP gaps: the truck ended one trip and started another (both
 *    endpoints are recurring halt clusters). BREAK the polyline — never draw
 *    a line between two real trips, because a drawn route between trips is
 *    an invented trip and looks authoritative.
 *  - MOVING gaps: the truck genuinely moved (A ≠ B, implausible implied
 *    speed for the silence). Only here may geometry be inferred — and only
 *    from a learned corridor that passes near BOTH endpoints in time-order
 *    (extractSubPath), never from thin air.
 *
 * HARD HONESTY RULES (Part 3 / Part 4 of the plan):
 *  - Estimated geometry is marked { estimated: true } end-to-end and NEVER
 *    enters measured stats: measuredKm/avg/max speeds use measured legs only.
 *  - unexplainedMs is reported raw, never clamped away.
 *  - Stored data is never modified; this module is pure over frames.
 */

import { haversineKm } from './routeReplay.js';

export const DEFAULTS = {
  minGapMinutes: 10,
  maxPlausibleKmph: 90, // governed trucks; above this a leg is a hole, not driving
  siteRadiusKm: 2,
  endpointToleranceKm: 5, // corridor must pass within this of BOTH gap endpoints
  haltClusterRadiusKm: 0.5,
  minOccurrences: 3, // a halt is "habitual" only after this many visits
  fallbackDriveKmph: 40, // when a corridor has no hour-median durations
};

const kmph = (legKm, legMs) => (legMs > 0 ? legKm / (legMs / 3600000) : null);

/**
 * Consecutive-frame holes worth investigating. A hole is either a long
 * silence or a physically implausible implied speed (few fixes, huge jump).
 */
export function detectGaps(
  frames,
  {
    minGapMinutes = DEFAULTS.minGapMinutes,
    maxPlausibleKmph = DEFAULTS.maxPlausibleKmph,
    siteRadiusKm = DEFAULTS.siteRadiusKm,
  } = {},
) {
  if (!Array.isArray(frames)) return [];
  const gaps = [];
  for (let i = 1; i < frames.length; i += 1) {
    const a = frames[i - 1];
    const b = frames[i];
    const gapMs = b.at - a.at;
    if (gapMs <= 0) continue;
    const gapKm = haversineKm(a, b);
    const impliedKmph = kmph(gapKm, gapMs);
    const isLong = gapMs >= minGapMinutes * 60_000;
    const isImplausible = impliedKmph != null && impliedKmph > maxPlausibleKmph;
    if (!isLong && !isImplausible) continue;
    gaps.push({
      fromIndex: i - 1,
      toIndex: i,
      gapMs,
      gapKm,
      impliedKmph,
      kind: gapKm <= siteRadiusKm ? 'stationary' : 'moving',
    });
  }
  return gaps;
}

/** Nearest polyline vertex index to p (straight-line, small-scale OK). */
function nearestVertexIdx(p, points) {
  let best = -1;
  let bestKm = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const d = haversineKm(p, points[i]);
    if (d < bestKm) {
      bestKm = d;
      best = i;
    }
  }
  return { idx: best, distKm: bestKm };
}

/**
 * Find a learned corridor that could plausibly carry the vehicle from the
 * gap's start fix to its end fix: nearest polyline point to each endpoint
 * within tolerance, and the end projection must lie AT OR AFTER the start
 * projection along the polyline (direction must agree with time).
 * Corridors flagged tooSparseForDeviation are skipped — a corridor with
 * holes wider than its buffer would draw a fake road.
 */
export function findMatchingCorridor(
  gap,
  frames,
  corridors,
  { endpointToleranceKm = DEFAULTS.endpointToleranceKm } = {},
) {
  const a = frames[gap.fromIndex];
  const b = frames[gap.toIndex];
  if (!a || !b) return null;
  for (const corridor of Array.isArray(corridors) ? corridors : []) {
    const points = corridor && corridor.points;
    if (!Array.isArray(points) || points.length < 2) continue;
    if (corridor.tooSparseForDeviation) continue;
    const na = nearestVertexIdx(a, points);
    const nb = nearestVertexIdx(b, points);
    if (na.distKm > endpointToleranceKm || nb.distKm > endpointToleranceKm) continue;
    if (nb.idx <= na.idx) continue;
    return { corridor, fromIdx: na.idx, toIdx: nb.idx };
  }
  return null;
}

/**
 * The corridor segment between the gap endpoints, trimmed to start exactly
 * at A and end exactly at B so no real fix is displaced.
 */
export function extractSubPath(corridor, fromIdx, toIdx, gap, frames) {
  const points = corridor.points.slice(fromIdx, toIdx + 1);
  const a = frames[gap.fromIndex];
  const b = frames[gap.toIndex];
  return [
    { lat: a.lat, lng: a.lng },
    ...points.slice(1, -1).map((p) => ({ lat: p.lat, lng: p.lng })),
    { lat: b.lat, lng: b.lng },
  ];
}

/**
 * Recurring stationary clusters: stationary runs (≈no movement between
 * fixes) grouped into ~500 m cells, kept only when visited often enough to
 * be called "habitual" (a depot, a regular halt).
 */
export function habitualHalts(
  frames,
  { minOccurrences = DEFAULTS.minOccurrences, clusterRadiusKm = DEFAULTS.haltClusterRadiusKm } = {},
) {
  if (!Array.isArray(frames) || frames.length === 0) return [];
  // Stationary runs: consecutive fixes covering < 100 m each. A long
  // silence also ends a run — the same halt revisited days later is a new
  // visit, not one 3-day dwell.
  const MAX_WITHIN_VISIT_MIN = 30;
  const visits = [];
  let runStart = 0;
  for (let i = 1; i <= frames.length; i += 1) {
    const moved =
      i < frames.length
        ? haversineKm(frames[i - 1], frames[i]) > 0.1 ||
          frames[i].at - frames[i - 1].at > MAX_WITHIN_VISIT_MIN * 60_000
        : true;
    if (moved) {
      if (i - runStart >= 2) {
        visits.push({ at: frames[runStart], dwellMs: frames[i - 1].at - frames[runStart].at });
      }
      runStart = i;
    }
  }
  // Cluster visits by a grid cell of clusterRadiusKm.
  const cellOf = (p) =>
    `${Math.round(p.lat / (clusterRadiusKm / 111))}:${Math.round(p.lng / (clusterRadiusKm / 111))}`;
  const clusters = new Map();
  for (const v of visits) {
    const key = cellOf(v.at);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(v);
  }
  const out = [];
  for (const list of clusters.values()) {
    if (list.length < minOccurrences) continue;
    const dwells = list.map((v) => v.dwellMs).sort((x, y) => x - y);
    out.push({
      lat: list[0].at.lat,
      lng: list[0].at.lng,
      occurrences: list.length,
      medianDwellMs: dwells[Math.floor(dwells.length / 2)],
    });
  }
  return out;
}

const near = (p, halt, radiusKm) => haversineKm(p, halt) <= radiusKm;

/**
 * Decide what a moving gap actually was and, when justified, the geometry
 * to draw. Returns enough for the gap panel to explain itself:
 *   { kind, path|null, estimatedKm, driveMs, dwellMs, unexplainedMs, provenance }
 * provenance: 'CORRIDOR' | 'NONE' (rendering keeps the straight line and
 * labels it) — inter-trip and stationary gaps carry no inferred path.
 */
export function estimateGap(
  gap,
  frames,
  {
    corridors = [],
    halts = [],
    endpointToleranceKm = DEFAULTS.endpointToleranceKm,
    fallbackDriveKmph = DEFAULTS.fallbackDriveKmph,
  } = {},
) {
  const a = frames[gap.fromIndex];
  const b = frames[gap.toIndex];

  if (gap.kind === 'stationary') {
    return {
      ...gap,
      path: null,
      estimatedKm: 0,
      driveMs: 0,
      dwellMs: gap.gapMs,
      unexplainedMs: 0,
      provenance: 'NONE',
      label: 'stationary — no movement between fixes',
    };
  }

  const match = findMatchingCorridor(gap, frames, corridors, { endpointToleranceKm });
  if (!match) {
    const intertrip =
      halts.some((h) => near(a, h, DEFAULTS.haltClusterRadiusKm * 2)) &&
      halts.some((h) => near(b, h, DEFAULTS.haltClusterRadiusKm * 2));
    return {
      ...gap,
      kind: intertrip ? 'intertrip' : 'moving',
      path: null,
      estimatedKm: 0,
      driveMs: 0,
      dwellMs: 0,
      unexplainedMs: gap.gapMs,
      provenance: 'NONE',
      label: intertrip
        ? 'break between trips — recurring halt clusters at both ends'
        : 'moving gap with no corridor history — straight line kept, unexplained',
    };
  }

  const path = extractSubPath(match.corridor, match.fromIdx, match.toIdx, gap, frames);
  let estimatedKm = 0;
  for (let i = 1; i < path.length; i += 1) estimatedKm += haversineKm(path[i - 1], path[i]);

  const hour = new Date(a.at).getUTCHours();
  const medianMin =
    match.corridor.medianDurationMinByHour && match.corridor.medianDurationMinByHour[hour];
  const driveMs =
    medianMin != null && medianMin > 0
      ? Math.round(medianMin * 60_000)
      : Math.round((estimatedKm / fallbackDriveKmph) * 3600_000);

  // Dwell credit for habitual halts lying on the inferred sub-path.
  let dwellMs = 0;
  for (const h of halts) {
    if (path.some((p) => near(p, h, DEFAULTS.haltClusterRadiusKm))) dwellMs += h.medianDwellMs;
  }

  return {
    ...gap,
    path,
    estimatedKm,
    driveMs,
    dwellMs,
    // Raw, deliberately — if the corridor's median duration exceeds the
    // silence, that discrepancy is exactly what a user should see.
    unexplainedMs: gap.gapMs - driveMs - dwellMs,
    provenance: 'CORRIDOR',
    label:
      `matched to learned corridor ${match.corridor.originKey || ''} → ${match.corridor.destinationKey || ''}`.trim(),
  };
}

/**
 * Build the playback/render frame list: measured frames pass through (marked
 * estimated: false); corridor-repaired moving gaps get their sub-path
 * interpolated in time over driveMs (each point marked estimated: true);
 * inter-trip gaps insert a BREAK so the renderer splits the polyline instead
 * of drawing between trips.
 *
 * @returns {{frames: Array, breaks: number[]}} breaks = frame indices where
 *   the polyline must break (start of a post-intertrip segment).
 */
export function spliceTrail(frames, estimates) {
  if (!Array.isArray(frames)) return { frames: [], breaks: [] };
  const byFrom = new Map((Array.isArray(estimates) ? estimates : []).map((e) => [e.fromIndex, e]));
  const out = [];
  const breaks = [];
  let insertedBreak = false;

  for (let i = 0; i < frames.length; i += 1) {
    if (i > 0 && !insertedBreak) {
      const prevGap = byFrom.get(i - 1);
      if (prevGap && prevGap.kind === 'intertrip') {
        breaks.push(out.length);
        insertedBreak = true;
      }
    } else {
      insertedBreak = false;
    }
    out.push({ ...frames[i], estimated: false });

    const est = byFrom.get(i);
    if (!est || !est.path || est.path.length < 2 || est.driveMs <= 0) continue;

    // Distance-proportional timestamps across the sub-path over driveMs.
    const cum = [0];
    for (let j = 1; j < est.path.length; j += 1) {
      cum.push(cum[j - 1] + haversineKm(est.path[j - 1], est.path[j]));
    }
    const totalKm = cum[cum.length - 1];
    for (let j = 1; j < est.path.length - 1; j += 1) {
      out.push({
        lat: est.path[j].lat,
        lng: est.path[j].lng,
        at: frames[i].at + Math.round((cum[j] / totalKm) * est.driveMs),
        reportedSpeed: null,
        course: null,
        ignition: null,
        state: null,
        legKm: 0,
        cumulativeKm: 0,
        groundSpeedKmph: totalKm > 0 ? (totalKm / est.driveMs) * 3600_000 : null,
        heading: 0,
        estimated: true,
        provenance: est.provenance,
      });
    }
  }

  // Recompute leg/cumulative figures over the spliced list so playback and
  // the "travelled" readout stay consistent across inserted estimated points.
  let cumulativeKm = 0;
  for (let i = 0; i < out.length; i += 1) {
    const legKm = i === 0 ? 0 : haversineKm(out[i - 1], out[i]);
    cumulativeKm += legKm;
    out[i] = {
      ...out[i],
      legKm,
      cumulativeKm,
      groundSpeedKmph:
        i === 0 ? (out[i].groundSpeedKmph ?? null) : kmph(legKm, out[i].at - out[i - 1].at),
    };
  }

  return { frames: out, breaks };
}

/**
 * Split spliced frames into drawable polyline runs: breaks split segments,
 * and within a segment measured and estimated runs get different styling.
 *
 * @returns {Array<{path: Array<{lat,lng}>, estimated: boolean}>}
 */
export function toRenderSegments(frames, breaks) {
  if (!Array.isArray(frames) || frames.length === 0) return [];
  const breakSet = new Set(Array.isArray(breaks) ? breaks : []);
  const segments = [];
  let current = null;
  for (let i = 0; i < frames.length; i += 1) {
    if (breakSet.has(i)) current = null;
    const estimated = Boolean(frames[i].estimated);
    if (!current || current.estimated !== estimated) {
      current = { estimated, path: [] };
      segments.push(current);
    }
    current.path.push({ lat: frames[i].lat, lng: frames[i].lng });
  }
  return segments.filter((s) => s.path.length > 1);
}
