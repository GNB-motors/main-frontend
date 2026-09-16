/**
 * Pure helpers for the corridor time-of-day heatmap — no React, no fetching.
 *
 * Sequential ramp: the dataviz skill's validated default blue scale
 * (references/palette.md, steps 100->700), light->dark = faster->slower.
 * Reused verbatim rather than inventing new hex values.
 */
export const SEQUENTIAL_RAMP = [
  '#cde2fb', // 100
  '#9ec5f4', // 200
  '#6da7ec', // 300
  '#3987e5', // 400
  '#256abf', // 500
  '#184f95', // 600
  '#0d366b', // 700
];

export const NO_DATA_COLOR = '#eef0f2';
export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Index buckets by "hour_dow" for O(1) lookup while rendering the grid. */
export function indexBuckets(buckets) {
  const byKey = new Map();
  for (const b of buckets || []) {
    byKey.set(`${b.hour}_${b.dow}`, b);
  }
  return byKey;
}

/**
 * Map a p50Min value to a ramp color, normalized against this corridor's own
 * min/max — a 20-min corridor and a 6-hour corridor each get their own
 * light->dark range, so the pattern within one corridor stays legible instead
 * of being flattened by a shared cross-corridor scale.
 */
export function colorForValue(value, min, max) {
  if (value == null) return NO_DATA_COLOR;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return SEQUENTIAL_RAMP[Math.floor(SEQUENTIAL_RAMP.length / 2)];
  }
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const idx = Math.min(SEQUENTIAL_RAMP.length - 1, Math.floor(t * SEQUENTIAL_RAMP.length));
  return SEQUENTIAL_RAMP[idx];
}

/** Confidence fades a thin bucket out rather than presenting it at full strength. */
export function opacityForSamples(samples) {
  if (!samples) return 1;
  if (samples >= 5) return 1;
  if (samples >= 2) return 0.7;
  return 0.45;
}

/** min/max p50Min across the populated buckets, or null if none have a value. */
export function p50Range(buckets) {
  const values = (buckets || []).map((b) => b.p50Min).filter((v) => v != null);
  if (!values.length) return { min: null, max: null };
  return { min: Math.min(...values), max: Math.max(...values) };
}
