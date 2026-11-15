/**
 * What a person reads when an action on a receipt did not work.
 *
 * A refusal arrives either as a thrown ApiError (the message the server wrote
 * for people) or as a 200 that carries a refusal in its body. Both become
 * plain words here: never a stack trace, never "Request failed with status
 * code 500", never a silent nothing.
 */

/** Technical noise: a person cannot act on it, so it never reaches the screen. */
const TECHNOISE =
  /(status code|request failed|network error|axios|ERR_|ECONN|ETIMEDOUT|socket hang up|timeout of|failed to fetch|undefined is not)/i;

/** The plain-word message for a failed action. */
export const plainActionError = (
  err,
  fallback = 'The server refused the action. Please try again.',
) => {
  const raw =
    err?.displayMessage ||
    err?.body?.message ||
    err?.body?.detail ||
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.userMessage ||
    err?.message ||
    '';
  const text = String(raw).trim();
  if (!text || TECHNOISE.test(text)) return fallback;
  return text;
};

/** The plain-word message for a failed LIST load (never an empty inbox). */
export const plainLoadError = (
  err,
  fallback = 'We could not load the receipts right now. Please try again.',
) => {
  const raw = err?.displayMessage || err?.response?.data?.message || err?.message || '';
  const text = String(raw).trim();
  if (!text || TECHNOISE.test(text)) return fallback;
  return `We could not load the receipts: ${text}`;
};

/**
 * A resolved promise is not always a success: the server can answer 200 and
 * still say it refused. The words of that refusal, or null when it worked.
 */
export const refusalMessage = (
  result,
  fallback = 'The server refused the action. Please try again.',
) => {
  if (!result || typeof result !== 'object') return null;
  const refused =
    result.success === false ||
    result.ok === false ||
    result.published === false ||
    result.saved === false ||
    ['failed', 'error', 'refused'].includes(String(result.status || '').toLowerCase());
  if (!refused) return null;
  return plainActionError(
    { message: result.message || result.error || result.detail || '' },
    fallback,
  );
};
