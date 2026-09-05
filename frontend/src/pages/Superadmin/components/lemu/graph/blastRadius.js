/* Blast radius: "what breaks if this changes".

   This is the question introspectEdges was built to answer — its own doc
   comment says so — and until now nothing consumed the edges to answer it.

   Direction matters here, unlike hopFilter: downstream is what depends on
   this node, upstream is what it depends on. Cycles are possible in the CODE
   layer (require graphs have them), so the walk is guarded by a visited set
   rather than assuming a DAG. `endId` handles a layout engine mutating link
   endpoints into node objects once the simulation runs. */
import { endId } from './hopFilter';

const adjacency = (links, reverse) => {
  const adj = new Map();
  (links || []).forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    if (s == null || t == null) return;
    const [from, to] = reverse ? [t, s] : [s, t];
    if (!adj.has(from)) adj.set(from, new Set());
    adj.get(from).add(to);
  });
  return adj;
};

const walk = (links, rootId, reverse) => {
  const out = new Set();
  if (rootId == null) return out;
  const adj = adjacency(links, reverse);
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    for (const next of adj.get(id) || []) {
      if (out.has(next) || next === rootId) continue;
      out.add(next);
      stack.push(next);
    }
  }
  return out;
};

export const downstreamOf = (links, rootId) => walk(links, rootId, false);
export const upstreamOf = (links, rootId) => walk(links, rootId, true);
