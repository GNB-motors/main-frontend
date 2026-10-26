/**
 * Toll plazas a trip drove through (GET /auto-trips/:id/tolls) placed on the trip page — pure.
 *
 * A pass that happened while the truck stood at a stop (a toll queue) belongs to that stop, so the stop
 * and the crossing read as one event. Every other pass is its own timeline row between the stops it
 * happened between. Rupees are shown only when the server sent them (owners and managers).
 *
 * A trip owns two legs, the same cut as route deviations: APPROACH, the empty drive from the previous
 * trip's last drop to this pickup, and LADEN, the run the replay plays. Only laden passes go on the
 * timeline and the replay map; approach passes happen before the replay starts.
 */
import { inr } from '../../utils/formatMoney';
import { toDate } from './autoTripFormat';

/** A pass this close to a stop's span is that stop: the booth and the queue are one place. */
const STOP_SLACK_MS = 5 * 60000;
const STOP_KINDS = new Set(['stop', 'unknown']);

const ms = (v) => toDate(v)?.getTime() ?? null;

/** A pass with no leg comes from a server before legs existed: it was on the laden run. */
const legOf = (p) => p.leg || 'LADEN';

/** The passes of one leg (APPROACH | LADEN). */
export const passesOf = (passes, leg) => (passes || []).filter((p) => legOf(p) === leg);

export const passId = (p) => `toll-${p.placeId || `${p.lat},${p.lng}`}-${ms(p.at)}`;

/** "Dankuni Toll Plaza", or what we know when no toll Place covers the booth yet. */
export const passName = (p) => p.name || 'Toll booth';

/**
 * The pass's fare as people read it. A closed expressway's entry pays nothing ("charged at exit"); its
 * exit pays the stretch. A fare from TollGuru rather than a published tariff says "quote".
 */
export function fareText(p) {
  if (p.fareBasis === 'ENTRY') return 'charged at exit';
  if (p.fareInr == null) return p.unknownReason ? 'fare unknown' : null;
  const suffix = { RETURN: ' return', SEGMENT: ' for the stretch' }[p.fareBasis] || '';
  return `${inr(p.fareInr)}${suffix}${p.fareSource === 'TOLLGURU' ? ' (quote)' : ''}`;
}

/** What saw a pass, when that is less than the matched road. */
const EVIDENCE_NOTE = {
  INFERRED_ROAD: 'time estimated across a GPS gap',
  STOP: 'stopped at the plaza',
  GPS: 'from GPS — road not matched yet',
};
export const evidenceNote = (p) => EVIDENCE_NOTE[p.evidence] || null;

const GROUP_LABEL = {
  lcv: 'LCV',
  bus: '2-axle truck',
  multiaxle: '3-axle',
  axle_4_6: '4–6 axle',
  axle_7_plus: '7+ axle',
};

/**
 * How the truck was priced: "priced as 4–6 axle (LPT 4830 (48 t))", or, when nothing on the vehicle
 * says its axles, what to fill in. Null for drivers (no fares) or with no passes.
 */
export function tollClassText(tolls) {
  if (!tolls?.total || !tolls.passes?.length) return null;
  const g = tolls.vehicleGroup;
  if (g?.group)
    return `priced as ${GROUP_LABEL[g.group] || g.group}${g.basis ? ` (${g.basis})` : ''}`;
  return 'not priced: set this truck’s axle class or model';
}

/**
 * One leg's tolls: "3 toll plazas · ₹1,185" (+ "· 1 unpriced"), "2 toll plazas" for drivers, null with
 * none. Rupees come from the server's per-leg total (owners and managers only).
 */
export function tollSummary(tolls, leg = 'LADEN') {
  const own = passesOf(tolls?.passes, leg);
  const n = own.length;
  if (!n) return null;
  const head = `${n} toll plaza${n === 1 ? '' : 's'}`;
  const t = tolls.total?.byLeg?.[leg] || (leg === 'LADEN' ? tolls.total : null);
  const parts = [head];
  if (t?.priced) parts.push(inr(t.inr));
  if (t?.unknown) parts.push(`${t.unknown} unpriced`);
  if (tolls.status === 'FALLBACK') parts.push('road not matched yet');
  return parts.join(' · ');
}

function stopOf(steps, at) {
  return steps.find((s) => {
    if (!STOP_KINDS.has(s.kind)) return false;
    const from = ms(s.at);
    const to = ms(s.leftAt) ?? from;
    return from != null && at >= from - STOP_SLACK_MS && at <= to + STOP_SLACK_MS;
  });
}

/**
 * The timeline plan with the trip's toll passes in it: a pass inside a stop sets that step's
 * `tollPass`; any other pass becomes a `{ type: 'toll' }` item right before the first step after it.
 */
export function withTollPasses(plan, passes) {
  const laden = passesOf(passes, 'LADEN');
  if (!plan || !laden.length) return plan;
  const steps = plan.items.filter((it) => it.type === 'step');
  const onStep = new Map();
  const loose = [];
  [...laden]
    .sort((a, b) => ms(a.at) - ms(b.at))
    .forEach((p) => {
      const step = stopOf(steps, ms(p.at));
      if (step && !onStep.has(step.id)) onStep.set(step.id, p);
      else loose.push(p);
    });

  const items = [];
  let k = 0;
  const flushBefore = (limit) => {
    while (k < loose.length && (limit == null || ms(loose[k].at) < limit)) {
      items.push({ type: 'toll', id: passId(loose[k]), pass: loose[k], playAt: loose[k].at });
      k += 1;
    }
  };
  plan.items.forEach((it) => {
    if (it.type === 'step') {
      // The pass goes between the drive and the step it happened before.
      flushBefore(ms(it.at));
      items.push(onStep.has(it.id) ? { ...it, tollPass: onStep.get(it.id) } : it);
    } else items.push(it);
  });
  flushBefore(null);
  return { ...plan, items };
}

/** Markers for the replay map; `passed` is relative to the replay's current instant. */
export function tollMarks(passes, cursorAt) {
  const now = ms(cursorAt);
  return passesOf(passes, 'LADEN').map((p) => ({
    id: passId(p),
    at: { lat: p.lat, lng: p.lng },
    name: passName(p),
    passed: now != null && ms(p.at) <= now,
    title: [passName(p), fareText(p), evidenceNote(p)].filter(Boolean).join(' · '),
  }));
}

/** For this long after a pass the replay says which plaza the truck just crossed. */
const JUST_PASSED_MS = 5 * 60000;

/** The plaza the replay crossed in the last few minutes before `cursorAt`, or null. */
export function justPassed(passes, cursorAt) {
  const now = ms(cursorAt);
  if (now == null) return null;
  const recent = passesOf(passes, 'LADEN').filter((p) => {
    const at = ms(p.at);
    return at != null && at <= now && now - at <= JUST_PASSED_MS;
  });
  return recent.length ? passName(recent[recent.length - 1]) : null;
}
