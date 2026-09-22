/**
 * roadTrail — pure helpers for rendering the road-followed, speed-graded trail
 * returned by GET /api/road-snap/trail/:reg. No React, no map SDK — just data
 * shaping, unit-tested beside this file.
 */

// Speed-grade colours. OVERSPEED red, NORMAL green, SLOW amber; UNKNOWN grey.
export const GRADE_COLOR = {
  OVERSPEED: '#e5484d',
  NORMAL: '#30a46c',
  SLOW: '#f5a623',
  UNKNOWN: '#9a9aa5',
};

/** Dashed styling marks an estimated (straight-line) hop — never a measured one. */
export function segmentStyle(segment) {
  const color = GRADE_COLOR[segment.grade] || GRADE_COLOR.UNKNOWN;
  const estimated = segment.provenance === 'straight';
  return { color, estimated };
}

/**
 * Collapse graded segments into contiguous runs sharing the same grade AND
 * estimated-ness, so the map draws one polyline per run instead of one per hop.
 * Each run: { grade, estimated, color, path:[{lat,lng}] }.
 */
export function segmentsToPolylines(segments) {
  const runs = [];
  for (const seg of Array.isArray(segments) ? segments : []) {
    if (!Array.isArray(seg.path) || seg.path.length < 2) continue;
    const { color, estimated } = segmentStyle(seg);
    const last = runs[runs.length - 1];
    if (last && last.grade === seg.grade && last.estimated === estimated) {
      // append, skipping the shared boundary vertex
      const first = seg.path[0];
      const tail = last.path[last.path.length - 1];
      const start = tail && tail.lat === first.lat && tail.lng === first.lng ? 1 : 0;
      for (let i = start; i < seg.path.length; i += 1) last.path.push(seg.path[i]);
    } else {
      runs.push({ grade: seg.grade, estimated, color, path: [...seg.path] });
    }
  }
  return runs;
}

/** One-line summary strip for the trail header. */
export function gradeSummary({ kmByGrade = {}, measuredKm = 0, estimatedKm = 0 } = {}) {
  const parts = [];
  if (kmByGrade.OVERSPEED) parts.push(`${kmByGrade.OVERSPEED.toFixed(0)} km overspeed`);
  if (kmByGrade.SLOW) parts.push(`${kmByGrade.SLOW.toFixed(0)} km slow`);
  const total = Math.round((measuredKm + estimatedKm) * 10) / 10;
  const est = estimatedKm > 0 ? ` (${estimatedKm.toFixed(0)} km estimated)` : '';
  return `${total.toFixed(0)} km${est}${parts.length ? ` · ${parts.join(' · ')}` : ''}`;
}
