/* The single source of truth for graph colour.

   P3 — one channel, one meaning:
     hue        -> kind        (what this thing is)
     ring       -> state       (whether anything has measured it)
     outline    -> selection
     opacity    -> search match
     pip        -> errors      (a node owns attributed errors)

   The v1 nodeColor() returned a dim grey for search misses, rose for the
   selection, cyan for "live" and otherwise a kind colour — four meanings
   collapsed onto one channel, which is why the board read as noise. Nothing
   here may reintroduce that. */

export const KIND_HUE = {
  // code layer
  module: '#6366f1',
  model: '#14b8a6',
  job: '#f59e0b',
  mount: '#64748b',
  route: '#94a3b8',
  // infra layer (Phase 3)
  host: '#475569',
  store: '#818cf8',
  collection: '#2dd4bf',
  table: '#a78bfa',
  pipe: '#fbbf24',
  source: '#22d3ee',
  surface: '#fb7185',
};

export const KIND_LABEL = {
  module: 'Modules', model: 'Models', job: 'Jobs',
  mount: 'Route mounts', route: 'Routes',
  host: 'Hosts', store: 'Stores', collection: 'Collections',
  table: 'Tables', pipe: 'Pipelines', source: 'Sources', surface: 'Surfaces',
};

export const LINK_COLOR = {
  require: 'rgba(99,102,241,0.35)',
  model: 'rgba(20,184,166,0.45)',
  mount: 'rgba(100,116,139,0.40)',
  job: 'rgba(245,158,11,0.45)',
  route: 'rgba(148,163,184,0.25)',
  reads: 'rgba(34,211,238,0.50)',
  writes: 'rgba(45,212,191,0.50)',
  hosts: 'rgba(71,85,105,0.35)',
  contains: 'rgba(129,140,248,0.30)',
  mirrors: 'rgba(167,139,250,0.55)',
  serves: 'rgba(251,113,133,0.45)',
};

/* Human labels for edge kinds, for the legend. Kept beside LINK_COLOR so
   the colour and its label can never drift apart. */
export const LINK_LABEL = {
  require: 'Requires',
  model: 'Uses model',
  mount: 'Mounts',
  job: 'Runs job',
  route: 'Routes',
  reads: 'Reads',
  writes: 'Writes',
  hosts: 'Hosts',
  contains: 'Contains',
  mirrors: 'Mirrors (CDC)',
  serves: 'Serves',
};

const RING_BY_STATE = { measured: 'solid', declared: 'hollow', unreachable: 'fault' };

/**
 * @param {object} node  { id, kind, state?, errorCount? }
 * @param {object} ctx   { selectedNodeId?, matches?: Set<string>, neighbours?: Set<string> }
 * @returns { color, opacity, ring: 'solid'|'hollow'|'fault', outline: null|'selected'|'neighbour',
 *           pip: null|'errors' }
 */
export const nodeAppearance = (node, ctx = {}) => {
  const { selectedNodeId, matches, neighbours } = ctx;
  const color = KIND_HUE[node.kind] || '#94a3b8';

  let opacity = 1;
  if (matches && matches.size && !matches.has(node.id)) opacity = 0.15;

  let outline = null;
  if (selectedNodeId && node.id === selectedNodeId) outline = 'selected';
  else if (neighbours && neighbours.has(node.id)) outline = 'neighbour';

  // A code-layer node has no `state` field: nothing measures it yet, so it is
  // drawn solid rather than claiming a state it does not have. State arrives
  // with the INFRA layer + Task 8's ring treatment.
  const ring = node.state ? RING_BY_STATE[node.state] || 'hollow' : 'solid';

  // Errors get their own channel, never a hue override (P3): a pip, drawn by
  // the canvas on top of whatever the ring/outline treatment produced.
  const pip = node.errorCount ? 'errors' : null;

  return { color, opacity, ring, outline, pip };
};
