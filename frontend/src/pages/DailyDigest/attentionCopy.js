import { formatHours, formatMoment, formatMoney, humanCode } from './ownerReportModel';

/**
 * The plain words of the "Needs attention" card, written for a fleet owner:
 * what each count is, one short line about it, and one line per record in
 * its review. No method notes (thresholds' sources, engine-state codes,
 * "unfinished durations").
 */
const L = (v) => (v == null ? 'not known' : `${v} L`);
/** "Long idling" → "long idling"; "SOS and breakdowns" keeps its capitals. */
const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const KINDS = {
  sos: {
    label: 'SOS and breakdowns',
    unit: ['report', 'reports'],
    about: () => 'Reported on this day, including ones already sorted.',
    record: (r) => `${humanCode(r.type)} · ${humanCode(r.status)}`,
  },
  moneyTheft: {
    label: 'Possible fuel loss',
    unit: ['truck', 'trucks'],
    about: () => 'Fuel went down more than driving explains. Not proof of theft — check it.',
    record: (r) =>
      `Missing ${L(r.missingL)} · billed ${L(r.billedL)} · used driving ${L(r.burnedL)}`,
  },
  routeDeviations: {
    label: 'Off-route trips',
    unit: ['trip', 'trips'],
    about: () => 'Trucks that left their usual route on this day.',
    record: (r) =>
      `${r.corridor || 'Route not named'} · ${
        r.extraKm == null ? 'extra distance not known' : `about ${r.extraKm} km extra`
      }`,
  },
  idling: {
    label: 'Long idling',
    unit: ['stop', 'stops'],
    about: (row) => {
      const n = row.numbers || {};
      const min = n.thresholdMin ? `${n.thresholdMin} min or more` : 'a long time';
      const total =
        Number.isFinite(n.verifiedIdleMinutes) && n.verifiedIdleMinutes > 0
          ? ` · ${formatHours(n.verifiedIdleMinutes / 60)} in total`
          : '';
      return `Engine left on at a stop for ${min}${total}.`;
    },
    record: (r) =>
      r.minutes == null ? 'Still idling' : `${formatHours(r.minutes / 60)} with the engine on`,
  },
  stuckAtPlant: {
    label: 'Long waits at plants',
    unit: ['wait', 'waits'],
    about: () => 'Waited longer than usual at a plant or loading point.',
    record: (r) =>
      `${r.site} · waited ${formatHours(r.stationaryMinutes / 60)} (usually up to ${formatHours(
        r.usualMaxMinutes / 60,
      )}) · ${r.status === 'DEPARTED' ? 'has left' : 'may still be there'}`,
  },
  papersWaiting: {
    label: 'Bills to approve',
    unit: ['bill', 'bills'],
    about: () => 'Waiting for your approval, including older ones.',
    record: (r) => `${humanCode(r.category)} · ${formatMoney(r.amount)}`,
  },
  documentsExpiring: {
    label: 'Documents to renew',
    unit: ['document', 'documents'],
    about: () => 'Already expired, or expiring in the next 7 days.',
    record: (r) =>
      `${humanCode(r.docType)} · ${r.expired ? 'expired' : 'expires'} ${formatMoment(r.expiryDate, {
        withTime: false,
      })}`,
  },
  broadcastNotAcknowledged: {
    label: 'Alerts to acknowledge',
    unit: ['alert', 'alerts'],
    about: () => 'Open alerts nobody has marked as seen yet.',
    record: (r) => r.wants || r.condition || 'Open alert',
  },
  // An older server counted fuel loss and route deviations together.
  fuelOrRoute: {
    label: 'Possible fuel loss or off-route trips',
    unit: ['item', 'items'],
    about: () => 'These two are counted together for now. Check them on the fuel page.',
    record: () => '',
  },
  etaSlipping: {
    label: 'Late arrivals',
    unit: ['trip', 'trips'],
    about: () => 'Not tracked yet.',
    record: () => '',
  },
};

const attentionCopy = {
  info: 'What happened on this day, and what is still waiting for you now. Open Review to see each one.',
  notTracked: 'Late arrivals are not tracked yet.',
  label: (kind) => KINDS[kind]?.label || humanCode(kind),
  unit: (kind, count) => {
    const [one, many] = KINDS[kind]?.unit || ['item', 'items'];
    return count === 1 ? one : many;
  },
  about: (row) => KINDS[row.kind]?.about(row) || '',
  record: (kind, r) => KINDS[kind]?.record(r) || '',
  /** "No long idling on this day." / "No bills to approve right now." */
  none: (kind, period) =>
    `No ${lowerFirst(KINDS[kind]?.label || 'items')} ${period === 'live' ? 'right now' : 'on this day'}.`,
  failed: 'Could not load this. Try again.',
  changed: 'This number has changed since the card loaded. Showing the latest.',
  kinds: Object.keys(KINDS),
};

export default attentionCopy;
