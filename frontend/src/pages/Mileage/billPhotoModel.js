/**
 * billPhotoModel — the photo bill flow.
 *
 * The owner photographs a diesel slip and the product works out which
 * truck it belongs to. The rules:
 *
 * 1. The photo is uploaded once, as multipart, with the kind of bill.
 * 2. The suggestion is then polled every two seconds for up to thirty.
 * 3. If the backend is sure, the product says which truck and why, and
 *    offers Confirm and Change. If it is not sure, it lists the
 *    candidates with their reasons and lets the owner choose.
 * 4. The old by-hand form stays reachable. A route is never deleted.
 */

/** The kinds of bill a photo can be. */
export const BILL_TYPES = [
  { id: 'DIESEL_SLIP', label: 'Diesel slip' },
  { id: 'SERVICE_INVOICE', label: 'Service bill' },
];

/** How often the suggestion is asked for. */
export const POLL_INTERVAL_MS = 2000;

/** How long the product waits before giving up. */
export const POLL_TIMEOUT_MS = 30000;

/**
 * The multipart body for the upload.
 * The field names are the capture contract's: `file` and `kind`.
 */
export function buildBillFormData(file, kind) {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  return form;
}

/**
 * The sentence for a match the backend is sure about.
 * "Matched to WB11F6762 (at the pump at 14:05, fill 212 L)".
 */
export function matchSentence(candidate) {
  if (!candidate?.registrationNumber) return null;
  const reasons = Array.isArray(candidate.reasons) ? candidate.reasons.filter(Boolean) : [];
  if (!reasons.length) return `Matched to ${candidate.registrationNumber}`;
  return `Matched to ${candidate.registrationNumber} (${reasons.join(', ')})`;
}

/**
 * The candidates the backend is unsure about, best first.
 * The reasons are what the owner reads to decide.
 */
export function candidateRows(suggestion) {
  const candidates = Array.isArray(suggestion?.candidates) ? suggestion.candidates : [];
  return [...candidates]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map((candidate) => ({
      registrationNumber: candidate.registrationNumber ?? null,
      score: candidate.score ?? null,
      reasons: Array.isArray(candidate.reasons) ? candidate.reasons : [],
      label: matchSentence(candidate),
    }));
}

/** True when the backend is sure enough to offer a one-click confirm. */
export function isAutoMatch(suggestion) {
  return suggestion?.decision === 'AUTO';
}

/** True when the owner has to choose. */
export function needsChoice(suggestion) {
  return suggestion?.decision === 'ASK';
}

/**
 * Whether the product should keep polling.
 * It stops when the answer arrives, when the timeout passes, or when the
 * request fails.
 */
export function shouldKeepPolling({ startedAt, now, decision, failed = false }) {
  if (failed) return false;
  if (decision === 'AUTO' || decision === 'ASK') return false;
  return now - startedAt < POLL_TIMEOUT_MS;
}
