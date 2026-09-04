/* Manifest-diff overlay (Phase 5, Task 6): maps a getManifestDiff(version)
   payload onto graph node ids so the canvas can outline what changed.

   Observed computeDiff shape (backend systemIntrospect.service.js, verified
   against the source — do not re-derive):

     {
       routes: {
         added:            [route],                        // full route objects
         removed:          [route],
         middlewareChanged: [{ key: 'GET /path', before: [], after: [] }],
       },
       models: {
         added:            [model],                        // keyed by modelName
         removed:          [model],
         indexChanged:     [{ modelName, before: [idx], after: [idx] }],
       },
       jobs: {
         added:            [job],                          // keyed by name
         removed:          [job],
         uninstrumented:   [job],                         // NOT a change — skipped
       },
       functions: { added: [fn], removed: [fn] },          // no fn nodes — dropped
       modules:  { added: [name string], removed: [name] },
       edges:    { added: [edge], removed: [edge] },       // edge facts, not node
                                                          // marks — dropped
     }

   Semantic note: getManifestDiff(v) is the diff v−1 → v (NOT v → current).
   Overlaying an older version therefore answers "what landed in v", which
   may include nodes that later versions touched again.

   Ids are built with the SAME nodeId helpers the rest of the graph uses
   (utils.js) so marks line up with graph ids exactly. Ids that do not
   resolve to a node in the rendered graph are dropped at render time by
   the tab, not guessed at here. */

import { nodeId } from '../utils';

/** @returns {Map<string, 'added'|'removed'|'changed'>} */
export const overlayFromDiff = (diff) => {
  const marks = new Map();
  if (!diff) return marks;
  const put = (id, mark) => { if (id) marks.set(id, mark); };

  (diff.routes?.added || []).forEach((r) => {
    try { put(nodeId.route(r), 'added'); } catch { /* unshapeable entry — drop */ }
  });
  (diff.routes?.removed || []).forEach((r) => {
    try { put(nodeId.route(r), 'removed'); } catch { /* drop */ }
  });
  (diff.routes?.middlewareChanged || []).forEach((c) => {
    /* key is 'METHOD /path' — split once to rebuild the route object the
       nodeId helper expects; fullRoutePath then handles the mount rules. */
    const sp = (c?.key || '').indexOf(' ');
    if (sp > 0) put(nodeId.route({ method: c.key.slice(0, sp), path: c.key.slice(sp + 1) }), 'changed');
  });

  (diff.models?.added || []).forEach((m) => put(m?.modelName ? nodeId.model(m) : null, 'added'));
  (diff.models?.removed || []).forEach((m) => put(m?.modelName ? nodeId.model(m) : null, 'removed'));
  (diff.models?.indexChanged || []).forEach((c) => put(c?.modelName ? `model:${c.modelName}` : null, 'changed'));

  (diff.jobs?.added || []).forEach((j) => put(j?.name ? nodeId.job(j) : null, 'added'));
  (diff.jobs?.removed || []).forEach((j) => put(j?.name ? nodeId.job(j) : null, 'removed'));

  /* modules diff is plain name strings, not objects */
  (diff.modules?.added || []).forEach((name) => { if (typeof name === 'string') put(`module:${name}`, 'added'); });
  (diff.modules?.removed || []).forEach((name) => { if (typeof name === 'string') put(`module:${name}`, 'removed'); });

  /* functions/edges carry no node meaning on this graph — deliberately dropped */
  return marks;
};

/* Ghost placeholder for a removed node that is absent from the current
   graph. Deliberately metric-free (no ops/live/errorCount): it must never
   read as a measured node (plan Task 6 known-gaps). */
export const ghostNode = (id) => {
  const kind = id.split(':')[0];
  return {
    id,
    kind,
    label: id.slice(kind.length + 1),
    state: 'removed',
    ghost: true,
    val: 3,
  };
};
