/* "How does this collection reach that page?" — BFS, so the first path found
   is a shortest one. Undirected on purpose: the user is asking about
   connection, not flow direction. `endId` handles force-graph mutating link
   endpoints into node objects once the simulation runs. */
import { endId } from './hopFilter';

export const shortestPath = (links, fromId, toId) => {
  if (fromId == null || toId == null) return [];
  if (fromId === toId) return [fromId];

  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  };
  (links || []).forEach((l) => {
    const s = endId(l.source);
    const t = endId(l.target);
    if (s == null || t == null) return;
    add(s, t);
    add(t, s);
  });

  const prev = new Map([[fromId, null]]);
  const queue = [fromId];
  while (queue.length) {
    const id = queue.shift();
    if (id === toId) {
      const path = [];
      for (let cur = toId; cur != null; cur = prev.get(cur)) path.unshift(cur);
      return path;
    }
    for (const next of adj.get(id) || []) {
      if (prev.has(next)) continue;
      prev.set(next, id);
      queue.push(next);
    }
  }
  return [];
};
