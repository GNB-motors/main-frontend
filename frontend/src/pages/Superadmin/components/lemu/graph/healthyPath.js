import { endId } from './hopFilter';

/* Healthy-path highlight (Phase 5): light the nodes that sit on a measured
   data path from an external source to a warehouse table.

   Semantics — a deliberate UNION, not a single directed path: the backend
   topology builder (systemTopology.service.js buildEdges) emits the path in
   TWO disconnected segments —
     reads:    source  -> job        (what the source feeds)
     mirrors:  collection -> pipe:cdc -> table   (what lands in the warehouse)
   with no job -> collection edge between them. A strict "nodes on a directed
   source→table path" intersection would therefore ALWAYS be empty, which
   would light nothing and lie to the operator. The honest approximation is
   the union of:
     - everything forward-reachable from a `source:` node, and
     - everything backward-reachable from a `table:` node,
   both walked over reads|mirrors edges only (hosts/contains/serves edges are
   placement, not data flow), then filtered to `state === 'measured'` so a
   declared-but-unverified seed (a source we have not seen traffic from)
   never lights. Seeds are included in the walk but subject to the same
   measured filter as everything else. */

const FLOW_KINDS = new Set(['reads', 'mirrors']);

export const healthyPathSet = (nodes, links) => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = new Map(); // forward adjacency
  const back = new Map(); // backward adjacency
  links.forEach((l) => {
    if (!FLOW_KINDS.has(l.kind)) return;
    const s = endId(l.source);
    const t = endId(l.target);
    if (!out.has(s)) out.set(s, []);
    out.get(s).push(t);
    if (!back.has(t)) back.set(t, []);
    back.get(t).push(s);
  });

  const reached = new Set();
  const walk = (id, adj) => {
    if (reached.has(id)) return;
    reached.add(id);
    (adj.get(id) || []).forEach((next) => walk(next, adj));
  };
  nodes.forEach((n) => {
    if (n.kind === 'source') walk(n.id, out);
    if (n.kind === 'table') walk(n.id, back);
  });

  const lit = new Set();
  reached.forEach((id) => {
    if (byId.get(id)?.state === 'measured') lit.add(id);
  });
  return lit;
};
