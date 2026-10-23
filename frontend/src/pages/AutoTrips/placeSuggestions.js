/**
 * Place suggestions — pure helpers for the trip / schedule place picker.
 * No React, no I/O, so the ranking labels are testable on their own.
 *
 * The server does the ranking (exact-prefix name match, then distance to the
 * map viewport, then stoppage frequency, then confidence). What lives here is
 * how a ranked record is *shown*: the confidence badge, the "why this one"
 * hint, and the duplicate warning when a pin lands inside the merge radius of
 * a place that already exists.
 */

/** Below this we call the place low-confidence in the UI. Mirrors the server default. */
export const LOW_CONFIDENCE_CUTOFF = 0.5;

/**
 * Turn a server suggestion into a `{ value, label }` pair for the select, and
 * keep the confidence fields around so the trigger can show a badge.
 *
 * The label keeps the visit count because "how busy is this place" is what
 * actually tells a scheduler whether they picked the right pin.
 */
export function toPickOption(site) {
  const name = site?.name || site?.key || 'Unnamed place';
  const visits = site?.visitCount ?? 0;
  const suffix = visits > 0 ? ` · ${visits} visit${visits === 1 ? '' : 's'}` : '';
  return {
    id: site?.id,
    label: `${name}${suffix}`,
    name,
    visitCount: visits,
    confidence: typeof site?.confidence === 'number' ? site.confidence : null,
    lowConfidence: site?.lowConfidence === true,
    stoppageCount: site?.stoppageCount ?? null,
    prefixMatch: site?.prefixMatch === true,
    siteType: site?.siteType ?? null,
  };
}

/** Map a ranked suggestion list straight to select options. */
export function toPickOptions(sites = []) {
  return sites.filter((s) => s?.id).map(toPickOption);
}

/**
 * Confidence badge text. `null` confidence means the score has not been
 * computed yet — say so rather than pretending the place is 0% confident.
 */
export function confidenceBadge(site) {
  if (!site) return null;
  if (site.lowConfidence === true) {
    return {
      tone: 'low',
      label: 'Low confidence',
      detail: site.stoppageCount
        ? `${site.confidentStoppageCount ?? 0} of ${site.stoppageCount} stoppages sit inside this fence`
        : 'Most of its stoppages fall outside the fence',
    };
  }
  if (typeof site.confidence === 'number') {
    const pct = Math.round(site.confidence * 100);
    return {
      tone: site.confidence >= LOW_CONFIDENCE_CUTOFF ? 'good' : 'fair',
      label: `${pct}% of stoppages inside`,
      detail: 'Confidence = share of this place’s stoppages that land inside its own fence',
    };
  }
  return {
    tone: 'unknown',
    label: 'Not scored yet',
    detail: 'Confidence has not been computed for this place',
  };
}

/**
 * The one-line reason a suggestion is where it is in the list. Mirrors the
 * server's tier order so the UI never claims a different winner than the API
 * picked.
 */
export function rankReason(site, { typed = '' } = {}) {
  if (!site) return '';
  const name = (site.name || site.key || '').toLowerCase();
  const q = typed.trim().toLowerCase();
  if (q && name.startsWith(q)) return `Starts with “${typed.trim()}”`;
  if (site.prefixMatch) return 'Name matches';
  if (site.visitCount > 0) return `${site.visitCount} stoppages for this org`;
  return 'No recorded stoppages yet';
}

/**
 * Duplicate warning for a dropped pin. `nearby` is the server's
 * `/sites/nearby` answer; anything in it is inside the merge radius, so a new
 * record created here would very likely be a duplicate of one of them.
 *
 * Returns `null` when there is nothing worth warning about — an empty nearby
 * list, or only a single place that is already the one being edited.
 */
export function duplicateWarning(nearby, { excludeId = null } = {}) {
  const items = (nearby?.items || []).filter(
    (s) => s?.id && s.id !== excludeId && s.status !== 'REJECTED',
  );
  if (!items.length) return null;
  const nearest = items[0];
  const others = items.length - 1;
  const what =
    items.length === 1
      ? `“${nearest.name}” is already ${Math.round(nearest.distanceM)} m away`
      : `“${nearest.name}” is ${Math.round(nearest.distanceM)} m away, plus ${others} more`;
  return {
    tone: nearest.lowConfidence === true ? 'fair' : 'warn',
    headline: 'Possible duplicate',
    detail: `${what}. Merging is cheaper than a second record nobody notices.`,
    candidates: items,
  };
}

/**
 * Should the picker offer the low-confidence places at all? Off unless the
 * person deliberately asks — the server hides them by default too.
 */
export function shouldIncludeLowConfidence(flag) {
  return flag === true;
}