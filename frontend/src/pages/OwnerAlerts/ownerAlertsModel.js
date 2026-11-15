import { formatInIST } from '../../utils/dateUtils';
import { timeAgo } from '../../utils/formatters';
import { ALERT_TYPE_LABELS } from './OwnerAlertsService.js';
import { billCheckView } from '../../utils/billCheck';

export const LIMIT = 20;

export const formatIST = (s) => formatInIST(s, 'DD MMM YYYY, hh:mm A [IST]') ?? '—';
export const formatRelativeIST = (s) => (s ? timeAgo(s) : null);

// Severity comes from the backend on every record (`severity`). The frontend
// keeps no severity table of its own (F13): a type's severity is the
// backend's decision. A record without one (the server before B0b) has none.
const ALERT_TITLE = {
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'Subscription expired',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'Subscription expiring',
  FLEETEDGE_REAUTH_REQUIRED: 'FleetEdge re-auth needed',
  FLEETEDGE_RELINK_DUE: 'FleetEdge re-link due',
  FUEL_SIPHON_SUSPECTED: 'Fuel loss suspected',
  FUEL_DATA_REVIEW: 'Fuel data review',
  ADBLUE_BALANCE_FLAG: 'AdBlue balance flag',
  IDLING_BURN_HIGH: 'High idling burn',
  EV_LOW_SOC: 'EV low charge',
  REFUEL_ESTIMATED: 'Refuel estimated',
  FLEETEDGE_ALERT_REFUEL: 'Refuel alert',
  FLEETEDGE_ALERT_FUEL_DRAIN: 'Fuel drain alert',
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: 'Geofence entered',
  FLEETEDGE_ALERT_GEOFENCE_EXITED: 'Geofence exited',
  FLEETEDGE_ALERT_OVERSPEED: 'Overspeed alert',
  IALERT_REAUTH_REQUIRED: 'iALERT re-connect needed',
  IALERT_RELINK_DUE: 'iALERT re-link due',
  IALERT_SUBSCRIPTION_EXPIRED: 'iALERT plan expired',
  IALERT_SUBSCRIPTION_EXPIRING: 'iALERT plan expiring',
  DEVIATION_DETECTED: 'Deviation detected',
  DEVIATION_IN_PROGRESS: 'Deviation in progress',
  UNAPPROVED_SERVICE_VISIT: 'Unapproved service visit',
  WATCHED_PLACE_VISIT: 'Watched place visit',
  RECONCILE_GAP: 'Fuel reconcile gap',
};
const CATEGORY_BY_TYPE = {
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'subscription',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'subscription',
  FLEETEDGE_REAUTH_REQUIRED: 'data',
  FLEETEDGE_RELINK_DUE: 'data',
  IALERT_REAUTH_REQUIRED: 'data',
  IALERT_RELINK_DUE: 'data',
  IALERT_SUBSCRIPTION_EXPIRED: 'subscription',
  IALERT_SUBSCRIPTION_EXPIRING: 'subscription',
  REFUEL_ESTIMATED: 'data',
  ADBLUE_BALANCE_FLAG: 'data',
  FUEL_DATA_REVIEW: 'data',
  RECONCILE_GAP: 'data',
  DEVIATION_DETECTED: 'movement',
  DEVIATION_IN_PROGRESS: 'movement',
  UNAPPROVED_SERVICE_VISIT: 'movement',
  WATCHED_PLACE_VISIT: 'movement',
};

export const SEV_RANK = { CRITICAL: 3, WARNING: 2, INFO: 1 };

/** The record's severity as the backend sent it, upper-cased; null when absent. */
export const severityOf = (record) => {
  const sev = record?.severity;
  return sev ? String(sev).toUpperCase() : null;
};
export const catOf = (t) => CATEGORY_BY_TYPE[t] || 'other';
/**
 * The row's title. A fuel row the backend rates only a WARNING is "Fuel to
 * check" — never "loss" or "theft" unless the code says it is corroborated.
 */
export const titleOf = (t, severity = null) => {
  if (t === 'FUEL_SIPHON_SUSPECTED' && severity === 'WARNING') return 'Fuel to check';
  return ALERT_TITLE[t] || ALERT_TYPE_LABELS[t] || t;
};
export const cleanMsg = (m) => (m || '').replace(/^Please review:\s*/i, '');

/** The views of the page. Critical is the default: it is what the owner reads. */
export const CHIPS = [
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warnings' },
  { key: 'all', label: 'All' },
  { key: 'acknowledged', label: 'Acknowledged' },
];
/** Before the server sends severity, only these views mean anything. */
export const LEGACY_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'acknowledged', label: 'Acknowledged' },
];
export const DEFAULT_CHIP = 'critical';

/** The request parameters for a view. The server filters; we never re-filter. */
export function viewParams(chip) {
  if (chip === 'acknowledged') return { acknowledged: true };
  if (chip === 'critical') return { acknowledged: false, severity: 'critical' };
  if (chip === 'warning') return { acknowledged: false, severity: 'warning' };
  return { acknowledged: false };
}
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

// Enrich + sort. Pure: never mutates the input array. The server already
// filtered by severity, so nothing here drops a row.
export function computeView(alerts, sort) {
  const list = alerts.map((a) => {
    const severity = severityOf(a);
    return {
      ...a,
      severity,
      category: catOf(a.type),
      title: titleOf(a.type, severity),
      typeLabel: ALERT_TYPE_LABELS[a.type] || a.type,
      detectedRel: formatRelativeIST(a.at),
      detectedAbs: formatIST(a.at),
      bill: billCheckView(a.billCheck),
    };
  });

  const byDateDesc = (a, b) => new Date(b.at) - new Date(a.at);
  if (sort === 'newest') list.sort(byDateDesc);
  else if (sort === 'oldest') list.sort((a, b) => new Date(a.at) - new Date(b.at));
  else if (sort === 'vehicle') {
    list.sort((a, b) => (a.vehicleNumber || 'zzz').localeCompare(b.vehicleNumber || 'zzz'));
  } else {
    list.sort(
      (a, b) =>
        Number(a.acknowledged) - Number(b.acknowledged) ||
        (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0) ||
        byDateDesc(a, b),
    );
  }
  return list;
}

/**
 * The server's counts over the whole filter (`meta.counts`), or null when the
 * server does not send them yet. Never counted from the page of rows.
 */
export function countsOf(data) {
  const counts = data?.meta?.counts;
  if (!counts || typeof counts !== 'object') return null;
  const num = (v) =>
    Number.isFinite(Number(v)) && v !== null && v !== undefined ? Number(v) : null;
  return {
    critical: num(counts.critical) ?? 0,
    warning: num(counts.warning ?? counts.warnings) ?? 0,
    trucks: num(
      counts.trucksCritical ?? counts.vehiclesCritical ?? counts.trucks ?? counts.vehicles,
    ),
  };
}
