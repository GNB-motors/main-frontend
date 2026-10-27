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
  measured: 'measured',
  vendor: 'vendor',
  estimated: 'estimated',
  not_comparable: 'not comparable',
  insufficient_data: 'insufficient data',
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
  return n.toFixed(decimals).replace(/\.?0+$/, '');
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
  const u = Number(cell?.uncertainty);
  return Number.isFinite(u) ? u : null;
};

/** True when the cell is a plain number with a source we understand. */
export const isKnownSource = (cell) => SOURCES.includes(cell?.source);
