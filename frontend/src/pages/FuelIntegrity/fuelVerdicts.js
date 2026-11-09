/**
 * The words the Fuel Integrity page uses for a fuel check.
 *
 * The old product cried "siphon" at the owner. Most of those were wrong: the
 * old sum trusted the engine's own fuel figure, which under-counts, so a
 * truck parked with the engine off looked like it was losing diesel. These
 * verdicts say what was measured and what was not. None of them accuses.
 */

/**
 * V2 balance verdicts and legacy driving/parked verdicts.
 *
 * `tip` is the sentence behind the badge — the same wording the redesign
 * appendix fixes, so the page and the other features say one thing.
 */
export const FUEL_VERDICTS = {
  REVIEW_LOSS: {
    label: 'Fuel loss to review',
    tone: 'act',
    tip: 'The calibrated fuel balance has unexplained loss above its review threshold. Review the readings; this does not establish when or why the fuel left the tank.',
  },
  CLEAN: {
    label: 'Within review threshold',
    tone: 'good',
    tip: 'The calibrated fuel balance is within its uncertainty and review threshold.',
  },
  INSUFFICIENT_DATA: {
    label: 'Not enough data',
    tone: 'info',
    tip: 'There are not enough usable readings to assess this fuel balance.',
  },
  KEY_CONFLICT: {
    label: 'Vehicle identity needs review',
    tone: 'watch',
    tip: 'Conflicting vehicle identifiers prevent a reliable fuel assessment.',
  },
  EXPLAINED_BY_DRIVING: {
    label: 'Explained by driving',
    tone: 'good',
    tip: 'The diesel used matches the km driven at this truck’s usual km/L.',
  },
  UNEXPLAINED_WHILE_PARKED: {
    label: 'Went down while parked',
    tone: 'act',
    tip: 'Diesel that left the tank while the truck was parked with the engine off. Driving use is not counted here.',
  },
  FILL_MISMATCH: {
    label: "Fill doesn't match bill",
    tone: 'watch',
    tip: 'The bill and the tank do not agree on this fill.',
  },
  NOT_ENOUGH_DATA: {
    label: 'Not enough data',
    tone: 'info',
    tip: 'We do not have enough readings for this window to say anything yet.',
  },
};

/**
 * The state a window is in before the backend has judged it. It is not a
 * verdict and must never be read as one — it says the check has not been
 * made yet, nothing more.
 */
export const NOT_CHECKED = {
  label: 'Not checked yet',
  tone: 'info',
  tip: 'This window has not been checked against the truck’s driving yet.',
};

/**
 * The verdict of one window, with the badge words and the reason.
 * `checked` is false when the backend has not sent a verdict for this window.
 */
export function verdictFor(window) {
  const verdict = FUEL_VERDICTS[window?.verdict];
  if (!verdict) return { ...NOT_CHECKED, key: null, checked: false };
  const why = window?.verdictWhy ?? null;
  return {
    ...verdict,
    key: window.verdict,
    checked: true,
    text: why?.text ?? verdict.tip,
    basis: why?.basis ?? null,
  };
}

/**
 * The diesel that left the tank while the truck was parked, or null when we
 * have not measured it. Null is not zero: an unmeasured drop is unknown.
 */
export function parkedDropL(window) {
  const litres = window?.parkedDropL;
  return typeof litres === 'number' && Number.isFinite(litres) ? litres : null;
}

/**
 * True when this window is the one that went down while parked.
 *
 * Only the verdict counts. The old `siphonSuspected` flag is not a fallback:
 * it was raised from the engine's own burn figure, which under-counts, so it
 * fired on trucks that were simply parked. Until the backend sends the
 * verdict, we cannot tell — and saying so is the honest answer.
 */
export function isParkedDrop(window) {
  return window?.verdict === 'UNEXPLAINED_WHILE_PARKED';
}

export function isV2Window(window) {
  return (
    window?.mathVersion === 'v2' ||
    ['REVIEW_LOSS', 'CLEAN', 'INSUFFICIENT_DATA', 'KEY_CONFLICT'].includes(window?.verdict)
  );
}

export const lossLabelFor = (window) =>
  isV2Window(window) ? 'Fuel loss to review' : 'Fuel down while parked';

export const isReviewLoss = (window) => window?.verdict === 'REVIEW_LOSS' || isParkedDrop(window);

/** V2 adjusted loss, never its threshold or a fabricated parked drop. */
export function reviewLossL(window) {
  if (!isV2Window(window)) return parkedDropL(window);
  if (window?.verdict === 'CLEAN') return 0;
  if (window?.verdict !== 'REVIEW_LOSS') return null;
  const litres = window.reviewLossL ?? window.unaccountedLossL;
  return Number.isFinite(litres) ? Math.max(0, litres) : null;
}

/**
 * "Used 638 L for 1,920 km; this truck usually needs 610 L for that."
 *
 * The old page said "theft suspected" here. This says the same measurement
 * without the accusation, and returns null when a number is missing rather
 * than writing a zero.
 */
export function drivingUseSentence(window) {
  const used = window?.drivingUseL;
  const expected = window?.expectedDrivingUseL;
  const km = window?.km;
  if (used == null || expected == null) return null;
  const usedText = `${Math.round(used)} L`;
  const expectedText = `${Math.round(expected)} L`;
  const kmText = km == null ? null : `${Number(km).toLocaleString('en-IN')} km`;
  if (!kmText) return `Used ${usedText}; this truck usually needs ${expectedText}.`;
  return `Used ${usedText} for ${kmText}; this truck usually needs ${expectedText} for that.`;
}
