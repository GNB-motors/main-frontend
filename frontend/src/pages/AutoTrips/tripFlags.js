/**
 * Why a trip carries a flag, and what the server said about a trip that stayed open — pure.
 *
 * The chips stay short so a table row stays readable. The server's own words about a stale
 * trip go in the chip's tooltip and in the row's tooltip, where there is room for them.
 */
import { humanizeCode } from '@/utils/format';
import { FLAG_LABEL } from './autoTripPlaces';

/** The flags that come with the server's explanation of a trip that stayed open. */
const STALE_FLAGS = new Set(['STALE_OPEN', 'OPEN_AT_DATA_END']);

/** The flags the route line already says — they do not need a chip of their own. */
const DROP_FLAGS = ['DROP_UNKNOWN', 'DROP_INFERRED'];

/** The checks a trip needs: the flags the route line does not already say. */
export function checkFlagsOf(trip) {
  const flags = trip?.flags || [];
  const dropFlag = flags.some((f) => DROP_FLAGS.includes(f));
  return flags.filter((f) => !DROP_FLAGS.includes(f) && !(dropFlag && f === 'PICKUP_TO_PICKUP'));
}

/** The flag's own label, always something a person can read. */
export const flagLabel = (flag) => FLAG_LABEL[flag] || humanizeCode(flag);

/** What the server wrote about a trip that stayed open. Null when it wrote nothing. */
export function staleDetail(trip) {
  const detail = trip?.staleReason?.detail;
  return typeof detail === 'string' && detail.trim() ? detail.trim() : null;
}

/**
 * The reason for a flag: the server's own words when it explained a stale trip, else the
 * flag's own label.
 */
export function flagReason(trip, flag) {
  const detail = staleDetail(trip);
  if (detail && STALE_FLAGS.has(flag)) return detail;
  return flagLabel(flag);
}

/** Every flag's reason, in the order the server listed them — the row's tooltip. */
export const flagReasons = (trip) => (trip?.flags || []).map((flag) => flagReason(trip, flag));
