/* Upstream trace: "where does this come from?" — the complement of blastRadius.

   BFS over reversed edges, so the first time a node is reached its depth is the
   shortest one (a diamond reports each node once, at its shallowest hop). The
   returned map includes the root at depth 0, matching the design's hopMap —
   the drawer's note derives the ancestor count from map.size - 1. A `cap`
   bounds the depth walked; ancestors beyond it are simply not reported, which
   is also how the parentless "origin" list stays honest: a truncated node that
   has unreached parents is not promoted to origin. Cycles are possible in the
   CODE layer (require graphs have them), so the walk is guarded by the map
   itself rather than assuming a DAG. `endId` handles force-graph mutating link
   endpoints into node objects once the simulation runs. */
import { endId } from './hopFilter';

export const traceUpstream = (nodeId, links, cap = Infinity) => {
  const depthMap = new Map();
  if (nodeId == null) return depthMap;

  const parents = new Map();
  (links || []).forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    if (s == null || t == null) return;
    if (!parents.has(t)) parents.set(t, []);
    parents.get(t).push(s);
  });

  depthMap.set(nodeId, 0);
  let frontier = [nodeId];
  for (let d = 1; d <= cap && frontier.length; d++) {
    const next = [];
    frontier.forEach((id) => {
      (parents.get(id) || []).forEach((p) => {
        if (depthMap.has(p)) return;
        depthMap.set(p, d);
        next.push(p);
      });
    });
    frontier = next;
  }
  return depthMap;
};

/* The drawer's TRACE UPSTREAM summary line, verbatim from the design:
   `N ancestors · D hops deep · origins: a, b, c +k more`, falling back to
   `no origin node reached — this is a root` when no parentless node was
   reached (either the root depends on nothing, or the cap cut the walk short
   before one). Origins are named through `nameOf`, which defaults to the id
   itself — callers with a node table pass (id) => byId[id].name. */
export const upstreamNote = (nodeId, links, cap = Infinity, nameOf = (id) => id) => {
  const depthMap = traceUpstream(nodeId, links, cap);
  const ancestors = depthMap.size - 1;
  let maxDepth = 0;
  depthMap.forEach((d) => {
    if (d > maxDepth) maxDepth = d;
  });

  const hasParents = new Set();
  (links || []).forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    if (s == null || t == null) return;
    hasParents.add(t);
  });
  const origins = [];
  depthMap.forEach((d, id) => {
    if (id !== nodeId && !hasParents.has(id)) origins.push(nameOf(id));
  });

  return (
    `${ancestors} ancestors · ${maxDepth} hop${maxDepth === 1 ? '' : 's'} deep · ` +
    (origins.length
      ? `origins: ${origins.slice(0, 3).join(', ')}${origins.length > 3 ? ` +${origins.length - 3} more` : ''}`
      : 'no origin node reached — this is a root')
  );
};
