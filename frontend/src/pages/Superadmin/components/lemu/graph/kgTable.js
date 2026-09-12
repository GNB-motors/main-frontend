/* Pure table model for the graph table view (plan Task 11).

   The component (LemuGraphTable) stays thin; everything testable lives here:
   state ordering, scale/evidence derivation, the sort comparator and the
   hop-distance map. No React, no DOM.

   Data honesty (plan §0): every derivation reads a field that exists on the
   real payload and returns null when it does not — the component renders
   '—' for null, never a substitute. */

import { endId } from './hopFilter';

/* Attention sorts to the top: a probe that failed outranks a surface nobody
   measured, which outranks a live row (design stOrder, line ~1365). */
export const STATE_ORDER = { unreachable: 0, declared: 1, measured: 2 };

/* Real state comes from node.state (§0 C2). Code-layer nodes carry no state:
   the manifest scan measured them, so they read 'measured'. Anything else
   (manifest-diff ghosts carry state: 'removed') reads hollow like declared,
   keeping it clear of the measured tier without inventing a state. */
export const rowState = (node) => {
  const s = node?.state;
  if (s === 'unreachable' || s === 'declared' || s === 'measured') return s;
  return s ? 'declared' : 'measured';
};

/* SCALE: real fields only. A measured code module's size is
   modules[].totalLoc (§0 C5). INFRA metrics are heterogeneous
   ({collectionCount}, {ops, fail}, …) — no single scale field exists, so
   infra rows (and non-module code kinds) return null, never a guess. */
export const scaleOf = (node) => {
  if (rowState(node) !== 'measured') return null;
  if (node.kind === 'module' && node.meta && Number.isFinite(node.meta.totalLoc)) {
    return node.meta.totalLoc;
  }
  return null;
};

/* EVIDENCE @: evTs <- evidence.at (§0 C2). Code-layer nodes have no per-node
   evidence; measuredAt (the manifest scan time, manifest.createdAt) is the
   real timestamp of the scan that measured their structure. Returns null
   when there is nothing real to show. */
export const evidenceAt = (node, measuredAt = null) => {
  if (node?.evidence?.at) return node.evidence.at;
  if (!node?.state && measuredAt) return measuredAt;
  return null;
};

/* 'YYYY-MM-DD HH:MM:SS' in UTC — the design's stamp() (line ~470), used for
   EVIDENCE @ and the empty state's last-attempt row. */
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
export const stamp = (iso) => {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} `
    + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

/* BFS hop distances from the selection over the visible links (design hopMap):
   'near' is symmetric, matching hopFilter.adjacency. An empty map means the
   HOP column renders '·' for every row. */
export const hopDistances = (links, rootId) => {
  const out = new Map();
  if (rootId == null) return out;
  const adj = new Map();
  (links || []).forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    if (s == null || t == null) return;
    if (!adj.has(s)) adj.set(s, []);
    if (!adj.has(t)) adj.set(t, []);
    adj.get(s).push(t);
    adj.get(t).push(s);
  });
  out.set(rootId, 0);
  let frontier = [rootId];
  let depth = 0;
  while (frontier.length) {
    depth += 1;
    const next = [];
    frontier.forEach((id) => {
      (adj.get(id) || []).forEach((n) => {
        if (!out.has(n)) { out.set(n, depth); next.push(n); }
      });
    });
    frontier = next;
  }
  return out;
};

/* The design's sort (line ~1366), ported onto real fields. ctx:
   { measuredAt?: string, hops?: Map<nodeId, number> }.
   'hop' sorts reachable nodes by distance; nodes with no distance (no
   selection / not adjacent) sink to the bottom of the ascending order. */
export const compareNodes = (a, b, key, ctx = {}) => {
  switch (key) {
    case 'kind':
      return String(a.kind).localeCompare(String(b.kind));
    case 'state':
      return STATE_ORDER[rowState(a)] - STATE_ORDER[rowState(b)];
    case 'scale':
      return (scaleOf(a) || 0) - (scaleOf(b) || 0);
    case 'err':
      return (a.errorCount || 0) - (b.errorCount || 0);
    case 'ev': {
      const ta = Date.parse(evidenceAt(a, ctx.measuredAt) || '') || 0;
      const tb = Date.parse(evidenceAt(b, ctx.measuredAt) || '') || 0;
      return ta - tb;
    }
    case 'hop': {
      const ha = ctx.hops ? ctx.hops.get(a.id) : undefined;
      const hb = ctx.hops ? ctx.hops.get(b.id) : undefined;
      return (ha ?? Infinity) - (hb ?? Infinity);
    }
    case 'name':
    default:
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
  }
};

export const sortNodes = (nodes, key, dir, ctx = {}) =>
  nodes.slice().sort((a, b) => compareNodes(a, b, key, ctx) * dir);
