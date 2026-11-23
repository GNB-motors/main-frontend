/**
 * Pure logic behind the "Trucks not sending" panel on /fleet-coverage.
 *
 * The backend classifies every truck into exactly one reason (see the SIGNAL-1
 * brief); this file only turns those reasons into the owner's words and
 * formats the row values. No fetch, no rendering — so it can be unit tested
 * without mounting the panel (this repo tests page logic as plain functions,
 * see fleetCoverageActions.js).
 */
import { formatDateIST } from '../../utils/dateUtils';
import { formatNum } from '../../utils/formatters';
import { daysAgoLabel } from '../../lib/reportFreshness';

const DAY_MS = 86400000;

/** What an unknown value looks like. Never 0 — a missing value is not a zero. */
export const DASH = '—';

/**
 * The reasons, in the order the owner reads them. Each one says what it means
 * and what to do about it. LIVE is a count only: a truck that is sending needs
 * nothing from the owner, so it gets no table.
 */
export const SIGNAL_REASONS = [
  {
    key: 'STOPPED',
    label: 'Stopped',
    meaning: 'No fix for more than 24 hours — the truck went quiet.',
    action: 'Check the truck is running and the device is powered.',
  },
  {
    key: 'DEVICE_DEAD',
    label: 'Device dead',
    meaning: 'The last fix is more than 30 days old.',
    action: 'Fit or check the device.',
  },
  {
    key: 'NEVER_SENT',
    label: 'Never sent',
    meaning: 'Linked, but not one fix has ever arrived.',
    action: 'Ask FleetEdge to check the feed.',
  },
  {
    key: 'ACCOUNT_LINK_LOST',
    label: 'Account link lost',
    meaning: "The telematics account's link is down — one relink fixes every truck on it.",
    action: 'Relink the account.',
  },
  {
    key: 'SUBSCRIPTION_EXPIRED',
    label: 'Subscription expired',
    meaning: 'The telematics subscription has expired.',
    action: 'Renew the subscription.',
  },
  {
    key: 'NO_DEVICE',
    label: 'No device',
    meaning: 'No telematics account and never a fix.',
    action: 'Fit or check the device.',
  },
  {
    key: 'SPARSE',
    label: 'Sparse',
    meaning: 'Sending, but far less often than the rest of the fleet.',
    action: 'Ask FleetEdge to check the feed.',
  },
  {
    key: 'MARKET',
    label: 'Market truck',
    meaning: 'In the fuel register, not in your fleet — not a fault.',
    action: 'Market truck: no action.',
  },
  {
    key: 'LIVE',
    label: 'Live',
    meaning: 'Reporting normally.',
    action: 'Nothing to do.',
  },
];

export const SIGNAL_REASON_KEYS = SIGNAL_REASONS.map((reason) => reason.key);

const REASON_BY_KEY = SIGNAL_REASONS.reduce((acc, reason) => {
  acc[reason.key] = reason;
  return acc;
}, {});

/** The reason in the owner's words; an unknown reason is humanised, not raw. */
export const reasonLabel = (reason) => {
  if (REASON_BY_KEY[reason]) return REASON_BY_KEY[reason].label;
  const words = String(reason ?? '')
    .trim()
    .split('_')
    .join(' ')
    .toLowerCase();
  if (!words) return DASH;
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * The rows of every reason that has any, in the owner's reading order. A
 * reason the backend invented (or a row without one) still shows up, last.
 */
export const groupRowsByReason = (rows = []) => {
  const groups = new Map();
  (rows || []).forEach((row) => {
    const key = row?.reason || 'UNKNOWN';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  const known = SIGNAL_REASON_KEYS.map((key) => ({
    ...REASON_BY_KEY[key],
    rows: groups.get(key) || [],
  })).filter((group) => group.rows.length > 0);

  const extras = [...groups.entries()]
    .filter(([key]) => !SIGNAL_REASON_KEYS.includes(key))
    .map(([key, groupRows]) => ({
      key,
      label: reasonLabel(key),
      meaning: '',
      action: '',
      rows: groupRows,
    }));

  return [...known, ...extras];
};

/** "5 Nov 2026 · 3 days ago" — the date, and how long ago it was. */
export const formatLastFix = (lastFixAt, asOf) => {
  if (!lastFixAt) return DASH;
  const fixedAt = new Date(lastFixAt).getTime();
  if (Number.isNaN(fixedAt)) return DASH;
  const reference = asOf ? new Date(asOf).getTime() : Date.now();
  const days = Number.isNaN(reference)
    ? 0
    : Math.max(0, Math.floor((reference - fixedAt) / DAY_MS));
  return `${formatDateIST(lastFixAt)} · ${daysAgoLabel(days)}`;
};

/** "40/day" — a rate with one decimal at most, never a bare 0 for "unknown". */
const rateText = (value) => {
  if (value === null || value === undefined || value === '') return DASH;
  const rate = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rate)) return DASH;
  const text = Number.isInteger(rate) ? formatNum(rate) : formatNum(rate, { decimals: 1 });
  return `${text}/day`;
};

/** "12/day vs normal 40/day" — the truck's rate next to the org's own floor. */
export const formatFixRate = (row) => {
  const rate = row?.fixesPerDay7d;
  const normal = row?.orgP10;
  if (rate === null || rate === undefined) {
    if (normal === null || normal === undefined) return DASH;
    return `${DASH} vs normal ${rateText(normal)}`;
  }
  return `${rateText(rate)} vs normal ${rateText(normal)}`;
};

/** The telematics account a truck reports through. */
export const accountLabel = (account) => {
  if (!account) return DASH;
  const parts = [account.provider, account.name || account.id].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : DASH;
};

/** A row's key: the plate, then the vehicle id, then its position. */
export const signalRowKey = (row, index) =>
  row?.registrationNumber || row?.vehicleId || `signal-${index}`;
