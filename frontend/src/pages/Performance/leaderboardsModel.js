/**
 * Driver boards — the pure part.
 *
 * The payload behind these boards is deliberately awkward: a value with no
 * rank, an expected value that excludes the row itself, a rank note that says
 * why, and a coverage block that says how little of the window the row
 * actually rests on. Every one of those is shown as it arrives. A missing
 * number is a dash, never a zero, and a row without a rank says why.
 */

/** What we print when a figure was never measured. */
export const DASH = '—';

/** How many decimals each unit is read at. */
const DECIMALS = {
  'km/L': 2,
  '%': 1,
  'per engine-on hour': 2,
  '₹/km': 2,
  '% of lane km': 1,
};

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "4.12 km/L", or a dash when the number was never measured. */
export function formatBoardValue(value, unit) {
  const n = num(value);
  if (n === null) return DASH;
  const decimals = DECIMALS[unit] ?? 2;
  const text = n.toFixed(decimals).replace(/\.?0+$/, '');
  return unit ? `${text} ${unit}` : text;
}

/** "+4.1%" against the duty pool, or a dash when there is no pool to compare to. */
export function formatVsExpected(pct) {
  const n = num(pct);
  if (n === null) return DASH;
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

/** "#3" when the interval allowed a rank, "unranked" when it did not. */
export function rankLabel(row) {
  return row?.rank != null ? `#${row.rank}` : 'unranked';
}

/** The learned floor of a duty group, in words. */
export function floorText(floor) {
  if (!floor) return null;
  const obs = num(floor.minObservations);
  const km = num(floor.minKm);
  if (obs === null && km === null) return null;
  const parts = [];
  if (obs !== null) parts.push(`${obs} observations`);
  if (km !== null) parts.push(`${km.toLocaleString('en-IN')} km`);
  return `this duty group's own median — ${parts.join(' and ')}`;
}

/** What the row's number actually rests on. */
export function coverageText(sample) {
  if (!sample) return null;
  const parts = [];
  if (sample.observedDays != null) parts.push(`${sample.observedDays} observed days`);
  if (sample.windowDays != null) parts.push(`of ${sample.windowDays}`);
  if (sample.coveragePct != null) parts.push(`${sample.coveragePct.toFixed(0)}% covered`);
  if (sample.km != null) parts.push(`${Math.round(sample.km).toLocaleString('en-IN')} km`);
  if (sample.trips != null) parts.push(`${sample.trips} trips`);
  if (sample.cycles) parts.push(`${sample.cycles} cycles`);
  return parts.join(' · ');
}

/** One line per truck the row rests on — the coverage a row is not allowed to skip. */
export function vehicleCoverageRows(row) {
  const list = Array.isArray(row?.vehicleCoverage) ? row.vehicleCoverage : [];
  return list.map((entry) => ({
    vehicleNumber: entry?.vehicleNumber || null,
    dutyGroup: entry?.dutyGroup || null,
    km: num(entry?.km),
    trips: num(entry?.trips),
    observedDays: num(entry?.observedDays),
    biasPct: num(entry?.ecuBillBiasPct),
    biasSamples: num(entry?.ecuBillBiasSamples),
  }));
}

/** The method notes, as the server wrote them. */
export function methodRows(meta) {
  if (!meta) return [];
  const duty = meta.duty || {};
  return [
    { label: 'Duty method', value: duty.method || null },
    { label: 'Duty cut', value: duty.cutKmPerCycle != null ? `${duty.cutKmPerCycle} km per cycle` : null },
    { label: 'Duty rule', value: duty.rule || null },
    { label: 'Ranking rule', value: meta.ranking || null },
    { label: 'Rank rule source', value: meta.rankRuleSource || null },
    { label: 'Bias scope', value: meta.biasScope || null },
    { label: 'Behaviour source', value: meta.behaviourSource || null },
    { label: 'Supersedes', value: meta.supersedes || null },
  ].filter((row) => row.value);
}
