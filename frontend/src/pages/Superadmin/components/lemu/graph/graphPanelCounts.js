/* Pure count derivations for the graph rail and filter panels (Tasks 8/9).

   Every count these panels show must describe the WHOLE active-layer graph,
   not the filtered subset — a filter's job is to show what it is hiding, so
   the numbers cannot move as kinds/states are switched off. All functions
   here are pure over their inputs. */

export const GRAPH_STATES = ['measured', 'declared', 'unreachable'];

/* The design's number format (line ~468): en-US grouping, em dash for
   "no value" — never a fabricated zero. */
export const nf = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

/* Nodes that carry no `state` (the CODE layer has none today) are not
   counted in any bucket — absence is not evidence of measurement. */
export const countByState = (nodes) => {
  const c = { measured: 0, declared: 0, unreachable: 0 };
  (nodes || []).forEach((n) => {
    if (Object.prototype.hasOwnProperty.call(c, n.state)) c[n.state] += 1;
  });
  return c;
};

export const countByKind = (nodes) => {
  const c = {};
  (nodes || []).forEach((n) => { c[n.kind] = (c[n.kind] || 0) + 1; });
  return c;
};

/* Query-hit count for the rail's live `N hits` label. Matches the canvas
   match semantics (case-insensitive id substring) but ignores the
   state-dimming and live-path overlays — the label answers "how many nodes
   match the text", nothing else. */
export const countQueryMatches = (nodes, query) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return 0;
  return (nodes || []).filter((n) => n.id.toLowerCase().includes(q)).length;
};
