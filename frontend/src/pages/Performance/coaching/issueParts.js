/**
 * Part categories for every observation the coaching drawer shows — DATA ONLY.
 *
 * There is no 3D model in this change and none is built here: these tags are
 * the stable metadata a future interactive part view would read. The drawer
 * prints a small label beside each observation so the owner can see which
 * part of the truck the conversation is about.
 *
 * IMPORTANT — an association means "relevant to", NOT proof of damage.
 *
 * "Harsh braking → brakes" says the brakes are worth looking at in the
 * conversation. It never says the brakes are worn out, it is never a
 * diagnosis, and it must never be presented as a billable finding.
 *
 * The mapping comes from the design review (UI_DESIGN_REPORT.md, finding 1):
 *
 *   acceleration / idling  → engine
 *   harsh braking          → brakes
 *   clutch                 → ONLY a CONFIRMED clutch signal. Clutch-riding
 *                             detection is not established in the paths that
 *                             were checked, so an unconfirmed clutch signal is
 *                             "—" with "not established" — never an inference.
 *   tyres                  → ONLY a verified tyre issue.
 */

export const PART_ENGINE = 'engine';
export const PART_BRAKES = 'brakes';
export const PART_CLUTCH = 'clutch';
export const PART_TYRES = 'tyres';
export const PART_UNKNOWN = 'unknown';

/** What the drawer prints beside an observation. */
export const PART_LABELS = {
  [PART_ENGINE]: 'Engine',
  [PART_BRAKES]: 'Brakes',
  [PART_CLUTCH]: 'Clutch',
  [PART_TYRES]: 'Tyres',
  [PART_UNKNOWN]: '—',
};

/** Why a part is not named — plain words, never a diagnosis. */
export const NOT_ESTABLISHED = 'not established';
export const NOT_VERIFIED = 'not verified';
export const NO_ASSOCIATION = 'no part linked to this yet';

/** The signal → part map. Only the associations the review allowed. */
export const PART_BY_SIGNAL = {
  acceleration: PART_ENGINE,
  harsh_acceleration: PART_ENGINE,
  harsh_acceleration_event: PART_ENGINE,
  acceleration_event: PART_ENGINE,
  over_rev: PART_ENGINE,
  overrev: PART_ENGINE,
  idle: PART_ENGINE,
  idling: PART_ENGINE,
  excess_idling: PART_ENGINE,
  braking: PART_BRAKES,
  harsh_braking: PART_BRAKES,
  harsh_braking_event: PART_BRAKES,
  smooth_braking: PART_BRAKES,
};

/** Signals that may only name a part when the signal itself is confirmed. */
const CLUTCH_SIGNALS = new Set(['clutch', 'clutch_riding', 'clutchriding', 'clutch_signal']);
const TYRE_SIGNALS = new Set(['tyre', 'tyres', 'tyre_issue', 'tyre_pressure', 'tyre_wear']);

/** "harshAcceleration" → "harsh_acceleration". */
export function normaliseSignal(signal) {
  return String(signal ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/**
 * A signal counts as confirmed only when it says so — a key that carries
 * "confirmed", or a caller that passes confirmed: true.
 */
export function isConfirmedSignal(signal) {
  return /confirm/i.test(String(signal ?? ''));
}

const knownPart = (part) => ({
  part,
  label: PART_LABELS[part] ?? '—',
  reason: null,
  established: true,
});

const unknownPart = (reason) => ({
  part: PART_UNKNOWN,
  label: PART_LABELS[PART_UNKNOWN],
  reason,
  established: false,
});

/**
 * The part an observation is relevant to.
 *
 * Returns { part, label, reason }. When the label is "—" the reason says why
 * in plain words: "not established" for clutch, "not verified" for tyres,
 * "no part linked to this yet" for anything the review did not associate.
 */
export function partForSignal(signal, { confirmed = false } = {}) {
  const key = normaliseSignal(signal);
  const isConfirmed = confirmed || isConfirmedSignal(signal);

  if (CLUTCH_SIGNALS.has(key)) {
    return isConfirmed ? knownPart(PART_CLUTCH) : unknownPart(NOT_ESTABLISHED);
  }
  if (TYRE_SIGNALS.has(key)) {
    return isConfirmed ? knownPart(PART_TYRES) : unknownPart(NOT_VERIFIED);
  }

  const mapped = PART_BY_SIGNAL[key];
  if (mapped) return knownPart(mapped);

  // A harsh count with no event type (acceleration or braking) cannot name a
  // part — guessing one would be an invented diagnosis.
  return unknownPart(NO_ASSOCIATION);
}
