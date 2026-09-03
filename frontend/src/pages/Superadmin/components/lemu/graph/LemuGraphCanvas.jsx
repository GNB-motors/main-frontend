import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { relativeTime } from '../utils';
import { KIND_LABEL, LINK_COLOR, nodeAppearance } from './graphTheme';

/* The renderers themselves. three.js is ~600KB, so both renderers are imported
   lazily — opening LEMU should not pay for the graph unless you open this tab,
   and the 2D canvas renderer lands in its own chunk beside the 3D one.
   All ForceGraph prop callbacks are hoisted to useCallback with explicit deps:
   react-kapsule re-applies every inline prop on each render, and this wrapper
   re-renders on hover (see the §6.2 note below). */
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));
const ForceGraph2D = lazy(() => import('react-force-graph-2d'));

/* KIND_HUE colours are #rrggbb hex; the 2D canvas wants fillStyle/strokeStyle
   strings, so the kind colour plus the search-match opacity travel together
   as one rgba() value (force-graph 2D has no nodeOpacity). */
const hexToRgba = (hex, alpha) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${alpha})`;
};

const LemuGraphCanvas = ({
  graph,
  selectedNodeId,
  matches,
  mode,
  onNodeClick,
  onNodeHover,
  latchRef,
  fitRef,
  focusRef,
  snapshotRef,
}) => {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(null);

  /* three.js is loaded DYNAMICALLY, and that is not an optimisation.

     A static `import * as THREE from 'three'` put a second, tree-shaken copy
     of three into this page's eager chunk while react-force-graph-3d kept its
     own copy in the lazy chunk — two module instances. Custom node meshes were
     then built with instance A and rendered by instance B's WebGLRenderer. It
     survives today only because three duck-types (`isObject3D`, `isMaterial`)
     instead of using instanceof, so it is a latent failure waiting for any
     richer node treatment, and it charged the eager bundle for a renderer the
     page may never open.

     Importing it dynamically puts three in the same chunk group as the
     renderer that consumes it: one instance, and nothing is paid until the
     3D view is actually opened. Until it resolves, nodeThreeObject returns
     undefined and the renderer draws its own default spheres — so the graph
     is correct at every moment, just briefly without custom rings. */
  const [three, setThree] = useState(null);
  useEffect(() => {
    let alive = true;
    import('three').then((m) => { if (alive) setThree(m); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Motion budget: read once — reduced motion means no particles and no
  // camera flights (cameraPosition with duration 0 sets instantly).
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  /* WebGL feature-detect: RDP sessions, stripped-down Chromium and VMs can
     all lack a GL context, where the 3D renderer is a permanent black
     rectangle. This is a fallback, not an error — the 2D canvas paints fine. */
  const webglOk = useMemo(() => {
    try {
      const c = document.createElement('canvas');
      return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }, []);
  const effectiveMode = mode === '3d' && webglOk ? '3d' : '2d';

  // The canvas needs explicit pixel dimensions; it cannot size itself from CSS.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDims({ width: Math.max(320, r.width), height: Math.max(420, r.height) });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resetView = useCallback(() => {
    fgRef.current?.zoomToFit(700, 60);
  }, []);

  // The Fit button lives in the controls bar, one level up; publish resetView.
  useEffect(() => {
    if (fitRef) fitRef.current = resetView;
  }, [fitRef, resetView]);

  /* The 2D canvas is untainted (no cross-origin content), so toDataURL works
     and a snapshot is one <a download> away. Published through a ref, same as
     the Fit button, because the wrapper div and its canvas live here. */
  const takeSnapshot = useCallback(() => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lemu-graph-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);
  useEffect(() => {
    if (snapshotRef) snapshotRef.current = takeSnapshot;
  }, [snapshotRef, takeSnapshot]);

  /* The camera flight, split out of handleClick so the tab's keyboard
     navigation (plan Task 10) can fly to a node without replaying the click:
     handleClick = select (onNodeClick) + flyTo. Same latch discipline either
     way — beginFocus keeps onEngineStop from fitting over the animation. */
  const flyTo = useCallback(
    (node) => {
      const fg = fgRef.current;
      if (!fg) return;
      const duration = reducedMotion ? 0 : 900;
      latchRef.current.beginFocus();
      if (effectiveMode === '3d') {
        const dist = 90;
        const ratio = 1 + dist / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
        fg.cameraPosition(
          { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
          node,
          duration,
        );
      } else {
        // cameraPosition is 3D-only; the 2D equivalent pans + zooms.
        fg.centerAt(node.x || 0, node.y || 0, duration);
        fg.zoom(5, duration);
      }
      setTimeout(() => latchRef.current.endFocus(), duration + 50); // just past the animation (0 when instant)
    },
    [latchRef, reducedMotion, effectiveMode],
  );
  useEffect(() => {
    if (focusRef) focusRef.current = flyTo;
  }, [focusRef, flyTo]);

  const handleClick = useCallback(
    (node) => {
      if (!node) return;
      onNodeClick?.(node);
      flyTo(node);
    },
    [onNodeClick, flyTo],
  );

  // §6.2 checked 2026-09-03: hover state re-renders the canvas wrapper; engine reheat on hover unverified without a browser — see plan Task 5 Step 7.
  const handleHover = useCallback(
    (node) => {
      setHovered(node);
      onNodeHover?.(node);
    },
    [onNodeHover],
  );

  /* 3D per-node alpha rides on the COLOUR, not on nodeOpacity.
     `nodeOpacity` is a static number in this library, never an accessor
     (react-force-graph-3d.d.ts: `nodeOpacity?: number`), and
     three-forcegraph computes `state.nodeOpacity * colorAlpha(color)` — so a
     function there makes the product NaN and every sphere renders invisible
     while the links still draw. That `colorAlpha(color)` term is the
     supported per-node channel, so search-dimming goes through rgba exactly
     as the 2D path already does. */
  const nodeColor3D = useCallback(
    (n) => {
      const { color, opacity } = nodeAppearance(n, { selectedNodeId, matches });
      return hexToRgba(color, opacity * 0.92);
    },
    [selectedNodeId, matches],
  );
  const nodeLabel = useCallback((n) => `${n.kind} · ${n.label}${n.live ? ' · live' : ''}`, []);
  const linkColor = useCallback((l) => LINK_COLOR[l.kind] || 'rgba(148,163,184,0.3)', []);
  const linkWidth = useCallback((l) => (l.kind === 'require' ? 0.4 : 0.7), []);
  // 2D linkWidth is canvas pixels, so the same weights doubled stay readable.
  const linkWidth2D = useCallback((l) => (l.kind === 'require' ? 0.8 : 1.4), []);
  const nodeColor2D = useCallback(
    (n) => {
      const { color, opacity } = nodeAppearance(n, { selectedNodeId, matches });
      return hexToRgba(color, opacity * 0.92);
    },
    [selectedNodeId, matches],
  );

  /* P3 state treatment — one channel per meaning (graphTheme):
     ring drives the geometry (solid sphere / wireframe / fault wireframe),
     outline adds a back-side halo for the selection and its neighbours.
     Solid, unselected nodes return undefined from nodeThreeObject, so they
     keep the cheap built-in sphere path (nodeThreeObjectExtend=false). The
     radius formula mirrors the renderer default: cbrt(val) * nodeRelSize. */
  const nodeThreeObject = useCallback((n) => {
    // Before three resolves, fall through to the renderer's own spheres.
    if (!three) return undefined;
    const { color, opacity, ring, outline } = nodeAppearance(n, { selectedNodeId, matches });
    const radius = Math.cbrt(Math.max(0, n.val || 1)) * 4;
    const group = new three.Group();
    if (outline) {
      group.add(new three.Mesh(
        new three.SphereGeometry(radius * 1.25, 12, 12),
        new three.MeshBasicMaterial({
          color: outline === 'selected' ? '#ffffff' : '#cbd5e1',
          transparent: true,
          opacity: 0.35,
          side: three.BackSide,
          depthWrite: false,
        }),
      ));
    }
    if (ring === 'hollow' || ring === 'fault') {
      group.add(new three.Mesh(
        new three.SphereGeometry(ring === 'fault' ? radius * 1.15 : radius, 10, 10),
        new three.MeshBasicMaterial({
          wireframe: true,
          color: ring === 'fault' ? '#fb7185' : color,
        }),
      ));
    } else if (outline) {
      // The custom object replaces the default sphere, so an outlined solid
      // node needs its sphere recreated or it would render as halo only.
      group.add(new three.Mesh(
        new three.SphereGeometry(radius, 12, 12),
        new three.MeshLambertMaterial({ color, transparent: true, opacity: opacity * 0.92 }),
      ));
    }
    return group.children.length ? group : undefined;
  }, [three, selectedNodeId, matches]);

  /* 2D equivalent of nodeThreeObject. The renderer default is a filled
     circle of radius sqrt(val) * nodeRelSize, painted after any custom paint
     in 'before' mode — so plain solid nodes draw nothing here and keep the
     cheap default path, while hollow/fault/selection nodes switch to
     'replace' and take over the paint: hollow as a stroked ring in the kind
     colour, fault stroked rose, selection as an outer halo ring (mirrors the
     3D BackSide outline). The hover shadow canvas uses its own pointer-area
     paint and is unaffected by any of this. */
  const nodeCanvasObjectMode = useCallback(
    (n) => {
      const { ring, outline } = nodeAppearance(n, { selectedNodeId, matches });
      return ring !== 'solid' || outline ? 'replace' : 'before';
    },
    [selectedNodeId, matches],
  );
  const nodeCanvasObject = useCallback(
    (n, ctx) => {
      const { color, opacity, ring, outline } = nodeAppearance(n, { selectedNodeId, matches });
      // 'before' mode: the default fill paints plain solid nodes.
      if (ring === 'solid' && !outline) return;
      const r = Math.sqrt(Math.max(0, n.val || 1)) * 4;
      const paint = (radius, style, width, fill) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI, false);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      if (ring === 'solid') {
        paint(r, color, 1, hexToRgba(color, opacity * 0.92));
      } else {
        paint(r, ring === 'fault' ? '#fb7185' : color, 1.5);
      }
      if (outline) {
        paint(r + 3, outline === 'selected' ? '#ffffff' : '#cbd5e1', 1.5);
      }
    },
    [selectedNodeId, matches],
  );

  /* Particles are the "throb": they only flow along edges touching a
     node with recent traffic, so motion means live data, not decoration.
     The motion budget caps them at the 200 busiest live edges by ops —
     endpoints are resolved by id because the renderer may not have swapped
     link source/target for node objects yet on the first pass. */
  const particleEdges = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const end = (e) => (typeof e === 'object' ? e : byId.get(e));
    const ops = (l) => Math.max(end(l.source)?.ops || 0, end(l.target)?.ops || 0);
    const live = graph.links.filter((l) => end(l.source)?.live || end(l.target)?.live);
    live.sort((a, b) => ops(b) - ops(a));
    return new Set(live.slice(0, 200));
  }, [graph.links, graph.nodes]);
  const linkParticles = useCallback(
    (l) => (reducedMotion || !particleEdges.has(l) ? 0 : 3),
    [reducedMotion, particleEdges],
  );
  const handleEngineStop = useCallback(() => {
    if (latchRef.current.shouldFit()) fgRef.current?.zoomToFit(500, 60);
  }, [latchRef]);

  return (
    /* role=img + the counts label: the WebGL canvas is a black box to AT, so
       it announces what it is and points at the table view (plan Task 10,
       spec §4.6). Keyboard shortcuts live one level up in the tab, which owns
       selection state; keydown bubbles here from the focused wrapper. */
    <div
      className="lemu-graph3d__canvas"
      ref={wrapRef}
      role="img"
      tabIndex={0}
      aria-label={`Knowledge graph: ${graph.nodes.length} nodes, ${graph.links.length} edges. Switch to table view for a keyboard-accessible list.`}
    >
      <Suspense fallback={<div className="lemu-meta lemu-graph3d__loading">Loading {effectiveMode === '3d' ? '3D' : '2D'} renderer…</div>}>
        {dims.width > 0 && effectiveMode === '3d' && (
          <ForceGraph3D
            ref={fgRef}
            width={dims.width}
            height={dims.height}
            graphData={graph}
            backgroundColor="rgba(0,0,0,0)"
            showNavInfo={false}
            nodeId="id"
            nodeVal="val"
            nodeColor={nodeColor3D}
            nodeOpacity={1}
            nodeResolution={12}
            nodeThreeObject={nodeThreeObject}
            nodeThreeObjectExtend={false}
            nodeLabel={nodeLabel}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkOpacity={0.45}
            linkDirectionalParticles={linkParticles}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={1.6}
            onNodeClick={handleClick}
            onNodeHover={handleHover}
            onEngineStop={handleEngineStop}
            cooldownTicks={120}
            enableNodeDrag
          />
        )}
        {dims.width > 0 && effectiveMode === '2d' && (
          <ForceGraph2D
            ref={fgRef}
            width={dims.width}
            height={dims.height}
            graphData={graph}
            backgroundColor="rgba(0,0,0,0)"
            nodeId="id"
            nodeVal="val"
            nodeColor={nodeColor2D}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={nodeCanvasObjectMode}
            nodeLabel={nodeLabel}
            linkColor={linkColor}
            linkWidth={linkWidth2D}
            linkOpacity={0.45}
            linkDirectionalParticles={linkParticles}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={1.6}
            onNodeClick={handleClick}
            onNodeHover={handleHover}
            onEngineStop={handleEngineStop}
            cooldownTicks={120}
            enableNodeDrag
          />
        )}
      </Suspense>

      {mode === '3d' && !webglOk && (
        <div className="lemu-graph3d__chip" role="status">
          3D unavailable — showing 2D
        </div>
      )}

      {hovered && (
        <div className="lemu-graph3d__hint" role="status">
          <strong>{hovered.label}</strong>
          <span className="lemu-meta">{KIND_LABEL[hovered.kind] || hovered.kind}</span>
          {hovered.live && (
            <span className="lemu-meta">
              {hovered.ops} ops
              {hovered.lastSeen ? ` · ${relativeTime(hovered.lastSeen)}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LemuGraphCanvas;
