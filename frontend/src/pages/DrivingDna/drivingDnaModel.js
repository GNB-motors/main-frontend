export const GRADES = ['A', 'B', 'C', 'D'];
export const GRADE_TONE = { A: 'ok', B: 'info', C: 'warn', D: 'bad' };
const DEFAULT_THRESHOLDS = { a: 85, b: 70, c: 50 };

const known = (value) => value != null && value !== '' && Number.isFinite(Number(value));
const mean = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

/** A sum over the trucks that have the value, and how many of them did. */
function total(rows, key) {
  const present = rows.filter((row) => known(row[key]));
  return {
    value: present.length ? present.reduce((sum, row) => sum + Number(row[key]), 0) : null,
    trucks: present.length,
  };
}

/** A share of readings, counted only over the trucks that sent that kind of reading. */
function share(rows, hitKey, ofKey) {
  const sending = rows.filter((row) => Number(row[ofKey]) > 0);
  const of = sending.reduce((sum, row) => sum + Number(row[ofKey]), 0);
  const hits = sending.reduce((sum, row) => sum + (Number(row[hitKey]) || 0), 0);
  return { pct: of ? (hits / of) * 100 : null, hits, of, trucks: sending.length };
}

/** ok / warn / bad for a 0–100 score, on the same lines as the grades. */
export function scoreTone(score, thresholds = DEFAULT_THRESHOLDS) {
  if (!known(score)) return null;
  if (score >= thresholds.b) return 'ok';
  if (score >= thresholds.c) return 'warn';
  return 'bad';
}

/** "85 and above", "70–84", "50–69", "Below 50". */
export function gradeRange(grade, thresholds = DEFAULT_THRESHOLDS) {
  const { a, b, c } = thresholds;
  return {
    A: `Score ${a} and above`,
    B: `Score ${b}–${a - 1}`,
    C: `Score ${c}–${b - 1}`,
    D: `Score below ${c}`,
  }[grade];
}

const AREAS = [
  { key: 'idleScore', label: 'Idling' },
  { key: 'speedingScore', label: 'Speeding' },
  { key: 'overRevScore', label: 'Over-revving' },
];

/** Everything the page's cards show, read from the profile rows. */
export function summarizeDna(rows) {
  const grades = { A: 0, B: 0, C: 0, D: 0 };
  for (const row of rows) if (grades[row.grade] != null) grades[row.grade] += 1;
  const scored = rows.filter((row) => known(row.drivingScore));
  const areas = AREAS.map((area) => ({
    ...area,
    score: mean(rows.filter((row) => known(row[area.key])).map((row) => row[area.key])),
  })).filter((area) => area.score != null);
  const idleMinutes = total(rows, 'idleExcessMinutes');

  return {
    count: rows.length,
    scored: scored.length,
    avgScore: mean(scored.map((row) => row.drivingScore)),
    grades,
    weakest: areas.sort((a, b) => a.score - b.score)[0] ?? null,
    lowest: scored.sort((a, b) => a.drivingScore - b.drivingScore)[0] ?? null,
    idleHours: idleMinutes.value == null ? null : idleMinutes.value / 60,
    idleTrucks: idleMinutes.trucks,
    idleRupees: total(rows, 'idleRupees'),
    speeding: share(rows, 'overspeedSamples', 'movingSamples'),
    overRev: share(rows, 'overRevSamples', 'canSamples'),
    computedAt:
      rows
        .map((row) => row.computedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
  };
}
