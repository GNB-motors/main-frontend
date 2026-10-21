import { label } from '../../lib/vocabulary';
import { connectionBadge } from '../Settings/ialertAccountsModel.js';

/** A reading older than this is shown as "not reporting", whatever iALERT's status says. */
export const NOT_REPORTING_AFTER_MS = 6 * 60 * 60 * 1000;

/** Filter keys, in the order the chips show. */
export const STATUS_ORDER = ['RUNNING', 'IDLING', 'STOPPED', 'NOT_REPORTING', 'NO_DATA'];

const toTime = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * The one status a row is filed under. A vehicle whose last update is older than
 * NOT_REPORTING_AFTER_MS is "not reporting" — a 2-day-old "Moving" is not moving.
 */
export function statusKey(vehicle, now = Date.now()) {
  const live = vehicle?.live;
  if (!live) return 'NO_DATA';
  const last = toTime(live.lastUpdateAt);
  if (last == null || now - last > NOT_REPORTING_AFTER_MS) return 'NOT_REPORTING';
  const s = String(live.status || '')
    .trim()
    .toUpperCase();
  return s || 'NOT_REPORTING';
}

export function statusLabel(key) {
  return label('ialertStatus', key);
}

/** "11h 10m", "2d 3h", "45m", "under a minute". */
export function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'under a minute';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

/** How long the vehicle has been in its current status, or null when iALERT did not say. */
export function statusFor(vehicle, now = Date.now()) {
  const since = toTime(vehicle?.live?.statusSince);
  return since == null ? null : formatDuration(now - since);
}

/** Counts per status key, for the filter chips. */
export function statusCounts(vehicles, now = Date.now()) {
  const counts = {};
  for (const v of vehicles) {
    const k = statusKey(v, now);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

/** Chips in a fixed order, then any status iALERT added that we have not named, by count. */
export function statusChips(vehicles, now = Date.now()) {
  const counts = statusCounts(vehicles, now);
  const known = STATUS_ORDER.filter((k) => counts[k]);
  const extra = Object.keys(counts)
    .filter((k) => !STATUS_ORDER.includes(k))
    .sort((a, b) => counts[b] - counts[a]);
  return [...known, ...extra].map((key) => ({ key, label: statusLabel(key), count: counts[key] }));
}

export function filterVehicles(vehicles, { q = '', statuses = [] } = {}, now = Date.now()) {
  const needle = q.trim().toLowerCase();
  return vehicles.filter((v) => {
    if (statuses.length && !statuses.includes(statusKey(v, now))) return false;
    if (!needle) return true;
    return [v.registration, v.vin, v.type, v.accountName].some(
      (x) => x != null && String(x).toLowerCase().includes(needle),
    );
  });
}

/** Moving first, then idling, stopped, the rest; plate order inside each group. */
export function sortVehicles(vehicles, now = Date.now()) {
  const rank = (v) => {
    const i = STATUS_ORDER.indexOf(statusKey(v, now));
    return i === -1 ? STATUS_ORDER.length : i;
  };
  return [...vehicles].sort(
    (a, b) => rank(a) - rank(b) || (a.registration || '').localeCompare(b.registration || ''),
  );
}

/** Newest pull across the fleet — the page's freshness stamp. */
export function newestPull(vehicles) {
  let best = null;
  for (const v of vehicles) {
    const t = toTime(v?.live?.pulledAt);
    if (t != null && (best == null || t > best)) best = t;
  }
  return best == null ? null : new Date(best);
}

/** Flat rows for the spreadsheet export. */
export function exportRows(vehicles, now = Date.now()) {
  return vehicles.map((v) => ({
    registration: v.registration || '',
    vin: v.vin || '',
    type: v.type || '',
    bs6: v.isBs6 === true ? 'Yes' : v.isBs6 === false ? 'No' : '',
    status: statusLabel(statusKey(v, now)),
    statusFor: statusFor(v, now) || '',
    ignition: v.live?.ignitionOn === true ? 'On' : v.live?.ignitionOn === false ? 'Off' : '',
    lastUpdateAt: v.live?.lastUpdateAt || '',
    latitude: v.live?.latitude ?? '',
    longitude: v.live?.longitude ?? '',
    alert: v.live?.alert || '',
    account: v.accountName || '',
    inFleet: v.vehicleId ? 'Yes' : 'No',
  }));
}

/**
 * Whether iALERT data is still arriving, from the link status rows
 * (GET api/extension/ialert/status). The vehicle list alone can't tell: a
 * stopped link keeps showing the last positions it pulled, which looks live.
 * @param {object[]|null} rows status rows
 * @returns {null | { tone: 'crit'|'warn'|'info', stopped: number, total: number, since: string|null }}
 */
export function connectionNotice(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return null;
  const tones = list.map((r) => connectionBadge(r).tone);
  const stoppedRows = list.filter((_, i) => tones[i] === 'crit');
  const renewing = tones.includes('warn');
  if (stoppedRows.length) {
    const since = stoppedRows
      .map((r) => r.expiresAt)
      .filter(Boolean)
      .sort()[0] || null;
    return {
      tone: stoppedRows.length === list.length ? 'crit' : 'warn',
      stopped: stoppedRows.length,
      total: list.length,
      since,
    };
  }
  if (renewing) return { tone: 'info', stopped: 0, total: list.length, since: null };
  return null;
}
