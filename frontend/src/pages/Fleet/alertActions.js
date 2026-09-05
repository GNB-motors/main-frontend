/**
 * Where each alert type is actually FIXED.
 *
 * The defect this closes: an alert told the user something was wrong and then
 * stopped. The worst case was FLEETEDGE_REAUTH_REQUIRED — it stops all
 * telemetry, and it surfaced in two places (the Owner Alerts feed, and a widget
 * buried on the Fuel Comparison page) with the text "reconnect via the
 * extension" and no link. Meanwhile /settings/fleetedge-accounts, the page built
 * to repair it, had zero inbound links anywhere in the app and could only be
 * reached by typing the URL.
 *
 * Every route referenced here exists today. When the Places and Live hubs land
 * (steps 5 and 6), only the `to` values change.
 */

// The owner-alert feed calls it `vehicleNumber`; the raw FleetEdge timeline
// calls it `registrationNumber`. Accept either so one action map serves both.
const vehicleRoute = (alert) => {
  const reg = alert?.vehicleNumber || alert?.registrationNumber;
  return reg ? `/vehicles/${encodeURIComponent(reg)}` : null;
};

/**
 * type -> { label, to } | (alert) => { label, to } | null
 * `label` is the button text, so it must name the action, not the screen.
 */
const ACTIONS = {
  // Integration health. Nothing else works until these are cleared.
  FLEETEDGE_REAUTH_REQUIRED: { label: 'Reconnect', to: '/settings/fleetedge-accounts' },
  FLEETEDGE_SUBSCRIPTION_EXPIRED: { label: 'Review accounts', to: '/settings/fleetedge-accounts' },
  FLEETEDGE_SUBSCRIPTION_EXPIRING: { label: 'Review accounts', to: '/settings/fleetedge-accounts' },

  // Suspected loss — the integrity checks are where you confirm or dismiss it.
  FUEL_SIPHON_SUSPECTED: { label: 'Check fuel', to: '/fleet/fuel?tab=checks&view=integrity' },
  FLEETEDGE_ALERT_FUEL_DRAIN: { label: 'Check fuel', to: '/fleet/fuel?tab=checks&view=integrity' },

  // Ordinary fuel events — land on the matching log.
  REFUEL_ESTIMATED: { label: 'Open logs', to: '/fleet/fuel?tab=logs&view=mileage' },
  FLEETEDGE_ALERT_REFUEL: { label: 'Open logs', to: '/fleet/fuel?tab=logs&view=mileage' },
  ADBLUE_BALANCE_FLAG: { label: 'Open AdBlue', to: '/fleet/fuel?tab=logs&view=adblue' },

  // Zone events belong with the zone definitions that produced them.
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: { label: 'View zones', to: '/geofence/zones' },
  FLEETEDGE_ALERT_GEOFENCE_EXITED: { label: 'View zones', to: '/geofence/zones' },

  // Vehicle-specific behaviour — Vehicle 360 is the one place that shows a
  // single truck whole. Falls back to null when the alert carries no
  // registration, rather than linking somewhere useless.
  IDLING_BURN_HIGH: (a) => {
    const to = vehicleRoute(a);
    return to ? { label: 'Open vehicle', to } : { label: 'Fuel spend', to: '/fleet/fuel?tab=costs&view=spend' };
  },
  FLEETEDGE_ALERT_OVERSPEED: (a) => {
    const to = vehicleRoute(a);
    return to ? { label: 'Open vehicle', to } : null;
  },
  EV_LOW_SOC: (a) => {
    const to = vehicleRoute(a);
    return to ? { label: 'Open vehicle', to } : null;
  },
};

/**
 * Resolve the fix for one alert. Returns { label, to } or null when there is
 * genuinely nothing to act on — an absent button is honest, a button that goes
 * nowhere is not.
 */
export const alertAction = (alert) => {
  if (!alert?.type) return null;
  const entry = ACTIONS[alert.type];
  if (!entry) return null;
  const resolved = typeof entry === 'function' ? entry(alert) : entry;
  return resolved?.to ? resolved : null;
};

export default alertAction;
