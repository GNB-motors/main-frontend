/**
 * The `truncated` list on the root of /api/intelligence/instances.
 *
 * The server says which lists it had to cut and at what limit, so the page can
 * say that instead of a hard-coded number that is right for one list only.
 * This is the server's own flag — it is not the client's paging flag and not
 * the road-coverage flag of the congestion page.
 */

/** "fuel windows cut at 5,000" — one entry of the truncated list. */
export function truncatedEntryText(entry) {
  const what = String(entry?.what ?? '').trim();
  if (!what) return null;
  const limit = Number(entry?.limit);
  if (!Number.isFinite(limit)) return what;
  return `${what} cut at ${limit.toLocaleString('en-IN')}`;
}

/** The whole note, or null when the response was not cut. */
export function truncatedNote(truncated) {
  const entries = Array.isArray(truncated) ? truncated : [];
  const parts = entries.map(truncatedEntryText).filter(Boolean);
  return parts.length ? `Partial list: ${parts.join('; ')}` : null;
}

/** The note for the cut lists whose name matches one of `words`. */
export function truncatedNoteFor(truncated, words = []) {
  const entries = Array.isArray(truncated) ? truncated : [];
  const matched = entries.filter((entry) => {
    const what = String(entry?.what ?? '').toLowerCase();
    return words.some((word) => what.includes(word));
  });
  return truncatedNote(matched);
}
