import { plateKey } from './trackAlertsModel.js';

const STATUS_ORDER = { moving: 0, idling: 1, stopped: 2, offline: 3 };

const ageOf = (v) => (Number.isFinite(v?.ago) ? v.ago : null);

function byStatus(a, b) {
  return (
    (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4) ||
    (ageOf(a) ?? Infinity) - (ageOf(b) ?? Infinity)
  );
}

/** All lifts the trucks displaying a red alert badge; each group keeps the live order. */
export function sortFleet(vehicles = [], { filter = 'all', alertCounts = new Map() } = {}) {
  const list = Array.isArray(vehicles) ? [...vehicles] : [];
  const hasAlert = (v) => (alertCounts.get(plateKey(v.plate)) || 0) > 0;
  return list.sort((a, b) => {
    const alertOrder = filter === 'all' ? Number(hasAlert(b)) - Number(hasAlert(a)) : 0;
    return alertOrder || byStatus(a, b);
  });
}
