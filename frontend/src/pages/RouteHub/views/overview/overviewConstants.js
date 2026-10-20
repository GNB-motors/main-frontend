export const RANGES = [
  { value: 24, label: '24 h' },
  { value: 168, label: '7 days' },
  { value: 720, label: '30 days' },
];
export const SCALE_PCT = 35;
export const OS_THRESHOLD = 60;
export const OS_MIN_MIN = 3;
/** /api/overspeed/fleet refuses windows longer than this, so the 7d/30d
 *  ranges narrow just the overspeed panel rather than failing the request. */
export const OS_MAX_HOURS = 48;
