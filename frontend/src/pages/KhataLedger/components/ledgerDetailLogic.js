// Pure request/response shaping for the shared driver/truck ledger detail
// view (rule 21). No React in this module — the component owns state/fetching.

import {
  CATEGORIES,
  CATEGORY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  toSplitArray,
  getDriverName,
  getVehicleLabel,
} from '../utils';

export const EMPTY_SUMMARY = {
  totalAmount: 0,
  count: 0,
  byCategory: {},
  bySource: {},
  split: [],
};

/** Query params for the ledger + summary endpoints, given the active filters. */
export function buildLedgerParams({ page, dateRange, category, source, crossFilterId, isDriver }) {
  const params = { page, limit: 20 };
  if (dateRange.startDate) params.startDate = dateRange.startDate;
  if (dateRange.endDate) params.endDate = dateRange.endDate;
  if (category) params.category = category;
  if (source) params.source = source;
  if (crossFilterId) {
    params[isDriver ? 'vehicleId' : 'driverId'] = crossFilterId;
  }
  return params;
}

/** Normalise a paged ledger payload; the API has shipped several envelope shapes. */
export function parseLedgerResponse(data) {
  if (Array.isArray(data)) {
    return { transactions: data, meta: { page: 1, totalPages: 1, totalResults: data.length } };
  }
  const payload = data || {};
  return {
    transactions: payload.results || payload.items || [],
    meta: {
      page: payload.page || 1,
      totalPages: payload.totalPages || 1,
      totalResults: payload.totalResults || payload.total || 0,
    },
  };
}

/** Merge a summary payload over the empty shape so renders never see missing keys. */
export function parseLedgerSummary(data) {
  if (!data) return { ...EMPTY_SUMMARY };
  return { ...EMPTY_SUMMARY, ...data };
}

/** Descending contributor list: explicit split wins, then the per-side aggregate. */
export function getLedgerSplitItems(summary, isDriver) {
  const data = summary || {};
  // EMPTY_SUMMARY's `split: []` is merged into every summary, so an empty list
  // must not hide byVehicle / byDriver.
  const explicit = toSplitArray(data.split);
  return explicit.length ? explicit : toSplitArray(isDriver ? data.byVehicle : data.byDriver);
}

/** Human label for one split row: look the id up in the loaded option list first. */
export function resolveLedgerSplitLabel({ isDriver, item, vehicles, drivers, fallback = '-' }) {
  const options = isDriver ? vehicles : drivers;
  const match = options.find((o) => o._id === (item.vehicleId || item.driverId || item._id));
  if (match) return isDriver ? getVehicleLabel(match) : getDriverName(match);
  return item.name || fallback;
}

/** Row key: source + _id is unique across merged manual/trip/fuel/maintenance rows. */
export function ledgerTxKey(tx) {
  return `${tx.source}-${tx._id}`;
}

export function countActiveLedgerFilters({ category, source, crossFilterId }) {
  return [category, source, crossFilterId].filter(Boolean).length;
}

const sentence = (text) => (text ? text.charAt(0) + text.slice(1).toLowerCase() : text);

// The ledger merges four record kinds. Fuel logs arrive as FUEL_EXPENSE and
// maintenance records as SERVICE or REPAIR, which the expense lists don't name.
const EXTRA_CATEGORY_LABELS = {
  FUEL_EXPENSE: 'Fuel log',
  SERVICE: 'Service',
  TRIP_EXPENSE: 'Trip expense',
};

/** Ledger categories, plus the fuel-log and service kinds the merged ledger adds. */
export const LEDGER_CATEGORY_OPTIONS = [...CATEGORIES, 'FUEL_EXPENSE', 'SERVICE'];

/** Sources the ledger endpoints accept as a filter (DRIVER_BILL is rejected). */
export const LEDGER_SOURCE_OPTIONS = ['MANUAL', 'FUEL', 'MAINTENANCE', 'TRIP'];

export function categoryLabel(key) {
  if (!key) return 'Uncategorised';
  return EXTRA_CATEGORY_LABELS[key] || sentence(CATEGORY_LABELS[key]) || sentence(key);
}

const SOURCE_WORDS = { FUEL: 'Fuel log', MAINTENANCE: 'Maintenance record', TRIP: 'Trip' };

export function sourceLabel(key) {
  if (!key) return 'Manual';
  return SOURCE_WORDS[key] || sentence(SOURCE_LABELS[key]) || sentence(key);
}

export function statusLabel(status) {
  return sentence(STATUS_LABELS[status] || status || 'Confirmed');
}

export function statusTone(status) {
  if (status === 'PENDING') return 'warn';
  if (status === 'REJECTED') return 'bad';
  return 'neutral';
}

// The ERP trip state labels and tones live with the trip states.
export { tripStateLabel, tripStateTone } from './erpTripStates';

const FUEL_CATEGORIES = ['FUEL', 'FUEL_EXPENSE'];
const MAINTENANCE_CATEGORIES = ['MAINTENANCE', 'REPAIR', 'SERVICE'];

/** Fuel, maintenance and the rest of a summary's total, by category. */
export function costBuckets(summary) {
  const byCategory = summary?.byCategory || {};
  const sum = (keys) => keys.reduce((total, key) => total + (Number(byCategory[key]) || 0), 0);
  const total = Number(summary?.totalAmount) || 0;
  const fuel = sum(FUEL_CATEGORIES);
  const maintenance = sum(MAINTENANCE_CATEGORIES);
  return { total, fuel, maintenance, other: Math.max(0, total - fuel - maintenance) };
}

/** The trips whose date falls inside the ledger's period (both bounds optional). */
export function tripsInPeriod(trips, { startDate, endDate } = {}) {
  const from = startDate ? new Date(startDate).getTime() : -Infinity;
  const to = endDate ? new Date(endDate).getTime() : Infinity;
  return (trips || []).filter((trip) => {
    const at = new Date(trip.tripDate || trip.createdAt).getTime();
    return Number.isFinite(at) && at >= from && at <= to;
  });
}

/** Largest first, at most `top` rows; the rest fold into one "Other" row. */
export function rankRows(entries, top = 6) {
  const rows = entries
    .map(([name, amount]) => ({ name, amount: Number(amount) || 0 }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  if (rows.length <= top) return rows;
  const rest = rows.slice(top - 1).reduce((total, row) => total + row.amount, 0);
  return [...rows.slice(0, top - 1), { name: 'Other', amount: rest }];
}
