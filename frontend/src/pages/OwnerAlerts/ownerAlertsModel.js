import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ALERT_TYPE_LABELS } from './OwnerAlertsService.jsx';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const IST_ZONE = 'Asia/Kolkata';
export const LIMIT = 20;

export const toIST = (s) => (s ? dayjs.utc(s).tz(IST_ZONE) : null);
export const formatIST = (s) => {
  const d = toIST(s);
  return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—';
};
export const formatRelativeIST = (s) => {
  const d = toIST(s);
  return d ? d.fromNow() : null;
};

// Severity / title / category derived from the alert type.
const SEVERITY_BY_TYPE = {
  FUEL_SIPHON_SUSPECTED: 'CRITICAL',
  FLEETEDGE_ALERT_FUEL_DRAIN: 'CRITICAL',
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'WARNING',
  FLEETEDGE_REAUTH_REQUIRED: 'WARNING',
  ADBLUE_BALANCE_FLAG: 'WARNING',
  IDLING_BURN_HIGH: 'WARNING',
  EV_LOW_SOC: 'WARNING',
  FLEETEDGE_ALERT_OVERSPEED: 'WARNING',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'INFO',
  REFUEL_ESTIMATED: 'INFO',
  FLEETEDGE_ALERT_REFUEL: 'INFO',
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: 'INFO',
  FLEETEDGE_ALERT_GEOFENCE_EXITED: 'INFO',
};
const ALERT_TITLE = {
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'Subscription expired',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'Subscription expiring',
  FLEETEDGE_REAUTH_REQUIRED: 'FleetEdge re-auth needed',
  FUEL_SIPHON_SUSPECTED: 'Fuel loss suspected',
  ADBLUE_BALANCE_FLAG: 'AdBlue balance flag',
  IDLING_BURN_HIGH: 'High idling burn',
  EV_LOW_SOC: 'EV low charge',
  REFUEL_ESTIMATED: 'Refuel estimated',
  FLEETEDGE_ALERT_REFUEL: 'Refuel alert',
  FLEETEDGE_ALERT_FUEL_DRAIN: 'Fuel drain alert',
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: 'Geofence entered',
  FLEETEDGE_ALERT_GEOFENCE_EXITED: 'Geofence exited',
  FLEETEDGE_ALERT_OVERSPEED: 'Overspeed alert',
};
const CATEGORY_BY_TYPE = {
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'subscription',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'subscription',
  FLEETEDGE_REAUTH_REQUIRED: 'data',
  REFUEL_ESTIMATED: 'data',
  ADBLUE_BALANCE_FLAG: 'data',
};

export const SEV_RANK = { CRITICAL: 3, WARNING: 2, INFO: 1 };

export const sevOf = (t) => SEVERITY_BY_TYPE[t] || 'WARNING';
export const catOf = (t) => CATEGORY_BY_TYPE[t] || 'other';
export const titleOf = (t) => ALERT_TITLE[t] || ALERT_TYPE_LABELS[t] || t;
export const cleanMsg = (m) => (m || '').replace(/^Please review:\s*/i, '');

export const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'data', label: 'Data issues' },
  { key: 'acknowledged', label: 'Acknowledged' },
];
export const SINCE = [
  { key: 'all', label: 'Any time' },
  { key: '1', label: 'Today' },
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
];
export const SORTS = [
  { key: 'triage', label: 'Triage' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'vehicle', label: 'Vehicle' },
];

// Enrich + client refine + sort. Pure: never mutates the input array.
export function computeView(alerts, refine, sort) {
  let list = alerts.map((a) => ({
    ...a,
    severity: sevOf(a.type),
    category: catOf(a.type),
    title: titleOf(a.type),
    typeLabel: ALERT_TYPE_LABELS[a.type] || a.type,
    detectedRel: formatRelativeIST(a.at),
    detectedAbs: formatIST(a.at),
  }));
  if (refine === 'critical') list = list.filter((a) => a.severity === 'CRITICAL');
  else if (refine === 'warning') list = list.filter((a) => a.severity === 'WARNING');
  else if (refine === 'subscription') list = list.filter((a) => a.category === 'subscription');
  else if (refine === 'data') list = list.filter((a) => a.category === 'data');

  const byDateDesc = (a, b) => new Date(b.at) - new Date(a.at);
  if (sort === 'newest') list.sort(byDateDesc);
  else if (sort === 'oldest') list.sort((a, b) => new Date(a.at) - new Date(b.at));
  else if (sort === 'vehicle') {
    list.sort((a, b) => (a.vehicleNumber || 'zzz').localeCompare(b.vehicleNumber || 'zzz'));
  } else {
    list.sort(
      (a, b) =>
        Number(a.acknowledged) - Number(b.acknowledged) ||
        SEV_RANK[b.severity] - SEV_RANK[a.severity] ||
        byDateDesc(a, b),
    );
  }
  return list;
}

// Summary tiles — derived only from the current page of alerts.
export function buildSummary(alerts, unacknowledgedCount) {
  const enriched = alerts.map((a) => ({ ...a, severity: sevOf(a.type), category: catOf(a.type) }));
  const vehicles = new Set(enriched.filter((a) => a.vehicleNumber).map((a) => a.vehicleNumber));
  return {
    toReview: unacknowledgedCount,
    critical: enriched.filter((a) => a.severity === 'CRITICAL').length,
    subscription: enriched.filter((a) => a.category === 'subscription').length,
    vehicles: vehicles.size,
  };
}
