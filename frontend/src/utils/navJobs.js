/**
 * The eight jobs (00_PLAN.md item 26.2).
 *
 * "Reduce 36 destinations to about 8 jobs: Today, Live, Trips, Vehicles,
 * Drivers, Fuel, Money, Reports. Everything else lives inside those."
 *
 * WHAT A JOB IS, HERE
 * -------------------
 * A job is where a screen FOLDED TO lives once its own org stops opening it.
 * Folding does not delete anything: the route, the page, the data and every
 * direct link keep working exactly as before. Only the sidebar entry moves.
 *
 * That is why this taxonomy has to live beside the navigation rather than on
 * the server: the menu is a frontend fact, and only the menu knows which
 * destination belongs under which job.
 *
 * `null` job means "never fold this". Two groups get null on purpose:
 *  - Account (Settings, Profile) — Profile is the guaranteed fallback route for
 *    every authenticated user. Hiding it could lock somebody out with no
 *    recovery path.
 *  - the ERP workspaces — those are already cut by ROLE, not by frequency, and
 *    an ERP user doing accounts work has a completely different job from a
 *    fleet owner. Folding them on usage would undo the role split.
 */

export const JOB = Object.freeze({
  TODAY: 'TODAY',
  LIVE: 'LIVE',
  TRIPS: 'TRIPS',
  VEHICLES: 'VEHICLES',
  DRIVERS: 'DRIVERS',
  FUEL: 'FUEL',
  MONEY: 'MONEY',
  REPORTS: 'REPORTS',
});

export const JOB_LABELS = Object.freeze({
  TODAY: 'Today',
  LIVE: 'Live',
  TRIPS: 'Trips',
  VEHICLES: 'Vehicles',
  DRIVERS: 'Drivers',
  FUEL: 'Fuel',
  MONEY: 'Money',
  REPORTS: 'Reports',
});

/**
 * Path prefix -> job, for screens that are not top-level nav entries (detail
 * pages, tabs). Longest prefix wins, so /vehicles/service-intelligence does not
 * fall into /vehicles' children by accident.
 */
const JOB_BY_PREFIX = Object.freeze([
  ['/vehicles', JOB.VEHICLES],
  ['/drivers', JOB.DRIVERS],
  ['/access-control', JOB.DRIVERS],
  ['/mileage', JOB.FUEL],
  ['/refuel-logs', JOB.FUEL],
  ['/mileage-tracking', JOB.FUEL],
  ['/fuel-comparison', JOB.FUEL],
  ['/fuel-integrity', JOB.FUEL],
  ['/def-ledger', JOB.FUEL],
  ['/adblue-tracking', JOB.FUEL],
  ['/auto-trips', JOB.TRIPS],
  // A place is where trips start and end; that is why Place Hub lives under
  // Trips rather than being a job of its own.
  ['/place-hub', JOB.TRIPS],
  ['/live-tracking', JOB.LIVE],
  ['/digest', JOB.TODAY],
  ['/reports', JOB.REPORTS],
  ['/khata-ledger', JOB.MONEY],
  ['/fleet-alerts', JOB.MONEY],
  ['/owner-alerts', JOB.MONEY],
  ['/erp/billing', JOB.MONEY],
  ['/erp/payables', JOB.MONEY],
  ['/erp/accounts', JOB.MONEY],
  ['/erp/approvals', JOB.MONEY],
  ['/erp/bill-approvals', JOB.MONEY],
  ['/approvals', JOB.MONEY],
  // Route Hub is deviation, replay, profitability and overspeed — analysis of
  // what already happened, which is a report, not an operational surface.
  ['/route-hub', JOB.REPORTS],
]);

/** Which job a path belongs to, or null when it must never be folded. */
export function jobForPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return null;
  let best = null;
  let bestLen = -1;
  for (const [prefix, job] of JOB_BY_PREFIX) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      if (prefix.length > bestLen) {
        best = job;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

export const jobLabel = (job) => JOB_LABELS[job] || job || null;