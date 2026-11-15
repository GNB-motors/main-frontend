/**
 * The freshness rule every redesign badge follows: "live" means the value was
 * measured in the last five minutes. A row the backend calls live but whose
 * own age is older than that is only "recent" — a 54-minute-old report must
 * never read "Live".
 */
export const LIVE_MAX_AGE_MIN = 5;

export function effectiveFreshness(state, ageMin) {
  const age = ageMin === null || ageMin === undefined ? NaN : Number(ageMin);
  if (state === 'live' && Number.isFinite(age) && age > LIVE_MAX_AGE_MIN) return 'recent';
  return state || 'never';
}
