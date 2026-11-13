import { istDayString } from '../../utils/dateUtils';
import { fleetAttribution } from '../../utils/measuredAttribution.js';
import { cellNumber } from '../Performance/performanceCells';

export const numeric = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

// These are formatted numeric cells from the existing digest contract. Unknown
// values (including the API's em dash) remain unknown rather than becoming zero.
export function digestNumber(value) {
  if (numeric(value) != null) return value;
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d[\d,]*(?:\.\d+)?)(?:\s|%|$)/);
  return match ? numeric(Number(match[1].replaceAll(',', ''))) : null;
}

export function shiftDay(day, amount) {
  const date = new Date(`${day}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + amount);
  return istDayString(date);
}

const cell = (card, label) =>
  card?.status && card.status !== 'ok'
    ? null
    : digestNumber(card?.items?.find((item) => item.label === label)?.value);

const distance = (card) => {
  if (card?.status && card.status !== 'ok') return null;
  const match = card?.big?.match(/([\d,]+(?:\.\d+)?)\s*km\b/i);
  return match ? Number(match[1].replaceAll(',', '')) : null;
};

export function buildOverview(digest, legacy = null, work = null) {
  const cards = Object.fromEntries((digest?.story || []).map((card) => [card.key, card]));
  const critical = legacy
    ? legacy.loading || legacy.error
      ? null
      : (legacy.actions?.filter((a) => a.sev === 'CRITICAL').length ?? null)
    : cell(cards.issues, 'Critical');
  const caution = legacy
    ? legacy.loading || legacy.error
      ? null
      : (legacy.actions?.filter((a) => ['HIGH', 'MEDIUM'].includes(a.sev)).length ?? null)
    : cell(cards.issues, 'Caution');
  const open = cell(cards.issues, 'Open issues');
  const places = cell(cards.questions, 'Places waiting');
  const reconnectKnown =
    cards.reconnect?.status === 'ok' ||
    (!cards.reconnect?.status && Array.isArray(digest?.reconnect));
  const disconnected =
    reconnectKnown && Array.isArray(digest?.reconnect) ? digest.reconnect.length : null;
  const pending = legacy
    ? legacy.loading || legacy.error
      ? null
      : (legacy.actions?.length ?? null)
    : places != null && disconnected != null
      ? places + disconnected
      : null;
  // The digest's runs block: how complete the day's distance is, which leg it
  // could not measure and how much it could not attribute. The old backend
  // sends none of it, so every field stays absent.
  const runs = digest?.runs ?? null;
  const noTripLegs = runs?.why?.reason === 'NO_TRIPS';
  const runsPartial = runs?.coverage === 'partial' || Boolean(runs?.kmPartial);
  const runsMissingParts = Array.isArray(runs?.kmMissingParts) ? runs.kmMissingParts : [];
  const runsUnknownKm = numeric(digest?.unknownKm ?? runs?.unknownKm);
  // The utilization response's fleet: how many trucks a fleet figure covers.
  // It describes the fleet only while the fleet is the source of the distance.
  const fromFleet = !(work && 'loadedKm' in work);
  const attribution = fleetAttribution(legacy?.utilization?.fleet, legacy?.utilization);
  const rawLoadedKm =
    work && 'loadedKm' in work
      ? numeric(work.loadedKm)
      : legacy
        ? numeric(legacy.utilization?.fleet?.loadedKm)
        : (cell(cards.loaded, 'Distance covered') ?? distance(cards.loaded));
  const rawEmptyKm =
    work && 'emptyKm' in work
      ? numeric(work.emptyKm)
      : legacy
        ? numeric(legacy.utilization?.fleet?.emptyKm)
        : (cell(cards.empty, 'Empty running') ?? distance(cards.empty));
  // A day without trip legs has no distance to attribute: it reads "no trip
  // legs for this day", never "0 km".
  const loadedKm = noTripLegs ? null : rawLoadedKm;
  const emptyKm = noTripLegs ? null : rawEmptyKm;

  const attention = legacy
    ? (legacy.actions || []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.desc,
        count: null,
        tone: a.sev === 'CRITICAL' ? 'act' : a.sev === 'LOW' ? 'info' : 'watch',
        to: a.to || '/owner-alerts',
        label: a.cta || 'Review',
      }))
    : [
        {
          id: 'issues',
          title: 'Critical truck issues',
          count: critical,
          description:
            critical === 0
              ? 'No critical issues reported.'
              : 'Review safety and vehicle issues first.',
          tone: critical > 0 ? 'act' : 'info',
          to: cards.issues?.link?.to || '/intelligence?tab=issues',
        },
        {
          id: 'fuel',
          title: 'Fuel discrepancies',
          count: cell(cards.fuel, 'Trucks affected'),
          description:
            cards.fuel?.text ||
            cards.fuel?.why?.text ||
            'Check unexplained fuel loss and tank discrepancies.',
          tone: cards.fuel?.tone || 'info',
          to: cards.fuel?.link?.to || '/intelligence?tab=fuel',
        },
        {
          id: 'questions',
          title: 'Places awaiting confirmation',
          count: places,
          description: 'Confirm places to improve trip detection and route reporting.',
          tone: places > 0 ? 'watch' : 'info',
          to: cards.questions?.link?.to || '/places?tab=review-queue',
        },
        {
          id: 'accounts',
          title: 'Account connectivity',
          count: disconnected,
          description:
            disconnected === 0
              ? 'No reconnects reported by the digest.'
              : 'Reconnect accounts to restore vehicle updates.',
          tone: disconnected > 0 ? 'act' : 'info',
          to: cards.reconnect?.link?.to || '/settings/fleetedge-accounts',
        },
      ];
  const order = { act: 0, watch: 1, info: 2, good: 3 };
  attention.sort((a, b) => (order[a.tone] ?? 2) - (order[b.tone] ?? 2));

  const board = legacy?.driverLeaderboard?.boards?.find((b) => b.rows?.some((r) => r.rank != null));
  const drivers = legacy
    ? (board?.rows || [])
        .filter((r) => r.rank != null && cellNumber(r.score) != null)
        .slice(0, 5)
        .map((r) => ({
          id: r.subjectId,
          name: r.subjectName,
          score: cellNumber(r.score),
          headline: board.label,
          to: '/performance?tab=leaderboards',
        }))
    : [...(digest?.goodDrivers || [])]
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        .slice(0, 5)
        .map((driver) => ({
          ...driver,
          to: `/intelligence?tab=drivers&driver=${encodeURIComponent(driver.id)}`,
        }));

  return {
    cards,
    attention,
    critical,
    caution,
    open,
    pending,
    loadedKm,
    emptyKm,
    loadedTrips: numeric(work?.trips),
    loadedOpenTrips: numeric(work?.openTrips),
    runningPartial: Boolean(work?.kmPartial || work?.emptyKmPartial),
    runningCoverage: fromFleet ? attribution.note : null,
    runningCoveragePartial: fromFleet ? attribution.partial : false,
    runsPartial,
    runsMissingParts,
    runsUnknownKm,
    noTripLegs,
    runningReason: noTripLegs
      ? 'No trip legs for this day'
      : legacy?.utilization?.fleet?.reason ||
        cards.loaded?.why?.text ||
        cards.empty?.why?.text ||
        null,
    drivers,
    followUps: digest?.needsAttention || [],
    issueNote: legacy
      ? 'Priority action items · may include grouped alerts'
      : 'Open issues reported by the digest',
    driverNote: legacy
      ? board?.label || 'Last computed performance window'
      : 'Reported driver scores · learned performance window',
  };
}

/** Daily measured consumption from the backend; missing days stay unknown. */
export function buildFuelTrend(payload, endDay) {
  if (!Array.isArray(payload?.items) || payload.held) return [];
  const days = Array.from({ length: 7 }, (_, i) => ({
    day: shiftDay(endDay, i - 6),
    litres: null,
    measuredTrucks: 0,
    partial: false,
  }));
  for (const item of payload.items) {
    const row = days.find((d) => d.day === item.day);
    if (!row) continue;
    row.litres = numeric(item.litres) != null && item.litres >= 0 ? item.litres : null;
    row.measuredTrucks = item.measuredTrucks ?? 0;
    row.partial = Boolean(item.partial);
  }
  return days;
}
