/**
 * The morning briefing: the pure part.
 *
 * Every number here comes from one of four responses the page already reads:
 * the owner report (eight sections), the morning brief (₹ leaks), the live
 * positions and the fleet-view digest. Nothing is invented; an unknown stays
 * null so the tile can print "—" with its reason.
 */
import { DASH, formatMoment, labelFor } from './ownerReportModel';
import { PARTIAL_LABEL } from '../../utils/measured.js';
import digestExplain from './digestExplain';
import digestDay from './digestDay';

/** A vendor error, without the internal API path: "Timed out after 30 s". */
export function feedReason(reason) {
  if (!reason) return null;
  const timeout = /timed out after (\d+)\s*s/i.exec(reason);
  if (timeout) return `The vendor's server timed out after ${timeout[1]} s`;
  const clean = String(reason)
    .replace(/\/[\w\-/.]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : null;
}

/** "45 min", "6 h", "3 d" — how long a truck has been silent. */
export function formatSilence(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(min, 1)} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 365) return `${d} d`;
  return `${Math.floor(d / 365)} yr+`;
}

/** Whole-rupee money with Indian grouping. */
export function rupees(value) {
  if (value == null || !Number.isFinite(Number(value))) return DASH;
  return `₹${Math.round(Number(value)).toLocaleString('en-IN')}`;
}

export const count = (value) =>
  value == null || !Number.isFinite(Number(value))
    ? DASH
    : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 });

/** A zero assembled from missing calculations is not a measured zero. */
export function extraFuelTotal(brief) {
  const total = brief?.totalRupees;
  if (total == null || !Number.isFinite(Number(total))) return null;
  const measured = brief.sections?.some((section) => section.rupees != null);
  if (Number(total) === 0 && (brief.partial || !measured)) return null;
  return Number(total);
}

/** Sections keyed by id, numbers defaulting to {}. */
export function sectionsById(sections) {
  const out = {};
  for (const section of Array.isArray(sections) ? sections : []) {
    if (section?.id) out[section.id] = section;
  }
  return out;
}

/**
 * The five headline tiles. Live counts win for "now" whenever live positions
 * are loaded; otherwise the report's snapshot is
 * used and the tile says when it was taken.
 */
export function buildKpis({ byId, brief, briefState, isToday, liveCounts, builtAt, day }) {
  const fleet = byId.fleetNow?.numbers || {};
  const work = byId.yesterdaysWork?.numbers || {};
  const trend = byId.trend?.numbers || {};
  const health = byId.dataHealth?.numbers || {};
  const tripsModule = work.openTrips != null;
  const tripsTo = day ? `/auto-trips?range=custom&from=${day}&to=${day}` : '/auto-trips';
  const live = liveCounts && liveCounts.all > 0 ? liveCounts : null;
  const snapshot = builtAt ? `When the report ran, ${builtAt}` : 'From the daily report';

  // A reported zero is a count, even while today's trips are still open.
  const notCounted = (value) => value == null;
  const delta = (pct) =>
    isToday || pct == null || !Number.isFinite(Number(pct)) ? null : Number(pct);
  const avgNote = (avg, unit) =>
    avg == null ? 'Not counted yet' : `Not counted yet · usually ${count(Math.round(avg))}${unit}`;

  // The ⓘ on each tile: what it shows, in the owner's words (digestExplain).
  const tripsUnavailable =
    work.trips == null ||
    (Number(work.trips) === 0 &&
      (byId.yesterdaysWork?.state === 'error' || work.tripsPartial === true));
  const countWhy = digestExplain.trips(isToday);
  const distanceWhy = digestExplain.loadedKm();

  const trucks = live ? live.all : (health.trucks ?? null);
  const dark = live ? live.offline : (fleet.dark ?? health.trucksDark ?? null);
  // Moving and dark are read as they are now, whatever day is picked.
  const notForDay = isToday || !day ? null : digestDay.notFor(day);

  return [
    {
      key: 'moving',
      period: 'live',
      label: 'Moving now',
      value: live ? live.moving : (fleet.moving ?? null),
      context: live
        ? `of ${count(trucks)} trucks · live`
        : fleet.moving == null
          ? 'Live tracking not reported'
          : notForDay
            ? `Live · ${notForDay}`
            : snapshot,
      to: '/live-tracking?status=moving',
    },
    {
      key: 'trips',
      label: isToday ? 'Trips started today' : 'Trips started',
      value: tripsUnavailable ? null : work.trips,
      context: tripsUnavailable
        ? avgNote(trend.tripsPrev7Avg, '/day')
        : isToday
          ? tripsModule
            ? 'Includes trips still on the road'
            : 'Completed / confirmed · so far today'
          : null,
      delta: tripsUnavailable || Number(work.trips) === 0 ? null : delta(trend.tripsVsPrev7Pct),
      why: countWhy,
      to: tripsTo,
    },
    {
      key: 'km',
      label: tripsModule
        ? isToday
          ? 'Loaded km today'
          : 'Loaded km'
        : isToday
          ? 'km today'
          : 'km',
      value: notCounted(work.km) ? null : work.km,
      context: notCounted(work.km)
        ? tripsModule && work.openTrips > 0
          ? `Distance pending for ${count(work.openTrips)} open trip${work.openTrips === 1 ? '' : 's'}`
          : avgNote(trend.kmPrev7Avg, ' km')
        : isToday
          ? tripsModule
            ? `Loaded trip distance${work.kmPartial ? ` · ${PARTIAL_LABEL.toLowerCase()}` : ''}`
            : 'From completed / confirmed trips'
          : null,
      delta: notCounted(work.km) ? null : delta(trend.kmVsPrev7Pct),
      why: distanceWhy,
      to: tripsTo,
    },
    {
      key: 'lost',
      label: isToday ? 'Extra fuel cost today' : 'Extra fuel cost',
      value: extraFuelTotal(brief),
      money: true,
      tone: Number(brief?.totalRupees) > 0 ? 'act' : null,
      context:
        briefState === 'error'
          ? 'Morning brief did not load'
          : extraFuelTotal(brief) == null
            ? 'Not counted yet'
            : brief?.partial
              ? 'Calculated loss · Incomplete'
              : 'Estimated extra diesel cost',
      why: digestExplain.extraFuelCost(),
    },
    {
      key: 'dark',
      period: 'live',
      label: notForDay ? 'Dark now' : 'Trucks dark',
      value: dark,
      tone: Number(dark) > 0 ? 'watch' : null,
      context:
        dark == null
          ? 'Live tracking not reported'
          : `of ${count(trucks)} trucks${
              live
                ? ' · live'
                : notForDay
                  ? ` · live, ${notForDay}`
                  : ` · ${snapshot.toLowerCase()}`
            }`,
      to: '/live-tracking?status=offline',
    },
  ];
}

/** The owner's word for a leak, whatever older servers called it. */
const LEAK_TITLES = { excessIdling: 'Idling' };

/** What "extra" is measured against, said once under the leak's title. */
const LEAK_COMPARED_TO = {
  fuelOverModel:
    'Compared with what each truck normally uses for the same distance and driving, learned from its own recent trips.',
};

const litres = (v) => Math.round(Number(v) * 10) / 10;

/** "20.7 L over its normal 85 L" — the extra, and what it is extra to. */
function overNormal(v) {
  const over = `${litres(v.excessL)} L over its normal`;
  return v.normalL != null && Number(v.normalL) > 0 ? `${over} ${litres(v.normalL)} L` : over;
}

/** Older servers said "than expected": say what it was expected from. */
function plainAction(key, text) {
  if (key !== 'fuelOverModel' || !text) return text || '';
  return text.replace(
    /more diesel than expected/,
    'more diesel than it normally uses for the same distance and driving',
  );
}

/** The ₹ leaks, biggest first, with each one's share of the day's total. */
export function leakRows(brief) {
  const sections = Array.isArray(brief?.sections) ? brief.sections : [];
  const total = sections.reduce((sum, s) => sum + (Number(s?.rupees) || 0), 0);
  return sections
    .map((section) => ({
      key: section?.key || section?.label || 'leak',
      label: LEAK_TITLES[section?.key] || section?.label || labelFor(section?.key),
      rupees: section?.rupees == null ? null : Number(section.rupees),
      share: total > 0 && section?.rupees != null ? Number(section.rupees) / total : null,
      action: plainAction(section?.key, section?.suggestedAction),
      comparedTo: LEAK_COMPARED_TO[section?.key] || null,
      partial: section?.partial || false,
      coverageNote: section?.coverageNote || '',
      reasons: (section?.unavailableReasons || [])
        .map((r) => r.message)
        .filter(Boolean)
        .join(' '),
      trucks: (Array.isArray(section?.vehicles) ? section.vehicles : [])
        .map((v) => ({
          reg: v?.registrationNumber || null,
          rupees: v?.rupees == null ? null : Number(v.rupees),
          detail:
            v?.excessL != null
              ? overNormal(v)
              : v?.durationMin != null
                ? `${formatSilence(Number(v.durationMin) * 60000)} idling`
                : null,
        }))
        .filter((t) => t.reg)
        .sort((a, b) => (b.rupees ?? -1) - (a.rupees ?? -1)),
    }))
    .sort((a, b) => (b.rupees ?? -1) - (a.rupees ?? -1));
}

const regKey = (reg) =>
  String(reg || '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase();

/**
 * Trucks that need someone today, grouped: dark (live), stuck at a plant
 * (report), never reported (report) and failing vendor feeds.
 */
export function attentionGroups({ vehicles, byId, now = Date.now() }) {
  const dark = (Array.isArray(vehicles) ? vehicles : [])
    .filter((v) => v.status === 'offline')
    .map((v) => {
      const at = v.lastFixAt ? new Date(v.lastFixAt).getTime() : null;
      const silentMs = at && Number.isFinite(at) ? now - at : null;
      return { reg: v.plate, silentMs, silent: formatSilence(silentMs) };
    })
    // Freshly dark trucks first: those are the ones someone can still chase today.
    .sort((a, b) => (a.silentMs ?? Infinity) - (b.silentMs ?? Infinity));

  const ex = Array.isArray(byId.exceptions?.rows) ? byId.exceptions.rows : [];
  // The revised report counts historical visits, including proven departures.
  // Those visits cannot establish that a truck is stuck right now. Their full
  // evidence belongs in Needs attention rather than this live-truck list.
  const stuckRows =
    byId.exceptions?.numbers?.attentionVersion === 2
      ? null
      : ex.find((r) => r?.kind === 'stuckAtPlant');
  const stuck = (Array.isArray(stuckRows?.rows) ? stuckRows.rows : [])
    .filter((r) => r?.registrationNumber)
    .map((r) => ({
      reg: r.registrationNumber,
      silent: r.stationaryMinutes != null ? formatSilence(r.stationaryMinutes * 60000) : null,
    }));

  const healthRows = byId.dataHealth?.rows || {};
  const liveRegs = new Set((Array.isArray(vehicles) ? vehicles : []).map((v) => regKey(v.plate)));
  const neverReported = (Array.isArray(healthRows.trucksNoData) ? healthRows.trucksNoData : [])
    .filter((reg) => typeof reg === 'string' && !liveRegs.has(regKey(reg)))
    .map((reg) => ({ reg }));
  const feedSource = (Array.isArray(byId.dataHealth?.sources) ? byId.dataHealth.sources : []).find(
    (src) => /AccountFeedHealth/.test(src?.name || ''),
  );
  const lastSuccess = feedSource?.freshAsOf
    ? formatMoment(feedSource.freshAsOf, { withTime: false })
    : null;
  const feeds = (Array.isArray(healthRows.failingFeeds) ? healthRows.failingFeeds : []).map(
    (f, i) => ({
      key: `feed-${i}`,
      failedPulls: f?.consecutiveFailedPulls ?? null,
      rawReason: f?.lastFailureReason || null,
      reason: feedReason(f?.lastFailureReason),
      lastSuccess,
    }),
  );

  const silentKnown = dark.filter((d) => d.silentMs != null);
  const darkRange =
    silentKnown.length > 1
      ? `${silentKnown[0].silent} to ${silentKnown[silentKnown.length - 1].silent}`
      : silentKnown[0]?.silent || null;

  return {
    dark,
    darkRange,
    stuck,
    stuckCount: stuckRows?.count ?? stuck.length,
    neverReported,
    feeds,
  };
}

/** Report sections shown in "The day in numbers". */
export const NUMBER_SECTIONS = ['yesterdaysWork', 'moneyOut', 'trend', 'fleetNow', 'dataHealth'];
