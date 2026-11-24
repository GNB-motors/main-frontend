import AutoTripService from '../../services/AutoTripService';
import { actualTripCount, deliveredTripCount } from './tripListModel';

/**
 * The trips page asks the backend for the tab counts with the list itself.
 *
 * `?withCounts=1` makes GET /api/auto-trips answer with the list and, beside
 * it, `tabCounts` — one key per tab status plus `total` — so the counts cost
 * one aggregate instead of one count query per status, per read.
 *
 * A backend that does not know the flag answers 400 (the query is validated);
 * one that knows it but sends no counts answers a plain list. Both fall back
 * to the plain read: the counts then come from the reads the page already
 * makes (the today read, the two samples and the trip plans).
 */
let withCountsSupported = null; // null: not tried yet, true/false: known

export const supportsWithCounts = () => withCountsSupported;

/** Forget what the backend answered (tests). */
export const resetWithCountsSupport = () => {
  withCountsSupported = null;
};

/** The counts beside the list, or null when the backend sent none. */
export const countsOf = (result) =>
  result?.tabCounts && typeof result.tabCounts === 'object' ? result.tabCounts : null;

/** A count somebody answered: a missing key is a zero. */
const answered = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/** A count nobody answered: null, so the page can show it as unknown. */
const exact = (value) =>
  value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);

/**
 * The counts the page shows.
 *
 * The list's own `tabCounts` is the truth. When the backend answers the list
 * without counts (the `withCounts` fallback), the numbers the page's other
 * reads carry are used where they are exact — the delivered sample knows how
 * many trips were delivered, the waiting sample how many wait for an answer —
 * and everything else stays unknown: it is shown as '—', never as a zero,
 * which would hide a tab that has trips in it.
 *
 * `listCounts` is null when the list answered without counts and the current
 * filter is not loading any more: the counts of the previous filter are not
 * reused.
 */
export function resolveTabCounts({
  listCounts = null,
  deliveredTotal = null,
  waitingTotal = null,
  waitingCounts = null,
} = {}) {
  const counts = listCounts ?? null;
  const waiting = exact(waitingCounts?.NEEDS_REVIEW);
  return {
    counts,
    all: counts ? actualTripCount(counts) : null,
    delivered: counts ? deliveredTripCount(counts) : exact(deliveredTotal),
    open: counts ? answered(counts.OPEN) : null,
    review: waiting ?? (counts ? answered(counts.NEEDS_REVIEW) : exact(waitingTotal)),
    // A plant-to-plant run is a trip of its own: its count is shown with the
    // others, and it is unknown when the backend sent no counts.
    reposition: counts ? answered(counts.reposition ?? counts.REPOSITION) : null,
    tab: (key) => (counts ? answered(counts[key]) : null),
  };
}

const statusOf = (err) => err?.status ?? err?.response?.status ?? null;

/** The trips list, with the counts asked for when the backend can answer them. */
export const listTripsWithCounts = async (params = {}, { signal } = {}) => {
  if (withCountsSupported === false) return AutoTripService.list(params, { signal });
  try {
    const result = await AutoTripService.list({ ...params, withCounts: 1 }, { signal });
    // Only a response that carries the counts counts as "the backend knows the
    // flag": one that ignores it would otherwise look like one that answered it.
    withCountsSupported = Boolean(countsOf(result));
    return result;
  } catch (err) {
    // The flag is not understood here: ask again without it, and never again.
    if (statusOf(err) !== 400) throw err;
    withCountsSupported = false;
    return AutoTripService.list(params, { signal });
  }
};

export default listTripsWithCounts;
