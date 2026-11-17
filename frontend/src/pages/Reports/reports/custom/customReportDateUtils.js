export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/**
 * Normalise any date input (ISO timestamp, YYYY-MM-DD, or DD-MM-YYYY) into YYYY-MM-DD.
 */
export function toYmd(val) {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(trimmed);
  if (m) {
    const [, d, mon, y] = m;
    return `${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

/**
 * Format any date input into consistent dd-mm-yyyy display string.
 */
export function toDmy(val) {
  if (!val) return '';
  const ymd = toYmd(val);
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}-${m}-${y}`;
}

/**
 * Parse a user-entered dd-mm-yyyy string into a valid YYYY-MM-DD string, or null if invalid.
 */
export function parseDmyInput(input) {
  if (!input || typeof input !== 'string') return null;
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(input.trim());
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);

  if (mon < 1 || mon > 12) return null;
  if (y < 1900 || y > 2100) return null;

  const maxDays = new Date(y, mon, 0).getDate();
  if (d < 1 || d > maxDays) return null;

  return `${y}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

