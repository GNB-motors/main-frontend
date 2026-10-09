/*
 * Job KPIs (GET /api/lemu/jobs/kpis) — pure display helpers.
 *
 * The backend folds the jobruns history into per-job rates; this module only
 * decides how each number reads: its text and which badge severity it gets.
 * Bands are display cues for the table, not alert thresholds — alerting lives
 * in the backend watchdog.
 */

export const KPI_WINDOWS = [
  { hours: 24, label: 'Last 24h' },
  { hours: 168, label: 'Last 7 days' },
  { hours: 720, label: 'Last 30 days' },
];

export const KPI_SORTS = {
  busy: 'Busiest',
  failures: 'Most failures',
  p95: 'Slowest (p95)',
  adherence: 'Most missed runs',
};

/** 0.9734 → "97.3%"; null/undefined → "—". */
export const formatPct = (x) => {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  return `${Math.round(x * 1000) / 10}%`;
};

/** Milliseconds as a short span: 850ms, 12.4s, 4m 12s, 1h 05m. */
export const formatSpan = (ms) => {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

/** Interval as a cadence label: 60000 → "every 1m". */
export const formatCadence = (ms) =>
  ms ? `every ${formatSpan(ms).replace(/ 00[sm]$/, '')}` : 'on demand';

// Badge severity for a rate where higher is better.
const rateSeverity = (x, warnBelow, errorBelow) => {
  if (x === null || x === undefined) return null;
  if (x < errorBelow) return 'error';
  if (x < warnBelow) return 'warn';
  return 'info';
};

export const successSeverity = (rate) => rateSeverity(rate, 0.99, 0.9);
export const adherenceSeverity = (adh) => rateSeverity(adh, 0.95, 0.8);

/** One job holding the worker for more than a quarter of the window is worth a look. */
export const busySeverity = (share) => {
  if (share === null || share === undefined) return null;
  if (share >= 0.5) return 'error';
  if (share >= 0.25) return 'warn';
  return null;
};

const failuresOf = (j) => (j.failed || 0) + (j.killed || 0);

/** Sorted copy; ties fall back to the job name so the order is stable. */
export const sortKpis = (jobs = [], key = 'busy') => {
  const by =
    {
      busy: (a, b) => (b.busyShare ?? 0) - (a.busyShare ?? 0),
      failures: (a, b) => failuresOf(b) - failuresOf(a),
      p95: (a, b) => (b.p95Ms ?? -1) - (a.p95Ms ?? -1),
      // Unknown adherence (no schedule) sorts last.
      adherence: (a, b) => (a.scheduleAdherence ?? 2) - (b.scheduleAdherence ?? 2),
    }[key] || (() => 0);
  return [...jobs].sort((a, b) => by(a, b) || String(a.job).localeCompare(String(b.job)));
};

/** Header cards from `totals`. */
export const summarizeTotals = (totals) => {
  if (!totals) return null;
  return {
    jobs: totals.jobs ?? 0,
    runs: totals.runs ?? 0,
    successRate: totals.successRate ?? null,
    failures: (totals.failed || 0) + (totals.killed || 0),
    killed: totals.killed || 0,
    // Sum of every job's busy share: > 1 means jobs overlapped in the worker.
    busyShare: totals.busyShare ?? 0,
  };
};
