import { formatNum } from '../../utils/formatters';

export const signedLitres = (v) =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${formatNum(v, { decimals: 1 })} L`;

export function humanizeFlagType(type) {
  if (type === 'DEF_DRAIN_SENSOR') return 'Drain beyond burn';
  if (type === 'IMPOSSIBLE_CLAIM') return 'Impossible fill';
  if (type === 'NEGATIVE_BALANCE') return 'Unlogged burn';
  const s = String(type || 'Flag')
    .toLowerCase()
    .replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
