/** Plain-language summary of a warehouse-change impact for the confirm dialog. */
export function impactSummary(impact) {
  if (!impact) return '';
  const open = impact.openTripsAffected || 0;
  const frozen = impact.frozenTripsUnaffected || 0;
  const parts = [];
  parts.push(
    open === 0
      ? 'No open trips use this place.'
      : `${open} open trip${open === 1 ? '' : 's'} of ${impact.vehicles} vehicle${impact.vehicles === 1 ? '' : 's'} may re-anchor to this yard (km split and variance flags can change; trip cost does not).`,
  );
  if (frozen)
    parts.push(
      `${frozen} closed-tour trip${frozen === 1 ? '' : 's'} stay frozen and will not change.`,
    );
  return parts.join(' ');
}

/** A typed ApiError that carries the trips a warehouse change would re-anchor. */
export function isImpactGate(err) {
  return err?.status === 409 && Boolean(err?.body?.impact);
}

/** The best message a failed request carries, for a toast or empty state. */
export function messageOf(err, fallback) {
  return err?.displayMessage || fallback;
}
