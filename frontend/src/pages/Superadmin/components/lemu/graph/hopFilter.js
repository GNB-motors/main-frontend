/* Neighbourhood queries over the graph.

   The retired d3-based renderer MUTATED graphData in place, replacing
   link.source/target string ids with node object references once the
   simulation ran. Anything reading
   links must accept both shapes — reading `.id` off a string, or using an
   object as a Map key, silently yields an empty result. */
export const endId = (v) => (v && typeof v === 'object' ? v.id : v);

const adjacency = (links) => {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a).add(b);
  };
  (links || []).forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    if (s == null || t == null) return;
    add(s, t);
    add(t, s); // undirected: "near" is symmetric
  });
  return adj;
};

export const nodesWithinHops = (links, rootId, depth) => {
  const out = new Set();
  if (rootId == null) return out;
  const adj = adjacency(links);
  out.add(rootId);
  let frontier = [rootId];
  for (let d = 0; d < depth; d += 1) {
    const next = [];
    frontier.forEach((id) => {
      (adj.get(id) || new Set()).forEach((n) => {
        if (!out.has(n)) { out.add(n); next.push(n); }
      });
    });
    if (!next.length) break;
    frontier = next;
  }
  return out;
};

export const neighboursOf = (links, rootId) => {
  const s = nodesWithinHops(links, rootId, 1);
  s.delete(rootId);
  return s;
};
