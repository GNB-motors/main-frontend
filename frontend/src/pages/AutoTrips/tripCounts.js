import AutoTripService from '../../services/AutoTripService';

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
