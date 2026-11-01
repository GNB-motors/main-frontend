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

export default function vehicleMetricReadings(vehicle, health = null) {
  const liveFuel = numeric(vehicle.fuel);
  const liveDef = numeric(vehicle.defLevel);
  const odo = numeric(vehicle.odo) ?? numeric(health?.canOdo);
  return {
    fuel:
      liveFuel != null
        ? level(liveFuel, vehicle.fuelUnit)
        : level(health?.primaryFuelLevel, health?.fuelLevelUnit),
    def:
      liveDef != null
        ? level(liveDef, vehicle.defUnit)
        : level(health?.defLevel, health?.defLevelUnit),
    odometer: odo == null ? '—' : `${format(odo)} km`,
  };
}
