/* Which nodes have real traffic in the liveness window.

   THREE independent signals feed this, and all three must actually be read:
   collection liveness (models), route liveness (mounts), job health (jobs).

   Two production realities shape this code — both verified on staging:

   1. Job-health rows are keyed `job`, never `name` (cronGuard.listJobHealth,
      app/utils/cronGuard.js:103). The previous inline code read `j?.name`, so
      NO job ever lit up. Only `ok` and `late` count as live; `healthy` is not
      a real status (the real set: ok | late | stalled | never-ran |
      unmonitored — cronGuard.js:75).

   2. Route-liveness keys are CONCRETE request paths
      ("GET /api/vehicles/507f1f77bcf86cd799439011"), NOT route patterns.
      httpPulseMiddleware is mounted before routes are registered
      (app/app.js:89), so `req.route` is always undefined and the key is always
      `${method} ${req.path}`. Exact-matching manifest patterns against these
      keys can never match. Mounts are therefore resolved by LONGEST mountPath
      PREFIX against the concrete path. */
export const buildActivity = ({ manifest, liveness, jobHealth }) => {
  const byNode = new Map();
  if (!manifest) return byNode;

  const roll = (id, ops, lastSeen) => {
    const prev = byNode.get(id) || { ops: 0, lastSeen: null };
    byNode.set(id, {
      ops: prev.ops + ops,
      lastSeen: !prev.lastSeen || (lastSeen && lastSeen > prev.lastSeen) ? lastSeen : prev.lastSeen,
    });
  };

  const collections = (liveness && liveness.collections) || {};
  (manifest.models || []).forEach((m) => {
    const live = collections[m.collectionName];
    if (live && live.ops) roll(`model:${m.modelName}`, live.ops, live.lastSeen);
  });

  // Longest-prefix mount resolution for concrete route keys (see header note 2).
  const mountsByMethod = new Map();
  (manifest.routes || []).forEach((r) => {
    if (!r.mountPath || !r.method) return;
    if (!mountsByMethod.has(r.method)) mountsByMethod.set(r.method, []);
    mountsByMethod.get(r.method).push(r);
  });

  const routes = (liveness && liveness.routes) || {};
  Object.entries(routes).forEach(([key, live]) => {
    if (!live || !live.n) return;
    const sp = key.indexOf(' ');
    if (sp < 1) return;
    const method = key.slice(0, sp);
    const p = key.slice(sp + 1);
    let best = null;
    (mountsByMethod.get(method) || []).forEach((r) => {
      const m = r.mountPath;
      if (p === m || p.startsWith(`${m}/`)) {
        if (!best || m.length > best.mountPath.length) best = r;
      }
    });
    if (best) roll(`mount:${best.mountPath}`, live.n, live.lastSeen);
  });

  (jobHealth || []).forEach((j) => {
    const name = j && (j.job || j.name);
    if (!name) return;
    if (j.status === 'ok' || j.status === 'late') {
      byNode.set(`job:${name}`, { ops: 1, lastSeen: j.lastOkAt || j.lastRunAt || null });
    }
  });

  /* Modules inherit the traffic of what they own.

     Nothing measures a module directly — the pulse records collections,
     routes and jobs, never "module X". Without this rollup every one of the
     87 module nodes read "no traffic in 24h" forever, which is both wrong and
     the single most misleading thing on the board: modules are the largest
     spheres, so the graph looked overwhelmingly dead while the system was
     busy. A module is live when something it owns is live, so walk the
     manifest's own edges (module -> model / job / mount) and sum. Only
     first-order ownership counts; `require` edges are deliberately excluded,
     or one busy leaf would light up half the graph through the import tree. */
  const OWNS = new Set(['model', 'job', 'mount']);
  (manifest.edges || []).forEach((e) => {
    if (!e || !OWNS.has(e.kind)) return;
    const from = String(e.from || '');
    if (!from.startsWith('module:')) return;
    const child = byNode.get(e.to);
    if (!child || !child.ops) return;
    roll(from, child.ops, child.lastSeen);
  });

  return byNode;
};
