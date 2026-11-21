/**
 * The contract's cell — one number with its provenance.
 *
 *   { value, unit, source, uncertainty, reason }
 *
 * `source` is one of five words: measured, vendor, estimated, not_comparable,
 * insufficient_data. A missing reading is NEVER 0 — it is one of the two
 * unknown sources carrying a reason.
 */

export const SOURCES = ['measured', 'vendor', 'estimated', 'not_comparable', 'insufficient_data'];

export const SOURCE_LABEL = {
  measured: 'Measured',
  vendor: 'iALERT',
  estimated: 'Estimated',
  not_comparable: 'Not comparable',
  insufficient_data: 'Not enough data',
};

export const UNKNOWN_SOURCES = ['not_comparable', 'insufficient_data'];

export const NO_READING_REASON = 'No reading for this period.';

/** The source of a cell. An unrecognised source is treated as unknown. */
export const cellSource = (cell) => {
  const source = cell?.source;
  return SOURCES.includes(source) ? source : 'insufficient_data';
};

/** True when the cell carries no number we are allowed to show. */
export const isUnknownCell = (cell) => {
  if (!cell) return true;
  if (UNKNOWN_SOURCES.includes(cellSource(cell))) return true;
  return cell.value == null;
};

/** The number, or null. A missing reading is null — never 0. */
export const cellNumber = (cell) => {
  if (isUnknownCell(cell)) return null;
  const n = Number(cell.value);
  return Number.isFinite(n) ? n : null;
};

/** Why we cannot show a number. Always something, never empty. */
export const cellReason = (cell) => {
  const reason = typeof cell?.reason === 'string' ? cell.reason.trim() : '';
  if (reason) return reason;
  if (cell?.source === 'not_comparable') return 'Not comparable to the measured reading.';
  return NO_READING_REASON;
};

export const formatCellNumber = (value, decimals = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  // Trailing zeros are trimmed after the decimal point only: 70 stays 70.
  return n
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
};

export const cellUnit = (cell) => (typeof cell?.unit === 'string' ? cell.unit.trim() : '');

/** "18.4" with the unit kept separate, so the uncertainty can sit between. */
export const formatCellValue = (cell, decimals = 1) => {
  const n = cellNumber(cell);
  if (n == null) return '—';
  return formatCellNumber(n, decimals);
};

/** The uncertainty an estimated cell carries, or null when there is none. */
export const cellUncertainty = (cell) => {
  if (cellSource(cell) !== 'estimated') return null;
  // No uncertainty reported is not an uncertainty of zero.
  if (cell?.uncertainty == null || cell.uncertainty === '') return null;
  const u = Number(cell.uncertainty);
  return Number.isFinite(u) ? u : null;
};

/** True when the cell is a plain number with a source we understand. */
export const isKnownSource = (cell) => SOURCES.includes(cell?.source);

const CADENCE_REASON = /^cadence P90 (\d+) min > (\d+) s$/;

const sentence = (text) => {
  const trimmed = String(text || '')
    .trim()
    .replace(/\.$/, '');
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.` : '';
};

/**
 * The reason a cell carries, grouped so one sentence can explain every row it
 * applies to. The server writes the cadence gate per truck ("cadence P90 63 min
 * > 90 s"), so trucks that fail the same gate share one group and the gap range
 * is kept for the sentence.
 */
export function reasonGroup(cell) {
  const raw = cellReason(cell);
  const cadence = CADENCE_REASON.exec(raw);
  if (cadence) {
    const minutes = Number(cadence[1]);
    const requiredS = Number(cadence[2]);
    return { key: `cadence:${requiredS}`, kind: 'cadence', minutes, requiredS };
  }
  if (/^no learned cadence/i.test(raw)) {
    return {
      key: 'cadence:unlearned',
      kind: 'text',
      text: 'Not enough readings yet to judge this feed.',
    };
  }
  if (/^this feed cannot be compared yet/i.test(raw)) {
    return { key: 'cadence:unknown', kind: 'text', text: 'This feed can’t be compared yet.' };
  }
  const text = sentence(raw);
  return { key: `text:${text}`, kind: 'text', text };
}

/** "Readings arrive up to 63 min apart; this needs one at least every 90 s." */
export function cadenceSentence({ minMinutes, maxMinutes, requiredS }) {
  const gap = minMinutes === maxMinutes ? `${maxMinutes} min` : `${minMinutes}–${maxMinutes} min`;
  return `Readings arrive up to ${gap} apart; this needs one at least every ${requiredS} s.`;
}

/** The reason of one cell, in plain words. */
export function plainReason(cell) {
  const group = reasonGroup(cell);
  if (group.kind !== 'cadence') return group.text;
  return cadenceSentence({
    minMinutes: group.minutes,
    maxMinutes: group.minutes,
    requiredS: group.requiredS,
  });
}

/** "neutral" → "Neutral", "harshBraking" → "Harsh braking", "g4" → "Gear 4". */
export function words(key) {
  const text = String(key ?? '');
  const gear = /^g(\d+)$/i.exec(text);
  if (gear) return `Gear ${gear[1]}`;
  const spaced = text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced ? `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}` : '';
}
