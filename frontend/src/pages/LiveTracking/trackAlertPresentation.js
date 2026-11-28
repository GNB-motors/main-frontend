import { titleOf, severityOf, formatIST } from '../OwnerAlerts/ownerAlertsModel';
import { alertTime } from './trackAlertsModel';

/** The explanation uses the alert record; a motion status never invents its cause. */
export function trackAlertView(alert) {
  const severity = severityOf(alert);
  const rawTitle = alert.title || titleOf(alert.type, severity) || 'Alert to review';
  const title = rawTitle.includes('_')
    ? rawTitle
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^./, (letter) => letter.toUpperCase())
    : rawTitle;
  const time = alertTime(alert);
  return {
    title,
    severity,
    message:
      typeof alert.message === 'string' && alert.message.trim()
        ? alert.message.trim()
        : 'No further details were provided for this alert.',
    at: time == null ? null : new Date(time).toISOString(),
    timeLabel: time == null ? 'Time not recorded' : formatIST(new Date(time).toISOString()),
  };
}

/** Track counts the owner-alert feed, so its review link must open that same feed. */
export function truckOwnerAlertsLink(plate, now = Date.now()) {
  const params = new URLSearchParams({
    severity: 'all',
    from: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(now).toISOString(),
  });
  const vehicle = String(plate || '').trim();
  if (vehicle) params.set('vehicle', vehicle);
  return `/owner-alerts?${params}`;
}
