/**
 * The day's loaded and empty distance.
 *
 * A total is published only when both legs were measured: one known leg is
 * not a total, and the missing leg is said out loud instead of being added
 * as a zero.
 */
import { toMeasured } from '../../utils/measured.js';

const LEG_LABEL = { loaded: 'Loaded', empty: 'Empty' };

const defaultKm = (value) => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 });

/** Both legs, the total when it is a total, and the leg that is missing. */
export function runningDistance(loadedKm, emptyKm) {
  const loaded = toMeasured(loadedKm);
  const empty = toMeasured(emptyKm);
  const complete = loaded != null && empty != null;
  const knownLeg = loaded != null ? 'loaded' : empty != null ? 'empty' : null;
  const missingLeg = complete ? null : loaded != null ? 'empty' : 'loaded';
  return {
    complete,
    total: complete ? loaded + empty : null,
    knownLeg,
    missingLeg,
    knownKm: knownLeg === 'loaded' ? loaded : empty,
  };
}

/** "Loaded 300 km · empty not measured" */
export function runningCoverageLine(distance, formatKm = defaultKm) {
  if (!distance?.knownLeg || !distance?.missingLeg) return null;
  const known = LEG_LABEL[distance.knownLeg];
  const missing = LEG_LABEL[distance.missingLeg].toLowerCase();
  return `${known} ${formatKm(distance.knownKm)} km · ${missing} not measured`;
}

/** "Loaded distance not measured" from the digest's missing parts. */
export function missingPartsLabel(parts) {
  const list = (Array.isArray(parts) ? parts : []).filter(
    (part) => part === 'loaded' || part === 'empty',
  );
  if (!list.length) return null;
  if (list.length === 1) return `${LEG_LABEL[list[0]]} distance not measured`;
  return 'Loaded and empty distance not measured';
}
