/**
 * Vocabulary layer — the single place where internal enum constants become
 * human language. Nothing user-facing renders a raw UPPER_SNAKE constant:
 * everything goes through `label()` / `toneOf()` / `<StatusChip>`.
 *
 * Adding Hindi later is a config change here, not a rewrite of 30 call sites.
 *
 * Rules:
 * - `label()` is case-insensitive (the fleet renders `critical`, the ERP
 *   renders `CRITICAL` — both resolve).
 * - Unknown keys fall through to `humanise()` — "PARTIALLY_PAID" becomes
 *   "Partially paid", never a crash and never raw snake case on screen.
 * - `null` / `undefined` / '' render as `fallback` (default '—'), because
 *   absent is not a value.
 */

export const LABELS = {
  status: {
    ACTIVE: 'Moving',
    MOVING: 'Moving',
    PARKED: 'Parked',
    OFFLINE: 'No signal',
    IDLE: 'Idling',
  },
  telematics: {
    INSUFFICIENT_DATA: 'Not enough GPS data',
    NO_TELEMATICS: 'This truck has no tracking device',
    UNATTRIBUTED: 'Not matched to a trip',
    RETURN_PARK: 'Returning to yard',
  },
  idleSource: {
    CAN_IDLING_MINUTES: 'Measured by the vehicle',
    DERIVED_ENGINE_HOURS: 'Estimated from engine hours',
  },
  severity: {
    CRITICAL: 'Critical',
    CAUTION: 'Needs attention',
    WARNING: 'Needs attention',
    INFO: 'Info',
  },
  serviceType: {
    SERVICE: 'Service',
    REPAIR: 'Repair',
  },
  risk: {
    OVERDUE: 'Overdue',
    DUE_SOON: 'Due soon',
    OK: 'OK',
  },
  loadType: {
    LOAD: 'Loaded',
    EMPTY: 'Empty',
  },
  legitimacy: {
    LEGIT: 'Legit',
    EXCESS: 'Excess',
  },
  source: {
    API: 'Fetched from price API',
    MANUAL: 'Entered manually',
  },
  // Diesel & Mileage hub (/mileage): one fill, as an owner reads it.
  refuel: {
    BILL_MATCHES: 'Bill matches',
    BILL_TOO_HIGH: 'Bill too high',
    BILL_TOO_LOW: 'Bill too low',
    BILL_MISSING: 'Bill missing',
    NO_TANK_READING: 'No tank reading',
    GAUGE_JUMP: 'Gauge jump',
  },
  pumpHonesty: {
    HONEST: 'Honest',
    RELIABLE: 'Mostly fine',
    SUSPICIOUS: 'Watch this pump',
    UNRELIABLE: 'Often short',
    CHRONIC_SHORTAGE: 'Always short',
    INSUFFICIENT_DATA: 'Too few fills',
  },
  mileageBand: {
    MILEAGE_GOOD: 'Good',
    MILEAGE_AVERAGE: 'Average',
    MILEAGE_LOW: 'Low',
  },
  trackerCheck: {
    TRACKER_MATCHES: 'Matches tracker',
    TRACKER_DIFFERS: 'Tracker shows different',
    TRACKER_NONE: 'No tracker data',
    TRACKER_PENDING: 'Checking tracker',
  },
  fuelCycle: {
    OPEN: 'Still running',
    CLOSED: 'Closed',
    RECONCILED: 'Checked',
    UNRECONCILED_NO_LEDGER: 'No trip data',
  },
  dieselUse: {
    USED_NORMAL: 'Normal',
    USED_EXTRA: 'Used extra',
    USED_LESS: 'Used less',
  },
  billCoverage: {
    BILLS_UP_TO_DATE: 'Bills up to date',
    SOME_BILLS_MISSING: 'Some bills missing',
    MANY_BILLS_MISSING: 'Many bills missing',
  },
  billsToCheck: {
    ALL_CLEAR: 'All clear',
    NEEDS_A_LOOK: 'Needs a look',
  },
};

/**
 * Tone reserved for status semantics — one of the four status colours.
 * Colour answers "does this need me?", never "what kind of thing is it?".
 */
export const TONES = {
  CRITICAL: 'critical',
  CAUTION: 'caution',
  WARNING: 'caution',
  OVERDUE: 'critical',
  DUE_SOON: 'caution',
  ACTIVE: 'ok',
  MOVING: 'ok',
  OK: 'ok',
  PAID: 'ok',
  APPROVED: 'ok',
  PLACED: 'ok',
  DONE: 'ok',
  CONFIRMED: 'ok',
  SERVICE: 'inert',
  REPAIR: 'caution',
  PARKED: 'inert',
  INFO: 'inert',
  DRAFT: 'inert',
  PENDING: 'caution',
  PENDING_APPROVAL: 'caution',
  PARTIALLY_PAID: 'caution',
  PARTIALLY_ADJUSTED: 'caution',
  SUBMITTED: 'inert',
  OFFLINE: 'critical',
  EXPIRED: 'critical',
  CANCELLED: 'critical',
  REJECTED: 'critical',
  FAILED: 'critical',
  BLACKLISTED: 'critical',
  IDLE: 'caution',
  LEGIT: 'ok',
  EXCESS: 'caution',
  BILL_MATCHES: 'ok',
  BILL_TOO_HIGH: 'critical',
  BILL_TOO_LOW: 'caution',
  BILL_MISSING: 'caution',
  HONEST: 'ok',
  RELIABLE: 'ok',
  SUSPICIOUS: 'caution',
  UNRELIABLE: 'critical',
  CHRONIC_SHORTAGE: 'critical',
  MILEAGE_GOOD: 'ok',
  MILEAGE_AVERAGE: 'caution',
  MILEAGE_LOW: 'critical',
  TRACKER_MATCHES: 'ok',
  TRACKER_DIFFERS: 'caution',
  RECONCILED: 'ok',
  UNRECONCILED_NO_LEDGER: 'caution',
  USED_NORMAL: 'ok',
  USED_EXTRA: 'caution',
  USED_LESS: 'ok',
  BILLS_UP_TO_DATE: 'ok',
  SOME_BILLS_MISSING: 'caution',
  MANY_BILLS_MISSING: 'critical',
  ALL_CLEAR: 'ok',
  NEEDS_A_LOOK: 'critical',
};

const normaliseKey = (key) =>
  String(key ?? '')
    .trim()
    .toUpperCase();

/** "RETURN_PARK" → "Return park". The safety net for keys with no curation. */
export function humanise(key) {
  const norm = normaliseKey(key);
  if (!norm) return '';
  const sentence = norm.split('_').join(' ').toLowerCase();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Human label for a constant. Unknown keys are humanised, not rendered raw.
 * `fallback` covers absent values (null / undefined / '').
 */
export function label(group, key, fallback = '—') {
  const norm = normaliseKey(key);
  if (!norm) return fallback;
  return LABELS[group]?.[norm] ?? humanise(norm);
}

/**
 * Reserved status tone for a constant. Unknown / informational keys are
 * 'inert' — tone must never guess that something is wrong.
 */
export function toneOf(group, key) {
  const norm = normaliseKey(key);
  if (!norm) return 'inert';
  return TONES[norm] ?? 'inert';
}
