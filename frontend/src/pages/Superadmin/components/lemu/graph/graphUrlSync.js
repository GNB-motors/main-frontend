/* Graph view-state <-> URL sync (pure).

   LemuGraphTab owns gview/hops/q/mode/layer in the search string and merges
   its writes into whatever else the URL carries (node, tab, findings, ...).
   The merge MUST start from the LIVE location, not a render-captured
   searchParams snapshot: setSearchParams functional updaters receive React
   Router's closed-over snapshot, which can predate a node= write queued in
   the same event (openNode from a canvas click followed by onAutoHop's
   hopDepth change running this sync effect) — the stale echo then clobbers
   the node param and the selection is lost. Reading window.location.search
   at effect time makes the merge race-free. */

export const applyGraphParams = (liveSearch, { view, hopDepth, query, mode, layer }) => {
  const next = new URLSearchParams(liveSearch);
  if (view === 'graph') next.delete('gview');
  else next.set('gview', view);
  if (hopDepth === 2) next.delete('hops');
  else next.set('hops', String(hopDepth));
  if (!query.trim()) next.delete('q');
  else next.set('q', query);
  if (mode === '3d') next.delete('mode');
  else next.set('mode', mode);
  if (layer === 'code') next.delete('layer');
  else next.set('layer', layer);
  return next;
};
