/**
 * fullTankTabModel.js — the "Full tank" report's numbers, in one pure place.
 *
 * WHY this module exists: the full-tank endpoint is newer than some backends
 * in the field, and even on a new backend a figure can be null because it was
 * never measured (km since the last full tank is the usual one). So the rules
 * this module keeps are:
 *   - a null figure reads "—", never 0;
 *   - a missing figure (an older backend that never sent the field) reads the
 *     same "—", never "undefined";
 *   - where the guide asks for nothing at all (a model's median gap), the
 *     helper returns an empty string rather than a placeholder.
 * Pure on purpose: every rule is unit-tested without a browser.
 */

import { formatInIST } from '../../../utils/dateUtils';
import { formatKm, formatNum } from '../../../utils/formatters';
import { matchesSearch } from './reportFilters';

/** What a figure that was never measured reads as. */
export const NOT_MEASURED = '—';

/**
 * What a model whose trip ledger misses more km than its peers reads as.
 * The backend sends `abovePeers: null` when there are too few models to
 * compare — that case prints nothing.
 */
export const ABOVE_PEERS_NOTE = 'ledger misses more km on this model';

/** The window the report asks the backend for, in days. */
export const FULL_TANK_WINDOW_DAYS = 90;

/** The summary figures the report shows, in the order they are shown. */
export const SUMMARY_FIELDS = [
  { key: 'fullCycles', label: 'Full cycles' },
  { key: 'openTabs', label: 'Open tabs' },
  { key: 'noFullYet', label: 'Trucks with no full tank yet' },
  { key: 'fromSlip', label: 'From slips' },
  { key: 'fromRegister', label: 'From register' },
];

/** True for a finite number; anything else (null, '', undefined) is unmeasured. */
const isMeasure = (value) =>
  value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

/**
 * The day a full tank was last recorded, e.g. "2 Nov 2026". null when the
 * backend sent no date — the caller then says "not measured" rather than
 * inventing one.
 */
export function formatFullDate(value) {
  if (!value) return null;
  const formatted = formatInIST(value, 'D MMM YYYY');
  return formatted || null;
}

/**
 * Where the last full tank was recorded from, in the report's own words:
 * "from slips" for an uploaded fuel slip, "from register rows" for the trip
 * register. null for an unknown basis — the date is then shown on its own.
 */
export function basisText(basis) {
  if (basis === 'SLIP') return 'from slips';
  if (basis === 'REGISTER_MAIN') return 'from register rows';
  return null;
}

/**
 * The "last full tank" cell: the date and where it came from, e.g.
 * "2 Nov 2026 · from slips". A truck whose window holds no full tank reads
 * "No full tank yet"; a truck with no date for any other reason reads "—".
 */
export function formatLastFull(truck) {
  const date = formatFullDate(truck?.lastFullAt);
  if (!date) {
    return truck?.status === 'NO_FULL_YET' ? 'No full tank yet' : NOT_MEASURED;
  }
  const basis = basisText(truck?.lastFullBasis);
  return basis ? `${date} · ${basis}` : date;
}

/** Days since the last full tank, e.g. "6.4". Unmeasured reads "—". */
export function formatDaysSince(value) {
  if (!isMeasure(value)) return NOT_MEASURED;
  const days = Number(value);
  return Number.isInteger(days) ? String(days) : days.toFixed(1);
}

/** Kilometres driven since the last full tank, e.g. "1,234 km". Unmeasured reads "—". */
export function formatKmSince(value) {
  if (!isMeasure(value)) return NOT_MEASURED;
  return formatKm(Number(value));
}

/**
 * The partial fills since the last full tank: how many, and how many litres
 * they added, e.g. "1 fill · 80 L". A truck with no partials object at all
 * reads "—" (unknown), a truck with an empty one reads "0 fills · 0 L".
 */
export function formatPartialFills(partials) {
  if (!partials || typeof partials !== 'object') return NOT_MEASURED;
  const count = isMeasure(partials.count) ? Number(partials.count) : null;
  const litres = isMeasure(partials.litres) ? Number(partials.litres) : null;
  const parts = [];
  if (count !== null) parts.push(`${count} ${count === 1 ? 'fill' : 'fills'}`);
  if (litres !== null) {
    parts.push(`${formatNum(litres, { decimals: Number.isInteger(litres) ? 0 : 1 })} L`);
  }
  return parts.length ? parts.join(' · ') : NOT_MEASURED;
}

/**
 * A plain count, e.g. "7". Unmeasured reads "—" — but a real zero is a
 * measurement and reads "0", because "no cycles" and "no count" are not the
 * same claim.
 */
export function formatCount(value) {
  if (!isMeasure(value)) return NOT_MEASURED;
  return formatNum(Number(value));
}

/** A km/L figure, e.g. "3.1 km/L". Unmeasured reads "—". */
export function formatKmPerL(value) {
  if (!isMeasure(value)) return NOT_MEASURED;
  return `${formatNum(Number(value), { decimals: 1 })} km/L`;
}

/**
 * A model's median km gap as a percentage, e.g. 0.16 → "16%".
 * A null gap is not a zero gap: it prints nothing at all.
 */
export function formatMedianGap(value) {
  if (!isMeasure(value)) return '';
  return `${Math.round(Number(value) * 100)}%`;
}

/**
 * The note under a model that misses more km than its peers. Only
 * `abovePeers === true` earns it; false and null (too few models to compare)
 * print nothing.
 */
export function modelNote(model) {
  return model?.abovePeers === true ? ABOVE_PEERS_NOTE : '';
}

/**
 * The trucks of a response, with the fields the screen reads. Every field is
 * optional: an older backend sent fewer of them, and the screen must not
 * print "undefined" for the ones it left out.
 */
export function readFullTankResponse(payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  return {
    trucks: Array.isArray(body.trucks) ? body.trucks : [],
    summary: body.summary && typeof body.summary === 'object' ? body.summary : {},
    models: Array.isArray(body.models) ? body.models : [],
    days: isMeasure(body.days) ? Number(body.days) : null,
  };
}

/** True when the backend sent a summary block at all. */
export function hasSummary(summary) {
  return Boolean(summary) && Object.keys(summary).length > 0;
}

/** The summary figures as the screen shows them: "—" for anything unmeasured. */
export function summaryItems(summary) {
  const source = summary && typeof summary === 'object' ? summary : {};
  return SUMMARY_FIELDS.map(({ key, label }) => ({
    key,
    label,
    value: formatNum(isMeasure(source[key]) ? Number(source[key]) : null),
  }));
}

/** The trucks whose plate or model matches the search. */
export function filterTrucks(trucks, search) {
  const list = Array.isArray(trucks) ? trucks : [];
  return list.filter((truck) =>
    matchesSearch(search, [truck?.registrationNumber, truck?.model]),
  );
}

/**
 * How many of the trucks have no measured km since their last full tank.
 * Shown next to the truck count so a total never hides what it left out.
 */
export function countKmNotMeasured(trucks) {
  const list = Array.isArray(trucks) ? trucks : [];
  return list.filter((truck) => !isMeasure(truck?.kmSinceFull)).length;
}

/**
 * "6 trucks without a measured km since the last full tank" — the note that
 * keeps a truck count from reading as a measurement. null when none are out.
 */
export function kmNotMeasuredNote(count) {
  if (!Number.isFinite(count) || count <= 0) return null;
  const noun = count === 1 ? 'truck' : 'trucks';
  return `${count} ${noun} without a measured km since the last full tank`;
}

/** The per-model rows of the block under the table. */
export function modelRows(models) {
  const list = Array.isArray(models) ? models : [];
  return list.map((model, index) => ({
    key: model?.modelKey || `model-${index}`,
    modelKey: model?.modelKey || NOT_MEASURED,
    cycles: isMeasure(model?.n) ? Number(model.n) : null,
    trucks: isMeasure(model?.trucks) ? Number(model.trucks) : null,
    gap: formatMedianGap(model?.medianPct),
    note: modelNote(model),
  }));
}
