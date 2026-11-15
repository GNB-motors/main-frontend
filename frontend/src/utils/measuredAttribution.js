/**
 * How much of the fleet a fleet figure covers.
 *
 * The new backend sums only the trucks whose value is known, so a fleet
 * number is a partial fleet figure and the reader is told how many trucks it
 * stands for. The old backend sends no attribution at all, so these helpers
 * say nothing for it and the old page stays exactly as it was.
 */
import { coverageNote, toMeasured } from './measured.js';

/** The fleet's truck total, counted from the utilization response's vehicles. */
export function fleetTruckTotal(source) {
  const list = source?.vehicles;
  return Array.isArray(list) ? list.length : null;
}

/**
 * The coverage of a fleet figure: "over 42 of 51 trucks" when the response
 * knows the fleet size, "over 42 trucks" when it does not, and nothing at all
 * when the field is absent.
 */
export function fleetAttribution(fleet, source = null) {
  const trucks = toMeasured(fleet?.trucksAttributed);
  const partial = Boolean(fleet?.kmPartial);
  if (trucks == null) return { trucks: null, note: null, partial };
  const total = fleetTruckTotal(source ?? fleet);
  // A total below the attributed count would read as "more than there are".
  const note =
    total != null && total >= trucks ? coverageNote(trucks, total) : `over ${trucks} trucks`;
  return { trucks, note, partial };
}
