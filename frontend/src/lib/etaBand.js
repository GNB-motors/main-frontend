import dayjs from 'dayjs';

/**
 * Corridor ETA helpers — pure, unit-tested.
 * An ETA is always a BAND with its sample size visible (audit §4): an
 * estimate from 3 trips must never look like one from 200.
 */

/** "Arriving Thu ~2–5 PM" — never a false-precision bare time. */
export function formatBand(p25Hours, p75Hours, now = new Date()) {
  // Number(null) is 0 — absent bounds must not become a real band.
  if (p25Hours === null || p25Hours === undefined || p75Hours === null || p75Hours === undefined) return null;
  const p25 = Number(p25Hours);
  const p75 = Number(p75Hours);
  if (!Number.isFinite(p25) || !Number.isFinite(p75)) return null;
  const a = dayjs(now).add(p25, 'hour');
  const b = dayjs(now).add(p75, 'hour');
  const sameDay = a.format('ddd D MMM') === b.format('ddd D MMM');
  const time = (d) => d.format('h A').replace(' ', ''); // 2PM
  if (sameDay) return `Arriving ${a.format('ddd')} ~${time(a)}–${time(b)}`;
  return `Arriving ${a.format('ddd D MMM')} – ${b.format('ddd D MMM')}`;
}

/** Confidence stated in words with its basis — the sample size is the basis. */
export function confidenceText(sampleSize) {
  const n = Number(sampleSize);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 5) return 'Rough estimate — first few trips on this route.';
  return `Based on ${n} past trip${n === 1 ? '' : 's'} on this corridor.`;
}

/** Distribution line — more useful to a planner than any single number. */
export function distributionText(stats) {
  if (!stats || !Number.isFinite(Number(stats.p25)) || !Number.isFinite(Number(stats.p75))) return null;
  const n = (v) => Math.round(Number(v));
  const worst = Number.isFinite(Number(stats.max)) ? `, worst ${n(stats.max)} h` : '';
  return `Usually ${n(stats.p25)}–${n(stats.p75)} h${worst}.`;
}

/** Delay surfaced against the prediction, not the plan. */
export function delayVsUsual(actualHours, medianHours) {
  if (actualHours === null || actualHours === undefined || medianHours === null || medianHours === undefined) return null;
  const a = Number(actualHours);
  const m = Number(medianHours);
  if (!Number.isFinite(a) || !Number.isFinite(m) || m <= 0) return null;
  const diff = a - m;
  const rounded = Math.abs(Math.round(diff));
  if (rounded < 1) return 'Running at its usual pace.';
  return diff > 0
    ? `Running ~${rounded} h behind its usual pace.`
    : `Running ~${rounded} h ahead of its usual pace.`;
}
