import { toISTDateString } from '../../../../utils/dateUtils';
import { haversineKm } from '../../../LiveTracking/geoMath';
import { serviceDistance } from '../../serviceDistance';
import { daysSince } from '../../vehicle360Logic';

export const numeric = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
export const shortDate = (value) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      }).format(new Date(value))
    : '—';

export function monthWindow(now = new Date()) {
  const today = toISTDateString(now);
  const start = new Date(`${today}T00:00:00+05:30`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { from: start.toISOString(), to: now.toISOString() };
}

/** Actual 30-day readings; GPS paths fill only days with no engine measure. */
export function distanceSeries(overview, track, now = new Date()) {
  const start = new Date(monthWindow(now).from);
  const rows = Array.from({ length: 30 }, (_, i) => {
    const at = new Date(start.getTime() + i * 86400000);
    const day = toISTDateString(at);
    const measured = overview?.days?.find((entry) => entry.day === day);
    return { day, engineKm: numeric(measured?.engineKm), gpsKm: numeric(measured?.gpsKm) };
  });
  const gps = new Map();
  const points = (track?.points || []).filter(
    (point) => numeric(point.lat) != null && numeric(point.lng) != null,
  );
  const gaps = (track?.segments || []).filter((segment) => segment.kind === 'GAP');
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1],
      point = points[i];
    const day = toISTDateString(point.t);
    if (!day || day !== toISTDateString(prev.t) || new Date(point.t) <= new Date(prev.t)) continue;
    if (
      gaps.some(
        (gap) => new Date(gap.fromT) < new Date(point.t) && new Date(gap.toT) > new Date(prev.t),
      )
    )
      continue;
    gps.set(day, (gps.get(day) ?? 0) + haversineKm([prev.lat, prev.lng], [point.lat, point.lng]));
  }
  return rows.map((row) => {
    const gpsKm = row.gpsKm ?? gps.get(row.day) ?? null;
    return {
      ...row,
      gpsKm,
      km: row.engineKm ?? gpsKm,
      gpsOnly: row.engineKm == null && gpsKm != null,
    };
  });
}

export function fluidLevels(overview, health, fleetMaster, ialert) {
  const fuelCapacity =
    numeric(overview?.fuel?.capacityL) ??
    numeric(health?.primaryFuelTankCapacityL) ??
    numeric(fleetMaster?.fuelTankCapacity) ??
    numeric(ialert?.primaryFuelTankCapacityL);
  const defCapacity =
    numeric(overview?.def?.capacityL) ??
    numeric(health?.defTankCapacityL) ??
    numeric(ialert?.defTankCapacityL);
  const fallbackFuel =
    health?.fuelLevelUnit === 'percent' || health?.fuelLevelUnit === '%'
      ? numeric(health?.primaryFuelLevel)
      : null;
  const fallbackDef =
    health?.defLevelUnit === 'percent' || health?.defLevelUnit === '%'
      ? numeric(health?.defLevel)
      : null;
  const fuelPct = overview?.fuel ? numeric(overview.fuel.percent) : fallbackFuel;
  const defPct = overview?.def ? numeric(overview.def.percent) : fallbackDef;
  return [
    {
      label: 'Diesel · sensor',
      percent: fuelPct,
      litres:
        numeric(overview?.fuel?.litres) ??
        (fuelPct != null && fuelCapacity > 0 ? (fuelPct / 100) * fuelCapacity : null),
      at: overview?.fuel ? overview.fuel.at : health?.fuelAt,
      capacityL: fuelCapacity,
      litresBasis: overview?.fuel?.litresBasis ?? null,
      source: overview?.fuel?.source ?? null,
    },
    {
      label: 'DEF (AdBlue) · sensor',
      percent: defPct,
      litres:
        numeric(overview?.def?.litres) ??
        (defPct != null && defCapacity > 0 ? (defPct / 100) * defCapacity : null),
      at: overview?.def ? overview.def.at : health?.defAt,
      capacityL: defCapacity,
      litresBasis: overview?.def?.litresBasis ?? null,
      source: overview?.def?.source ?? null,
    },
  ];
}

export function serviceProgress(prediction, health) {
  return {
    ...serviceDistance(prediction, health),
    age: daysSince(prediction?.currentOdometer != null ? prediction?.computedAt : health?.pulledAt),
  };
}

export const DOCUMENTS = [
  { type: 'RC', label: 'Registration (RC)' },
  { type: 'INSURANCE', label: 'Insurance' },
  { type: 'FITNESS', label: 'Fitness certificate' },
  { type: 'NATIONAL_PERMIT', label: 'National permit' },
  { type: 'PUCC', label: 'Pollution (PUC)' },
];

export function documentRows(documents = [], now = Date.now()) {
  const available = Array.isArray(documents) ? documents : [];
  return DOCUMENTS.map((item) => {
    const doc = available.find((entry) => entry.docType === item.type);
    const expired = doc?.expiryDate && new Date(doc.expiryDate).getTime() < now;
    return {
      ...item,
      present: Boolean(doc),
      status: !doc ? 'Missing' : expired ? 'Expired' : 'On file',
      expired,
    };
  });
}
