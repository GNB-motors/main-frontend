/**
 * The new fields a fuel cycle can carry, in the report's own words.
 *
 * The new backend adds three things to a cycle: the basis of its km/L
 * (`fullBasis`), the flags that say what was NOT measured, and the tolerance
 * the km gap was judged against (`km.tolerance`).
 *
 * Two rules shape every line here:
 *
 * - None of them may read as "there was no gap". A flag records what was not
 *   measured, never what went wrong.
 * - None of them may accuse the truck or its driver.
 *
 * Every field is optional. The old backend sends none of them, and then the
 * report says nothing new — it never prints "undefined" and never guesses.
 */

/** The flag that says the cycle's two ends were not both full tanks. */
export const FILL_TYPE_FLAG = 'FILL_TYPE_UNKNOWN';

/** The plain words for the flags a fuel cycle can carry. */
export const CYCLE_FLAG_LABEL = {
  FILL_TYPE_UNKNOWN: 'fill type not recorded',
  GAP_NOT_ASSESSED: 'not assessed yet',
  LEDGER_PARTIAL: 'ledger covers part of this cycle',
  GAP_DURING_SILENCE: 'truck silent during this gap',
};

/**
 * The flags of a cycle, minus the fill-type flag.
 *
 * The fill-type flag belongs to the km/L beside it — that cell says why the
 * number is a dash — so the flags list does not say it a second time.
 */
export function cycleGapFlags(flags) {
  return Array.isArray(flags) ? flags.filter((flag) => flag !== FILL_TYPE_FLAG) : [];
}

/** The word for one flag; a flag with no word of its own keeps its code. */
export function cycleFlagLabel(flag) {
  return Object.prototype.hasOwnProperty.call(CYCLE_FLAG_LABEL, flag)
    ? CYCLE_FLAG_LABEL[flag]
    : flag;
}

/** The words for a cycle's flags, in the order the backend sent them. */
export function cycleFlagLabels(flags) {
  return Array.isArray(flags) ? flags.map(cycleFlagLabel) : [];
}

/** True when the cycle carries this flag. */
export function hasCycleFlag(flags, code) {
  return Array.isArray(flags) && flags.includes(code);
}

/**
 * Where the cycle's km/L came from: "from slips" when both ends of the cycle
 * are real fuel slips, "from register rows" when both ends are register rows.
 *
 * Null when the server did not say — the old backend sends no basis at all,
 * and then the report shows nothing rather than guessing.
 */
export function fullBasisText(basis) {
  if (basis === 'SLIP') return 'from slips';
  if (basis === 'REGISTER_MAIN') return 'from register rows';
  return null;
}

/**
 * What the truck's km gap was judged against, in the report's own words:
 * "compared with other LPT 4830 trucks" when the limit was fitted on the
 * truck's own model, "compared with your organisation's trucks" when it was
 * the org's own pooled limit.
 *
 * Null when the server did not say — the old backend has no tolerance at all.
 */
export function toleranceScopeText(tolerance) {
  const scope = tolerance?.scope;
  const modelKey = tolerance?.modelKey;
  if (scope === 'MODEL' || scope === 'POOLED_MODEL') {
    return modelKey ? `compared with other ${modelKey} trucks` : null;
  }
  if (scope === 'ORG') return "compared with your organisation's trucks";
  if (scope === 'POOLED_ORG') return 'compared with trucks from other organisations';
  return null;
}
