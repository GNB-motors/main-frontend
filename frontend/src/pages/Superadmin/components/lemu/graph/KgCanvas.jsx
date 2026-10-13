/* KgCanvas — the React shell around the raw-canvas knowledge-graph renderer
   (plan Task 7). Replaces the legacy wrapper: it owns the <canvas>,
   the RAF loop, pointer binding, picking and camera state, and calls the pure
   modules for everything else — kgLayout (sim), kgProject (camera),
   kgDraw (draw pass), kgLabels (labels), kgPick (hit-testing).

   The frame loop carries the design's generation guard (window.__kgGen):
   a hot-reloaded or remounted component must not leave a second loop
   running — this repo has been bitten by exactly that class of bug. The
   200ms pump forces a frame when the RAF loop has been dead for 260ms
   (background tab throttling, broken compositors). */

import React, { useRef } from 'react';
import { createCamera } from './kgProject';
import { useKgCamera } from './useKgCamera';
import { useKgFrameLoop } from './useKgFrameLoop';
import { useKgInput } from './useKgInput';

/**
 * Props:
 *   graph        { nodes, links } — the VISIBLE subset (post hop/kind/search),
 *                link endpoints as string ids ({source, target, kind, ...})
 *   layer        'infra' | 'code'
 *   mode         '2d' | '3d' (3D is the design's hand-rolled projection, still
 *                one 2D canvas — no WebGL involved)
 *   theme        'dark' | 'light' (Task 14 wires the switch; default dark)
 *   selectedNodeId, hopDepth  — selection state, owned by the tab
 *   matches      Set<string> | null — search/state-dim/live-path opacity gate
 *   neighbours   Set<string> | null — analysis (blast/path) + hop highlight
 *   urgency      Map<nodeId, {scale, pulseHz, halo, pull, rank}> | null —
 *                incidentRank.urgencyByNode (I4): ranked incidents render
 *                large/pulsing/on-top with a zoom-proof halo, and are pulled
 *                `pull` of the way toward the viewport centre
 *   overlay      Map<nodeId, 'added'|'changed'|'removed'> | null — manifest-diff
 *                marks; owns the outline channel while non-empty (P3)
 *   query        raw search string
 *   focusMatches bool — search-focus mode suspends selection dimming
 *   motion       bool — particles and camera flights
 *   drawerOpen   bool — widens the fitView right pad
 *   onSelect(node, event)      — click-without-move on a node/host chip
 *   onAutoHop(2)               — the hairball cure: hop was 'all' on select
 *   onHover(tip)               — { show, x, y, color, name, meta }
 *   onClearSelection()         — Esc / click empty space
 *   onHopDepth(n | 'all')      — 1–4 / 0 keys
 *   onFocusSearch()            — '/' key
 *   Space (window-level)       — hold to pan on any drag; node-drag suspended
 *   fitRef/focusRef/snapshotRef/instanceRef — published handlers, same
 *                contract as the old canvas wrapper
 */
const KgCanvas = ({
  graph,
  layer = 'code',
  mode = '2d',
  theme = 'dark',
  selectedNodeId = null,
  hopDepth = 'all',
  matches = null,
  neighbours = null,
  urgency = null,
  overlay = null,
  query = '',
  focusMatches = false,
  motion = true,
  drawerOpen = false,
  onSelect,
  onAutoHop,
  onHover,
  onClearSelection,
  onHopDepth,
  onFocusSearch,
  fitRef,
  focusRef,
  snapshotRef,
  instanceRef,
}) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const camRef = useRef(createCamera());
  const flightRef = useRef(null);
  const dimsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const simRef = useRef({ nodes: [], links: [], drawLinks: [], drawNodes: [] });
  const alphaRef = useRef(0);
  const sigRef = useRef('');
  const fittedRef = useRef(false);
  const prevKeyRef = useRef(`${layer}|${mode}`);
  const projOfRef = useRef(new Map());
  const hostByIdRef = useRef(new Map());
  const chipsRef = useRef([]);
  const hoverRef = useRef(null);
  const tipAtRef = useRef({ id: null, x: -1, y: -1 });
  const dragRef = useRef(null);
  const lastRef = useRef(0);
  const loggedRef = useRef(false);

  /* Motion budget: read once. Reduced motion means no particles, no camera
     flights — every camera jump lands instantly. */
  const reducedRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  /* The frame loop must see current props without re-subscribing: refresh a
     ref every render. Everything the loop reads lives here or in the other
     refs; no prop is captured in a closure that outlives it. */
  const propsRef = useRef({});
  propsRef.current = {
    graph,
    layer,
    is3d: mode === '3d',
    theme,
    selectedNodeId,
    hopDepth,
    matches,
    neighbours,
    urgency,
    overlay,
    query,
    focusMatches,
    motion,
    drawerOpen,
    onSelect,
    onAutoHop,
    onHover,
    onClearSelection,
    onHopDepth,
    onFocusSearch,
  };

  const { requestFit, maybeFit } = useKgCamera({
    canvasRef,
    camRef,
    flightRef,
    dimsRef,
    simRef,
    fittedRef,
    projOfRef,
    reducedRef,
    propsRef,
    fitRef,
    focusRef,
    snapshotRef,
    instanceRef,
  });

  useKgFrameLoop({
    graph,
    layer,
    mode,
    wrapRef,
    canvasRef,
    ctxRef,
    camRef,
    flightRef,
    dimsRef,
    simRef,
    alphaRef,
    sigRef,
    fittedRef,
    prevKeyRef,
    projOfRef,
    hostByIdRef,
    chipsRef,
    hoverRef,
    lastRef,
    loggedRef,
    reducedRef,
    propsRef,
    requestFit,
    maybeFit,
  });

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleKeyDown,
  } = useKgInput({
    canvasRef,
    camRef,
    simRef,
    alphaRef,
    projOfRef,
    hostByIdRef,
    chipsRef,
    hoverRef,
    tipAtRef,
    dragRef,
    propsRef,
    requestFit,
  });

  /* No visible nodes → the tab renders the empty state (Task 12); the shell
     renders nothing. Hooks above still ran, so this early return is safe. */
  if (!graph.nodes.length) return null;

  return (
    /* role=img + the counts label: the canvas is a black box to AT, so it
       announces what it is and points at the table view (spec §4.6). */
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- role=img is deliberate (spec §4.6); onKeyDown carries the canvas keyboard shortcuts
    <div
      ref={wrapRef}
      className="lemu-graph3d__canvas"
      role="img"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the canvas must take focus for its keyboard shortcuts; role=img is deliberate (spec §4.6)
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Knowledge graph: ${graph.nodes.length} nodes, ${graph.links.length} edges. Switch to table view for a keyboard-accessible list.`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: 'block', width: '100%', height: '100%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
};

export default KgCanvas;
