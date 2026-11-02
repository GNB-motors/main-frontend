/**
 * The live vehicle view on the client — a reader of the backend's
 * `liveVehicleView` (main-backend app/modules/liveTracking/liveVehicleView.js),
 * never a second definition (audit DC-07…16, DC-18).
 *
 * Rows arrive by stream diff, so a row that stops changing is not re-sent. The
 * only thing the client adds is time: once a fix ages past the backend's own
 * `offlineAfterMin`, the row reads offline here too. Rows from an older backend
 * without `view` get the same rule applied locally.
 */

const DEFAULTS = { movingSpeedKmh: 3, offlineAfterMin: 60, staleAfterMin: 24 * 60 };

const finite = (v) => typeof v === 'number' && Number.isFinite(v);

function toMs(v) {
  if (v == null) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

function ignitionOf(v) {
  if (v === true || v === 'ON' || v === 'on' || v === 1 || v === '1') return true;
  if (v === false || v === 'OFF' || v === 'off' || v === 0 || v === '0') return false;
  return null;
}

/** The same rule as the backend, for rows that arrive without `view`. */
function localView(row, nowMs) {
  const fixMs = toMs(row.eventDateTime);
  const ageMin = fixMs == null ? null : Math.max(0, (nowMs - fixMs) / 60000);
  const isOffline = ageMin == null || ageMin > DEFAULTS.offlineAfterMin;
  const speed = finite(row.speed) ? Math.max(0, row.speed) : null;
  const ignition = ignitionOf(row.ignition);
  const hasPosition =
    finite(Number(row.latitude)) &&
    finite(Number(row.longitude)) &&
    row.latitude != null &&
    row.longitude != null;
  let status;
  if (isOffline) status = 'offline';
  else if (speed != null && speed > DEFAULTS.movingSpeedKmh) status = 'moving';
  else if (ignition === true) status = 'idling';
  else status = 'stopped';
  return {
    status,
    isOffline,
    freshness:
      ageMin == null
        ? 'never'
        : ageMin <= DEFAULTS.offlineAfterMin
          ? 'live'
          : ageMin <= DEFAULTS.staleAfterMin
            ? 'recent'
            : 'stale',
    lastFixAt: fixMs == null ? null : new Date(fixMs),
    ageMin,
    hasPosition,
    hasGpsFix: hasPosition && !isOffline,
    speedKmh: isOffline || speed == null ? null : Math.round(speed),
    ignition: isOffline ? null : ignition,
    offlineAfterMin: DEFAULTS.offlineAfterMin,
  };
}

/**
 * The view for `row` as of `nowMs`.
 * @returns {{ status: string, isOffline: boolean, freshness: string, lastFixAt: Date|null,
 *   ageMin: number|null, hasPosition: boolean, hasGpsFix: boolean, speedKmh: number|null,
 *   ignition: boolean|null }}
 */
export function viewOf(row, nowMs = Date.now()) {
  if (!row) return localView({}, nowMs);
  const v = row.view;
  if (!v) return localView(row, nowMs);
  const fixMs = toMs(v.lastFixAt ?? row.eventDateTime);
  const ageMin = fixMs == null ? null : Math.max(0, (nowMs - fixMs) / 60000);
  const limit = finite(v.offlineAfterMin) ? v.offlineAfterMin : DEFAULTS.offlineAfterMin;
  const lastFixAt = fixMs == null ? null : new Date(fixMs);
  if (!v.isOffline && ageMin != null && ageMin > limit) {
    return {
      ...v,
      status: 'offline',
      isOffline: true,
      freshness: ageMin <= DEFAULTS.staleAfterMin ? 'recent' : 'stale',
      hasGpsFix: false,
      speedKmh: null,
      ignition: null,
      lastFixAt,
      ageMin,
    };
  }
  return { ...v, lastFixAt, ageMin };
}

/**
 * One fuel formatter for every page (audit DC-18). `fuel` is the backend's
 * { value, unit } — unit 'L' or '%' only when proven. An unproven unit is
 * said, never guessed.
 */
export function formatFuel(fuel) {
  if (!fuel || !finite(Number(fuel.value))) return '—';
  const n = Number(fuel.value).toLocaleString('en-IN', { maximumFractionDigits: 1 });
  if (fuel.unit === 'L') return `${n} L`;
  if (fuel.unit === '%') return `${n}%`;
  return `${n} (unit unknown)`;
}

export default { viewOf, formatFuel };
