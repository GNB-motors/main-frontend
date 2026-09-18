/* Graph preparation for the canvas renderer, extracted from the KgCanvas
   shell: deterministic node seeding, per-layer radius/column shaping, draw
   vs sim edge split, and the particle budget. The renderer (RAF loop,
   projection, draw pass) stays in KgCanvas; everything here is pure so the
   shaping rules are testable without a canvas. */

import { INFRA_COLUMN, columnTarget, infraRadius, codeRadius } from './kgLayout';
import { endId } from './hopFilter';

/* Particle budget, carried over from the old renderer: at most this many
   edges carry particles, the busiest first. */
export const PARTICLE_EDGE_CAP = 200;

/* Structural edge kinds on the infra layer. `hosts` is drawn as the host BOX
   (kgDraw.drawHosts) — drawing the link too would double-encode containment
   (P3). `contains` (store → collection) is implied by the column layout the
   infra sim pins every node to. Both stay in the graph data for analysis
   (blast, hop filter, table); only the canvas draw pass drops them. */
export const STRUCTURAL_LINKS = new Set(['hosts', 'contains']);

/* Deterministic spread for seeded positions (design uses mulberry/rnd; a
   string hash keeps first-paint layout stable across reloads). */
export const hashOf = (id) => {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/* Infra column classification. The design hard-codes mongo vs clickhouse
   columns; the real payload names its stores `store:mongo` / `store:ClickHouse`
   and hosts by instance id, so classify by name and fall back to the app
   column. */
const saysMongo = (n) => `${n.id} ${n.label || ''}`.toLowerCase().includes('mongo');
const saysClickhouse = (n) => `${n.id} ${n.label || ''}`.toLowerCase().includes('clickhouse');

export const hostColumn = (n) => {
  if (saysMongo(n)) return INFRA_COLUMN.hostMongo;
  if (saysClickhouse(n)) return INFRA_COLUMN.hostClickhouse;
  return INFRA_COLUMN.hostApp;
};

export const nodeColumn = (n) => {
  if (n.kind === 'store')
    return saysClickhouse(n) ? INFRA_COLUMN.storeClickhouse : INFRA_COLUMN.store;
  const col = INFRA_COLUMN[n.kind];
  return col == null ? 3.0 : col;
};

/* The design's hover meta line: kind, plus scale when measured, plus the
   honest absence note otherwise. Rows/loc come only from fields that exist —
   nothing plausible-looking is invented (plan §0). */
export const hoverMeta = (n) => {
  const state = n.state || 'measured';
  if (n.ghost || state === 'removed') return `${n.kind} · removed in the compared manifest`;
  if (state === 'measured') {
    const rows = n.metrics && n.metrics.rows;
    const loc = n.meta && n.meta.totalLoc;
    if (rows != null) return `${n.kind} · ${rows} rows`;
    if (loc != null) return `${n.kind} · ${loc} loc`;
    return n.kind;
  }
  if (state === 'declared') return `${n.kind} · no measurement on record`;
  return `${n.kind} · unreachable`;
};

/* Shape a freshly-arrived graph into what the sim and the draw pass consume.

   Node objects come from the tab's identity cache: they are reused by id
   across rebuilds, so the x/y/z the sim writes survive the 30s polls. Nodes
   missing coordinates are seeded deterministically; the infra layer also gets
   its column pin target (tx) and world radius (r), the code layer its
   loc-based radius (plan §0 C5: modules[].totalLoc). A NaN radius is not
   cosmetic: collide()'s rr goes NaN, the separation push poisons x/y for the
   whole board, and the next frame's createLinearGradient throws — hence the
   representative-size fallback for nodes that carry no loc. */
export const prepareSimGraph = ({ graph, layer, mode, prevKey }) => {
  const is3d = mode === '3d';
  const key = `${layer}|${mode}`;
  const layerChanged = prevKey.split('|')[0] !== layer;
  const modeChanged = prevKey.split('|')[1] !== mode;

  const byId = new Map();
  const nodes = graph.nodes.map((n) => {
    if (!n.name) n.name = n.label || n.id;
    if (layer === 'infra') {
      // No per-node row counts on the real payload: infraRadius falls to
      // its floor (~8.6) for everything rather than inventing a size.
      n.r = n.kind === 'host' ? 0 : infraRadius(n.metrics && n.metrics.rows);
      n.tx = columnTarget(n.kind === 'host' ? hostColumn(n) : nodeColumn(n));
    } else {
      /* §0 C5 sizes MODULES by totalLoc. Models/jobs/mounts/routes carry
         no loc on the real payload; they take the design formula at a
         representative size (~350 loc — the middle of the design's
         non-module band) so every radius stays finite. */
      n.r = n.kind === 'module' ? codeRadius(n.meta && n.meta.totalLoc) : codeRadius(350);
      delete n.tx;
    }
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) {
      const h = hashOf(n.id);
      if (layer === 'infra') {
        n.x = n.tx;
        n.y = ((h % 1000) / 1000 - 0.5) * 520;
        n.z = (((h >> 10) % 1000) / 1000 - 0.5) * 160;
      } else {
        const a = (h % 6283) / 1000;
        const rr = 120 + (h % 380);
        n.x = Math.cos(a) * rr;
        n.y = Math.sin(a) * rr * 0.75;
        n.z = (((h >> 10) % 1000) / 1000 - 0.5) * 420;
      }
    } else if (modeChanged && is3d && layer === 'code' && Math.abs(n.z || 0) < 1) {
      // 2D sim damps z to 0 every step; a fresh spread on entering 3D keeps
      // the perspective view from opening perfectly flat.
      const h = hashOf(n.id);
      n.z = (((h >> 10) % 1000) / 1000 - 0.5) * 420;
    }
    n.vx = n.vx || 0;
    n.vy = n.vy || 0;
    n.vz = n.vz || 0;
    byId.set(n.id, n);
    return n;
  });

  const simNodes = [];
  const drawNodes = [];
  const hostById = new Map();
  nodes.forEach((n) => {
    if (n.kind === 'host') hostById.set(n.id, n);
    // Parallel draw entries: the sim keeps WORLD coords on the node objects,
    // kgDraw wants SCREEN coords on the entries it iterates.
    drawNodes.push({
      id: n.id,
      kind: n.kind,
      state: n.state,
      name: n.name,
      r: n.r,
      host: layer === 'infra' && n.kind !== 'host' ? n.hostId || null : null,
      errorCount: n.errorCount,
      x: 0,
      y: 0,
      s: 1,
      d: 0,
      _n: n,
    });
    if (n.kind !== 'host') simNodes.push(n); // hosts are not simulated (design: r = 0)
  });

  const simLinks = [];
  const drawLinks = [];
  graph.links.forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    simLinks.push({ s, t });
    if (layer === 'infra' && STRUCTURAL_LINKS.has(l.kind)) return;
    let traffic = false;
    let w = 0.4;
    let ops = 0;
    if (layer === 'infra') {
      // The CDC spine IS the flow — particles ride every mirrors edge.
      traffic = l.kind === 'mirrors';
      w = 0.8;
    } else {
      const sn = byId.get(s);
      const tn = byId.get(t);
      traffic = Boolean((sn && sn.live) || (tn && tn.live));
      ops = Math.max((sn && sn.ops) || 0, (tn && tn.ops) || 0);
      w = Math.min(1, 0.3 + ops / 50);
    }
    drawLinks.push({ s, t, kind: l.kind, w, traffic, _ops: ops });
  });
  /* Same 200-edge particle budget as the old renderer: busiest first. */
  const traf = drawLinks.filter((l) => l.traffic);
  if (traf.length > PARTICLE_EDGE_CAP) {
    traf.sort((a, b) => b._ops - a._ops);
    traf.slice(PARTICLE_EDGE_CAP).forEach((l) => {
      l.traffic = false;
    });
  }

  const sig = `${key}|${nodes.map((n) => n.id).join(',')}|${graph.links.map((l) => `${endId(l.source)}>${endId(l.target)}`).join(',')}`;

  return {
    key,
    layerChanged,
    modeChanged,
    nodes,
    simNodes,
    drawNodes,
    simLinks,
    drawLinks,
    hostById,
    sig,
  };
};
