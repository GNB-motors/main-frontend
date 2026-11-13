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

// Which freshness lane a vehicle sits in, for the top-of-page filter and the
// fresh-only headline totals. STALE/NO_DATA are their own lanes; RECENT and the
// rarer UNKNOWN both count as usable ("fresh") telemetry.
export function freshnessBucket(vehicle) {
  const s = defFreshness(vehicle).status;
  if (s === 'STALE') return 'stale';
  if (s === 'NO_DATA') return 'none';
  return 'fresh';
}

// Earliest coverage start and latest coverage end across the vehicles that have
// any telemetry — the real span behind the "(in window)" figures, which is a
// different length for every truck.
export function coverageRange(vehicles) {
  let from = null;
  let to = null;
  for (const v of vehicles || []) {
    if (v.coverageFrom && (!from || new Date(v.coverageFrom) < new Date(from)))
      from = v.coverageFrom;
    if (v.coverageTo && (!to || new Date(v.coverageTo) > new Date(to))) to = v.coverageTo;
  }
  return { from, to };
}

export function humanizeFlagType(type) {
  if (type === 'DEF_DRAIN_SENSOR') return 'Drain beyond burn';
  if (type === 'IMPOSSIBLE_CLAIM') return 'Impossible fill';
  if (type === 'NEGATIVE_BALANCE') return 'Unlogged burn';
  const s = String(type || 'Flag')
    .toLowerCase()
    .replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
