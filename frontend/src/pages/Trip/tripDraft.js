/**
 * Draft persistence for the trip-creation flow (FRONTEND_UX_AUDIT §7.16 —
 * "a dropped connection currently loses a whole trip entry").
 *
 * Only JSON-serializable state is persisted: the vehicle/driver selections
 * and the journey-setup data. Photos and scans (File objects) cannot survive
 * a reload, and weight slips without files must never reach submission, so
 * documents and slips are deliberately NOT part of the draft — the user
 * re-attaches them after a restore.
 */

export const TRIP_DRAFT_PREF_KEY = 'gnb:trip-creation-draft';

const DRAFT_VERSION = 1;

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Serialize the restorable slice of the trip-creation state.
 * Returns null when there is nothing worth persisting.
 *
 * @param {Object} state
 * @param {Object|null} state.selectedVehicle
 * @param {Object|null} state.selectedDriver
 * @param {Object|null} state.journeyData
 * @returns {string|null} JSON payload, or null
 */
export const serializeTripDraft = ({ selectedVehicle, selectedDriver, journeyData } = {}) => {
  if (!selectedVehicle && !selectedDriver && !journeyData) return null;
  return JSON.stringify({
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    selectedVehicle: selectedVehicle ?? null,
    selectedDriver: selectedDriver ?? null,
    journeyData: journeyData ?? null,
  });
};

/**
 * Parse a raw draft payload. Returns null for anything malformed, from a
 * different draft version, or carrying non-object fields — callers then
 * start fresh instead of restoring half a state.
 *
 * @param {string|null|undefined} raw
 * @returns {{savedAt: string|null, selectedVehicle: Object|null, selectedDriver: Object|null, journeyData: Object|null}|null}
 */
export const parseTripDraft = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isPlainObject(parsed)) return null;
  if (parsed.version !== DRAFT_VERSION) return null;

  return {
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
    selectedVehicle: isPlainObject(parsed.selectedVehicle) ? parsed.selectedVehicle : null,
    selectedDriver: isPlainObject(parsed.selectedDriver) ? parsed.selectedDriver : null,
    journeyData: isPlainObject(parsed.journeyData) ? parsed.journeyData : null,
  };
};
