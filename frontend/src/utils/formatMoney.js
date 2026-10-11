/**
 * formatMoney.js — accounting presentation on top of utils/formatters.js.
 *
 * formatters.js owns how a rupee amount is printed (full: formatINR, compact
 * tiles: formatInrCompact). This module only adds what financial statements
 * need on top: zero-for-missing totals (inr), em-dash cells (money), signed
 * deltas (signedInr) and Dr/Cr balances (drCr).
 */
import { formatINR } from './formatters.js';

/** Full-precision rupees, no paise; a missing value counts as zero. e.g. 1200000 → "₹12,00,000" */
export const inr = (v) => formatINR(Number(v) || 0);

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
