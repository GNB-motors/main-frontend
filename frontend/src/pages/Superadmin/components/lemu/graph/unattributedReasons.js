/* Unattributed error reasons — why a group could not be joined to the
   manifest, counted per reason by the backend's errorAttribution service
   (H9). The banner must read "67 unattributed: 41 no stack, 19 outside the
   manifest, 7 no sourcemap", never a bare number: a count without its
   reasons is not actionable, and the biggest class (no stack) is a capture
   gap, not a code gap.

   `reasons` is the unattributedReasons map; `count` is
   unattributed.length. They are passed separately so the formatter stays
   honest if the two ever disagree — it derives the total from the map and
   falls back to the given count only when the map is absent. */

const REASON_ORDER = ['no stack', 'outside manifest', 'node_modules frame', 'missing sourcemap'];

export const formatUnattributed = ({ count = 0, reasons = null } = {}) => {
  if (!reasons || Object.keys(reasons).length === 0) {
    return `${count} error${count === 1 ? '' : 's'} could not be attributed`;
  }
  const known = REASON_ORDER.filter((r) => reasons[r]);
  const unknown = Object.keys(reasons)
    .filter((r) => !REASON_ORDER.includes(r))
    .sort();
  const parts = [...known, ...unknown].map((r) => `${reasons[r]} ${r}`);
  const total = Object.values(reasons).reduce((a, b) => a + b, 0);
  return `${total} unattributed: ${parts.join(', ')}`;
};
