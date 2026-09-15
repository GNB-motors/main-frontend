/* Shared formatting helpers for the LEMU observability sections. */

/** "5m ago" / "2h ago" style relative time; '—' for missing values. */
export const relativeTime = (iso) => {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
};

export const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

export const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/* ── Layer 3 shared helpers ─────────────────────────────────────────────── */

/**
 * Full route path. Manifest builders differ: some bake mountPath into path,
 * some keep them split, and some lose the sub-path entirely (path is just the
 * mount root). Join whichever shape arrives without doubling or dropping
 * segments, so the list never shows a dozen identical "GET /api/".
 */
export const fullRoutePath = (route) => {
  const clean = (p) => (p && p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p || '');
  const mount = clean(route.mountPath);
  const path = clean(route.path);
  if (!mount) return path || '/';
  if (!path || path === '/') return mount; // sub-path lost at the source
  if (path === mount || path.startsWith(`${mount}/`)) return path; // mount baked in
  if (mount.startsWith(`${path}/`)) return mount; // path IS the mount root; mount knows more
  return `${mount}${path.startsWith('/') ? '' : '/'}${path}`; // split fields
};

/** Build deep-linkable node IDs. INFRA kinds share the `kind:key` scheme. */
export const nodeId = {
  route: (route) => `route:${route.method}:${fullRoutePath(route)}`,
  model: (model) => `model:${model.modelName}`,
  job: (job) => `job:${job.name}`,
  module: (module) => `module:${module.name}`,
  host: (host) => `host:${host}`,
  store: (store) => `store:${store}`,
  collection: (collection) => `collection:${collection}`,
  table: (table) => `table:${table}`,
  pipe: (pipe) => `pipe:${pipe}`,
  source: (source) => `source:${source}`,
  surface: (surface) => `surface:${surface}`,
};

/** Heat bucket for a pulse count (routes) or summed model ops. */
export const heatFromCount = (n) => {
  if (!n || n <= 0) return 0;
  if (n <= 4) return 1;
  if (n <= 19) return 2;
  if (n <= 49) return 3;
  return 4;
};

/** Pulse key for a route: "GET /api/vehicles/:id". */
export const routePulseKey = (route) => `${route.method} ${fullRoutePath(route)}`;

/** Map a job health status to the silence trio. */
export const jobStatusToTrio = (status) => {
  switch (status) {
    case 'stalled':
      return 'broken';
    case 'late':
      return 'degraded';
    case 'never-ran':
    case 'unmonitored':
      return 'off';
    case 'ok':
    default:
      return 'nothing';
  }
};

/** Given a manifest, return a module name for every route.
 *  Primary: match route.handlerName to functions[].functionName, then read .module.
 *  Fallback: first segment of route.mountPath, or 'core' if mountPath is empty or '/'. */
export const deriveRouteModule = (route, functionsByName) => {
  if (route.handlerName && functionsByName[route.handlerName]) {
    return functionsByName[route.handlerName].module;
  }
  const segment = (route.mountPath || '')
    .replace(/^\//, '')
    .split('/')[0];
  return segment || 'core';
};

/** Format numbers compactly for plate headers. */
export const compactNumber = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
};

