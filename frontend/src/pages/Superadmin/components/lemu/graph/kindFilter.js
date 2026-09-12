import { endId } from './hopFilter';

/** Hide whole kinds. Links are dropped when either endpoint goes. */
export const applyKindFilter = (graph, hiddenKinds) => {
  if (!hiddenKinds || !hiddenKinds.size) return graph;
  const nodes = graph.nodes.filter((n) => !hiddenKinds.has(n.kind));
  const present = new Set(nodes.map((n) => n.id));
  return {
    nodes,
    links: graph.links.filter((l) => present.has(endId(l.source)) && present.has(endId(l.target))),
  };
};
