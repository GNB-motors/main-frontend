import { hasErpAccess, hasFleetAccess } from './moduleAccess';

/**
 * Cross-module landing routes: an org with both modules lands on the shared
 * Overview; an ERP-only org lands on the ERP home. Fleet-only orgs fall through
 * to the per-flag FLAG_TO_ROUTE list below.
 */
const COMMAND_CENTER_ROUTE = '/command-center';
const ERP_HOME_ROUTE = '/erp';

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
 *
 * Module-first, matching the sidenav's access model (see moduleAccess.js):
 *   - both modules -> the combined Overview (/command-center)
 *   - ERP only     -> the ERP home (/erp)
 *   - fleet only   -> first enabled fleet route (overview first)
 * Falls back to `/profile` (always accessible) when no module is enabled.
 */
const resolveLandingRoute = (flags) => {
  if (!flags || typeof flags !== 'object') return PROFILE_FALLBACK;

  const isEnabled = (key) => flags[key] === true;
  const erp = hasErpAccess(isEnabled);
  const fleet = hasFleetAccess(isEnabled);

  if (erp && fleet) return COMMAND_CENTER_ROUTE;
  if (erp) return ERP_HOME_ROUTE;

  if (fleet) {
    for (const [key, route] of FLAG_TO_ROUTE) {
      if (flags[key] === true) return route;
    }
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
