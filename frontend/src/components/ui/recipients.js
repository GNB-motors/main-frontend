/**
 * Recipient helpers for the report e-mail dialog and the scheduled-recipients
 * setting. The rules live here, not in a component: both places must treat an
 * address the same way, and both must never silently drop one.
 */

/** The most addresses a single report e-mail may carry. */
export const MAX_RECIPIENTS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A single address, trimmed. */
export const isEmail = (s) => EMAIL_RE.test(String(s || '').trim());

/**
 * Split a typed list into the addresses that are valid and the ones that are
 * not. Addresses are lowercased and de-duplicated, so `A@x.com` and `a@x.com`
 * are one recipient.
 *
 * @param {string} text
 * @returns {{ valid: string[], invalid: string[] }}
 */
export function parseRecipients(text) {
  const parts = String(text || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const valid = [];
  const invalid = [];
  for (const p of parts) (isEmail(p) ? valid : invalid).push(p);
  return { valid: [...new Set(valid)], invalid: [...new Set(invalid)] };
}
