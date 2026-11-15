/**
 * trackAlertsModel — the alert badge on a truck card.
 *
 * The live stream pushes the alerts of the last 24 hours. A truck shows a
 * badge for the ones nobody has looked at yet. An alert we cannot place on a
 * truck is never counted as zero — it is simply not this truck's badge.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Plates are written with or without spaces and in any case. */
export function plateKey(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '');
}

/** The truck an alert belongs to, whichever way the backend wrote it. */
export function alertVehicleKey(alert) {
  return plateKey(
    alert?.vehicleNumber ||
      alert?.registrationNumber ||
      alert?.vehicle?.registrationNumber ||
      alert?.vehicle?.vehicleNumber ||
      alert?.vehicle?.plate,
  );
}

/** An alert nobody has looked at yet. */
export function isUnacknowledged(alert) {
  if (alert?.acknowledged) return false;
  return String(alert?.status || '').toUpperCase() !== 'ACKNOWLEDGED';
}

/** When the alert was raised, when the backend said so. */
export function alertTime(alert) {
  const raw = alert?.createdAt || alert?.raisedAt || alert?.at || alert?.ts || alert?.timestamp;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * True when the alert belongs to the last 24 hours. An alert with no time is
 * kept: the stream only sends the recent window, and dropping it would hide a
 * real alert behind a missing field.
 */
export function isWithinLastDay(alert, now = Date.now()) {
  const ms = alertTime(alert);
  if (ms == null) return true;
  return now - ms <= DAY_MS;
}

/** The unacknowledged alerts of the last 24 hours that belong to one truck. */
export function alertsForVehicle(alerts = [], plate, now = Date.now()) {
  const wanted = plateKey(plate);
  if (!wanted) return [];
  return (Array.isArray(alerts) ? alerts : []).filter(
    (alert) =>
      alert &&
      alertVehicleKey(alert) === wanted &&
      isUnacknowledged(alert) &&
      isWithinLastDay(alert, now),
  );
}

/** How many unacknowledged alerts each truck has, keyed by plate. */
export function alertCountsByVehicle(alerts = [], now = Date.now()) {
  const counts = new Map();
  for (const alert of Array.isArray(alerts) ? alerts : []) {
    if (!alert || !isUnacknowledged(alert) || !isWithinLastDay(alert, now)) continue;
    const key = alertVehicleKey(alert);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}
