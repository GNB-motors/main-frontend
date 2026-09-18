/* Incident rank + urgency weight (I4). The dense graph is the point — an
   unresolved FATAL must be visible ON the canvas, not only in a list. This
   module owns the pure half of that: which error groups are incidents, the
   order they rank in, and how rank maps to visual weight (size, pulse rate,
   halo, centre pull). The draw pass (kgDraw) and the shell (KgCanvas) consume
   the weight; LemuGraphTab computes the rank from the live attribution
   payload.

   Rank order is the brief's, exactly: severity first, then blast radius
   (occurrences — how much the failure has fired), then age (how long it has
   been unresolved). A group that could not be attributed to a node has no
   place on the graph and is not an incident here — the banner (H9) owns the
   unattributed story. */

export const SEVERITY_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4 };

/* Groups from a backend that predates I4 carry no severity; they read as
   ERROR (level 3) so they still rank, but never louder than a real FATAL. */
export const severityLevelOf = (severity) =>
  SEVERITY_LEVELS[String(severity || '').toUpperCase()] ?? SEVERITY_LEVELS.ERROR;

/**
 * Order the attributed, unresolved groups into ranked incidents.
 * @param {Array}  groups  errorAttribution.groups
 * @param {number} now     epoch ms the age is measured against (injectable for tests)
 * @returns {Array} [{ nodeId, fingerprint, severity, severityLevel, occurrences,
 *                    errorName, ageMs }] — severity desc, then occurrences desc,
 *                    then age (longest-unresolved first). Input is not mutated.
 */
export const rankIncidents = (groups = [], now = Date.now()) =>
  groups
    .filter((g) => g && g.nodeId && g.matchQuality !== 'none')
    .map((g) => ({
      nodeId: g.nodeId,
      fingerprint: g.fingerprint || null,
      severity: g.severity || 'ERROR',
      severityLevel: severityLevelOf(g.severity),
      occurrences: g.occurrences || 0,
      errorName: g.errorName || null,
      ageMs: g.firstOccurrence ? Math.max(0, now - new Date(g.firstOccurrence).getTime()) : 0,
    }))
    .sort(
      (a, b) =>
        b.severityLevel - a.severityLevel || b.occurrences - a.occurrences || b.ageMs - a.ageMs,
    );

/**
 * Rank → visual weight. Rank 0 is literally the loudest thing on screen;
 * every channel decays monotonically so a worse incident can never render
 * quieter than a milder one.
 *   scale   — radius multiplier on top of the node's own radius
 *   pulseHz — pulse frequency of the red treatment (per second)
 *   halo    — halo ring multiplier (draw pass applies a screen-space floor
 *             so the halo survives full zoom-out regardless of this value)
 *   pull    — fraction of the way toward the viewport centre the node is
 *             drawn (0 = its laid-out position, 1 = dead centre)
 */
export const urgencyForRank = (rank) => {
  const r = Math.max(0, Number(rank) || 0);
  return {
    scale: 2.2 / (1 + r * 0.35),
    pulseHz: Math.max(0.6, 1.6 / (1 + r * 0.4)),
    halo: 1 - Math.min(0.5, r * 0.08),
    pull: Math.max(0, 0.28 - r * 0.04),
  };
};

/**
 * Node id → urgency record for the draw pass and the shell: the weight plus
 * the rank and the incident itself (rows in the companion list read from the
 * same objects, so list and canvas can never disagree). One entry per node:
 * a node's worst incident wins.
 */
export const urgencyByNode = (incidents = []) => {
  const map = new Map();
  incidents.forEach((incident, rank) => {
    if (!incident.nodeId || map.has(incident.nodeId)) return;
    map.set(incident.nodeId, { ...urgencyForRank(rank), rank, incident });
  });
  return map;
};

/**
 * Pull a screen point toward the viewport centre. Pure; the shell applies it
 * AFTER projection so picking, labels and the draw pass all see the same
 * position. pull comes from urgencyForRank (0..~0.28).
 */
export const pullTowardCentre = (x, y, pull, width, height) => ({
  x: x + (width / 2 - x) * pull,
  y: y + (height / 2 - y) * pull,
});

/* ---------- incident list formatting (companion panel, I4) ---------- */

const AGE_MIN = 60 * 1000;
const AGE_HOUR = 60 * AGE_MIN;
const AGE_DAY = 24 * AGE_HOUR;

/* "Unresolved for how long?" — the age half of the rank, rendered for the
   companion list rows and their tooltips. */
export const formatIncidentAge = (ageMs) => {
  if (!Number.isFinite(ageMs) || ageMs < AGE_MIN) return '<1m';
  if (ageMs < AGE_HOUR) return `${Math.floor(ageMs / AGE_MIN)}m`;
  if (ageMs < AGE_DAY) return `${Math.floor(ageMs / AGE_HOUR)}h`;
  return `${Math.floor(ageMs / AGE_DAY)}d`;
};
