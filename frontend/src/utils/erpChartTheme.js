/**
 * erpChartTheme.js
 * Shared chart palette for ERP + financial visualisations.
 *
 * Categorical slots are validated (lightness band, chroma floor, adjacent-pair
 * CVD separation, normal-vision floor, contrast vs surface) — do not swap a hue
 * here without re-running the check. `signal.*` is the reserved status scale and
 * is never reused as a series color; every status mark also carries a text label
 * so identity is never colour-alone.
 *
 * `pipeline` is a sequential ramp (one hue, light → dark) because the trip
 * stages are ordered. It is not a categorical set.
 *
 * The lead hue is the app primary (--primary-color, #4f46e5) so these pages read
 * as part of the product rather than as the separate teal "console" language.
 * It is hardcoded rather than read from the themeable CSS variable on purpose:
 * these are data marks, and an arbitrary user-picked hue cannot be checked for
 * CVD separation against its neighbours ahead of time.
 */
export const C = {
  ink: '#0e1726',
  inkSoft: '#1b2535',
  muted: '#8b93a7',
  grid: '#e8ecf3',
  cat: ['#4f46e5', '#b0479b'],
  catSoft: '#eeecfd',
  signal: { good: '#0f8b6c', warn: '#f2a413', critical: '#e5484d' },
  pipeline: ['#c7c3f7', '#a9a3f2', '#8b83ed', '#6f68e9', '#544be6', '#3f37c4'],
};

/**
 * Receivables vs payables are two *categories*, not two points on a scale, so
 * they take the validated categorical pair (indigo ↔ magenta, normal-vision
 * ΔE 21.1, worst-CVD ΔE 12.3 — both clear).
 *
 * Do NOT encode them as green/red: "money in is good, money out is bad" is
 * wrong for a business (payables you owe are normal), and it burns the reserved
 * status scale on a plain categorical split.
 */
export const MONEY_SERIES = {
  receivable: C.cat[0],
  payable: C.cat[1],
};

/**
 * Ageing buckets are ORDINAL (discrete, ordered, escalating), so they take a
 * single-hue ramp light→dark — never categorical hues, which would imply the
 * buckets are unrelated kinds rather than degrees of the same thing.
 *
 * Validated as an ordinal ramp: monotone lightness, adjacent ΔL ≥ 0.06, light
 * end 2.16:1 vs surface, hue spread 3°. Red family so severity reads without
 * the legend, and so it never collides with the indigo `pipeline` ramp.
 *
 * UNKNOWN is deliberately off-ramp (muted gray): "we don't have a due date" is
 * not a degree of overdue-ness, it's missing data.
 */
export const AGEING_RAMP = {
  CURRENT: '#e89a94',
  '1-30': '#d9706a',
  '31-60': '#c4443d',
  '61-90': '#9e2f2a',
  '90+': '#75201d',
  UNKNOWN: C.muted,
};

/** Canonical bucket order — matches the backend's ageing helper. */
export const AGEING_ORDER = ['CURRENT', '1-30', '31-60', '61-90', '90+', 'UNKNOWN'];

export const ageingColor = (bucket) => AGEING_RAMP[bucket] || C.muted;

export default C;
