/**
 * Known-destination ETA — pure helpers.
 *
 * A row from `GET /api/eta/known` looks like:
 *   { registrationNumber, destination: { placeId, label, source },
 *     p10, p50, p90, issuedAt }          (the arrivals are ISO timestamps)
 *
 * Two rules live here:
 *  · a plate is matched case-insensitively and without spaces, because one
 *    fleet typed "MH 12 AB 1234" and another typed "MH12AB1234";
 *  · a missing arrival is "—", never 0 minutes.
 */

/** Plates are stored as each fleet typed them, with or without spaces. */
export const plateKey = (plate) =>
  String(plate || '')
    .toUpperCase()
    .replace(/\s+/g, '');

/** "5:30 PM" in IST. Null when the value is not a usable timestamp. */
export function formatEtaClock(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

/** The row for one plate, or null when that truck has no known destination. */
export function matchKnownEta(rows, plate) {
  const wanted = plateKey(plate);
  if (!wanted) return null;
  const list = Array.isArray(rows) ? rows : [];
  return list.find((row) => plateKey(row?.registrationNumber) === wanted) || null;
}

/**
 * "→ Pune depot · ETA 5:30 PM (4:55 PM–6:10 PM)".
 * Null when the row has no destination label — a bare place id is not something
 * a driver can be told to drive to.
 */
export function formatKnownEtaLine(row) {
  if (!row) return null;
  const label = row.destination?.label;
  if (!label) return null;
  const p50 = formatEtaClock(row.p50);
  if (!p50) return `→ ${label} · ETA not yet known`;
  const p10 = formatEtaClock(row.p10) || '—';
  const p90 = formatEtaClock(row.p90) || '—';
  return `→ ${label} · ETA ${p50} (${p10}–${p90})`;
}
