// Pure request/response shaping for the shared driver/truck ledger detail
// view (rule 21). No React in this module — the component owns state/fetching.

import { toSplitArray, getDriverName, getVehicleLabel } from '../utils';

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
  return toSplitArray(data.split || (isDriver ? data.byVehicle : data.byDriver));
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
