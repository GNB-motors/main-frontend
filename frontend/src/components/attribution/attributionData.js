/**
 * Attribution card — presentation logic. PURE, so it is testable with vitest and
 * needs no React, no axios and no mocking.
 *
 * The backend has already made every judgement (which part replicates, whether
 * there is enough evidence, whether the profile is independent of the window).
 * Nothing here re-decides anything — it only decides how to SAY it. That split
 * matters: a card that quietly upgraded INSUFFICIENT_DATA into "probably the
 * truck" in the view layer would be the exact green-screen failure this
 * programme is about.
 *
 * The two rules this file enforces:
 *   1. A part that could not be measured is rendered as "not measured", never as
 *      a 0%. Showing 0% would read as "we checked the road and it was fine".
 *   2. The learned thresholds and their history are always visible. A verdict the
 *      owner cannot audit is not a verdict.
 */

export const STATUS = Object.freeze({
  ATTRIBUTED: 'ATTRIBUTED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  NO_GAP: 'NO_GAP',
  PROFILE_NOT_LEARNED: 'PROFILE_NOT_LEARNED',
  PROFILE_NOT_INDEPENDENT: 'PROFILE_NOT_INDEPENDENT',
});

export const VERDICTS = Object.freeze({
  SUPPORTS: 'SUPPORTS',
  AGAINST: 'AGAINST',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  NOT_MEASURED: 'NOT_MEASURED',
});

/** Severity per verdict, for the dot/icon. Deliberately not a number 0-100. */
export function toneFor(verdict) {
  switch (verdict) {
    case VERDICTS.SUPPORTS:
      return 'caution';
    case VERDICTS.AGAINST:
      return 'ok';
    case VERDICTS.INSUFFICIENT_DATA:
    case VERDICTS.NOT_MEASURED:
      return 'muted';
    default:
      return 'muted';
  }
}

/** Plain-language label. Never an enum, never an ObjectId. */
export function labelForVerdict(verdict) {
  switch (verdict) {
    case VERDICTS.SUPPORTS:
      return 'Points here';
    case VERDICTS.AGAINST:
      return 'Does not point here';
    case VERDICTS.INSUFFICIENT_DATA:
      return 'Not enough evidence';
    case VERDICTS.NOT_MEASURED:
      return 'Not measured';
    default:
      return 'Unknown';
  }
}

/**
 * Format an excess percentage.
 *
 * Returns the em-dash string for null/undefined, and NEVER '0%' — because a
 * null excess means "we could not measure this", which is a different statement
 * from "we measured zero". Collapsing the two is how a card ends up claiming the
 * road was checked when it never was.
 */
export function formatExcess(pct) {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return '—';
  const abs = Math.abs(pct);
  return `${abs.toFixed(1)}% ${pct < 0 ? 'below expected' : 'above expected'}`;
}

/** "3 drivers" / "1 driver" — and never a raw count with no noun. */
export function formatSupport(count, singular, plural) {
  if (!Number.isFinite(count)) return '—';
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * The gap line: what we measured against what we expected.
 * Returns null when there is no gap, so the caller can render nothing rather
 * than a row of dashes.
 */
export function describeGap(gap, metric = 'km_per_l') {
  if (!gap || !Number.isFinite(gap.residualPct)) return null;
  const unit = metric === 'fuel_l' ? 'L' : 'km/L';
  const ours = Number.isFinite(gap.ours) ? `${gap.ours.toFixed(2)} ${unit}` : '—';
  const expected = Number.isFinite(gap.expected) ? `${gap.expected.toFixed(2)} ${unit}` : '—';
  return {
    ours,
    expected,
    residualPct: gap.residualPct,
    headline: `${Math.abs(gap.residualPct).toFixed(1)}% below expected`,
  };
}

/**
 * The provenance line. Every threshold the card used, and where it came from —
 * so the owner can see the card is built on the org's own history rather than a
 * hard-coded rule.
 *
 * Returns null when nothing has been learned, which the card renders as an
 * explicit "not learned yet" rather than hiding.
 */
export function describeLearned(learned) {
  if (!learned) return null;
  const {
    bandAbsResidualPct,
    minDistinctDrivers,
    minDistinctVehicles,
    minDaysPerGroup,
    samples,
    learnedUpTo,
  } = learned;
  if (!Number.isFinite(bandAbsResidualPct)) return null;
  const rows = [
    { label: 'A gap counts as a gap past', value: `${bandAbsResidualPct.toFixed(1)}%` },
    {
      label: 'Drivers needed to rule a driver out',
      value: Number.isFinite(minDistinctDrivers) ? String(minDistinctDrivers) : '—',
    },
    {
      label: 'Trucks needed to rule a truck out',
      value: Number.isFinite(minDistinctVehicles) ? String(minDistinctVehicles) : '—',
    },
    {
      label: 'Cycles needed before a pattern counts',
      value: Number.isFinite(minDaysPerGroup) ? String(minDaysPerGroup) : '—',
    },
  ];
  return {
    rows,
    samples: Number.isFinite(samples) ? samples : null,
    learnedUpTo: learnedUpTo ?? null,
    note: 'Learned from this organisation’s own closed cycles, re-measured nightly.',
  };
}

/**
 * Same-span warning. Review class 2/7: evidence and gap measured over different
 * spans compare cleanly and produce a confident wrong number, so when the card
 * knows it is comparing over a shorter span it says so.
 */
export function describeCoverage(card) {
  if (!card) return null;
  if (card.sameSpan === null || card.sameSpan === undefined) return null;
  if (card.sameSpan) return null;
  const days = Number.isFinite(card.uncovered) ? card.uncovered : null;
  if (!days) return null;
  return {
    tone: 'muted',
    text: `Evidence covers ${days} day(s) less than the window asked for. The rest is not counted, not assumed.`,
  };
}

/**
 * Build the whole view-model in one pure call. Kept as a single function so a
 * test can assert the card never shows a number it should not.
 */
export function buildAttributionView(card) {
  if (!card) {
    return {
      status: null,
      headline: 'No attribution card for this yet.',
      tone: 'muted',
      gap: null,
      parts: [],
      learned: null,
      coverage: null,
      overAttributed: false,
    };
  }

  const parts = (card.parts ?? []).map((p) => ({
    key: p.key,
    label: p.label,
    verdict: p.verdict,
    tone: toneFor(p.verdict),
    verdictLabel: labelForVerdict(p.verdict),
    support: Number.isFinite(p.support) ? p.support : null,
    observedGroups: Number.isFinite(p.observedGroups) ? p.observedGroups : null,
    excessText: formatExcess(p.excessPct),
    measured: Number.isFinite(p.excessPct),
    why: p.why ?? '',
    dataPoints: Array.isArray(p.dataPoints) ? p.dataPoints : [],
    cusum: p.cusum ?? null,
    // Carried through explicitly: over-attribution is the card saying the parts
    // OVERLAP and the split is not an apportionment. Dropping it here would hide
    // the one caveat that stops a reader treating the four parts as a pie chart.
    overAttributed: Boolean(p.overAttributed),
    overAttributedPct: Number.isFinite(p.overAttributedPct) ? p.overAttributedPct : null,
  }));

  const unexplained = parts.find((p) => p.key === 'UNEXPLAINED');

  return {
    status: card.status ?? null,
    headline: card.headline ?? '',
    tone: card.status === STATUS.ATTRIBUTED ? 'caution' : 'muted',
    gap: describeGap(card.gap, card.metric),
    parts,
    learned: describeLearned(card.learned),
    coverage: describeCoverage(card),
    overAttributed: Boolean(unexplained?.overAttributed),
  };
}

/** Can this card be drawn at all, or should the caller show a placeholder? */
export function hasAnythingToShow(card) {
  if (!card) return false;
  if (card.status === STATUS.PROFILE_NOT_LEARNED) return false;
  return Array.isArray(card.parts) && card.parts.length > 0;
}