const kindOf = (id) => String(id).split(':')[0];

/** Sphere radius driver. Force-graph squares this, so keep the spread modest. */
const sizeFor = (kind, meta) => {
  if (kind === 'module') return 2 + Math.min(6, Math.sqrt((meta?.totalLoc || 0) / 250));
  if (kind === 'model') return 2 + Math.min(5, Math.sqrt((meta?.pathCount || 0) / 4));
  if (kind === 'job') return 3;
  if (kind === 'mount') return 2;
  return 1.5;
};

/* Derives the { nodes, links } graph from the manifest. Routes are deliberately
   NOT nodes by default: there are ~1700 of them and they hang off mounts, so
   including them buries the structure this view exists to show. The showRoutes
   flag opts into that full surface. */
export const buildCodeGraph = ({ manifest, activity, showRoutes }) => {
  if (!manifest) return { nodes: [], links: [] };

  const meta = new Map();
  (manifest.modules || []).forEach((m) => meta.set(`module:${m.name}`, m));
  (manifest.models || []).forEach((m) => meta.set(`model:${m.modelName}`, m));
  (manifest.jobs || []).forEach((j) => meta.set(`job:${j.name}`, j));

  const wanted = new Set();
  const edges = (manifest.edges || []).filter((e) => e && e.from && e.to);
  edges.forEach((e) => {
    wanted.add(e.from);
    wanted.add(e.to);
  });
  // Modules with no edge at all still belong on the map — an orphaned module
  // is exactly the kind of thing this view should make visible.
  (manifest.modules || []).forEach((m) => wanted.add(`module:${m.name}`));

  const links = edges.map((e) => ({ source: e.from, target: e.to, kind: e.kind }));

  if (showRoutes) {
    (manifest.routes || []).forEach((r) => {
      const mount = r.mountPath ? `mount:${r.mountPath}` : null;
      const id = `route:${r.method}:${r.mountPath || ''}${r.path === '/' ? '' : r.path}`;
      wanted.add(id);
      meta.set(id, r);
      if (mount && wanted.has(mount)) links.push({ source: mount, target: id, kind: 'route' });
    });
  }

  const nodes = [...wanted].map((id) => {
    const kind = kindOf(id);
    const m = meta.get(id);
    const live = activity.get(id);
    return {
      id,
      kind,
      label: id.slice(kind.length + 1) || id,
      meta: m,
      val: sizeFor(kind, m),
      live: Boolean(live),
      ops: live?.ops || 0,
      lastSeen: live?.lastSeen || null,
    };
  });

  const present = new Set(nodes.map((n) => n.id));
  return { nodes, links: links.filter((l) => present.has(l.source) && present.has(l.target)) };
};
