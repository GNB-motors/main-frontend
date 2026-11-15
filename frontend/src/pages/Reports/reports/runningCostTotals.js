/**
 * The totals of the running-cost report.
 *
 * A row whose cost was not computed is not ₹0: it is left out of the sum and
 * counted, so the total says how many rows it leaves out instead of quietly
 * becoming a smaller number.
 */
import { sumKnown } from '@/utils/measured';

export const COST_KEYS = [
  'totalCostInr',
  'businessCostInr',
  'nonBusinessCostInr',
  'deviationCostInr',
];

/**
 * The sum of the known rows per cost key, and how many rows each sum leaves
 * out. A sum with nothing known in it is null, so the page prints a dash.
 */
export function runningCostTotals(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const totals = {};
  const unknown = {};
  COST_KEYS.forEach((key) => {
    const { sum, unknown: missing } = sumKnown(list.map((row) => row?.[key]));
    totals[key] = sum;
    unknown[key] = missing;
  });
  return { totals, unknown };
}

/** The CSV cell of a cost: "not costed" for a row that has no cost, the number otherwise. */
export function costCell(value) {
  return value == null ? 'not costed' : value;
}
