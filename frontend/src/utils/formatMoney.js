/**
 * formatMoney.js
 * Central currency/number formatting for the app.
 *
 * WHY THIS EXISTS:
 * Currency formatting was reimplemented ~8 times across the codebase, each
 * with slightly different fraction-digit and null handling, so the same amount
 * could render three different ways on three screens. All money display goes
 * through this file.
 *
 * The canonical implementations of `inr`/`compactInr`/`num`/`pct` originated in
 * CommandCenterPage and are kept verbatim here so that page's output does not
 * shift when it imports from this module.
 */

/** Full-precision rupees, no paise. e.g. 1200000 → "₹12,00,000" */
export const inr = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

/**
 * Abbreviated rupees for hero numbers ONLY — KPI tiles, chart axes, bar labels.
 * Full precision must stay available in tooltips, table cells and detail rows,
 * because an accountant needs to read and copy the exact figure.
 * e.g. 42000000 → "₹4.20 Cr"
 */
export const compactInr = (v) => {
  const n = Math.abs(v || 0);
  if (n >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(v / 1e3).toFixed(1)}k`;
  return inr(v);
};

/** Plain Indian-grouped integer. e.g. 120000 → "1,20,000" */
export const num = (v) => new Intl.NumberFormat('en-IN').format(v || 0);

/** Percentage of a whole, guarding divide-by-zero. Returns a number, not a string. */
export const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

/**
 * Money for table cells: renders an em-dash for null/undefined rather than "₹0",
 * because "no value recorded" and "zero rupees" mean different things on a
 * financial statement. Pass 0 explicitly when you mean zero.
 */
export const money = (v) => (v === null || v === undefined || v === '' ? '—' : inr(v));

/**
 * Signed amount for deltas and movements only (never for balances — use drCr).
 * e.g. -4200 → "-₹4,200", 4200 → "+₹4,200"
 */
export const signedInr = (v) => {
  const n = Number(v) || 0;
  if (n === 0) return inr(0);
  return `${n > 0 ? '+' : '-'}${inr(Math.abs(n))}`;
};

/**
 * Accounting presentation of a balance.
 *
 * Accountants read Dr/Cr, not a minus sign — a "-₹50,000" party balance is
 * ambiguous (do they owe us, or do we owe them?) whereas "₹50,000 Cr" is not.
 * Every balance shown in the financial UI goes through this.
 *
 * Convention matches the ledger: positive balance = net debit = they owe us.
 *
 * @returns {{ amount:number, suffix:'Dr'|'Cr'|'', text:string, tone:'debit'|'credit'|'zero' }}
 */
export const drCr = (balance) => {
  const n = Number(balance) || 0;
  if (n === 0) return { amount: 0, suffix: '', text: inr(0), tone: 'zero' };
  const suffix = n > 0 ? 'Dr' : 'Cr';
  return {
    amount: Math.abs(n),
    suffix,
    text: `${inr(Math.abs(n))} ${suffix}`,
    tone: n > 0 ? 'debit' : 'credit',
  };
};
