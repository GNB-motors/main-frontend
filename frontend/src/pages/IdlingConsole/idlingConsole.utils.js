/**
 * Pure helpers for the Idling Console panels — no React, no fetching.
 */

/** 42 -> "42 min"; 95 -> "1h 35m". Never negative, never decimals. */
export function formatDurationMin(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Case-insensitive substring match against a vehicle's registration number. */
export function matchesRegistration(query, registrationNumber) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return String(registrationNumber ?? '')
    .toLowerCase()
    .includes(needle);
}
