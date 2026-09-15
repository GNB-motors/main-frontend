/* Collision-avoiding label placement, ported from the label pass in the
   design's draw() (Knowledge Graph.dc.html, lines ~1126-1156). Pure: takes
   projected geometry and an injected measureText, returns the labels to draw.
   Nothing is rendered here.

   The pass never drops information to avoid a collision: important nodes
   (selected / hovered / neighbour / search match) always keep their label;
   clash-skipping applies only to the rest. */

import { project } from './kgProject';

/** Label font, verbatim from the design. */
export const LABEL_FONT = "500 10.5px 'IBM Plex Mono', monospace";

/** Labels longer than this are cut at 29 chars + '…'. */
export const LABEL_MAX = 30;

/** Off-screen cull margins: ±80 on x, ±40 on y. */
export const CULL_X = 80, CULL_Y = 40;

/** labelAll thresholds: infra always labels; otherwise every node is labelled
    only while the graph is small or the view is zoomed in. */
export const LABEL_ALL_COUNT = 90, LABEL_ALL_K = 1.6;

/** Non-important nodes smaller than this skip their label. */
export const IMPORTANT_MIN_R = 5.5;

const has = (nb, id) => {
  if (nb == null) return false;
  if (nb instanceof Set) return nb.has(id);
  if (Array.isArray(nb)) return nb.includes(id);
  return !!nb[id];
};

/** The design's matches(): name, file, ns, or kind contains the query. */
const matches = (n, q) => !!q && (
  (n.name || '').toLowerCase().includes(q)
  || (n.file || '').toLowerCase().includes(q)
  || (n.ns || '').toLowerCase().includes(q)
  || (n.kind || '').includes(q)
);

const truncate = (name) => (name.length > LABEL_MAX ? name.slice(0, LABEL_MAX - 1) + '…' : name);

/** Place labels for the visible nodes.

    nodes: [{ id, name, r, x, y, z? }]
    opts: {
      layer: 'infra' | 'code',
      visibleCount: number,       // count feeding the labelAll threshold
      cam: camera,                // passed to project()
      is3d?: boolean,
      width, height: viewport px,
      selId?, hoverId?: node ids,
      neighbours?: Set | array | object of neighbour ids,
      query?: search string,
      measureText: (label) => ({ width }),  // injected for testability
    }

    Returns [{ id, label, alpha, box: [x, y, w, h], text: [x, y] }] in
    priority order. Box is [x - w/2 - 3, y + r + 4, w + 6, 13]; text is drawn
    at [x, y + r + 5.5]. */
export const placeLabels = (nodes, opts) => {
  const { layer, visibleCount, cam, is3d = false, width: W, height: H, measureText } = opts;
  const sel = opts.selId || null, hov = opts.hoverId || null;
  const nb = opts.neighbours;
  const q = (opts.query || '').trim().toLowerCase();

  const labelAll = layer === 'infra' || visibleCount < LABEL_ALL_COUNT || cam.k > LABEL_ALL_K;
  const P = {};
  for (const n of nodes) P[n.id] = project(n, cam, is3d);

  // Priority: selected +3, neighbour +2, hovered +3, r * 0.02 — high first.
  const prio = (n) => (n.id === sel ? 3 : 0) + (has(nb, n.id) ? 2 : 0) + (n.id === hov ? 3 : 0) + n.r * 0.02;
  const cand = nodes.slice().sort((a, b) => prio(b) - prio(a));

  const placed = [];
  const out = [];
  for (const n of cand) {
    const p = P[n.id], r = Math.max(2.2, n.r * cam.k * p.s);
    const important = n.id === sel || n.id === hov || has(nb, n.id) || matches(n, q);
    if (!labelAll && !important) continue;
    if (!important && r < IMPORTANT_MIN_R) continue;
    if (p.x < -CULL_X || p.x > W + CULL_X || p.y < -CULL_Y || p.y > H + CULL_Y) continue;
    const label = truncate(n.name || '');
    const w = measureText(label).width;
    const box = [p.x - w / 2 - 3, p.y + r + 4, w + 6, 13];
    let clash = false;
    for (let i = 0; i < placed.length; i++) {
      const o = placed[i];
      if (box[0] < o[0] + o[2] + 2 && box[0] + box[2] + 2 > o[0] && box[1] < o[1] + o[3] + 1 && box[1] + box[3] + 1 > o[1]) { clash = true; break; }
    }
    if (clash && !important) continue;
    placed.push(box);
    out.push({
      id: n.id,
      label,
      alpha: important ? 1 : (sel ? 0.3 : 0.68),
      box,
      text: [p.x, p.y + r + 5.5],
    });
  }
  return out;
};
