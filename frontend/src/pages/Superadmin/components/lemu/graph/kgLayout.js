/* Force simulation and collision, ported from the design's physics() and
   collide() (Knowledge Graph.dc.html, lines ~926 and ~973). These constants
   are tuned — do not round or "improve" them.

   The infra layer is pinned to columns: fx is forced to 0 in the charge pass
   and each step pulls x toward the node's precomputed `tx`
   (`x += (tx - x) * 0.18`, vx zeroed), so the board reads as a left-to-right
   pipeline instead of a hairball. The code layer is free on all axes.

   Both functions are pure over their inputs: they mutate the node objects'
   x/y/z/vx/vy/vz and nothing else. No DOM, no time source. `step` takes the
   current alpha in opts and returns the decayed alpha for the next step. */

/** Infra column targets from the plan (Task 3). `store` is 2.0 on the mongo
    side and 4.3 on the clickhouse side; hosts are not simulated (r = 0) but
    carry a column for placement. tx = (col - 3.0) * 178. */
export const INFRA_COLUMN = {
  source: 0,
  job: 1.1,
  store: 2.0,
  storeClickhouse: 4.3,
  collection: 2.75,
  pipe: 3.7,
  table: 4.95,
  surface: 6.1,
  hostApp: 1.1,
  hostMongo: 2.4,
  hostClickhouse: 4.6,
};

/** Infra x-axis pin target: (col - 3.0) * 178. */
export const columnTarget = (col) => (col - 3.0) * 178;

/** Infra node radius: max(7, min(17, 7 + pow(rows || 1, 0.16) * 1.55)).
    Hosts are not simulated — the design gives them r = 0. */
export const infraRadius = (rows) => Math.max(7, Math.min(17, 7 + Math.pow(rows || 1, 0.16) * 1.55));

/** Code-layer node radius: max(3.2, min(13, 3 + pow(size, 0.34) * 0.62)).
    `size` is modules[].totalLoc per plan §0 C5 — never functions[].loc.
    An absent size behaves as 1 (the same `|| 1` discipline as infraRadius):
    models/jobs/mounts carry no totalLoc on the real payload, and a NaN
    radius poisons collide()'s separation pass — absence must never NaN
    the layout. */
export const codeRadius = (size) => Math.max(3.2, Math.min(13, 3 + Math.pow(size || 1, 0.34) * 0.62));

const byId = (nodes) => {
  const m = new Map();
  for (const n of nodes) m.set(n.id, n);
  return m;
};

/* Deterministic spread for a node that arrives without a usable position
   (a fresh object the identity cache has never seen, or coordinates a
   previous run corrupted). Same string-hash discipline as the canvas
   shell's first-paint seed. NaN is contagious — one non-finite coordinate
   corrupts every force pass it touches — so step() self-seeds before it
   integrates and the invariant "after one step every position is finite"
   holds for any caller. */
const hashOf = (id) => {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const ensurePositions = (nodes, infra) => {
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i];
    const h = hashOf(p.id);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      if (infra) {
        p.x = Number.isFinite(p.tx) ? p.tx : 0;
        p.y = ((h % 1000) / 1000 - 0.5) * 520;
      } else {
        const a = (h % 6283) / 1000;
        const rr = 120 + (h % 380);
        p.x = Math.cos(a) * rr;
        p.y = Math.sin(a) * rr * 0.75;
      }
    }
    if (!Number.isFinite(p.z)) p.z = (((h >> 10) % 1000) / 1000 - 0.5) * (infra ? 160 : 420);
    if (!Number.isFinite(p.vx)) p.vx = 0;
    if (!Number.isFinite(p.vy)) p.vy = 0;
    if (!Number.isFinite(p.vz)) p.vz = 0;
  }
};

/** One force-simulation step, ported from physics(). Mutates node x/y/z and
    vx/vy/vz. Returns the decayed alpha (alpha * 0.978) for the next step;
    callers stop when alpha < 0.004. Below that threshold this is a no-op
    and returns the alpha unchanged.

    opts: { layer: 'infra' | 'code', is3d?: boolean, alpha: number }
    links: [{ s: nodeId, t: nodeId }] — endpoints are node ids, as in the
    design's link objects. */
export const step = (nodes, links, opts) => {
  const infra = opts.layer === 'infra';
  const is3 = !!opts.is3d;
  ensurePositions(nodes, infra);
  const a = opts.alpha;
  if (a < 0.004) return a;
  const n0 = nodes.length;
  const charge = infra ? 5200 : (n0 > 200 ? 2600 : 4200);

  for (let i = 0; i < n0; i++) {
    const p = nodes[i];
    for (let j = i + 1; j < n0; j++) {
      const q = nodes[j];
      const dx = q.x - p.x, dy = q.y - p.y, dz = is3 ? q.z - p.z : 0;
      let d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > 320000 || d2 === 0) continue;
      if (d2 < 25) d2 = 25;
      const d = Math.sqrt(d2), f = charge / d2 * a / d;
      let fx = dx * f; const fy = dy * f, fz = dz * f;
      if (infra) fx = 0;
      p.vx -= fx; p.vy -= fy; q.vx += fx; q.vy += fy;
      if (is3) { p.vz -= fz; q.vz += fz; }
    }
  }

  const ids = byId(nodes);
  const L = links || [];
  for (let i = 0; i < L.length; i++) {
    const p = ids.get(L[i].s), q = ids.get(L[i].t);
    if (!p || !q) continue;
    const dist = infra ? 40 : 46;
    const dx = q.x - p.x, dy = q.y - p.y, dz = is3 ? q.z - p.z : 0;
    const d = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz));
    const f = (d - dist) / d * a * (infra ? 0.3 : 0.42);
    if (!infra) { p.vx += dx * f * 0.5; q.vx -= dx * f * 0.5; }
    p.vy += dy * f * 0.5; q.vy -= dy * f * 0.5;
    if (is3) { p.vz += dz * f * 0.5; q.vz -= dz * f * 0.5; }
  }

  for (let i = 0; i < n0; i++) {
    const p = nodes[i];
    if (infra) { p.vy += (0 - p.y) * 0.012 * a * 4; }
    else {
      p.vx += -p.x * 0.0055 * a * 3;
      p.vy += -p.y * 0.0075 * a * 3;
      if (is3) p.vz += -p.z * 0.004 * a * 3;
    }
    if (!is3) p.z += (0 - p.z) * 0.08;
    if (p.fixed) { p.vx = 0; p.vy = 0; p.vz = 0; continue; }
    p.vx *= 0.78; p.vy *= 0.78; p.vz *= 0.78;
    if (infra) { p.x += ((p.tx || 0) - p.x) * 0.18; p.vx = 0; }
    else p.x += Math.max(-14, Math.min(14, p.vx));
    p.y += Math.max(-14, Math.min(14, p.vy));
    if (is3) p.z += Math.max(-14, Math.min(14, p.vz));
  }

  return a * 0.978;
};

/** Collision pass, ported from collide(). Mutates node x/y. Infra separates
    on y only (nodes ride their column); the code layer pushes on x and y.
    Spatial hash grid with cell size (maxR + pad) * 2.2.

    opts: { layer: 'infra' | 'code' } */
export const collide = (nodes, opts) => {
  if (nodes.length < 2) return;
  const infra = opts.layer === 'infra';
  const pad = infra ? 11 : 2.2;
  /* A non-finite radius excludes itself from maxR (NaN comparisons are
     false) but would still NaN the per-pair rr below — treat it as 0 for
     the separation math so one bad radius cannot poison the grid. */
  const rOf = (n) => (Number.isFinite(n.r) ? n.r : 0);
  let maxR = 0; for (let i = 0; i < nodes.length; i++) if (nodes[i].r > maxR) maxR = nodes[i].r;
  const cs = (maxR + pad) * 2.2, grid = new Map();
  for (const n of nodes) {
    const k = Math.floor(n.x / cs) + ',' + Math.floor(n.y / cs);
    let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(n);
  }
  for (const n of nodes) {
    const gi = Math.floor(n.x / cs), gj = Math.floor(n.y / cs);
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const a = grid.get((gi + di) + ',' + (gj + dj)); if (!a) continue;
      for (const m of a) {
        if (m === n || m.id < n.id) continue;
        let dx = m.x - n.x, dy = m.y - n.y;
        const rr = rOf(n) + rOf(m) + pad;
        if (infra) {
          if (Math.abs(dx) > rr * 0.8) continue;
          if (dy === 0) dy = (n.id < m.id ? 0.4 : -0.4);
          const need = rr - Math.abs(dy);
          if (need <= 0) continue;
          const s = dy > 0 ? 1 : -1, amt = Math.min(5, need * 0.32);
          if (!n.fixed) n.y -= s * amt;
          if (!m.fixed) m.y += s * amt;
        } else {
          let d = Math.sqrt(dx * dx + dy * dy);
          if (d === 0) { dx = 0.5; dy = 0.3; d = 0.6; }
          if (d >= rr) continue;
          const push = Math.min(4, (rr - d) * 0.34) / d;
          if (!n.fixed) { n.x -= dx * push; n.y -= dy * push; }
          if (!m.fixed) { m.x += dx * push; m.y += dy * push; }
        }
      }
    }
  }
};
