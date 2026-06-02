/**
 * Maps each feature flag key to its primary route. Used to pick a sensible
 * landing page after login when the user's org may not have `overview` enabled.
 * Order = preference (overview first, then logical flow).
 */
const FLAG_TO_ROUTE = [
  ['overview', '/overview'],
  ['reports', '/reports'],
  ['vehicles', '/vehicles'],
  ['vehicleActivity', '/refuel-logs'],
  ['drivers', '/drivers'],
  ['locations', '/locations'],
  ['fuelComparison', '/fuel-comparison'],
  ['khataLedger', '/khata-ledger'],
];

const PROFILE_FALLBACK = '/profile';

/**
 * Resolve the route the user should land on given a feature flag map.
 * Returns first enabled flag's route, else `/profile` (always accessible).
 */
const resolveLandingRoute = (flags) => {
  if (!flags || typeof flags !== 'object') return PROFILE_FALLBACK;
  for (const [key, route] of FLAG_TO_ROUTE) {
    if (flags[key] === true) return route;
  }
  return PROFILE_FALLBACK;
};

/**
 * Fetch the current user's org flags via /auth/me and resolve a landing route.
 * Falls back to /profile on any failure (always-accessible page).
 */
const fetchAndResolveLandingRoute = async (apiClient) => {
  try {
    const res = await apiClient.get('/api/auth/me');
    const payload = res.data?.data ?? res.data ?? {};
    return resolveLandingRoute(payload?.organization?.featureFlags);
  } catch {
    return PROFILE_FALLBACK;
  }
};

export {
  FLAG_TO_ROUTE,
  PROFILE_FALLBACK,
  resolveLandingRoute,
  fetchAndResolveLandingRoute,
};
