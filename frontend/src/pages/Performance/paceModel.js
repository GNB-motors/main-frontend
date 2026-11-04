/**
 * The pace factor, read the way the driver thinks about it.
 *
 * 1.0 is the road's expected pace and above 1 is slower, so the number is
 * written as "1.08× road pace" with the uncertainty the model carries
 * beside it. A driver with no pace profile is a dash with the reason — not
 * a 1.00, which would read as "exactly on the road's pace".
 */
export function formatPace(value, uncertainty) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const base = `${n.toFixed(2)}× road pace`;
  if (uncertainty == null) return base;
  const u = Number(uncertainty);
  if (!Number.isFinite(u)) return base;
  return `${base} ± ${u.toFixed(2)}`;
}
