/**
 * The flags the admin toggled on this page, as the PATCH body. Only these are
 * sent: sending every flag let a stale or unrelated save switch off flags
 * nobody touched. A missing flag is off.
 */
export function changedFlags(keys, original, edited) {
  const out = {};
  for (const k of keys) {
    const now = edited?.[k] === true;
    if (now !== (original?.[k] === true)) out[k] = now;
  }
  return out;
}
