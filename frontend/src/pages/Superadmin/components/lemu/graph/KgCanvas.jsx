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

import React, { useCallback, useEffect, useRef } from 'react';
import { createCamera, project, fitView, applyFlight, zoomAt, clampPitch } from './kgProject';
import { step, collide, INFRA_COLUMN, columnTarget, infraRadius, codeRadius } from './kgLayout';
import { draw } from './kgDraw';
import { placeLabels, LABEL_FONT } from './kgLabels';
import { kindHue, canvasTokens } from './graphTheme';
import { endId } from './hopFilter';
import { pickNode, pickHostChip } from './kgPick';
import { shouldCaptureSpace, isSpaceKey, SPACE_PAN_CURSORS } from './spacePan';

/* Particle budget, carried over from the old renderer: at most this many
   edges carry particles, the busiest first. */
const PARTICLE_EDGE_CAP = 200;

/* Structural edge kinds on the infra layer. `hosts` is drawn as the host BOX
   (kgDraw.drawHosts) — drawing the link too would double-encode containment
   (P3). `contains` (store → collection) is implied by the column layout the
   infra sim pins every node to. Both stay in the graph data for analysis
   (blast, hop filter, table); only the canvas draw pass drops them. */
const STRUCTURAL_LINKS = new Set(['hosts', 'contains']);

/* Deterministic spread for seeded positions (design uses mulberry/rnd; a
   string hash keeps first-paint layout stable across reloads). */
const hashOf = (id) => {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/* Infra column classification. The design hard-codes mongo vs clickhouse
   columns; the real payload names its stores `store:mongo` / `store:ClickHouse`
   and hosts by instance id, so classify by name and fall back to the app
   column. */
const saysMongo = (n) => `${n.id} ${n.label || ''}`.toLowerCase().includes('mongo');
const saysClickhouse = (n) => `${n.id} ${n.label || ''}`.toLowerCase().includes('clickhouse');

const hostColumn = (n) => {
  if (saysMongo(n)) return INFRA_COLUMN.hostMongo;
  if (saysClickhouse(n)) return INFRA_COLUMN.hostClickhouse;
  return INFRA_COLUMN.hostApp;
};

const nodeColumn = (n) => {
  if (n.kind === 'store')
    return saysClickhouse(n) ? INFRA_COLUMN.storeClickhouse : INFRA_COLUMN.store;
  const col = INFRA_COLUMN[n.kind];
  return col == null ? 3.0 : col;
};

/* The design's hover meta line: kind, plus scale when measured, plus the
   honest absence note otherwise. Rows/loc come only from fields that exist —
   nothing plausible-looking is invented (plan §0). */
const hoverMeta = (n) => {
  const state = n.state || 'measured';
  if (n.ghost || state === 'removed') return `${n.kind} · removed in the compared manifest`;
  if (state === 'measured') {
    const rows = n.metrics && n.metrics.rows;
    const loc = n.meta && n.meta.totalLoc;
    if (rows != null) return `${n.kind} · ${rows} rows`;
    if (loc != null) return `${n.kind} · ${loc} loc`;
    return n.kind;
  }
  if (state === 'declared') return `${n.kind} · no measurement on record`;
  return `${n.kind} · unreachable`;
};

const HIDE_TIP = { show: false, x: 0, y: 0, color: '#fff', name: '', meta: '' };

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

  const requestFit = useCallback((instant) => {
    const { width: W, height: H } = dimsRef.current;
    const sim = simRef.current;
    const pr = propsRef.current;
    if (!sim.nodes.length || !W) return false;
    const cam = camRef.current;
    const r = fitView(sim.nodes, cam, {
      width: W,
      height: H,
      drawerOpen: pr.drawerOpen,
      is3d: pr.is3d,
      motion: pr.motion,
      reduced: reducedRef.current,
      instant,
      now: performance.now(),
    });
    if (!r) return false;
    if (r.flight) flightRef.current = r.flight;
    else {
      cam.k = r.target.k;
      cam.tx = r.target.tx;
      cam.ty = r.target.ty;
      flightRef.current = null;
    }
    return true;
  }, []);

  /* First fit is gated on knowing the viewport size, which arrives
     asynchronously (ResizeObserver) — possibly AFTER the graph-prep effect
     ran. Both paths call here; whoever finds nodes + dims first wins. */
  const maybeFit = useCallback(
    (instant) => {
      if (fittedRef.current || !simRef.current.nodes.length || !dimsRef.current.width) return;
      fittedRef.current = true;
      requestFit(instant);
    },
    [requestFit],
  );

  /* The Fit button lives one level up; publish the handler the same way the
     old wrapper did. `f` calls the same path from the keyboard handler. */
  useEffect(() => {
    if (fitRef) fitRef.current = () => requestFit(false);
  }, [fitRef, requestFit]);

  /* Camera flight to a node, for the tab's keyboard/table navigation. Same
     discipline as the old wrapper: instant when motion is off or reduced. */
  const flyToNode = useCallback((node) => {
    const { width: W, height: H } = dimsRef.current;
    const cam = camRef.current;
    if (!node || !W || !H) return;
    const k = Math.min(2.6, Math.max(1.2, cam.k));
    const target = { k, tx: W / 2 - (node.x || 0) * k, ty: H / 2 - (node.y || 0) * k };
    if (!propsRef.current.motion || reducedRef.current) {
      cam.k = target.k;
      cam.tx = target.tx;
      cam.ty = target.ty;
      flightRef.current = null;
      return;
    }
    flightRef.current = {
      from: { k: cam.k, tx: cam.tx, ty: cam.ty },
      to: target,
      t0: performance.now(),
      dur: 900,
    };
  }, []);
  useEffect(() => {
    if (focusRef) focusRef.current = flyToNode;
  }, [focusRef, flyToNode]);

  /* Snapshot: the canvas is untainted (no cross-origin content), so toDataURL
     works and an incident-report capture is one <a download> away. */
  const takeSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lemu-graph-${propsRef.current.layer}-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);
  useEffect(() => {
    if (snapshotRef) snapshotRef.current = takeSnapshot;
  }, [snapshotRef, takeSnapshot]);

  /* Probe handle, same contract shape as the old wrapper's instanceRef:
     parents (and the headless probe) reach graph data and coordinates
     without the canvas growing a prop per query. */
  useEffect(() => {
    if (!instanceRef) return undefined;
    instanceRef.current = {
      graph: () => propsRef.current.graph,
      cam: () => camRef.current,
      screenOf: (id) => {
        const p = projOfRef.current.get(id);
        return p ? { x: p.x, y: p.y, s: p.s } : null;
      },
    };
    return () => {
      if (instanceRef.current && instanceRef.current.graph) instanceRef.current = null;
    };
  }, [instanceRef]);

  /* ---------- graph preparation ----------
     Node objects come from the tab's identity cache: they are reused by id
     across rebuilds, so the x/y/z the sim writes survive the 30s polls —
     that is the whole stabilisation story (same approach the old canvas
     relied on, now explicit). New nodes are seeded deterministically; the
     infra layer also gets its column pin target (tx) and world radius (r),
     the code layer its loc-based radius (plan §0 C5: modules[].totalLoc). */
  useEffect(() => {
    const is3d = mode === '3d';
    const key = `${layer}|${mode}`;
    const layerChanged = prevKeyRef.current.split('|')[0] !== layer;
    const modeChanged = prevKeyRef.current.split('|')[1] !== mode;
    prevKeyRef.current = key;

    const byId = new Map();
    const nodes = graph.nodes.map((n) => {
      if (!n.name) n.name = n.label || n.id;
      if (layer === 'infra') {
        // No per-node row counts on the real payload: infraRadius falls to
        // its floor (~8.6) for everything rather than inventing a size.
        n.r = n.kind === 'host' ? 0 : infraRadius(n.metrics && n.metrics.rows);
        n.tx = columnTarget(n.kind === 'host' ? hostColumn(n) : nodeColumn(n));
      } else {
        /* §0 C5 sizes MODULES by totalLoc. Models/jobs/mounts/routes carry
           no loc on the real payload; they take the design formula at a
           representative size (~350 loc — the middle of the design's
           non-module band) so every radius stays finite. A NaN radius here
           is not cosmetic: collide()'s rr goes NaN, the separation push
           poisons x/y for the whole board, and the next frame's
           createLinearGradient throws. */
        n.r = n.kind === 'module' ? codeRadius(n.meta && n.meta.totalLoc) : codeRadius(350);
        delete n.tx;
      }
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) {
        const h = hashOf(n.id);
        if (layer === 'infra') {
          n.x = n.tx;
          n.y = ((h % 1000) / 1000 - 0.5) * 520;
          n.z = (((h >> 10) % 1000) / 1000 - 0.5) * 160;
        } else {
          const a = (h % 6283) / 1000;
          const rr = 120 + (h % 380);
          n.x = Math.cos(a) * rr;
          n.y = Math.sin(a) * rr * 0.75;
          n.z = (((h >> 10) % 1000) / 1000 - 0.5) * 420;
        }
      } else if (modeChanged && is3d && layer === 'code' && Math.abs(n.z || 0) < 1) {
        // 2D sim damps z to 0 every step; a fresh spread on entering 3D keeps
        // the perspective view from opening perfectly flat.
        const h = hashOf(n.id);
        n.z = (((h >> 10) % 1000) / 1000 - 0.5) * 420;
      }
      n.vx = n.vx || 0;
      n.vy = n.vy || 0;
      n.vz = n.vz || 0;
      byId.set(n.id, n);
      return n;
    });

    const simNodes = [];
    const drawNodes = [];
    const hostById = new Map();
    nodes.forEach((n) => {
      if (n.kind === 'host') hostById.set(n.id, n);
      // Parallel draw entries: the sim keeps WORLD coords on the node objects,
      // kgDraw wants SCREEN coords on the entries it iterates.
      drawNodes.push({
        id: n.id,
        kind: n.kind,
        state: n.state,
        name: n.name,
        r: n.r,
        host: layer === 'infra' && n.kind !== 'host' ? n.hostId || null : null,
        errorCount: n.errorCount,
        x: 0,
        y: 0,
        s: 1,
        d: 0,
        _n: n,
      });
      if (n.kind !== 'host') simNodes.push(n); // hosts are not simulated (design: r = 0)
    });
    hostByIdRef.current = hostById;

    const simLinks = [];
    const drawLinks = [];
    graph.links.forEach((l) => {
      const s = endId(l.source),
        t = endId(l.target);
      simLinks.push({ s, t });
      if (layer === 'infra' && STRUCTURAL_LINKS.has(l.kind)) return;
      let traffic = false;
      let w = 0.4;
      let ops = 0;
      if (layer === 'infra') {
        // The CDC spine IS the flow — particles ride every mirrors edge.
        traffic = l.kind === 'mirrors';
        w = 0.8;
      } else {
        const sn = byId.get(s),
          tn = byId.get(t);
        traffic = Boolean((sn && sn.live) || (tn && tn.live));
        ops = Math.max((sn && sn.ops) || 0, (tn && tn.ops) || 0);
        w = Math.min(1, 0.3 + ops / 50);
      }
      drawLinks.push({ s, t, w, traffic, _ops: ops });
    });
    /* Same 200-edge particle budget as the old renderer: busiest first. */
    const traf = drawLinks.filter((l) => l.traffic);
    if (traf.length > PARTICLE_EDGE_CAP) {
      traf.sort((a, b) => b._ops - a._ops);
      traf.slice(PARTICLE_EDGE_CAP).forEach((l) => {
        l.traffic = false;
      });
    }

    const sig = `${key}|${nodes.map((n) => n.id).join(',')}|${graph.links.map((l) => `${endId(l.source)}>${endId(l.target)}`).join(',')}`;
    if (sig !== sigRef.current) {
      sigRef.current = sig;
      alphaRef.current = 1;
    }
    simRef.current = { nodes: simNodes, links: simLinks, drawLinks, drawNodes };

    /* Auto-fit: instantly on first graph load, with a flight on layer switch
       (the design's componentDidMount fitView(true) / syncFilters branch). */
    if (layerChanged) {
      if (simNodes.length && dimsRef.current.width) {
        fittedRef.current = true;
        requestFit(false);
      }
    } else {
      maybeFit(true);
    }
  }, [graph, layer, mode, requestFit, maybeFit]);

  /* ---------- one frame: sim, project, draw, labels ---------- */
  const frame = useCallback(() => {
    const now = performance.now();
    lastRef.current = now;
    const ctx = ctxRef.current;
    const pr = propsRef.current;
    const { width: W, height: H, dpr: d } = dimsRef.current;
    if (!ctx || !W || !H) return;
    const cam = camRef.current;
    const is3d = pr.is3d;
    const sim = simRef.current;

    if (flightRef.current) {
      const r = applyFlight(flightRef.current, now);
      cam.k = r.k;
      cam.tx = r.tx;
      cam.ty = r.ty;
      if (r.done) flightRef.current = null;
    }

    if (alphaRef.current >= 0.004 && sim.nodes.length) {
      alphaRef.current = step(sim.nodes, sim.links, {
        layer: pr.layer,
        is3d,
        alpha: alphaRef.current,
      });
      collide(sim.nodes, { layer: pr.layer });
    }

    const projOf = projOfRef.current;
    for (let i = 0; i < sim.drawNodes.length; i++) {
      const e = sim.drawNodes[i];
      const p = project(e._n, cam, is3d);
      e.x = p.x;
      e.y = p.y;
      e.s = p.s;
      e.d = p.d;
      projOf.set(e.id, p);
    }

    const chips =
      draw(ctx, {
        width: W,
        height: H,
        dpr: d,
        now,
        theme: pr.theme,
        layer: pr.layer,
        k: cam.k,
        mode3d: is3d,
        motion: pr.motion,
        reduced: reducedRef.current,
        focus: pr.focusMatches,
        query: pr.query,
        matches: pr.matches,
        selectedId: pr.selectedNodeId,
        hoverId: hoverRef.current,
        neighbours: pr.neighbours,
        overlay: pr.overlay,
        nodes: sim.drawNodes,
        links: sim.drawLinks,
      }) || [];
    chipsRef.current = chips;

    const labels = placeLabels(sim.nodes, {
      layer: pr.layer,
      visibleCount: sim.nodes.length,
      cam,
      is3d,
      width: W,
      height: H,
      selId: pr.selectedNodeId,
      hoverId: hoverRef.current,
      neighbours: pr.neighbours,
      query: pr.query,
      measureText: (t) => ctx.measureText(t),
    });
    const C = canvasTokens(pr.theme);
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      ctx.globalAlpha = l.alpha;
      ctx.fillStyle = C.labelBg;
      ctx.fillRect(l.box[0], l.box[1], l.box[2], l.box[3]);
      ctx.fillStyle = l.alpha >= 1 ? C.labelOn : C.labelOff;
      ctx.fillText(l.label, l.text[0], l.text[1]);
    }
    ctx.globalAlpha = 1;
  }, []);

  /* ---------- canvas, RAF loop, pump, wheel ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    ctxRef.current = canvas.getContext('2d');

    const gen = (window.__kgGen = (window.__kgGen || 0) + 1);
    let raf = requestAnimationFrame(function loop() {
      if (gen !== window.__kgGen) return; // a newer loop owns the canvas
      try {
        frame();
      } catch (err) {
        if (!loggedRef.current) {
          loggedRef.current = true;
          console.error(err);
        }
      }
      raf = requestAnimationFrame(loop);
    });
    const pump = setInterval(() => {
      if (gen !== window.__kgGen) {
        clearInterval(pump);
        return;
      }
      if (performance.now() - lastRef.current > 260) frame();
    }, 200);

    /* Wheel must be anchored at the cursor AND preventDefault to stop the
       page scrolling — React attaches wheel passively, so bind natively. */
    const onWheel = (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(camRef.current, e.clientX - r.left, e.clientY - r.top, e.deltaY);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(pump);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [frame]);

  /* ---------- sizing ---------- */
  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return undefined;
    const resize = () => {
      const r = el.getBoundingClientRect();
      const W = Math.max(320, r.width);
      const H = Math.max(420, r.height);
      const d = Math.min(2, window.devicePixelRatio || 1);
      dimsRef.current = { width: W, height: H, dpr: d };
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
    };
    resize();
    maybeFit(true);
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
    const ro = new ResizeObserver(() => {
      resize();
      maybeFit(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maybeFit]);

  /* ---------- Space+drag panning (design-tool convention) ----------
     While Space is held, ANY pointer drag pans the camera — node-drag is
     suspended (space-pan wins) — and the canvas shows grab/grabbing. The
     window listeners ignore Space when the event target is interactive
     (inputs, buttons, links, contentEditable) so typing and button
     activation keep working; preventDefault on capture stops the page from
     scrolling on Space. Released (or window blur) restores normal mode. */
  const spaceRef = useRef(false);

  const updateCursor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.cursor = spaceRef.current
      ? dragRef.current
        ? SPACE_PAN_CURSORS.dragging
        : SPACE_PAN_CURSORS.ready
      : '';
  }, []);

  useEffect(() => {
    const down = (e) => {
      if (!isSpaceKey(e.key) || !shouldCaptureSpace(e.target)) return;
      e.preventDefault(); // Space must not scroll the page
      if (e.repeat) return;
      spaceRef.current = true;
      updateCursor();
    };
    const up = (e) => {
      if (!isSpaceKey(e.key)) return;
      if (spaceRef.current) e.preventDefault();
      spaceRef.current = false;
      updateCursor();
    };
    const blur = () => {
      spaceRef.current = false;
      updateCursor();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [updateCursor]);

  /* ---------- pointer ---------- */
  const toLocal = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const pickAt = (mx, my) => {
    const hostId = pickHostChip(chipsRef.current, mx, my);
    if (hostId) return { node: hostByIdRef.current.get(hostId) || null, hostId };
    const n = pickNode(
      simRef.current.nodes,
      (x) => projOfRef.current.get(x.id),
      mx,
      my,
      camRef.current.k,
    );
    return { node: n, hostId: null };
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const [mx, my] = toLocal(e);
    const cam = camRef.current;
    if (spaceRef.current) {
      /* Space-pan wins over node-drag: an empty pan drag, never a click. */
      dragRef.current = {
        space: true,
        n: null,
        hostId: null,
        mx,
        my,
        moved: true,
        shift: e.shiftKey,
        ox: cam.tx,
        oy: cam.ty,
        yaw: cam.yaw,
        pitch: cam.pitch,
      };
      canvasRef.current.setPointerCapture(e.pointerId);
      updateCursor();
      return;
    }
    const { node } = pickAt(mx, my);
    dragRef.current = {
      n: node && node.kind !== 'host' ? node : null,
      hostId: node && node.kind === 'host' ? node.id : null,
      mx,
      my,
      moved: false,
      shift: e.shiftKey,
      ox: cam.tx,
      oy: cam.ty,
      yaw: cam.yaw,
      pitch: cam.pitch,
    };
    if (dragRef.current.n) {
      dragRef.current.n.fixed = true;
      alphaRef.current = Math.max(alphaRef.current, 0.45);
    }
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const pr = propsRef.current;
    const [mx, my] = toLocal(e);
    const d = dragRef.current;
    if (d) {
      const dx = mx - d.mx,
        dy = my - d.my;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.space) {
        /* Space-pan: translate the camera in BOTH 2D and 3D (a pan of the
           projected view — never an orbit). */
        const cam = camRef.current;
        cam.tx = d.ox + dx;
        cam.ty = d.oy + dy;
        return;
      }
      if (d.n) {
        const cam = camRef.current;
        if (!pr.is3d) {
          d.n.x = (mx - cam.tx) / cam.k;
          d.n.y = (my - cam.ty) / cam.k;
        } else {
          d.n.x += (dx * 0.9) / cam.k;
          d.n.y += (dy * 0.9) / cam.k;
          d.mx = mx;
          d.my = my;
        }
        d.n.vx = 0;
        d.n.vy = 0;
        d.n.vz = 0;
        alphaRef.current = Math.max(alphaRef.current, 0.35);
        /* A tooltip glued to a node under the pointer is noise mid-drag. */
        if (hoverRef.current) {
          hoverRef.current = null;
          pr.onHover && pr.onHover(HIDE_TIP);
        }
      } else if (pr.is3d) {
        const cam = camRef.current;
        cam.yaw = d.yaw + dx * 0.006;
        cam.pitch = clampPitch(d.pitch + dy * 0.005);
      } else {
        const cam = camRef.current;
        cam.tx = d.ox + dx;
        cam.ty = d.oy + dy;
      }
      return;
    }
    const { node } = pickAt(mx, my);
    const id = node ? node.id : null;
    const t = tipAtRef.current;
    if (id !== hoverRef.current || (node && (Math.abs(mx - t.x) > 2 || Math.abs(my - t.y) > 2))) {
      hoverRef.current = id;
      tipAtRef.current = { id, x: mx, y: my };
      if (!node) {
        pr.onHover && pr.onHover(HIDE_TIP);
      } else {
        pr.onHover &&
          pr.onHover({
            show: true,
            x: mx + 52,
            y: my + 44,
            color: kindHue(node.kind, pr.theme) || '#94a3b8',
            name: node.name || node.id,
            meta: hoverMeta(node),
          });
      }
    }
  };

  const handlePointerUp = (e) => {
    const pr = propsRef.current;
    const d = dragRef.current;
    dragRef.current = null;
    updateCursor();
    if (!d) return;
    if (d.n) d.n.fixed = false;
    if (d.moved) return;
    const evt = { shiftKey: d.shift, pointerType: e.pointerType };
    if (d.n) {
      pr.onSelect && pr.onSelect(d.n, evt);
      /* The hairball cure (design select(), ~line 893): selecting a node
         while hop is 'all' collapses the view to 2 hops around it. The tab
         owns hop state; we only notify. */
      if (pr.hopDepth === 'all') pr.onAutoHop && pr.onAutoHop(2);
    } else if (d.hostId) {
      const host = hostByIdRef.current.get(d.hostId);
      if (host) {
        pr.onSelect && pr.onSelect(host, evt);
        if (pr.hopDepth === 'all') pr.onAutoHop && pr.onAutoHop(2);
      }
    } else {
      pr.onClearSelection && pr.onClearSelection();
    }
  };

  const handlePointerLeave = () => {
    const pr = propsRef.current;
    if (dragRef.current) return; // pointer capture keeps events flowing mid-drag
    hoverRef.current = null;
    tipAtRef.current = { id: null, x: -1, y: -1 };
    pr.onHover && pr.onHover(HIDE_TIP);
  };

  /* ---------- keyboard (the container owns focus) ---------- */
  const handleKeyDown = (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const pr = propsRef.current;
    switch (e.key) {
      case '/':
        e.preventDefault();
        pr.onFocusSearch && pr.onFocusSearch();
        return;
      case 'Escape':
        e.preventDefault();
        hoverRef.current = null;
        tipAtRef.current = { id: null, x: -1, y: -1 };
        pr.onHover && pr.onHover(HIDE_TIP);
        pr.onClearSelection && pr.onClearSelection();
        return;
      case '1':
      case '2':
      case '3':
      case '4':
        if (pr.selectedNodeId) {
          e.preventDefault();
          pr.onHopDepth && pr.onHopDepth(Number(e.key));
        }
        return;
      case '0':
        if (pr.selectedNodeId) {
          e.preventDefault();
          pr.onHopDepth && pr.onHopDepth('all');
        }
        return;
      case 'f':
      case 'F':
        e.preventDefault();
        requestFit(false);
        return;
      default:
        return;
    }
  };

  /* No visible nodes → the tab renders the empty state (Task 12); the shell
     renders nothing. Hooks above still ran, so this early return is safe. */
  if (!graph.nodes.length) return null;

  return (
    /* role=img + the counts label: the canvas is a black box to AT, so it
       announces what it is and points at the table view (spec §4.6). The
       wrapper stays keyboard-focusable so sighted keyboard users can pan/zoom
       the canvas — hence the non-interactive role with a key handler. */
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={wrapRef}
      className="lemu-graph3d__canvas"
      role="img"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Knowledge graph: ${graph.nodes.length} nodes, ${graph.links.length} edges. Switch to table view for a keyboard-accessible list.`}
    >
      <canvas
        ref={canvasRef}
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
