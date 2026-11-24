const idOf = (value) => String(value?._id || value?.id || value || '');
const plate = (value) =>
  String(value || '')
    .replace(/\s/g, '')
    .toUpperCase();

/** Recorded attribution wins; otherwise require an assignment covering the whole idle. */
export function idleEventMatchesDriver(event, driver, assignments = [], now = Date.now()) {
  if (!driver) return true;
  if (idOf(event.driverId)) return idOf(event.driverId) === driver;
  const start = Date.parse(event.startAt);
  const end = event.endAt ? Date.parse(event.endAt) : now;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return false;
  return assignments.some((assignment) => {
    if (idOf(assignment.driverId) !== driver) return false;
    const sameVehicle =
      idOf(event.vehicleId) && idOf(assignment.vehicleId) === idOf(event.vehicleId);
    const samePlate =
      plate(event.registrationNumber) &&
      plate(assignment.vehicleId?.registrationNumber) === plate(event.registrationNumber);
    const from = Date.parse(assignment.startDate);
    const to = assignment.endDate ? Date.parse(assignment.endDate) : Infinity;
    return (idOf(event.vehicleId) ? sameVehicle : samePlate) && from <= start && end <= to;
  });
}

export function filterIdleEvents(events, { vehicle = '', driver = '', assignments = [] }) {
  return events.filter(
    (event) =>
      (!vehicle || plate(event.registrationNumber) === plate(vehicle)) &&
      idleEventMatchesDriver(event, driver, assignments),
  );
}
