import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { relativeTime } from '../utils';
import { KIND_LABEL, LINK_COLOR, nodeAppearance } from './graphTheme';

/* The 3D renderer itself. three.js is ~600KB, so the renderer is imported
   lazily — opening LEMU should not pay for the graph unless you open this tab.
   All ForceGraph prop callbacks are hoisted to useCallback with explicit deps:
   react-kapsule re-applies every inline prop on each render, and this wrapper
   re-renders on hover (see the §6.2 note below). */
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));

const LemuGraphCanvas = ({
  graph,
  selectedNodeId,
  matches,
  onNodeClick,
  onNodeHover,
  latchRef,
  fitRef,
}) => {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(null);

  // Motion budget: read once — reduced motion means no particles and no
  // camera flights (cameraPosition with duration 0 sets instantly).
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

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

  const handleClick = useCallback(
    (node) => {
      if (!node) return;
      onNodeClick?.(node);
      const fg = fgRef.current;
      if (!fg) return;
      const dist = 90;
      const ratio = 1 + dist / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
      const duration = reducedMotion ? 0 : 900;
      latchRef.current.beginFocus();
      fg.cameraPosition(
        { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
        node,
        duration,
      );
      setTimeout(() => latchRef.current.endFocus(), duration + 50); // just past the animation (0 when instant)
    },
    [onNodeClick, latchRef, reducedMotion],
  );

  // §6.2 checked 2026-09-03: hover state re-renders the canvas wrapper; engine reheat on hover unverified without a browser — see plan Task 5 Step 7.
  const handleHover = useCallback(
    (node) => {
      setHovered(node);
      onNodeHover?.(node);
    },
    [onNodeHover],
  );

  const nodeColor = useCallback(
    (n) => nodeAppearance(n, { selectedNodeId, matches }).color,
    [selectedNodeId, matches],
  );
  const nodeOpacity = useCallback(
    (n) => nodeAppearance(n, { selectedNodeId, matches }).opacity * 0.92,
    [selectedNodeId, matches],
  );
  const nodeLabel = useCallback((n) => `${n.kind} · ${n.label}${n.live ? ' · live' : ''}`, []);
  const linkColor = useCallback((l) => LINK_COLOR[l.kind] || 'rgba(148,163,184,0.3)', []);
  const linkWidth = useCallback((l) => (l.kind === 'require' ? 0.4 : 0.7), []);

  /* P3 state treatment — one channel per meaning (graphTheme):
     ring drives the geometry (solid sphere / wireframe / fault wireframe),
     outline adds a back-side halo for the selection and its neighbours.
     Solid, unselected nodes return undefined from nodeThreeObject, so they
     keep the cheap built-in sphere path (nodeThreeObjectExtend=false). The
     radius formula mirrors the renderer default: cbrt(val) * nodeRelSize. */
  const nodeThreeObject = useCallback((n) => {
    const { color, opacity, ring, outline } = nodeAppearance(n, { selectedNodeId, matches });
    const radius = Math.cbrt(Math.max(0, n.val || 1)) * 4;
    const group = new THREE.Group();
    if (outline) {
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.25, 12, 12),
        new THREE.MeshBasicMaterial({
          color: outline === 'selected' ? '#ffffff' : '#cbd5e1',
          transparent: true,
          opacity: 0.35,
          side: THREE.BackSide,
          depthWrite: false,
        }),
      ));
    }
    if (ring === 'hollow' || ring === 'fault') {
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(ring === 'fault' ? radius * 1.15 : radius, 10, 10),
        new THREE.MeshBasicMaterial({
          wireframe: true,
          color: ring === 'fault' ? '#fb7185' : color,
        }),
      ));
    } else if (outline) {
      // The custom object replaces the default sphere, so an outlined solid
      // node needs its sphere recreated or it would render as halo only.
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 12),
        new THREE.MeshLambertMaterial({ color, transparent: true, opacity: opacity * 0.92 }),
      ));
    }
    return group.children.length ? group : undefined;
  }, [selectedNodeId, matches]);

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
    <div className="lemu-graph3d__canvas" ref={wrapRef}>
      <Suspense fallback={<div className="lemu-meta lemu-graph3d__loading">Loading 3D renderer…</div>}>
        {dims.width > 0 && (
          <ForceGraph3D
            ref={fgRef}
            width={dims.width}
            height={dims.height}
            graphData={graph}
            backgroundColor="rgba(0,0,0,0)"
            showNavInfo={false}
            nodeId="id"
            nodeVal="val"
            nodeColor={nodeColor}
            nodeOpacity={nodeOpacity}
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
      </Suspense>

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
