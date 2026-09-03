import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
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
      latchRef.current.beginFocus();
      fg.cameraPosition(
        { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
        node,
        900,
      );
      setTimeout(() => latchRef.current.endFocus(), 950); // just past the 900ms animation
    },
    [onNodeClick, latchRef],
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
  /* Particles are the "throb": they only flow along edges touching a
     node with recent traffic, so motion means live data, not decoration. */
  const linkParticles = useCallback((l) => {
    const s = typeof l.source === 'object' ? l.source : null;
    const t = typeof l.target === 'object' ? l.target : null;
    return s?.live || t?.live ? 3 : 0;
  }, []);
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
