import { formatHours, humanCode } from './ownerReportModel';

/**
 * The plain words of the "Needs attention" card, written for a fleet owner:
 * what each count is and one short line about it. No method notes (thresholds' sources, engine-state codes,
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
  },
  moneyTheft: {
    label: 'Possible fuel loss',
    unit: ['truck', 'trucks'],
    about: () => 'Fuel went down more than driving explains. Not proof of theft — check it.',
  },
  routeDeviations: {
    label: 'Off-route trips',
    unit: ['trip', 'trips'],
    about: () => 'Trucks that left their usual route on this day.',
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
  },
  stuckAtPlant: {
    label: 'Long waits at plants',
    unit: ['wait', 'waits'],
    about: () => 'Waited longer than usual at a plant or loading point.',
  },
  papersWaiting: {
    label: 'Bills to approve',
    unit: ['bill', 'bills'],
    about: () => 'Waiting for your approval, including older ones.',
  },
  documentsExpiring: {
    label: 'Documents to renew',
    unit: ['document', 'documents'],
    about: () => 'Already expired, or expiring in the next 7 days.',
  },
  broadcastNotAcknowledged: {
    label: 'Alerts to acknowledge',
    unit: ['alert', 'alerts'],
    about: () => 'Open alerts nobody has marked as seen yet.',
  },
  // An older server counted fuel loss and route deviations together.
  fuelOrRoute: {
    label: 'Possible fuel loss or off-route trips',
    unit: ['item', 'items'],
    about: () => 'These two are counted together for now. Check them on the fuel page.',
  },
  etaSlipping: {
    label: 'Late arrivals',
    unit: ['trip', 'trips'],
    about: () => 'Not tracked yet.',
  },
};

const attentionCopy = {
  info: 'What happened on this day, and what is still waiting for you now. Review opens the page where you deal with it.',
  notTracked: 'Late arrivals are not tracked yet.',
  label: (kind) => KINDS[kind]?.label || humanCode(kind),
  unit: (kind, count) => {
    const [one, many] = KINDS[kind]?.unit || ['item', 'items'];
    return count === 1 ? one : many;
  },
  about: (row) => KINDS[row.kind]?.about(row) || '',
  /** "No long idling on this day." / "No bills to approve right now." */
  none: (kind, period) =>
    `No ${lowerFirst(KINDS[kind]?.label || 'items')} ${period === 'live' ? 'right now' : 'on this day'}.`,
  /** A day the check has not run for yet. */
  pending: (kind) =>
    kind === 'moneyTheft'
      ? 'Fuel loss is checked after the day ends.'
      : `${KINDS[kind]?.label || 'This'} is checked after the day ends.`,
  failed: 'Could not load this. Try again.',
  kinds: Object.keys(KINDS),
};

export default attentionCopy;
