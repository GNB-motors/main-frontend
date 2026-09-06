import { ShieldAlert, FileWarning, Bell, Wrench, Fuel, Timer, Route } from 'lucide-react';
import { ALERT_TYPE_LABELS } from '../OwnerAlerts/OwnerAlertsService';
import { formatINR, formatInrCompact, formatNum, formatLitres } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';

/**
 * Pure "what needs attention today" assembly for the Daily Digest (rule 21).
 * Each build* function takes the raw API responses and returns the list of
 * display-ready items its section renders — no JSX, so it's unit-testable
 * without mounting anything.
 */

// Start of today in IST, as an ISO instant for backend windows.
export function startOfTodayIST() {
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istNow.setHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - 5.5 * 3600 * 1000).toISOString();
}

export const SEV = {
  CRITICAL: { rank: 3, tone: 'critical', color: 'var(--critical)' },
  HIGH: { rank: 2, tone: 'critical', color: 'var(--critical)' },
  MEDIUM: { rank: 1, tone: 'caution', color: 'var(--caution)' },
  LOW: { rank: 0, tone: 'inert', color: 'var(--inert)' },
};

// Owner-alert type → { severity, title, icon }
export const ALERT_META = {
  FUEL_SIPHON_SUSPECTED: { sev: 'CRITICAL', title: 'Fuel loss suspected', icon: ShieldAlert },
  FLEETEDGE_ALERT_FUEL_DRAIN: { sev: 'CRITICAL', title: 'Fuel drain', icon: ShieldAlert },
  FLEETEDGE_SUBSCRIPTION_EXPIRED: { sev: 'HIGH', title: 'Plan expired', icon: ShieldAlert },
  FLEETEDGE_REAUTH_REQUIRED: { sev: 'HIGH', title: 'FleetEdge re-auth needed', icon: ShieldAlert },
  FLEETEDGE_SUBSCRIPTION_EXPIRING: { sev: 'MEDIUM', title: 'Plan expiring', icon: Bell },
  ADBLUE_BALANCE_FLAG: { sev: 'MEDIUM', title: 'AdBlue balance flag', icon: Bell },
  IDLING_BURN_HIGH: { sev: 'MEDIUM', title: 'High idling burn', icon: Fuel },
  EV_LOW_SOC: { sev: 'MEDIUM', title: 'EV low charge', icon: Bell },
  FLEETEDGE_ALERT_OVERSPEED: { sev: 'MEDIUM', title: 'Overspeed', icon: Bell },
};

export function cleanMsg(msg) {
  return (msg || '').replace(/^Please review:\s*/i, '');
}

export function buildActionItems({
  totals,
  m,
  alerts,
  fleetAlertSummary,
  documents,
  serviceVehicles,
}) {
  const actions = [];

  // Unexplained fuel loss (tank mass-balance)
  if (totals?.siphonSuspectedLossL > 0) {
    actions.push({
      id: 'siphon',
      sev: 'CRITICAL',
      icon: ShieldAlert,
      title: 'Unexplained fuel loss',
      desc: `${formatLitres(totals.siphonSuspectedLossL)} left tanks without explanation today (${formatINR(totals.siphonSuspectedLossInr)}).`,
      to: '/fuel-integrity',
      cta: 'Investigate',
    });
  } else if (m?.theftLossInr > 0) {
    const top = m.topVehicles?.[0];
    actions.push({
      id: 'theft',
      sev: 'CRITICAL',
      icon: ShieldAlert,
      title: 'Unexplained fuel loss',
      desc: `≈ ${formatINR(m.theftLossInr)} unexplained fuel loss today${top ? ` — most on ${top.registrationNumber}` : ''}.`,
      to: '/fuel-integrity',
      cta: 'Investigate',
    });
  }
  if (m?.billFraudSuspectInr > 0) {
    actions.push({
      id: 'bill',
      sev: 'CRITICAL',
      icon: Fuel,
      title: 'Bill mismatch',
      desc: `${formatINR(m.billFraudSuspectInr)} of fuel bills don't match the tanks.`,
      to: '/fuel-integrity',
      cta: 'Review bills',
    });
  }

  // Owner alerts (unacknowledged)
  const unack = alerts?.records?.filter((a) => !a.acknowledged) || [];
  for (const a of unack.slice(0, 6)) {
    const meta = ALERT_META[a.type] || {
      sev: 'MEDIUM',
      title: ALERT_TYPE_LABELS[a.type] || a.type,
      icon: Bell,
    };
    actions.push({
      id: `alert-${a.id}`,
      sev: meta.sev,
      icon: meta.icon,
      title: meta.title,
      desc: cleanMsg(a.message) || meta.title,
      meta: a.at ? `Detected ${formatDateIST(a.at)}` : null,
      to: a.vehicleNumber ? `/vehicles/${encodeURIComponent(a.vehicleNumber)}` : '/owner-alerts',
      cta: a.vehicleNumber ? 'Review vehicle' : 'Review alert',
    });
  }

  // Native FleetEdge critical alerts
  const nativeCount = fleetAlertSummary?.totalAlerts || 0;
  const worst = fleetAlertSummary?.byType?.find((t) => t.severity === 'critical');
  if (worst) {
    actions.push({
      id: 'native',
      sev: 'HIGH',
      icon: Bell,
      title: 'FleetEdge alerts',
      desc: `${formatNum(nativeCount)} native FleetEdge alert${nativeCount === 1 ? '' : 's'} today — including ${worst.count} ${worst.title.toLowerCase()}.`,
      to: '/fleet-alerts',
      cta: 'Review alerts',
    });
  }

  // Expired documents
  for (const d of (documents || []).filter((x) => x.daysLeft < 0).slice(0, 4)) {
    actions.push({
      id: `doc-${d.registrationNumber}-${d.docType}`,
      sev: 'HIGH',
      icon: FileWarning,
      title: `${d.docType} expired`,
      desc: `${d.registrationNumber} — ${d.docType} expired ${formatNum(-d.daysLeft)} days ago.`,
      to: '/compliance',
      cta: 'Review document',
    });
  }

  // Overdue service
  for (const v of (serviceVehicles || []).filter((x) => x.risk === 'OVERDUE').slice(0, 3)) {
    actions.push({
      id: `svc-${v.registrationNumber}`,
      sev: 'HIGH',
      icon: Wrench,
      title: 'Service overdue',
      desc: `${v.registrationNumber} is overdue for service by ${formatNum(Math.abs(v.daysUntilDue ?? 0))} days.`,
      to: `/vehicles/${encodeURIComponent(v.registrationNumber)}`,
      cta: 'Review vehicle',
    });
  }

  actions.sort((a, b) => (SEV[b.sev]?.rank || 0) - (SEV[a.sev]?.rank || 0));
  return actions;
}

export function buildActivityItems(m) {
  const activity = [];
  if (m?.fuelCostInr > 0) {
    activity.push({
      id: 'fuel',
      icon: Fuel,
      label: 'Fuel spend',
      value: formatInrCompact(m.fuelCostInr),
      sub: 'Fuel spend today',
      to: '/fuel-spend',
    });
  }
  if (m?.idlingWasteInr > 0) {
    activity.push({
      id: 'idle',
      icon: Timer,
      label: 'Idling waste',
      value: formatInrCompact(m.idlingWasteInr),
      sub: 'Burned by idling today',
      to: '/owner-alerts',
    });
  }
  if (m?.detourWasteInr > 0) {
    activity.push({
      id: 'detour',
      icon: Route,
      label: 'Detour waste',
      value: formatInrCompact(m.detourWasteInr),
      sub: 'Cost of detours today',
      to: '/route-deviation',
    });
  }
  return activity;
}

export function buildUpcomingItems({ serviceVehicles, documents }) {
  const upcoming = [];
  for (const v of (serviceVehicles || []).filter((x) => x.risk !== 'OVERDUE').slice(0, 4)) {
    upcoming.push({
      id: `up-svc-${v.registrationNumber}`,
      icon: Wrench,
      tone: 'var(--caution)',
      text: `${v.registrationNumber} is due for service in ${formatNum(v.daysUntilDue ?? 0)} days.`,
      to: `/vehicles/${encodeURIComponent(v.registrationNumber)}`,
    });
  }
  for (const d of (documents || []).filter((x) => x.daysLeft >= 0).slice(0, 4)) {
    upcoming.push({
      id: `up-doc-${d.registrationNumber}-${d.docType}`,
      icon: FileWarning,
      tone: 'var(--caution)',
      text: `${d.registrationNumber} — ${d.docType} expires in ${formatNum(d.daysLeft)} days.`,
      to: '/compliance',
    });
  }
  return upcoming;
}

export function nextServiceLabel(serviceVehicles) {
  const nextSvc = (serviceVehicles || [])
    .map((v) => v.daysUntilDue)
    .filter((n) => n != null)
    .sort((a, b) => a - b)[0];
  const label = nextSvc == null ? '—' : nextSvc < 0 ? 'Overdue' : `${formatNum(nextSvc)} days`;
  return { nextSvc, label };
}
