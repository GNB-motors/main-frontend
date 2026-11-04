/**
 * deviationDetailModel — the detour detail, in the owner's words.
 *
 * The rules this file keeps:
 *
 * 1. The map draws FOUR things, in this order: the usual road (grey, 8 px,
 *    70%), the road as driven (blue, 4 px), the part off the usual road
 *    (red, 5 px), and where it left and came back.
 * 2. When we have no usual road, the map says why, in a caption. It does
 *    not draw an empty layer.
 * 3. The stops while off the usual road are FACTS: where and for how long.
 *    Never a reason, never a judgement. Some drivers detour for bad
 *    reasons and some to earn more for their families; the screen shows
 *    the facts and the owner decides.
 */

/** The caption shown when we cannot draw the usual road. */
export const NO_USUAL_ROAD_CAPTION =
  'Not judged — your trucks have used this road fewer than 2 times.';

/** The layer order, bottom to top. */
export const LAYER_ORDER = ['usualRoute', 'track', 'offRoute', 'exitRejoin'];

/** The word for the leg of the journey. */
function legWord(leg) {
  if (leg === 'LADEN') return 'a loaded run';
  if (leg === 'EMPTY') return 'an empty run';
  if (leg === 'REPOSITION') return 'a plant-to-plant run';
  return 'a run';
}

/**
 * The header sentence for the detour.
 * "On a loaded run · FARAKKA AMBUJA PLANT → DANKUNI SIDING".
 */
export function tripHeader(trip) {
  if (!trip) return null;
  const from = trip.pickupName || null;
  const to = trip.dropName || null;
  if (!from && !to) return `On ${legWord(trip.leg)}`;
  return `On ${legWord(trip.leg)} · ${from ?? '—'} → ${to ?? '—'}`;
}

/**
 * The cost, as the product decides: an em dash when it is unknown, and
 * never a zero.
 */
export function costLabel(costInr) {
  if (costInr === null || costInr === undefined) return '—';
  const n = Math.round(Number(costInr));
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * The stops while the truck was off its usual road.
 * Each row is a fact: where, when, and for how long.
 */
export function stopsDuringRows(stops) {
  const list = Array.isArray(stops) ? stops : [];
  return list.map((stop) => ({
    key: `${stop.startAt}-${stop.endAt}`,
    placeName: stop.place?.name ?? null,
    startAt: stop.startAt,
    endAt: stop.endAt,
    durationMin: stop.durationMin ?? null,
    lat: stop.place?.lat ?? null,
    lng: stop.place?.lng ?? null,
  }));
}

/**
 * The whole detour detail, ready for the screen.
 *
 * `detail` is the new contract's payload; `row` is the release's feed row,
 * which is used when the new fields are not there yet.
 */
export function deviationDetailModel(detail, row = null) {
  const event = detail?.event || row || {};
  const geometry = detail?.roadEngine?.geometry ?? detail?.geometry ?? null;

  const usualRoute = detail?.roadEngine?.usualRoute ?? detail?.usualRoute ?? (detail?.corridor?.line?.map((p) => [p.lat, p.lng])) ?? null;
  const offRoute = Array.isArray(geometry?.offRoute) ? geometry.offRoute : null;
  const exitPoint = geometry?.exitPoint ?? null;
  const rejoinPoint = geometry?.rejoinPoint ?? null;

  return {
    usualRoute,
    offRoute,
    exitPoint,
    rejoinPoint,
    hasUsualRoad: Array.isArray(usualRoute) && usualRoute.length > 1,
    noUsualRoadCaption: detail && !(usualRoute?.length > 1) ? NO_USUAL_ROAD_CAPTION : null,
    exitAt: exitPoint?.at ?? event.startedAt ?? null,
    rejoinAt: rejoinPoint?.at ?? event.endedAt ?? null,
    trip: detail?.trip ?? null,
    header: tripHeader(detail?.trip),
    replay: detail?.roadEngine?.replay ?? detail?.replay ?? null,
    stopsDuring: stopsDuringRows(detail?.roadEngine?.stopsDuring ?? detail?.stopsDuring),
    cost: costLabel(event.estimatedExtraCostInr),
    durationMin: event.durationMin ?? null,
    maxOffKm: event.maxOffKm ?? null,
    extraKmEstimate: event.extraKmEstimate ?? null,
  };
}
