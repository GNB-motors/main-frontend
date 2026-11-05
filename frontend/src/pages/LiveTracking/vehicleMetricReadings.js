import { formatFuel } from '../../utils/liveView.js';

function numeric(value) {
  if (
    value == null ||
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  )
    return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const format = (value) => value.toLocaleString('en-IN', { maximumFractionDigits: 1 });

function level(value, unit) {
  const n = numeric(value);
  if (n == null) return '—';
  if (unit === 'percent' || unit === '%') return n <= 100 ? `${format(n)}%` : '—';
  if (unit === 'litres') return `${format(n)} L`;
  return format(n);
}

export function newestOdometer(vehicle = {}, health = null, status = null) {
  const live = vehicle.readings?.odometerKm;
  const candidates = [
    { value: numeric(status?.odometer), at: status?.eventDateTime, source: 'STATUS' },
    { value: numeric(health?.canOdo), at: health?.eventDateTime ?? health?.pulledAt, source: 'CAN', isStale: health?.isStale },
    { value: numeric(live?.value ?? vehicle.odo), at: live?.at ?? vehicle.lastFixAt, source: 'LIVE', freshness: live?.freshness, ageMin: live?.ageMin },
  ].filter(item => item.value != null);
  candidates.sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0));
  return candidates[0] ?? null;
}

/**
 * The Track tiles' fuel / DEF / odometer, read the way every page reads them:
 * fuel through the shared formatFuel (a unit only when proven, DC-18), the
 * odometer CAN-first then the live feed (DC-20), and a Vehicle Health reading
 * older than its 6 h freshness says so (DC-15).
 */
export default function vehicleMetricReadings(vehicle, health = null, status = null) {
  const old = health?.isStale ? ' · old reading' : '';
  const liveFuel =
    vehicle.fuelReading ||
    (numeric(vehicle.fuel) != null
      ? {
          value: numeric(vehicle.fuel),
          unit: vehicle.fuelUnit === 'L' || vehicle.fuelUnit === 'litres' ? 'L' : null,
        }
      : null);
  const canFuel = numeric(health?.primaryFuelLevel);
  const liveDef = numeric(vehicle.defLevel);
  const odo = newestOdometer(vehicle, health, status);
  return {
    fuel: liveFuel
      ? formatFuel(liveFuel)
      : canFuel != null && canFuel <= 100
        ? `${formatFuel({ value: canFuel, unit: '%' })}${old}`
        : '—',
    def:
      liveDef != null
        ? level(liveDef, vehicle.defUnit)
        : health?.defLevel != null
          ? `${level(health.defLevel, health.defLevelUnit)}${old}`
          : '—',
    odometer: odo ? `${format(odo.value)} km${odo.source === 'CAN' && odo.isStale ? old : ''}` : '\u2014',
    odometerSource: odo?.source ?? null,
  };
}
