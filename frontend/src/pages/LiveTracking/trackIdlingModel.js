/**
 * trackIdlingModel — the idling chip on a truck card.
 *
 * The idling console knows which trucks are idling right now and for how long.
 * The chip says it in the owner's words: "Idling 23 min". A missing duration
 * is not zero minutes — it is nothing to say.
 */

/** The chip text for a truck that has been idling for `minutes`. */
export function formatIdlingChip(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return null;
  const mins = Math.round(n);
  if (mins < 60) return `Idling ${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `Idling ${hours} h ${rest} min` : `Idling ${hours} h`;
}

/** Plates are written with or without spaces. */
export function plateKey(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '');
}

/**
 * The minutes each truck has been idling, keyed by plate.
 *
 * The longest open segment wins: a truck that idled twice is not "the shorter
 * of the two".
 */
export function idlingMinutesByPlate(rows = []) {
  const byPlate = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = plateKey(row?.registrationNumber || row?.vehicleNumber || row?.plate);
    if (!key) continue;
    const minutes = Number(row?.durationMin);
    if (!Number.isFinite(minutes)) continue;
    const previous = byPlate.get(key);
    if (previous == null || minutes > previous) byPlate.set(key, minutes);
  }
  return byPlate;
}

/** The minutes one truck has been idling, or null when it is not idling. */
export function idlingMinutesFor(rows = [], plate) {
  const minutes = idlingMinutesByPlate(rows).get(plateKey(plate));
  return minutes == null ? null : minutes;
}
