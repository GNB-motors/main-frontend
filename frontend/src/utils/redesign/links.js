/**
 * Link helpers for the redesign.
 *
 * Rule: components never build an app URL by hand. They use `link.to` from
 * the API, or one of these three helpers. Keeping them here means the
 * Intelligence page, the Track page and the Digest cannot drift apart.
 */

import { useNavigate } from 'react-router-dom';
import { fleetDestination } from './fleetDestination';

/** IST offset used when a caller hands us a naive local date-time. */
const IST_OFFSET = '+05:30';

/**
 * ISO string with the IST offset, which is what the API expects for a
 * range (`2026-11-01T18:30:00+05:30`). A Date is converted to IST first so
 * the wall-clock time is what a transporter in Bengal would read.
 */
export function toIstIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const shifted = new Date(date.getTime() + (330 + date.getTimezoneOffset()) * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}` +
    `T${pad(shifted.getHours())}:${pad(shifted.getMinutes())}:${pad(shifted.getSeconds())}${IST_OFFSET}`
  );
}

/**
 * `/live-tracking?v=…&from=…&to=…&at=…`
 * `from`/`to` are ISO strings with the IST offset; `at` positions the
 * playhead.
 */
export function trackLink({ reg, from, to, at } = {}) {
  const params = new URLSearchParams();
  if (reg) params.set('v', reg);
  const fromIso = toIstIso(from);
  const toIso = toIstIso(to);
  if (fromIso) params.set('from', fromIso);
  if (toIso) params.set('to', toIso);
  const atIso = toIstIso(at);
  if (atIso) params.set('at', atIso);
  const query = params.toString();
  return query ? `/live-tracking?${query}` : '/live-tracking';
}

/**
 * `/intelligence?tab=…&vehicle=…&driver=…&from=…&to=…`
 * Empty values are dropped so the page reads its own defaults.
 */
export function intelligenceLink({ tab, vehicle, driver, from, to } = {}) {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (vehicle) params.set('vehicle', vehicle);
  if (driver) params.set('driver', driver);
  const fromIso = toIstIso(from);
  const toIso = toIstIso(to);
  if (fromIso) params.set('from', fromIso);
  if (toIso) params.set('to', toIso);
  const query = params.toString();
  return query ? `/intelligence?${query}` : '/intelligence';
}

/** `/auto-trips/:id` */
export function tripLink(id) {
  if (!id) return '/auto-trips';
  return `/auto-trips/${encodeURIComponent(id)}`;
}

/**
 * The re-link screen every "Reconnect" button in the product points at.
 * The backend sends the same path in `action.to`; this helper is the
 * frontend's own copy so a button never renders a broken link.
 */
export const RECONNECT_PATH = '/settings/fleetedge-accounts';

/** `/auto-trips?tab=history&site=…` — a place's visit history. */
export function tripsHistoryLink({ site, vehicle } = {}) {
  const params = new URLSearchParams();
  params.set('tab', 'history');
  if (site) params.set('site', site);
  if (vehicle) params.set('vehicle', vehicle);
  return `/auto-trips?${params.toString()}`;
}

/** `/mileage?tab=mileage` — the km/L and DEF page. */
export function mileageLink({ tab = 'mileage', vehicle } = {}) {
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (vehicle) params.set('vehicle', vehicle);
  return `/mileage?${params.toString()}`;
}

/**
 * `useNavigate` wrapper: a component that must navigate to a link object
 * gets one call instead of building a router hook and the href itself.
 */
export function useGoToLink() {
  const navigate = useNavigate();
  return (link) => {
    const destination = fleetDestination(link?.to);
    if (destination) navigate(destination);
  };
}
