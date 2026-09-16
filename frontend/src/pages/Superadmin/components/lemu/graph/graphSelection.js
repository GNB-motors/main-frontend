/* Selection-adjacent graph logic for the tab: the analysis-neighbour set that
   feeds the canvas highlight channel, and the arrow-key neighbour cursor that
   makes repeated presses step around the selected node instead of ping-ponging.
   Pure so both are testable without React. */

import { neighboursOf } from './hopFilter';

/* Blast/path highlights feed the canvas through the neighbour-outline channel
   — the SAME treatment hop highlighting uses (P3). The selected node itself
   never joins the set: null means "nothing to highlight". */
export const analysisNeighbourSet = (blast, pathInfo, selectedNodeId) => {
  const s = new Set();
  if (blast) {
    blast.down.forEach((id) => s.add(id));
    blast.up.forEach((id) => s.add(id));
  }
  (pathInfo || []).forEach((id) => {
    if (id !== selectedNodeId) s.add(id);
  });
  return s.size ? s : null;
};

/* One arrow-key step. The caller keeps the returned cursor in a ref so "next"
   is stable across repeated presses; a null result means "stay put" — either
   there is no selection yet (the caller selects the first visible node) or
   the anchor has no neighbours. */
export const nextNavTarget = (cursor, selectedNodeId, links, dir) => {
  if (!selectedNodeId) return null;
  if (cursor.anchor !== selectedNodeId) {
    const ids = [...neighboursOf(links, selectedNodeId)];
    if (!ids.length) return null;
    const index = dir > 0 ? 0 : ids.length - 1;
    return { cursor: { anchor: selectedNodeId, ids, index }, id: ids[index] };
  }
  const index = (cursor.index + dir + cursor.ids.length) % cursor.ids.length;
  return { cursor: { ...cursor, index }, id: cursor.ids[index] };
};
