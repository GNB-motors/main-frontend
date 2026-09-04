/* Node and host-chip hit-testing for the canvas shell — the design's pick()
   (Knowledge Graph.dc.html, ~line 883) extracted pure so it can be tested
   without a canvas: reverse iteration, hit radius max(6, r*k*s) + 5,
   nearest wins. */

/** Hit-test a pointer position against drawable nodes.
    nodes: iterable of { id, r } in draw order (later = on top).
    projectOf: (node) => ({ x, y, s? }) in SCREEN coords, or null/undefined
               when the node has no projection this frame.
    Returns the nearest hit node, or null. */
export const pickNode = (nodes, projectOf, mx, my, k) => {
  let best = null, bd = Infinity;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i], p = projectOf(n);
    if (!p) continue;
    const rr = Math.max(6, n.r * k * (p.s == null ? 1 : p.s)) + 5;
    const d = Math.hypot(p.x - mx, p.y - my);
    if (d < rr && d < bd) { bd = d; best = n; }
  }
  return best;
};

/** Hit-test host label chips (returned by kgDraw's drawHosts) before nodes.
    chips: [{ hostId, rect: [x, y, w, h] }], reverse order so the topmost
    chip wins. Returns the hostId or null. */
export const pickHostChip = (chips, mx, my) => {
  for (let i = chips.length - 1; i >= 0; i--) {
    const r = chips[i].rect;
    if (mx >= r[0] && mx <= r[0] + r[2] && my >= r[1] && my <= r[1] + r[3]) return chips[i].hostId;
  }
  return null;
};
