/**
 * Challan status vocabulary + tone map.
 *
 * Mirrors the backend enum in app/modules/challan/challan.model.js:
 *   OPEN | PAID | DISPUTED | CANCELLED
 *
 * Tones are Tailwind class strings (same shape as DefLedger's
 * defLedgerStatus.js) so the badge and the KPI tiles read identically.
 */
import { CircleAlert, CircleCheck, Scale, CircleSlash } from 'lucide-react';

export const STATUS = {
  OPEN: { label: 'Open', tone: 'rose', Icon: CircleAlert },
  PAID: { label: 'Paid', tone: 'emerald', Icon: CircleCheck },
  DISPUTED: { label: 'Disputed', tone: 'amber', Icon: Scale },
  CANCELLED: { label: 'Cancelled', tone: 'slate', Icon: CircleSlash },
};

export const TONE = {
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

/** Tailwind text colour per tone — for KPI tiles and the age column. */
export const TONE_TEXT = {
  rose: 'text-rose-600 dark:text-rose-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  slate: 'text-slate-500 dark:text-slate-400',
};

export const DEFAULT_STATUS = 'OPEN';

export function statusMeta(status) {
  return STATUS[status] || STATUS.OPEN;
}
