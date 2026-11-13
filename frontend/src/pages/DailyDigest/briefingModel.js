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

/** Sections keyed by id, numbers defaulting to {}. */
export function sectionsById(sections) {
  const out = {};
  for (const section of Array.isArray(sections) ? sections : []) {
    if (section?.id) out[section.id] = section;
  }
  return out;
}

/**
 * The five headline tiles. Live counts win for "now" when the page is on
 * today and live positions are loaded; otherwise the report's snapshot is
 * used and the tile says when it was taken.
 */
export function buildKpis({ byId, brief, briefState, isToday, liveCounts, builtAt, day }) {
  const fleet = byId.fleetNow?.numbers || {};
  const work = byId.yesterdaysWork?.numbers || {};
  const trend = byId.trend?.numbers || {};
  const health = byId.dataHealth?.numbers || {};
  const tripsModule = work.openTrips != null;
  const tripsTo = day ? `/auto-trips?range=custom&from=${day}&to=${day}` : '/auto-trips';
  const live = isToday && liveCounts && liveCounts.all > 0 ? liveCounts : null;
  const snapshot = builtAt ? `When the report ran, ${builtAt}` : 'From the daily report';

  // A reported zero is a count, even while today's trips are still open.
  const notCounted = (value) => value == null;
  const delta = (pct) =>
    isToday || pct == null || !Number.isFinite(Number(pct)) ? null : Number(pct);
  const avgNote = (avg, unit) =>
    avg == null ? 'Not counted yet' : `Not counted yet · usually ${count(Math.round(avg))}${unit}`;

  const countWhy = `${
    tripsModule
      ? 'The Trips module detector version and pickup-departure day in IST are used. Open, completed, confirmed and review trips are included; dismissed and superseded trips are excluded'
      : 'Counts include completed and confirmed trips that left a pickup on this IST day. Open trips are excluded'
  }${
    builtAt ? `; this report was built at ${builtAt}` : ''
  }. "Usually" is the average of the previous 7 days.`;
  const distanceWhy = tripsModule
    ? `${countWhy} Distance is the Trips table's loaded km: odometer first, GPS otherwise. An open trip can be counted before its loaded distance is recorded. Missing distances are excluded and the total is labelled partial. This is loaded trip distance, not all fleet travel since midnight.`
    : `${countWhy} Distance includes approach, loaded, return and fuel-detour km for those trips, rather than all fleet travel since midnight.`;

  const trucks = live ? live.all : (health.trucks ?? null);
  const dark = live ? live.offline : (fleet.dark ?? health.trucksDark ?? null);

  return [
    {
      key: 'moving',
      label: isToday ? 'Moving now' : 'Moving',
      value: live ? live.moving : (fleet.moving ?? null),
      context: live
        ? `of ${count(trucks)} trucks · live`
        : fleet.moving == null
          ? 'Live tracking not reported'
          : snapshot,
      to: '/live-tracking?status=moving',
    },
    {
      key: 'trips',
      label: isToday ? 'Trips today' : 'Trips',
      value: notCounted(work.trips) ? null : work.trips,
      context: notCounted(work.trips)
        ? avgNote(trend.tripsPrev7Avg, '/day')
        : isToday
          ? tripsModule
            ? 'Departed today · includes open trips'
            : 'Completed / confirmed · so far today'
          : null,
      delta: notCounted(work.trips) ? null : delta(trend.tripsVsPrev7Pct),
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
      value: brief?.totalRupees ?? null,
      money: true,
      tone: Number(brief?.totalRupees) > 0 ? 'act' : null,
      context:
        briefState === 'error'
          ? 'Morning brief did not load'
          : brief?.totalRupees == null
            ? 'Not estimated for this day'
            : 'Estimated extra diesel cost',
      why: brief?.disclaimer || null,
    },
    {
      key: 'dark',
      label: 'Trucks dark',
      value: dark,
      tone: Number(dark) > 0 ? 'watch' : null,
      context:
        dark == null
          ? 'Live tracking not reported'
          : `of ${count(trucks)} trucks${live ? ' · live' : ` · ${snapshot.toLowerCase()}`}`,
      to: '/live-tracking?status=offline',
    },
  ];
}

/** The ₹ leaks, biggest first, with each one's share of the day's total. */
export function leakRows(brief) {
  const sections = Array.isArray(brief?.sections) ? brief.sections : [];
  const total = sections.reduce((sum, s) => sum + (Number(s?.rupees) || 0), 0);
  return sections
    .map((section) => ({
      key: section?.key || section?.label || 'leak',
      label: section?.label || labelFor(section?.key),
      rupees: section?.rupees == null ? null : Number(section.rupees),
      share: total > 0 && section?.rupees != null ? Number(section.rupees) / total : null,
      action: section?.suggestedAction || '',
      trucks: (Array.isArray(section?.vehicles) ? section.vehicles : [])
        .map((v) => ({
          reg: v?.registrationNumber || null,
          rupees: v?.rupees == null ? null : Number(v.rupees),
          detail:
            v?.excessL != null
              ? `${Math.round(Number(v.excessL) * 10) / 10} litres extra diesel`
              : v?.durationMin != null
                ? `${formatSilence(Number(v.durationMin) * 60000)} stopped with engine running`
                : null,
        }))
        .filter((t) => t.reg)
        .sort((a, b) => (b.rupees ?? -1) - (a.rupees ?? -1)),
    }))
    .sort((a, b) => (b.rupees ?? -1) - (a.rupees ?? -1));
}

export const EXCEPTION_LINKS = {
  sos: '/alert-inbox?inboxView=INCIDENTS&incidentStatus=ACTIVE',
  moneyTheft: '/intelligence?tab=fuel',
  idling: '/intelligence?tab=idling',
  stuckAtPlant: '/auto-trips?tab=history&minDwellMin=180',
  etaSlipping: '/auto-trips',
  papersWaiting: '/khata-ledger?tab=all&expenseStatus=PENDING',
  documentsExpiring: '/vehicles/dashboard?docFilter=EXPIRING_SOON',
  broadcastNotAcknowledged: '/alert-inbox?inboxStatus=OPEN',
};

const URGENT = new Set(['sos', 'moneyTheft']);

/** Exceptions: the counted ones as bars, the rest named in one line. */
export function exceptionSummary(section) {
  const rows = Array.isArray(section?.rows)
    ? section.rows.filter((r) => r && typeof r === 'object')
    : [];
  const counted = rows
    .filter((r) => Number.isFinite(Number(r.count)) && r.count !== null && Number(r.count) > 0)
    .filter(
      (r) =>
        String(r.note || '')
          .trim()
          .toLowerCase() !== 'not built yet',
    )
    .map((r) => {
      const idleMin = Number(r.numbers?.verifiedIdleMinutes);
      return {
        key: r.kind,
        label: labelFor(r.kind),
        count: Number(r.count),
        urgent: URGENT.has(r.kind),
        detail:
          r.kind === 'idling' && Number.isFinite(idleMin) && idleMin > 0
            ? `${Math.round(idleMin / 60).toLocaleString('en-IN')} h engine on`
            : null,
        to: EXCEPTION_LINKS[r.kind] || '/alert-inbox',
      };
    })
    .sort((a, b) => b.count - a.count);
  const clear = rows
    .filter((r) => r.count !== null && Number(r.count) === 0)
    .map((r) => labelFor(r.kind));
  const unmeasured = rows
    .filter((r) => r.count == null || String(r.note || '').toLowerCase() === 'not built yet')
    .map((r) => labelFor(r.kind));
  const total = section?.numbers?.total;
  return {
    counted,
    clear,
    unmeasured,
    total: Number.isFinite(Number(total)) ? Number(total) : null,
  };
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
  const stuckRows = ex.find((r) => r?.kind === 'stuckAtPlant');
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
