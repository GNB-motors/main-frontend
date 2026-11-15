/**
 * Unknown is never 0.
 *
 * The backend sends null for "not measured". `Number(null) === 0`, `null || 0`
 * and `null ?? 0` all turn that into a real-looking zero, so a measured quantity
 * goes through these helpers instead.
 */

export const PARTIAL_LABEL = 'Partly measured';

/** A real number or numeric string. null, undefined, '', booleans and NaN are not. */
export function isMeasured(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim() !== '' && Number.isFinite(Number(value));
  return false;
}

/** The number, or null when it was not measured. */
export function toMeasured(value) {
  return isMeasured(value) ? Number(value) : null;
}

/**
 * Sum only what was measured. `sum` is null when nothing was, so the caller can
 * print a dash rather than 0; `unknown` is how many items the sum leaves out.
 */
export function sumKnown(values = []) {
  let sum = null;
  let known = 0;
  let total = 0;
  for (const value of values) {
    total += 1;
    if (isMeasured(value)) {
      sum = (sum ?? 0) + Number(value);
      known += 1;
    }
  }
  return { sum, known, unknown: total - known, total };
}

/** "over 42 of 51 trucks". Null when the counts are absent, as on the old backend. */
export function coverageNote(known, total, noun = 'trucks') {
  if (!isMeasured(known) || !isMeasured(total)) return null;
  return `over ${Number(known)} of ${Number(total)} ${noun}`;
}
