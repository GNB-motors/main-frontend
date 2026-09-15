/* Dead surfaces: things that exist but do nothing.

   Two categories that must NOT be conflated:
     - disabled: a feature flag is off. Working as configured. Shown, not alarmed.
     - dead:     it should be doing something and is not.

   Merging them is how ROUTE_INTELLIGENCE_ENABLED=false hid in plain sight —
   a page running on a feed whose cron never fires, indistinguishable from a
   broken cron. Copy always names the window: absence is a claim about the
   window, never about all time (P4).

   `flags` (v2-C3): there is NO API that exposes job-name -> flag value, and
   inventing one would misreport. The Flags tab renders per-ORG
   featureFlags from /api/admin/organizations, while job-enabling env flags
   (ROUTE_INTELLIGENCE_ENABLED etc.) live only in the backend .env. So
   callers pass {} and disabledJobs stays empty — understates, never
   misreports. Wire a real supplier here when one exists. */
import { endId } from './hopFilter';

export const findDeadSurfaces = ({ nodes = [], links = [], jobHealth = [], flags = {} }) => {
  const inbound = new Set(links.map((l) => endId(l.target)));

  const orphanModules = nodes
    .filter((n) => n.kind === 'module' && !inbound.has(n.id))
    .map((n) => ({ id: n.id, label: n.label, reason: 'no module depends on it' }));

  const idleModels = nodes
    .filter((n) => n.kind === 'model' && !n.ops)
    .map((n) => ({ id: n.id, label: n.label, reason: 'no traffic in 24h' }));

  const quietMounts = nodes
    .filter((n) => n.kind === 'mount' && !n.ops)
    .map((n) => ({ id: n.id, label: n.label, reason: 'no requests in 24h' }));

  const neverRanJobs = [];
  const disabledJobs = [];
  const zeroOutputJobs = [];
  for (const j of jobHealth) {
    const name = j.job || j.name;
    if (!name) continue;
    if (flags[name] === false) {
      disabledJobs.push({ id: `job:${name}`, label: name, reason: 'feature flag is off — not a fault' });
      continue;
    }
    if (j.status === 'never-ran') {
      neverRanJobs.push({ id: `job:${name}`, label: name, reason: 'registered but has never run' });
    }
    const zero = j.consecutiveRunsWithZeroOutput || 0;
    if (zero >= 3) {
      zeroOutputJobs.push({
        id: `job:${name}`,
        label: name,
        reason: `succeeded but wrote 0 rows in ${zero} consecutive runs`,
      });
    }
  }

  /* Severity order — zero-output first (a succeeded job producing nothing is
     the sneakiest failure), flag-disabled deliberately last and muted by the
     panel: it is information, not a fault. */
  return {
    zeroOutputJobs,
    neverRanJobs,
    orphanModules,
    idleModels,
    quietMounts,
    disabledJobs,
  };
};
