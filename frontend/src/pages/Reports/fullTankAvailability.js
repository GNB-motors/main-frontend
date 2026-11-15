/**
 * fullTankAvailability.js — does this backend have the "Full tank" report?
 *
 * WHY this module exists: the full-tank endpoint
 * (GET /api/reports/fuel-cycles/full-tank-tab) is newer than the rest of the
 * Reports API. A backend that has not shipped it yet answers 404, and a
 * sidebar row that opens a broken screen is worse than no row at all. So the
 * report row is only shown once the endpoint has answered, and a 404 hides
 * it for good.
 *
 * The answer is a fact about the server, not about this render: it is probed
 * once and cached in the module, so the sidebar and the Reports page share a
 * single request and a re-render never asks again.
 */

import { useEffect, useState } from 'react';
import { ReportsService } from './ReportsService';
import { FULL_TANK_WINDOW_DAYS } from './reports/fullTankTabModel';

/** The catalog id of the "Full tank" report row. */
export const FULL_TANK_REPORT_ID = 'fullTankTab';

/** The answer of the last successful probe, once it is known for good. */
let cached = null;

/** The probe in flight, so two callers share one request. */
let pending = null;

/**
 * Ask the backend whether the full-tank report exists.
 *
 * A 404 means "not on this backend yet" and is remembered, so the row stays
 * hidden. Any other failure (a network blip, a 500) is NOT remembered: the
 * report row is left visible and the report screen itself reports the error,
 * and the next mount asks again.
 * @returns {Promise<{ available: boolean }>}
 */
export function probeFullTankAvailability({ force = false } = {}) {
  if (!force && cached) return Promise.resolve(cached);
  if (!force && pending) return pending;

  // The probe is shared, so its controller is never aborted by one caller
  // unmounting — the answer belongs to the whole session.
  const controller = new AbortController();
  pending = ReportsService.getFullTankTab({ days: FULL_TANK_WINDOW_DAYS }, controller.signal)
    .then((result) => {
      cached = { available: result?.available !== false };
      return cached;
    })
    .catch(() => ({ available: true }))
    .finally(() => {
      pending = null;
    });
  return pending;
}

/**
 * The availability of the full-tank report for the screen that shows it.
 * `available` is false until the backend has answered, so nothing renders a
 * broken report in the meantime.
 * @returns {{ available: boolean, loading: boolean }}
 */
export function useFullTankAvailable() {
  const [state, setState] = useState(() =>
    cached ? { available: cached.available, loading: false } : { available: false, loading: true },
  );

  useEffect(() => {
    let active = true;
    probeFullTankAvailability().then((result) => {
      if (active) setState({ available: result.available, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/** Forget the probe's answer — for tests, which need a clean slate. */
export function resetFullTankAvailability() {
  cached = null;
  pending = null;
}

/**
 * The catalog groups without the "Full tank" row. A group left empty is
 * dropped, so the rail never shows a heading with nothing under it.
 * @param {Array} groups - the visible catalog groups
 * @returns {Array} the same groups, minus the full-tank row
 */
export function withoutFullTankReport(groups) {
  return (Array.isArray(groups) ? groups : [])
    .map((group) => ({
      ...group,
      children: (group?.children || []).filter((report) => report.id !== FULL_TANK_REPORT_ID),
    }))
    .filter((group) => group.children.length > 0);
}
