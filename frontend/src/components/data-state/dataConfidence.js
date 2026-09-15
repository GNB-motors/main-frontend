import { formatLitres, formatPct, formatNum, timeAgo, freshnessOf } from '../../utils/formatters';

/**
 * Data-confidence helpers.
 *
 * Kept in a separate non-component file so that the component file below can
 * comply with React Fast Refresh (only component exports) while callers still
 * import the primitives from the data-state barrel.
 */

export const DATA_STATES = {
  NO_DATA: 'no-data',
  STALE: 'stale',
  MEASURED_ZERO: 'measured-zero',
  MEASURED: 'measured',
};

/**
 * Classify a reading.
 * @param {number|null|undefined} value
 * @param {string|Date|null|undefined} at reading timestamp (carries reading age)
 * @returns {{state: 'no-data'|'stale'|'measured-zero'|'measured', ageText: string, level: 'fresh'|'aging'|'stale'|'dead'}}
 */
export function confidenceOf(value, at) {
  if (value == null || Number.isNaN(Number(value))) {
    return { state: DATA_STATES.NO_DATA, ageText: '', level: 'dead' };
  }

  const level = at ? freshnessOf(at) : 'fresh';
  const ageText = at ? timeAgo(at) : '';

  if (level === 'stale' || level === 'dead') {
    return { state: DATA_STATES.STALE, ageText, level };
  }

  if (Number(value) === 0) {
    return { state: DATA_STATES.MEASURED_ZERO, ageText: '', level };
  }

  return { state: DATA_STATES.MEASURED, ageText: '', level };
}

export function isMeasuredState(state) {
  return state === DATA_STATES.MEASURED || state === DATA_STATES.MEASURED_ZERO;
}

/**
 * Format a reading with its unit, honouring the confidence classification.
 */
export function formatDataValue(value, unit, { decimals } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  if (unit === 'unverified') return 'unit unverified';
  if (unit === 'litres') return formatLitres(value, { decimals });
  if (unit === '%') return formatPct(value, { decimals });
  return `${formatNum(value, { decimals })}${unit ? ` ${unit}` : ''}`;
}
