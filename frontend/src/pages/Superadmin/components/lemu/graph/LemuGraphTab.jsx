import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Boxes } from 'lucide-react';
import { buildActivity } from './buildActivity';
import { buildCodeGraph } from './buildCodeGraph';
import { createFitLatch } from './cameraLatch';
import { endId, nodesWithinHops } from './hopFilter';
import { applyKindFilter } from './kindFilter';
import { KIND_HUE, KIND_LABEL } from './graphTheme';
import LemuGraphCanvas from './LemuGraphCanvas';
import LemuGraphControls from './LemuGraphControls';
import GraphErrorBoundary from './GraphErrorBoundary';

/* 3D knowledge graph tab for the LEMU manifest.

   The manifest already ships a real graph — `edges` is a typed adjacency list
   over modules, models, jobs and route mounts — so this view renders that
   directly rather than inventing a topology. Node ids are the SAME ids the flat
   System map and the node drawer use (`module:x`, `model:X`, `job:y`), which is
   why clicking a sphere can open the existing drawer unchanged.

   Routes are deliberately NOT nodes by default: there are ~1700 of them and
   they hang off mounts, so including them buries the structure this view exists
   to show. The toggle is there for when you actually want the full surface. */
const LemuGraphTab = ({ manifest, liveness, jobHealth, onSelectNode, selectedNodeId }) => {
  const latch = useRef(createFitLatch());
  const fitRef = useRef(null);
  const [query, setQuery] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [hopDepth, setHopDepth] = useState(2);
  const [focusMatches, setFocusMatches] = useState(false);
  const [hiddenKinds, setHiddenKinds] = useState(() => new Set());

  /* Liveness keys collections by collection name, so model nodes are matched
     through modelName -> collectionName. Until the DB pulse is recording, every
     collection reads as idle and the graph is structurally correct but static —
     that is a data problem upstream, not a rendering one. */
  const activity = useMemo(
    () => buildActivity({ manifest, liveness, jobHealth }),
    [manifest, liveness, jobHealth],
  );

  const graph = useMemo(
    () => buildCodeGraph({ manifest, activity, showRoutes }),
    [manifest, activity, showRoutes],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(graph.nodes.filter((n) => n.id.toLowerCase().includes(q)).map((n) => n.id));
  }, [query, graph.nodes]);

  /* Filters compose in a fixed order inside this memo: hidden kinds drop out
     first, then focus-match search (when on), then the hop-depth collapse.
     Legend counts and the footer below still describe the FULL graph. */
  const visible = useMemo(() => {
    const kinded = applyKindFilter(graph, hiddenKinds);
    let g = kinded;
    if (focusMatches && matches) {
      const nodes = kinded.nodes.filter((n) => matches.has(n.id));
      const present = new Set(nodes.map((n) => n.id));
      g = {
        nodes,
        links: kinded.links.filter((l) => present.has(endId(l.source)) && present.has(endId(l.target))),
      };
    }
    if (!selectedNodeId || hopDepth === 'all') return g;
    const keep = nodesWithinHops(g.links, selectedNodeId, Number(hopDepth));
    return {
      nodes: g.nodes.filter((n) => keep.has(n.id)),
      links: g.links.filter((l) => keep.has(endId(l.source)) && keep.has(endId(l.target))),
    };
  }, [graph, hiddenKinds, focusMatches, matches, selectedNodeId, hopDepth]);

  const toggleKind = useCallback((kind) => {
    setHiddenKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  useEffect(() => { latch.current.reset(); }, [hopDepth, selectedNodeId, showRoutes]);

  // The drawer resolves module/model/job ids. Mounts and routes have no
  // drawer view, so the canvas focuses the camera instead of opening an
  // empty panel (its handleClick does the camera work after this fires).
  const handleNodeClick = useCallback(
    (node) => {
      if (['module', 'model', 'job'].includes(node.kind)) onSelectNode?.(node.id);
    },
    [onSelectNode],
  );

  const counts = useMemo(() => {
    const c = {};
    graph.nodes.forEach((n) => { c[n.kind] = (c[n.kind] || 0) + 1; });
    return c;
  }, [graph.nodes]);

  if (!manifest) {
    return (
      <div className="lemu-graph3d">
        <div className="lemu-state">
          <div className="lemu-state__icon"><Boxes size={24} /></div>
          <div className="lemu-state__title">
            No manifest yet — the graph is built from the system manifest.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lemu-graph3d">
      <div className="lemu-graph3d__panel lemu-graph3d__panel--tl">
        <LemuGraphControls
          query={query}
          onQuery={setQuery}
          showRoutes={showRoutes}
          onShowRoutes={setShowRoutes}
          routeCount={(manifest.routes || []).length}
          hopDepth={hopDepth}
          onHopDepth={setHopDepth}
          hasSelection={!!selectedNodeId}
          onFit={() => fitRef.current?.()}
          focusMatches={focusMatches}
          onFocusMatches={setFocusMatches}
        />
      </div>

      <div className="lemu-graph3d__legend lemu-graph3d__panel lemu-graph3d__panel--tr">
        {Object.keys(KIND_LABEL)
          .filter((k) => counts[k])
          .map((k) => (
            <button
              key={k}
              type="button"
              className={`lemu-graph3d__legend-item${hiddenKinds.has(k) ? ' lemu-graph3d__legend-item--off' : ''}`}
              aria-pressed={!hiddenKinds.has(k)}
              onClick={() => toggleKind(k)}
            >
              <i style={{ background: KIND_HUE[k] }} aria-hidden="true" />
              {KIND_LABEL[k]} <b>{counts[k]}</b>
            </button>
          ))}
        <span className="lemu-meta">{graph.links.length} edges</span>
      </div>

      <GraphErrorBoundary>
        <LemuGraphCanvas
          graph={visible}
          selectedNodeId={selectedNodeId}
          matches={matches}
          onNodeClick={handleNodeClick}
          latchRef={latch}
          fitRef={fitRef}
        />
      </GraphErrorBoundary>

      <p className="lemu-meta lemu-graph3d__foot lemu-graph3d__rail">
        Drag to rotate, scroll to zoom, click a sphere to focus it — modules, models and jobs
        also open in the node drawer. Colour encodes kind; particles along an edge mean
        recent traffic.
      </p>
    </div>
  );
};

export default LemuGraphTab;
