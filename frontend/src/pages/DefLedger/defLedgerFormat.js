import { formatNum } from '../../utils/formatters';

export const FRESHNESS_LABEL = {
  RECENT: 'Recent',
  STALE: 'Stale',
  UNKNOWN: 'Freshness unknown',
  NO_DATA: 'No telemetry',
};

export function defFreshness(vehicle) {
  const reported = vehicle.freshness;
  const candidate = reported ? reported.asOf : vehicle.coverageTo;
  const asOf = candidate && Number.isFinite(new Date(candidate).getTime()) ? candidate : null;
  const status =
    vehicle.status === 'NO_DATA'
      ? 'NO_DATA'
      : FRESHNESS_LABEL[reported?.status]
        ? reported.status
        : 'UNKNOWN';
  return {
    status: !asOf && status !== 'NO_DATA' ? 'UNKNOWN' : status,
    asOf: status === 'NO_DATA' ? null : asOf,
  };
}

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
