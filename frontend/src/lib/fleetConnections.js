/**
 * Pure view-model for the Fleet connections panel: the Tata FleetEdge accounts
 * (link-health payload) and the Ashok Leyland iALERT links (iALERT status rows)
 * side by side. Every number and sentence the panel shows comes from here.
 */
import { needsAction } from './fleetLink';
import { connectionBadge } from '../pages/Settings/ialertAccountsModel.js';

const FLEETEDGE_DEFAULT_NAME = /^\s*fleet\s*edge\s*[—–-]\s*/i;

/**
 * The name a person would use for a FleetEdge account. The extension names
 * new links "FleetEdge — <fleetId>", which only repeats the Fleet ID shown
 * underneath, so such names (and missing ones) read "Tata FleetEdge account".
 */
export function fleetEdgeAccountTitle(account) {
  const name = String(account?.friendlyName || '').trim();
  if (!name) return 'Tata FleetEdge account';
  if (FLEETEDGE_DEFAULT_NAME.test(name)) {
    const rest = name.replace(FLEETEDGE_DEFAULT_NAME, '').trim();
    if (!rest || rest === String(account?.fleetId || '')) return 'Tata FleetEdge account';
  }
  return name;
}

/** The name a person would use for an iALERT link. */
export function ialertAccountTitle(row) {
  const name = String(row?.friendlyName || '').trim();
  if (name) return name;
  return row?.externalAccountId ? `iALERT owner ${row.externalAccountId}` : 'iALERT account';
}

const vehiclesOf = (a) => a?.vehicleCount ?? (a?.vehicles || []).length;

/**
 * The three tiles at the top of the panel.
 * @param {object|null} feData link-health payload (null while loading)
 * @param {object[]|null} ialertRows iALERT status rows (null when not loaded or not allowed)
 */
export function overviewTiles(feData, ialertRows) {
  const fe = feData?.accounts || [];
  const ia = ialertRows || [];
  const feAttention = fe.filter(needsAction).length;
  const iaAttention = ia.filter((r) => connectionBadge(r).tone === 'crit').length;
  const attention = feAttention + iaAttention;
  return [
    { key: 'accounts', label: 'Accounts', value: fe.length + ia.length, tone: 'neutral' },
    {
      key: 'vehicles',
      label: 'Vehicles',
      value: fe.reduce((n, a) => n + vehiclesOf(a), 0) + ia.reduce((n, r) => n + (r.vehicleCount || 0), 0),
      tone: 'neutral',
    },
    {
      key: 'attention',
      label: 'Need attention',
      value: attention,
      display: attention ? null : 'None',
      tone: attention ? 'crit' : 'ok',
    },
  ];
}

/**
 * Registrations per iALERT link, for the chips under each account. Vehicles
 * without an account id belong to the only link when there is exactly one.
 */
export function ialertVehiclesByAccount(rows, vehicles) {
  const out = new Map();
  const list = rows || [];
  for (const v of vehicles || []) {
    const reg = v?.registrationNumber || v?.registration;
    if (!reg) continue;
    const id = v.ialertAccountId ? String(v.ialertAccountId) : list.length === 1 ? String(list[0].accountId) : null;
    if (!id) continue;
    if (!out.has(id)) out.set(id, []);
    out.get(id).push(reg);
  }
  return out;
}

/**
 * How fresh an iALERT link's data is, as one short phrase and a tone.
 * Fresh within 30 min is ok, within 6 h is warn, older or never is crit/muted.
 */
export function ialertFreshness(row, now = Date.now()) {
  const at = row?.lastDataAt ? new Date(row.lastDataAt).getTime() : NaN;
  if (!Number.isFinite(at)) return { tone: 'muted', minutes: null };
  const minutes = Math.max(0, Math.round((now - at) / 60000));
  if (minutes <= 30) return { tone: 'ok', minutes };
  if (minutes <= 360) return { tone: 'warn', minutes };
  return { tone: 'crit', minutes };
}

/**
 * Whether an iALERT link renews on its own. Without a stored refresh token
 * nothing is known to renew it (21 Oct: the first prod link
 * lapsed at its first expiry, ~15 min after sign-in), so the customer is told plainly.
 */
export function ialertRenewalNote(row) {
  if (connectionBadge(row).tone === 'crit') {
    return 'Sign in to iALERT again with the GNB Edge extension installed; it reconnects by itself.';
  }
  if (row?.canSelfRenew) return 'Renews on its own.';
  return "Doesn't renew on its own yet. When it shows Reconnect needed, sign in to iALERT again.";
}
