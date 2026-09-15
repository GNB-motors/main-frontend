/**
 * Call-planning UI constants, mirroring the backend's erpCall.constants.js.
 *
 * Kept in a plain .js module (not alongside a component) so react-refresh stays
 * happy and these can be imported from anywhere.
 */

/**
 * The four outcomes a KAM can submit, with the conditional-field rules the
 * server enforces. NOT_CALLED is deliberately absent — the nightly job applies
 * it, the UI never sends it.
 */
export const CALL_OUTCOMES = [
  {
    value: 'SURE_ORDER',
    label: 'Sure Order',
    blurb: 'Customer confirmed an order',
    needsRemark: false,
    needsNextDate: false,
    tone: 'success',
  },
  {
    value: 'FOLLOW_UP',
    label: 'Follow Up',
    blurb: 'Talk again on a later date',
    needsRemark: true,
    needsNextDate: true,
    tone: 'warning',
  },
  {
    value: 'NO_RESPONSE',
    label: 'No Response',
    blurb: 'Could not reach the customer',
    needsRemark: true,
    needsNextDate: true,
    tone: 'warning',
  },
  {
    value: 'NO_ORDER',
    label: 'No Order',
    blurb: 'Customer did not place an order',
    needsRemark: true,
    needsNextDate: false,
    tone: 'danger',
  },
];

/** Display labels for every stored outcome, including the cron-applied one. */
export const OUTCOME_LABELS = {
  SURE_ORDER: 'Sure Order',
  FOLLOW_UP: 'Follow Up',
  NO_RESPONSE: 'No Response',
  NO_ORDER: 'No Order',
  NOT_CALLED: 'Not Called',
};

/** Badge tone per outcome. */
export const OUTCOME_TONE = {
  SURE_ORDER: 'success',
  FOLLOW_UP: 'warning',
  NO_RESPONSE: 'warning',
  NO_ORDER: 'danger',
  NOT_CALLED: 'neutral',
};

/** Monday-first ordering; `value` matches JS getDay() (0 = Sunday). */
export const WEEKDAYS = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 0, short: 'Sun' },
];
