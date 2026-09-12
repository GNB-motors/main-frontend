/* INFRA layer transform: the /api/lemu/topology payload -> graph shape
   ({ nodes, links } with string link endpoints).

   Node `state` is carried through untouched — it is what drives the ring
   treatment in graphTheme (solid = measured, hollow = declared, fault =
   unreachable). A hollow node must look empty on purpose: fifteen hollow
   ClickHouse tables would have been visible from across the room during the
   weeks the reconciliation was silently broken. */
const SIZE = { host: 8, store: 6, table: 4, collection: 4, pipe: 5, job: 3, source: 5, surface: 3 };

export const buildTopologyGraph = (topology) => {
  if (!topology || !Array.isArray(topology.nodes)) return { nodes: [], links: [] };
  const nodes = topology.nodes.map((n) => ({ ...n, val: SIZE[n.kind] || 3 }));
  const present = new Set(nodes.map((n) => n.id));
  const links = (topology.edges || [])
    .filter((e) => e && present.has(e.from) && present.has(e.to))
    .map((e) => ({ source: e.from, target: e.to, kind: e.kind }));
  return { nodes, links };
};
