/**
 * Overspeed evidence formatting — pure, unit-tested (audit §3).
 * The card reads: "78 km/h for 6 minutes on NH-19 near Dankuni" — speed,
 * duration, place. Never a coordinate, never a raw enum.
 *
 * Both signals are shown with provenance and NEVER averaged: "Our
 * calculation: 4 events, 22 min over. Tata's device reported: 31 events."
 * That disagreement is itself the argument for the product.
 */

/** "78 km/h for 6 minutes" — speed and duration, both rounded honestly. */
export function eventLine(event) {
  if (!event) return null;
  const speed = Math.round(Number(event.maxSpeedKmh));
  // Floor: a 30-second blip is not "for 1 minute".
  const minutes = Math.floor(Number(event.durationSec) / 60);
  if (!Number.isFinite(speed) || !Number.isFinite(minutes) || minutes < 1) return null;
  return `${speed} km/h for ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** Total overspeed minutes across computed events. */
export function totalOverMinutes(events) {
  if (!Array.isArray(events)) return 0;
  return events.reduce((sum, e) => sum + (Number(e?.durationSec) || 0), 0) / 60;
}

/**
 * Count-based variant for cards that already hold aggregates.
 *   comparisonFromCounts({ computedCount: 4, computedOverMinutes: 22, corroboratingCount: 31 })
 */
export function comparisonFromCounts({ computedCount = 0, computedOverMinutes = 0, corroboratingCount = 0 } = {}) {
  const ours = Number(computedCount) || 0;
  const theirs = Number(corroboratingCount) || 0;
  if (ours === 0 && theirs === 0) return null;
  const ourMinutes = Math.round(Number(computedOverMinutes) || 0);
  const parts = [`Our calculation: ${ours} event${ours === 1 ? '' : 's'}, ${ourMinutes} min over`];
  if (theirs > 0) {
    parts.push(`device-reported: ${theirs} event${theirs === 1 ? '' : 's'}`);
  }
  return parts.join('. ') + '.';
}

/**
 * The two-source comparison line, or null when there is nothing to compare.
 * FleetEdge's OverSpeedEvent fires on an instantaneous sample — it is
 * corroboration, never the source, and never merged with our compute.
 */
export function comparisonLine(computedEvents, corroboratingEvents) {
  return comparisonFromCounts({
    computedCount: Array.isArray(computedEvents) ? computedEvents.length : 0,
    computedOverMinutes: totalOverMinutes(computedEvents),
    corroboratingCount: Array.isArray(corroboratingEvents) ? corroboratingEvents.length : 0,
  });
}

/** True when the two sources materially disagree — surfaced, not smoothed. */
export function sourcesDisagree(computedEvents, corroboratingEvents, ratio = 2) {
  const ours = Array.isArray(computedEvents) ? computedEvents.length : 0;
  const theirs = Array.isArray(corroboratingEvents) ? corroboratingEvents.length : 0;
  if (ours === 0 || theirs === 0) return false;
  const big = Math.max(ours, theirs);
  const small = Math.min(ours, theirs);
  return big >= ratio * small;
}
