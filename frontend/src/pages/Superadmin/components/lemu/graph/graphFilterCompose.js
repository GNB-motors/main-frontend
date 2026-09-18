/* Filter composition for the graph tab. The visible graph is the full layer
   graph passed through a FIXED pipeline — hidden kinds drop out first, then
   hidden states, then focus-match search (when on), then the hop-depth
   collapse around the selection. Rail and filter-panel counts deliberately
   describe the FULL graph; only this module decides what the canvas and the
   table render. Pure so the order is testable without React. */

import { endId, nodesWithinHops } from './hopFilter';
import { applyKindFilter } from './kindFilter';

export const composeVisible = (graph, filters) => {
  const { hiddenKinds, offStates, focusMatches, matches, selectedNodeId, hopDepth } = filters;
  let g = applyKindFilter(graph, hiddenKinds);
  if (offStates.size) {
    const nodes = g.nodes.filter((n) => !offStates.has(n.state));
    const present = new Set(nodes.map((n) => n.id));
    g = {
      nodes,
      links: g.links.filter((l) => present.has(endId(l.source)) && present.has(endId(l.target))),
    };
  }
  if (focusMatches && matches) {
    const nodes = g.nodes.filter((n) => matches.has(n.id));
    const present = new Set(nodes.map((n) => n.id));
    g = {
      nodes,
      links: g.links.filter((l) => present.has(endId(l.source)) && present.has(endId(l.target))),
    };
  }
  if (!selectedNodeId || hopDepth === 'all') return g;
  const keep = nodesWithinHops(g.links, selectedNodeId, Number(hopDepth));
  return {
    nodes: g.nodes.filter((n) => keep.has(n.id)),
    links: g.links.filter((l) => keep.has(endId(l.source)) && keep.has(endId(l.target))),
  };
};
