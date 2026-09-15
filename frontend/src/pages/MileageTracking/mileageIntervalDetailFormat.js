import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';
import { Minus, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

/** Pure display logic for the Mileage Interval Detail page (rule 21). */

export function fmt(v, decimals = 2, unit = '') {
  if (v == null) return '—';
  return `${Number(v).toFixed(decimals)}${unit ? ' ' + unit : ''}`;
}

export function fmtDate(d) {
  return d ? formatDateTimeIST(d) : '—';
}

export function fmtDateShort(d) {
  return d ? formatDateIST(d) : '—';
}

// Variance severity: ≤10% normal, ≤50% review, otherwise flagged.
export function getVarianceMeta(pct) {
  if (pct == null) return { color: '#6b7280', bg: '#f3f4f6', label: '—', Icon: Minus };
  const abs = Math.abs(pct);
  const label = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  if (abs <= 10) return { color: '#15803d', bg: '#f0fdf4', label, Icon: CheckCircle2 };
  if (abs <= 50) return { color: '#c56200', bg: '#fffbeb', label, Icon: AlertTriangle };
  return { color: '#b91c1c', bg: '#fef2f2', label, Icon: XCircle };
}
