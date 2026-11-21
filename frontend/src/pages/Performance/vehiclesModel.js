import { words } from './performanceCells';

/**
 * A row's identity: `vehicleKey` (also set for iALERT-only trucks, which have no
 * platform vehicle id), or the platform id from an older server.
 */
export const keyOf = (v) => v.vehicleKey || v.vehicleId || null;

export const VEHICLE_METRICS = [
  { key: 'kmPerL', label: 'Mileage', decimals: 2 },
  { key: 'idlePct', label: 'Idle share', decimals: 1 },
  { key: 'topGearPct', label: 'Top-gear share', decimals: 1 },
  { key: 'overRevPct', label: 'Over-rev share', decimals: 1 },
];

const PROVIDER_LABEL = { TATA: 'Tata', IALERT: 'iALERT' };

export const providerLabel = (provider) =>
  PROVIDER_LABEL[String(provider || '').toUpperCase()] ||
  (provider ? words(provider) : 'Provider not on record');

const RPM_LABEL = { idle: 'Idle', green: 'Green', amber: 'Amber', red: 'Red' };

/** "g4" → "Gear 4", "amber" → "Amber". */
export const bandLabel = (key) => RPM_LABEL[key] || words(key);

const FINDING_TONE = { ok: 'ok', watch: 'warn', finding: 'bad' };
const FINDING_LABEL = {
  ok: 'OK',
  watch: 'Watch',
  finding: 'Finding',
  not_measured: 'Not measured',
  insufficient_data: 'Not enough data',
};

/** The pill of an engine-health finding. */
export const findingPill = (status) => ({
  tone: FINDING_TONE[status] || null,
  label: FINDING_LABEL[status] || words(status),
});

/**
 * The gear or rpm cells of one group, as rows — or one sentence when none of
 * them carries a number, so the drawer does not show a column of dashes.
 */
export function shareGroup(map, isUnknown, reasonOf) {
  const entries = Object.entries(map ?? {});
  if (!entries.length) return { rows: [], allUnknownReason: null };
  const unknown = entries.filter(([, cell]) => isUnknown(cell));
  if (unknown.length === entries.length) {
    return { rows: [], allUnknownReason: reasonOf(entries[0][1]) };
  }
  return { rows: entries, allUnknownReason: null };
}
