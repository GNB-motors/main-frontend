/**
 * Module-level access derived from per-key feature flags.
 *
 * Flags are granted one key at a time, but commercially the two products are
 * sold whole: an org that gets any ERP/CRM key gets the module, and likewise for
 * fleet. So "does this org have ERP?" is `some(erp keys)`, not a check on one
 * specific key — that way a single stage shipping early can't leave the module
 * half-visible.
 *
 * Keep these lists in sync with FEATURE_FLAG_KEYS in the backend
 * (app/modules/featureFlag/featureFlag.constants.js).
 */

export const ERP_FLAG_KEYS = [
  'erpMasters',
  'erpCallPlanning',
  'erpDeliveryOrders',
  'erpPlacement',
  'erpAdvances',
  'erpCnUpdation',
  'erpTripClose',
  'erpPod',
  'erpAccounts',
  'erpUnloading',
  'erpBilling',
  'erpFinance',
  'erpApprovals',
  'erpOperations',
];

export const FLEET_FLAG_KEYS = [
  'overview',
  'reports',
  'vehicleActivity',
  'locations',
  'fuelComparison',
  'fuelIntegrity',
  'fleetIntelligence',
  'khataLedger',
  'dailyMileageReport',
  'geofence',
];

/**
 * Master data both modules run on — an ERP trip needs a vehicle and a driver
 * just as much as a fleet trip does. Deliberately NOT in FLEET_FLAG_KEYS: if
 * these granted fleet access, an ERP-only org that switched on the vehicle
 * master would read as "has both modules" and get shown the combined Overview.
 */
export const SHARED_FLAG_KEYS = ['vehicles', 'drivers'];

export const hasErpAccess = (isEnabled) => ERP_FLAG_KEYS.some((k) => isEnabled(k));

export const hasFleetAccess = (isEnabled) => FLEET_FLAG_KEYS.some((k) => isEnabled(k));

/**
 * `access` on a nav item: 'erp' | 'fleet' | 'both'. Undefined = no module gate
 * (the item's own feature-flag `key` still applies).
 */
export const satisfiesAccess = (required, { erp, fleet }) => {
  if (!required) return true;
  if (required === 'both') return erp && fleet;
  if (required === 'erp') return erp;
  if (required === 'fleet') return fleet;
  return true;
};
