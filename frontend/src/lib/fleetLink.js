/**
 * FleetEdge link health, as the header icon, the banner, the vehicles table and
 * the relink panel read it. Pure: every surface derives its copy from the one
 * `/api/fleetedge/accounts/link-health` payload through these functions, so the
 * icon and the table can never disagree about an account.
 */

/** Only these roles can sign in to the GNB Edge extension, so only they can re-link. */
export const RELINK_ROLES = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];

export const canRelink = (role) => RELINK_ROLES.includes(String(role || '').toUpperCase());

/** States the customer has to act on, worst first. */
export const ACTION_STATES = ['NEEDS_RELINK', 'EXPIRING'];

const regKey = (reg) =>
  String(reg || '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase();

/**
 * accountId → account and plate → account lookups. Plates are compared
 * separator-insensitively ("MH 12 AB 1234" is "MH12AB1234").
 */
export function indexLinkHealth(data) {
  const byAccount = new Map();
  const byReg = new Map();
  for (const account of data?.accounts || []) {
    byAccount.set(String(account.accountId), account);
    for (const v of account.vehicles || []) {
      const key = regKey(v.registrationNumber);
      if (key) byReg.set(key, account);
    }
  }
  return { byAccount, byReg };
}

export const linkForAccount = (index, accountId) =>
  accountId ? index?.byAccount.get(String(accountId)) || null : null;

export const linkForReg = (index, reg) => index?.byReg.get(regKey(reg)) || null;

export const needsAction = (account) => ACTION_STATES.includes(account?.state);

const days = (n) => {
  const whole = Math.max(0, Math.floor(n ?? 0));
  if (whole === 0) return 'today';
  if (whole === 1) return 'in 1 day';
  return `in ${whole} days`;
};

/**
 * Short status text and tone for one account.
 * tone: 'crit' | 'warn' | 'info' | 'ok'
 */
export function linkStatus(account) {
  switch (account?.state) {
    case 'NEEDS_RELINK':
      return {
        tone: 'crit',
        label: account.reason === 'NOT_LINKED' ? 'Not connected' : 'Disconnected',
      };
    case 'EXPIRING':
      return {
        tone: account.urgent ? 'crit' : 'warn',
        label: `Expires ${days(account.daysLeft)}`,
      };
    case 'RECOVERING':
      return { tone: 'info', label: 'Reconnecting automatically' };
    case 'HEALTHY':
      return { tone: 'ok', label: 'Connected' };
    default:
      return { tone: 'info', label: '—' };
  }
}

/** One plain sentence on why the account needs the customer. */
export function linkReason(account) {
  if (account?.state === 'NEEDS_RELINK') {
    if (account.reason === 'NOT_LINKED') {
      return 'Nobody is connected to this FleetEdge account any more, so no data is coming in.';
    }
    if (account.reason === 'EXPIRED') return 'The FleetEdge sign-in ended, so data stopped.';
    return 'FleetEdge stopped accepting the saved sign-in, so data stopped.';
  }
  if (account?.state === 'EXPIRING') {
    return account.reason === 'CANNOT_RENEW'
      ? 'It was connected without auto-renew and will stop on its own.'
      : 'Its FleetEdge sign-in lasts 90 days and cannot be renewed automatically.';
  }
  return null;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Header icon model. The icon is always shown to roles that can re-link, so
 * the customer always has one place to check FleetEdge:
 *   crit — accounts disconnected (red, count = how many)
 *   warn — accounts expiring soon (amber dot)
 *   ok   — every account connected (green dot)
 *   idle — still loading, the check failed, or no account linked yet
 */
export function indicatorModel(data) {
  const s = data?.summary;
  if (!s) return { tone: 'idle', count: 0, label: 'FleetEdge connection' };
  if (s.needsRelink > 0) {
    return {
      tone: 'crit',
      count: s.needsRelink,
      label: `FleetEdge: ${plural(s.needsRelink, 'account needs', 'accounts need')} reconnecting`,
    };
  }
  if (s.expiring > 0) {
    return {
      tone: 'warn',
      count: 0,
      label: `FleetEdge: ${plural(s.expiring, 'account expires', 'accounts expire')} soon`,
    };
  }
  if (!(data.accounts || []).length) {
    return { tone: 'idle', count: 0, label: 'FleetEdge: no account connected yet' };
  }
  return { tone: 'ok', count: 0, label: 'FleetEdge: all accounts connected' };
}

/**
 * Strip under the navbar: every disconnected account, or an expiring one within
 * two days. `signature` changes when a different set of accounts is affected,
 * so a dismissal never hides a new problem.
 */
export function bannerModel(data) {
  const accounts = data?.accounts || [];
  const broken = accounts.filter((a) => a.state === 'NEEDS_RELINK');
  if (broken.length) {
    const vehicles = data.summary?.affectedVehicles ?? 0;
    const name = broken.length === 1 ? broken[0].friendlyName || broken[0].fleetId : null;
    const who = name
      ? `FleetEdge account ${name} is disconnected`
      : `${broken.length} FleetEdge accounts are disconnected`;
    return {
      tone: 'crit',
      text: vehicles
        ? `${who} — live data for ${plural(vehicles, 'vehicle', 'vehicles')} is paused.`
        : `${who}.`,
      signature: `crit:${broken
        .map((a) => a.accountId)
        .sort()
        .join(',')}`,
    };
  }
  const soon = accounts.filter((a) => a.state === 'EXPIRING' && a.urgent);
  if (soon.length) {
    const first = soon[0];
    const text =
      soon.length === 1
        ? `FleetEdge account ${first.friendlyName || first.fleetId} stops syncing ${days(first.daysLeft)}.`
        : `${soon.length} FleetEdge accounts stop syncing within 2 days.`;
    return {
      tone: 'warn',
      text,
      signature: `warn:${soon
        .map((a) => a.accountId)
        .sort()
        .join(',')}`,
    };
  }
  return null;
}

/** Accounts that stopped needing action between two payloads — for the "reconnected" toast. */
export function recoveredAccounts(before, after) {
  const was = new Map(
    (before?.accounts || []).filter(needsAction).map((a) => [String(a.accountId), a]),
  );
  if (!was.size || !after) return [];
  const nowById = new Map((after.accounts || []).map((a) => [String(a.accountId), a]));
  return [...was.values()].filter((a) => {
    const next = nowById.get(String(a.accountId));
    return next && !needsAction(next);
  });
}

/** "Ramesh (you)", "Ramesh, Priya" — who last linked an account. */
export function linkedByText(account) {
  const names = (account?.linkedBy || [])
    .map((l) => (l.isMe ? `${l.name || 'You'} (you)` : l.name))
    .filter(Boolean);
  return names.length ? names.join(', ') : null;
}
