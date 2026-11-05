/**
 * format.js — the small string helpers the shared UI needs.
 *
 * House rule: a user never sees an internal constant. `humanizeCode` turns
 * REFUEL_SOON into "Refuel soon" and CRITICAL into "Critical", and leaves
 * every other value exactly as it was.
 */

/** A code is an upper-case token, optionally underscore-separated. */
const CODE_PATTERN = /^[A-Z0-9]+(_[A-Z0-9]+)*$/;

/**
 * "REFUEL_SOON" → "Refuel soon", "CRITICAL" → "Critical",
 * "PICKUP_TO_PICKUP" → "Pickup to pickup".
 *
 * A value that is not a code (a sentence, a name, a number, an em dash) or a
 * short one (three characters or fewer, like "OK") is returned unchanged, so
 * this is safe to wrap around any label.
 */
export function humanizeCode(s) {
  if (typeof s !== 'string') return s;
  const code = s.trim();
  if (code.length <= 3) return s;
  if (!CODE_PATTERN.test(code)) return s;
  const sentence = code.split('_').join(' ').toLowerCase();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
