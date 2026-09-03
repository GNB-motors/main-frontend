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

  return byNode;
};
