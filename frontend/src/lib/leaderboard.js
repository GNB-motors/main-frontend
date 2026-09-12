/**
 * Leaderboard helpers — pure, unit-tested.
 * A leaderboard always shows BOTH ends: who is best and who is worst at the
 * metric. Hiding the worst end is how overspending fleets stay invisible.
 */

/**
 * Split rows into { best, worst } by metric, sorted so index 0 is the
 * extreme. Rows with a null/undefined/non-finite metric are dropped (absent
 * is not zero — a row that never reported must not rank as "best at 0").
 *
 *   splitLeaderboard(rows, 'margin', { size: 5 })
 */
export function splitLeaderboard(rows, metricKey, { size = 5 } = {}) {
  if (!Array.isArray(rows)) return { best: [], worst: [] };
  const scored = rows
    .map((row, index) => ({ row, index, raw: row?.[metricKey] }))
    .filter((e) => e.raw !== null && e.raw !== undefined && e.raw !== '')
    .map((e) => ({ ...e, value: Number(e.raw) }))
    .filter((e) => Number.isFinite(e.value));
  const best = [...scored].sort((a, b) => b.value - a.value || a.index - b.index).slice(0, size);
  const worst = [...scored].sort((a, b) => a.value - b.value || a.index - b.index).slice(0, size);
  return {
    best: best.map(({ row, value }) => ({ ...row, [metricKey]: value })),
    worst: worst.map(({ row, value }) => ({ ...row, [metricKey]: value })),
  };
}

/** Format a metric value for display. unit: 'currency' | 'number' | 'percent'. */
export function formatMetric(value, unit = 'number') {
  // Number(null) is 0 — absent must not render as a formatted zero.
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (unit === 'currency') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }
  if (unit === 'percent') return `${n.toFixed(1)}%`;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);
}
