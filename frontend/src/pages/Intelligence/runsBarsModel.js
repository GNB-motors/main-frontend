/**
 * The kilometre bars of Intelligence → Runs.
 *
 * A leg that could not be measured stays unknown: it is never added to a sum
 * as 0 km. A truck keeps the kilometres that were measured and is marked
 * `partial`, so the page can say that part of the distance is unknown instead
 * of inventing a distance.
 */
import { sumKnown, toMeasured } from '@/utils/measured';
import { classifyTrip } from './intelligenceModel';

/**
 * The km of one trip, split by leg.
 *
 * `km.laden` is the trip out (plant → customer, or plant → plant for a
 * reposition) and `km.return` is the way back to the plant, which is empty
 * running whenever it happens. A leg that does not apply to the kind of the
 * trip is a true 0; a leg that was not measured stays null.
 */
export function tripKmParts(trip) {
  const km = trip?.km ?? {};
  const laden = toMeasured(km.laden);
  // The empty running is the approach to the pickup and the way back: the
  // server counts both, and only the legs it measured.
  const empty = sumKnown([km.approach, km.return]).sum;
  const kind = classifyTrip(trip);
  if (kind === 'reposition') return { loadedKm: 0, emptyKm: empty, repositionKm: laden };
  if (kind === 'empty') return { loadedKm: 0, emptyKm: empty, repositionKm: 0 };
  return { loadedKm: laden, emptyKm: empty, repositionKm: 0 };
}

/** The known kilometres of one leg, added to what that leg already has. */
const addPart = (known, value) => (value == null ? known : (known ?? 0) + value);

/**
 * The legs of a trip kind that can carry km. The other legs are true zeros —
 * a plant-to-plant run has no loaded km — so they never make a truck's
 * distance "known".
 */
function applicableLegs(kind) {
  if (kind === 'reposition') return ['emptyKm', 'repositionKm'];
  if (kind === 'empty') return ['emptyKm'];
  return ['loadedKm', 'emptyKm'];
}

/**
 * The classified distance of the period: loaded + empty + plant-to-plant, from
 * the legs that were measured. Null when nothing was measured.
 */
export function classifiedTotal(runs) {
  const known = [runs?.loadedKm, runs?.emptyKm, runs?.repositionKm]
    .map(toMeasured)
    .filter((value) => value != null);
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null;
}

/**
 * The share of the classified driving that carried load, in percent.
 *
 * Null unless the loaded and the empty km were both measured: a share of a
 * distance we do not know is not a share, and "100% carried load" would be a
 * claim about a return leg nobody measured.
 */
export function loadedShare(runs) {
  const loaded = toMeasured(runs?.loadedKm);
  const empty = toMeasured(runs?.emptyKm);
  if (loaded == null || empty == null) return null;
  const total = classifiedTotal(runs);
  return total != null && total > 0 ? (loaded / total) * 100 : null;
}

/** "1 truck has unknown km." — null when no truck is missing its distance. */
export function unknownKmTruckNote(count) {
  if (!Number.isFinite(count) || count <= 0) return null;
  return `${count} ${count === 1 ? 'truck has' : 'trucks have'} unknown km.`;
}

/**
 * The per-truck km of the period: the top trucks by distance, each split into
 * loaded, empty and plant-to-plant km.
 *
 * Only measured kilometres are summed. A truck with an unmeasured leg keeps
 * the km that were measured (`partial: true`) and a truck with nothing
 * measured has no km at all (`totalKm: null`), so the page can print a dash.
 */
export function runBarsByTruck(trips = [], { limit = 20 } = {}) {
  const byTruck = new Map();
  const knownKm = new Set();
  trips.forEach((trip) => {
    const registration = trip?.registrationNumber;
    if (!registration) return;
    const kind = classifyTrip(trip);
    const parts = tripKmParts(trip);
    const row = byTruck.get(registration) ?? {
      registrationNumber: registration,
      loadedKm: null,
      emptyKm: null,
      repositionKm: null,
      partial: false,
    };
    row.loadedKm = addPart(row.loadedKm, parts.loadedKm);
    row.emptyKm = addPart(row.emptyKm, parts.emptyKm);
    row.repositionKm = addPart(row.repositionKm, parts.repositionKm);
    if (parts.loadedKm == null || parts.emptyKm == null || parts.repositionKm == null) {
      row.partial = true;
    }
    if (applicableLegs(kind).some((leg) => parts[leg] != null)) knownKm.add(registration);
    byTruck.set(registration, row);
  });

  return [...byTruck.values()]
    .map((row) => {
      const known = [row.loadedKm, row.emptyKm, row.repositionKm].filter((value) => value != null);
      const total = knownKm.has(row.registrationNumber)
        ? known.reduce((sum, value) => sum + value, 0)
        : null;
      return { ...row, totalKm: total };
    })
    .sort(
      (a, b) =>
        (b.totalKm ?? -Infinity) - (a.totalKm ?? -Infinity) ||
        a.registrationNumber.localeCompare(b.registrationNumber),
    )
    .slice(0, limit);
}
