/**
 * duplicatePairModel — the sentence the "Same place?" tab shows.
 *
 * The owner asked for one clear line: these look like the same place, here
 * are the two names, and here is how far apart they are. Everything else
 * on that tab is evidence; this is the conclusion, in words.
 */

/** The two names of a pair, with the distance between them. */
export function samePlaceSentence(pair) {
  if (!pair) return null;
  const a = pair.a?.name || 'Unnamed place';
  const b = pair.b?.name || 'Unnamed place';
  const apart =
    pair.distanceM == null
      ? 'we do not know how far apart they are'
      : `${Math.round(pair.distanceM)} m apart`;
  return `These look like the same place: ${a} and ${b}, ${apart}.`;
}

/** The distance between the two places, in the owner's words. */
export function apartText(distanceM) {
  if (distanceM == null) return '—';
  const metres = Math.round(distanceM);
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
