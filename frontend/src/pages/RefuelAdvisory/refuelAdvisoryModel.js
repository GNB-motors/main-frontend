export const STATUS = {
  CRITICAL: { label: 'Critical', tone: 'bad' },
  REFUEL_SOON: { label: 'Refuel soon', tone: 'warn' },
  OK: { label: 'Enough fuel', tone: 'ok' },
};

const HOUR_MS = 60 * 60 * 1000;
const known = (value) => value != null && value !== '' && Number.isFinite(Number(value));

/** A sum over the trucks that have the value, and how many of them did. */
function total(rows, key) {
  const present = rows.filter((row) => known(row[key]));
  return {
    value: present.length ? present.reduce((sum, row) => sum + Number(row[key]), 0) : null,
    trucks: present.length,
  };
}

function latest(rows, key) {
  const times = rows.map((row) => Date.parse(row[key])).filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

/** A reading older than the sweep's own stale limit, or one with no time at all. */
export function isStale(row, staleReadingHours, now = Date.now()) {
  if (!staleReadingHours) return false;
  const at = Date.parse(row.lastReadingAt);
  return !Number.isFinite(at) || now - at > staleReadingHours * HOUR_MS;
}

/** Everything the page's cards show, read from the advisory rows. */
export function summarizeAdvisories(rows, { staleReadingHours = null } = {}, now = Date.now()) {
  const counts = { CRITICAL: 0, REFUEL_SOON: 0, OK: 0 };
  for (const row of rows) if (counts[row.status] != null) counts[row.status] += 1;

  const atRisk = rows.filter((row) => row.status === 'CRITICAL' || row.status === 'REFUEL_SOON');
  const tanks = rows.filter((row) => known(row.currentFuelL) && Number(row.tankCapacityL) > 0);
  const tankLevel = total(tanks, 'currentFuelL').value;
  const tankCapacity = total(tanks, 'tankCapacityL').value;
  const ranges = rows
    .filter((row) => known(row.estimatedRangeKm))
    .sort((a, b) => a.estimatedRangeKm - b.estimatedRangeKm);
  const middle = Math.floor(ranges.length / 2);
  const medianRangeKm = !ranges.length
    ? null
    : ranges.length % 2
      ? ranges[middle].estimatedRangeKm
      : (ranges[middle - 1].estimatedRangeKm + ranges[middle].estimatedRangeKm) / 2;

  return {
    count: rows.length,
    counts,
    onBoard: total(rows, 'currentFuelL'),
    pctFull: tankCapacity ? (tankLevel / tankCapacity) * 100 : null,
    tankTrucks: tanks.length,
    atRisk: {
      trucks: atRisk.length,
      litres: total(atRisk, 'litresToFull'),
      cost: total(atRisk, 'estimatedFillCostInr'),
    },
    fleet: { litres: total(rows, 'litresToFull'), cost: total(rows, 'estimatedFillCostInr') },
    medianRangeKm,
    rangeTrucks: ranges.length,
    shortest: ranges[0] ?? null,
    stale: staleReadingHours
      ? rows.filter((row) => isStale(row, staleReadingHours, now)).length
      : null,
    newestReadingAt: latest(rows, 'lastReadingAt'),
    computedAt: latest(rows, 'computedAt'),
  };
}
