export const DEF_COMPARISON_COPY =
  'DEF use is compared with the range supplied for this truck and model. A missing comparison range is not a normal reading.';

export function defComparisonBand(band) {
  if (band?.min == null || band?.max == null) return null;
  const min = Number(band.min);
  const max = Number(band.max);
  return Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max > min
    ? { min, max }
    : null;
}

export function defComparisonLabel(band) {
  const valid = defComparisonBand(band);
  return valid ? `Comparison range: ${valid.min}–${valid.max}%` : 'Comparison range not available';
}
