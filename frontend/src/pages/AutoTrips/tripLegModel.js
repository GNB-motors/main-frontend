/**
 * tripLegModel — what a trip's leg means, in the owner's words.
 *
 * The big change in the redesign: a plant-to-plant run is NORMAL. Plants
 * work like warehouses, so a truck going from one plant straight to
 * another is working, and it usually saves an empty run. It is never shown
 * as an error and never as something that needs a check.
 */

/** The word for each leg. */
export const LEG_WORDS = {
  LADEN: 'Loaded run',
  RETURN: 'Empty run',
  REPOSITION: 'Plant to plant',
  APPROACH: 'Going to the pickup',
};

/** The tone of each leg. Plant-to-plant is the quiet one. */
export const LEG_TONES = {
  LADEN: 'good',
  RETURN: 'watch',
  REPOSITION: 'info',
  APPROACH: 'info',
};

/** The colour of each leg, the same as the map's leg colours. */
export const LEG_COLORS = {
  LADEN: 'var(--rd-leg-loaded)',
  RETURN: 'var(--rd-leg-empty)',
  REPOSITION: 'var(--rd-leg-reposition)',
  APPROACH: 'var(--rd-leg-unknown)',
};

/** The hover text for the plant-to-plant badge, exactly as the plan words it. */
export const REPOSITION_INFO =
  'The truck went from one plant straight to another without coming back empty. This is normal: plants work like warehouses, and it often saves an empty run.';

/** The word for a leg, or null when we do not know it. */
export function legWord(leg) {
  return LEG_WORDS[leg] ?? null;
}

/** The tone for a leg. */
export function legTone(leg) {
  return LEG_TONES[leg] ?? 'info';
}

/** True when the trip went from one plant straight to another. */
export function isPlantToPlant(trip) {
  return trip?.leg === 'REPOSITION';
}

/**
 * The kilometres of each leg of a trip, in the order they happened.
 *
 * The release's shape calls the return leg `return` and the deadhead to
 * the plant `approach`; the redesign shows the empty leg as whichever of
 * the two the trip actually recorded. A leg with no distance is left out,
 * so the bar never draws a zero-width slice that pretends to be a leg.
 */
export function legKilometres(trip) {
  const km = trip?.km ?? {};
  const legs = [
    { kind: 'LADEN', km: km.ladenOdo ?? km.laden ?? null },
    { kind: 'RETURN', km: km.returnOdo ?? km.return ?? km.approach ?? null },
    { kind: 'REPOSITION', km: km.repositionOdo ?? km.reposition ?? null },
  ].filter((leg) => leg.km !== null && leg.km !== undefined && Number(leg.km) > 0);
  return legs;
}

/**
 * The leg bar: one slice per leg, sized by its share of the distance.
 * The slices add up to 100% of the distance they cover, so a bar never
 * lies about the proportions.
 */
export function legBarSegments(trip) {
  const legs = legKilometres(trip);
  const total = legs.reduce((sum, leg) => sum + Number(leg.km), 0);
  if (!total) return [];
  return legs.map((leg) => ({
    kind: leg.kind,
    km: Number(leg.km),
    label: LEG_WORDS[leg.kind],
    color: LEG_COLORS[leg.kind],
    percent: (Number(leg.km) / total) * 100,
  }));
}

/**
 * The sentence under the leg bar.
 * "412 km loaded · 88 km plant to plant".
 */
export function legBarSentence(trip) {
  const segments = legBarSegments(trip);
  if (!segments.length) return 'No distance recorded for this trip.';
  return segments
    .map((segment) => `${Math.round(segment.km)} km ${segment.label.toLowerCase()}`)
    .join(' · ');
}
