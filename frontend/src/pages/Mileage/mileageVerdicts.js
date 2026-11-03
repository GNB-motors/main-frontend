/**
 * The words the Mileage page uses for a fuel check.
 *
 * The old page called a bad round "theft" and a good round "clean". Neither
 * word is true of a fuel number: a round either adds up or it does not, and
 * "does not add up" is a measurement, not a verdict on anybody. These labels
 * are the only words a verdict may be spoken in.
 */

/** The five verdicts the contract can return for a truck or for one cycle. */
export const MILEAGE_VERDICTS = {
  ADDS_UP: { label: 'Adds up', tone: 'good' },
  UNEXPLAINED: { label: "Doesn't add up", tone: 'act' },
  LOW_KMPL: { label: 'Low km/L', tone: 'watch' },
  MISSING_BILL: { label: 'Bill missing', tone: 'watch' },
  NOT_ENOUGH_DATA: { label: 'Not enough data', tone: 'info' },
};

/** DEF as a share of diesel. 3–6% is normal for a BS-VI truck. */
export const DEF_BAND = { min: 3, max: 6 };

/**
 * How far below its usual km/L a truck may drift before it is worth a look.
 * A tenth is the line the redesign set: below that, a single fill's reading
 * noise is enough to explain the difference.
 */
export const KMPL_DROP_LIMIT = 0.1;

/** The badge for a cycle that was checked against the oil report. */
export const RECONCILED_COPY = {
  label: 'From your oil report',
  tip: 'These cycles were checked against your oil report (bills) for 14 Sep – 6 Oct.',
};

/** What a DEF percentage means, for the tip beside the column. */
export const DEF_PCT_COPY =
  "BS-VI trucks use about 3–6 litres of DEF per 100 litres of diesel. Much lower can mean DEF isn't being dosed; much higher can mean a leak or wrong reading.";

/**
 * DEF litres are not reported by the truck. They are worked out from the
 * owner's own top-ups, and only after the first one — so this number is
 * learned, and the page says so rather than pretending it was measured.
 */
export const DEF_LEARNED_COPY =
  'DEF litres are worked out from your top-ups after the first one. The truck does not report how much DEF it used, so this is learned, not measured.';

/**
 * The label and tone of a verdict. A verdict we do not recognise is treated
 * as "we cannot tell yet", never as a good or a bad answer.
 */
export function verdictOf(item) {
  return MILEAGE_VERDICTS[item?.verdict] ?? MILEAGE_VERDICTS.NOT_ENOUGH_DATA;
}

/**
 * good when a truck is at or above its usual km/L, act when it is more than
 * a tenth below, and nothing when the two are within a tenth of each other —
 * a truck that is a little under its usual is not a finding.
 */
export function kmPerLTone(kmPerL, usualKmPerL) {
  if (kmPerL == null || usualKmPerL == null || usualKmPerL <= 0) return null;
  if (kmPerL >= usualKmPerL) return 'good';
  if (kmPerL < usualKmPerL * (1 - KMPL_DROP_LIMIT)) return 'act';
  return null;
}

/** watch when DEF use sits outside the 3–6% band; nothing when it sits inside. */
export function defPctTone(defPct, band = DEF_BAND) {
  if (defPct == null) return null;
  const { min, max } = band ?? DEF_BAND;
  if (defPct < min || defPct > max) return 'watch';
  return null;
}

/** "normal 3–6% of diesel" — the caption under a DEF percentage. */
export function defBandCaption(band = DEF_BAND) {
  const { min, max } = band ?? DEF_BAND;
  return `normal ${min}–${max}% of diesel`;
}

/** True when this row was reconciled against the oil report. */
export function isReconciled(item) {
  return item?.source === 'RECONCILED_REGISTER';
}

/**
 * The rows of a contract payload, whichever key the endpoint used. The
 * contract says `items`; the older hubs say `trucks` or `cycles`.
 */
export function rowsOf(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.trucks)) return payload.trucks;
  if (Array.isArray(payload?.cycles)) return payload.cycles;
  return [];
}
