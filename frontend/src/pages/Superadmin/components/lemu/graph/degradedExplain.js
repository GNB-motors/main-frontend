/* Plain-language rendering of topology degraded[] entries (r2 feedback: the
   chips read like scary errors — the popover explains what probe/dependency
   failed, what happened, whether a fallback is expected, when it was
   reported, and what it affects).

   Backend shape (systemTopology.service.js — READ, not guessed): every entry
   is { step, reason, affects: string[] }. There is deliberately NO per-entry
   timestamp and no recovery field on the wire; the payload's generatedAt is
   the only real time. If a future backend version adds fields (at, recovery),
   rows appear only when the field exists (§0 C3 — nothing fabricated). */

/* step -> human name of the probe/dependency that could not complete. */
export const DEGRADED_STEP_LABELS = {
  imds: 'Instance identity (IMDS)',
  'redis-probe': 'Redis TCP probe',
  'warehouse-disabled': 'Warehouse (ClickHouse) tier',
  'clickhouse-query': 'ClickHouse liveness query',
  manifest: 'Manifest introspection',
  pulse: 'System pulse bucket',
  liveness: 'Collection & route liveness',
  'warehouse-status': 'Warehouse service status',
  watermarks: 'CDC ingestion watermarks',
  'job-health': 'Job heartbeat health',
};

/* step -> context that turns the raw reason into an explanation. Only the
   entries whose behaviour is documented in the backend source get a specific
   note; everything else gets an honest generic one. */
export const DEGRADED_EXPLAINERS = {
  imds: 'No instance metadata was reachable, so the backend named this host from the OS hostname instead. On machines without IMDS — local dev, docker, bare metal — this fallback is expected, not a fault.',
  'redis-probe': 'Redis has no passive measurement, so the backend opens a bare TCP connection with a 600 ms budget. A timeout or refusal means nothing answered at the configured URL; the Redis node stays declared.',
  'warehouse-disabled': 'The warehouse service reported disabled or unreachable, so the ClickHouse tier is omitted from this topology. The reason above is the service\u2019s own verdict.',
  'clickhouse-query': 'The liveness query for this table failed, so the table keeps its last known state instead of a fresh measurement.',
};

export const GENERIC_EXPLAINER = 'This measurement could not be completed for this payload. The affected nodes keep their last known state — declared or stale, not silently healthy.';

export const degradedTitle = (step) => DEGRADED_STEP_LABELS[step] || step || 'unknown step';

export const degradedExplainer = (step) => DEGRADED_EXPLAINERS[step] || GENERIC_EXPLAINER;

/* Map an affects[] id to the node's label when the payload carries it,
   falling back to the bare id (suffix after the colon) — never invented. */
export const affectName = (id, nodes) => {
  if (!id) return null;
  const n = (nodes || []).find((x) => x.id === id);
  if (n && n.label) return n.label;
  const bare = String(id).replace(/^\w+:/, '');
  return bare || id;
};

/**
 * Rows for the detail popover. Real fields only — a row is omitted when the
 * entry (or payload) lacks the field.
 *
 * @param {object} entry     degraded[] element { step, reason, affects? }
 * @param {object} opts      { nodes?: topology nodes, generatedAt?: payload iso }
 * @returns Array<{ k: string, v: string, mono?: boolean }>
 */
export const degradedDetail = (entry, opts = {}) => {
  if (!entry || typeof entry !== 'object') return [];
  const { nodes = [], generatedAt = null } = opts;
  const rows = [];
  if (entry.step) rows.push({ k: 'probe / dependency', v: degradedTitle(entry.step), mono: true });
  if (entry.reason) rows.push({ k: 'what happened', v: entry.reason });
  if (generatedAt) {
    const abs = new Date(generatedAt);
    if (!Number.isNaN(abs.getTime())) {
      rows.push({ k: 'reported at', v: `${abs.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')}` });
    }
  }
  if (Array.isArray(entry.affects) && entry.affects.length) {
    rows.push({ k: entry.affects.length === 1 ? 'affects' : `affects (${entry.affects.length})`, v: entry.affects.map((a) => affectName(a, nodes)).filter(Boolean).join(', '), mono: true });
  }
  /* Future-proofing, not fabrication: only rendered when the backend emits it. */
  if (entry.recovery) rows.push({ k: 'recovery', v: entry.recovery });
  if (entry.note) rows.push({ k: 'note', v: entry.note });
  if (entry.step) rows.push({ k: 'context', v: degradedExplainer(entry.step) });
  return rows;
};
