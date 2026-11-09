/**
 * formatMoney.js — accounting presentation on top of utils/formatters.js.
 *
 * formatters.js owns how a rupee amount is printed (full: formatINR, compact
 * tiles: formatInrCompact). This module only adds what financial statements
 * need on top: em-dash money cells (inr, money), plain grouped integers (num),
 * signed deltas (signedInr) and Dr/Cr balances (drCr).
 *
 * Two different ideas live here, and they must not be mixed:
 *
 * - An **amount** the server did not send is unknown. "No value recorded" and
 *   "zero rupees" mean different things on a financial statement, so a missing
 *   amount prints an em-dash. The backend says the same thing: an idle
 *   segment nobody priced carries `rupees: null` and "must not read as ₹0
 *   wasted".
 * - A **count** that is missing means there are none of them. A count is
 *   zero or a number, so `num` keeps printing 0 for a missing count — turning
 *   "—" into every empty counter would be a change of meaning, not a fix.
 */
import { formatINR } from './formatters.js';

/** Full-precision rupees, no paise; a missing amount is an em-dash. e.g. 1200000 → "₹12,00,000" */
export const inr = (v) =>
  v === null || v === undefined || v === '' ? '—' : formatINR(Number(v) || 0);

/**
 * Plain Indian-grouped integer. e.g. 120000 → "1,20,000"
 *
 * This is the count formatter: a count that was not sent is zero, so it stays
 * "0" and never becomes a dash.
 */
export const num = (v) => new Intl.NumberFormat('en-IN').format(v || 0);

/**
 * Litres as people read them. A volume nobody measured is a dash, not 0 L.
 * e.g. 120.4 → "120 L"
 */
export const litres = (v) =>
  v === null || v === undefined || v === '' ? '—' : `${num(Math.round(Number(v)))} L`;

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
