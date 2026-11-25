/**
 * Password rules for the reset flows. The backend owns the real check
 * (8..72 characters, both fields equal); these are the same rules so the form
 * can answer before the request goes out.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/**
 * null when the pair is fine, else the message to show under the field.
 * @param {string} password
 * @param {string} [confirm] - when given, the two must match
 * @returns {string|null}
 */
export function checkNewPassword(password, confirm) {
  const pw = String(password || '');
  if (pw.length < PASSWORD_MIN) return `At least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `At most ${PASSWORD_MAX} characters.`;
  if (confirm !== undefined && pw !== String(confirm || '')) {
    return 'The two passwords do not match.';
  }
  return null;
}

// No 0/O, 1/l/I: these get read out over the phone to drivers.
export const PASSWORD_ALPHABET =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const UINT32_RANGE = 0x100000000;
// Rejection sampling: values at or above the limit are thrown away, so every
// symbol of the alphabet is equally likely (a plain modulo would favour the
// first few symbols).
const UNBIASED_LIMIT = Math.floor(UINT32_RANGE / PASSWORD_ALPHABET.length) * PASSWORD_ALPHABET.length;

/**
 * A readable password from the browser's crypto RNG.
 * @param {number} [length]
 * @returns {string}
 */
export function generatePassword(length = 10) {
  const rng = globalThis.crypto;
  if (!rng?.getRandomValues) {
    throw new Error('This browser cannot generate a secure password.');
  }
  const out = [];
  const buffer = new Uint32Array(Math.max(length, 1) * 2);
  while (out.length < length) {
    rng.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && out.length < length; i += 1) {
      if (buffer[i] < UNBIASED_LIMIT) out.push(PASSWORD_ALPHABET[buffer[i] % PASSWORD_ALPHABET.length]);
    }
  }
  return out.join('');
}
