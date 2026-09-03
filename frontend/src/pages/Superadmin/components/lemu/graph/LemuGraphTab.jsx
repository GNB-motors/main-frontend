import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { buildActivity } from './buildActivity';
import { buildCodeGraph } from './buildCodeGraph';
import { createFitLatch } from './cameraLatch';
import { endId, neighboursOf, nodesWithinHops } from './hopFilter';
import { applyKindFilter } from './kindFilter';
import { KIND_HUE, KIND_LABEL } from './graphTheme';
import LemuGraphCanvas from './LemuGraphCanvas';
import LemuGraphControls from './LemuGraphControls';
import LemuGraphTable from './LemuGraphTable';
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
const LemuGraphTab = ({ manifest, liveness, jobHealth, onSelectNode, selectedNodeId, dataUpdatedAt }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const latch = useRef(createFitLatch());
  const fitRef = useRef(null);
  const focusRef = useRef(null);
  const snapshotRef = useRef(null);
  const searchRef = useRef(null);

  /* Same WebGL probe the canvas runs: it decides the initial render mode so
     machines without a GL context (RDP, VMs, stripped Chromium) open in 2D
     instead of flashing a black rectangle first. The canvas re-checks and
     shows an info chip if 3D is picked where WebGL is missing. */
  const webglOk = useMemo(() => {
    try {
      const c = document.createElement('canvas');
      return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }, []);

  /* View state reads the URL exactly once at mount (read-once init below) and
     is written back on change by the sync effect. hiddenKinds and
     focusMatches are ephemeral and stay out of the URL deliberately. */
  const [view, setView] = useState(() => {
    const v = searchParams.get('gview');
    return v === 'graph' || v === 'table' ? v : 'graph';
  });
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [showRoutes, setShowRoutes] = useState(false);
  const [hopDepth, setHopDepth] = useState(() => {
    const h = searchParams.get('hops');
    if (h === 'all') return 'all';
    return ['1', '2', '3', '4'].includes(h) ? Number(h) : 2;
  });
  const [focusMatches, setFocusMatches] = useState(false);
  const [hiddenKinds, setHiddenKinds] = useState(() => new Set());
  const [mode, setMode] = useState(() => {
    const m = searchParams.get('mode');
    if (m === '2d' || m === '3d') return m;
    return webglOk ? '3d' : '2d';
  });
  const effectiveMode = mode === '3d' && webglOk ? '3d' : '2d';

  /* Write-on-change URL sync. Defaults are deleted to keep shared URLs short.

     The mount run is SKIPPED, and that skip is load-bearing. Every value this
     effect writes (view/hopDepth/query/mode) was initialised FROM the URL by
     the lazy initializers above, so writing them back on mount is by
     construction either a no-op or a corruption — never useful.

     The corruption: setSearchParams copies `prev`, which is React Router's
     closed-over snapshot, and echoes back EVERY param including `tab`, which
     this component does not own. On mount that snapshot can still predate the
     `tab=graph` write that just mounted us, so the effect rewrote `tab` to the
     previous tab. LemuLogsPage:516-522 treats the URL as the source of truth
     for activeTab, so the page followed it straight back and the Graph tab
     could not be opened at all. */
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (view === 'graph') next.delete('gview');
      else next.set('gview', view);
      if (hopDepth === 2) next.delete('hops');
      else next.set('hops', String(hopDepth));
      if (!query.trim()) next.delete('q');
      else next.set('q', query);
      if (mode === '3d') next.delete('mode');
      else next.set('mode', mode);
      return next;
    }, { replace: true });
  }, [view, hopDepth, query, mode, setSearchParams]);

  /* Liveness keys collections by collection name, so model nodes are matched
     through modelName -> collectionName. Until the DB pulse is recording, every
     collection reads as idle and the graph is structurally correct but static —
     that is a data problem upstream, not a rendering one. */
  const activity = useMemo(
    () => buildActivity({ manifest, liveness, jobHealth }),
    [manifest, liveness, jobHealth],
  );

  /* Node object identity is preserved across rebuilds, and that is what stops
     the graph exploding every 30 seconds.

     force-graph hands its node objects to d3-force, which MUTATES them with
     x/y/z and velocities. The liveness poll changes `activity` every 30s,
     which rebuilt every node as a fresh object — so d3 got nodes with no
     coordinates, discarded the settled layout and re-simulated from a random
     scatter. Re-using the previous object for an id keeps the coordinates
     d3 wrote, so a poll updates ops/live in place and the layout barely
     moves. Object.assign is safe here precisely because the freshly built
     node carries no x/y/z of its own to clobber with. */
  const nodeCache = useRef(new Map());
  const graph = useMemo(() => {
    const built = buildCodeGraph({ manifest, activity, showRoutes });
    const nodes = built.nodes.map((n) => {
      const prev = nodeCache.current.get(n.id);
      return prev ? Object.assign(prev, n) : n;
    });
    nodeCache.current = new Map(nodes.map((n) => [n.id, n]));
    return { nodes, links: built.links };
  }, [manifest, activity, showRoutes]);

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

  const nodeById = useMemo(
    () => new Map(visible.nodes.map((n) => [n.id, n])),
    [visible.nodes],
  );

  /* Table rows address nodes by id (spec: the Name button calls
     onSelectNode(node.id)); resolve back to the node object and run the SAME
     handler a sphere click uses, so drawer gating is identical in both views. */
  const handleTableSelect = useCallback(
    (id) => {
      const node = nodeById.get(id);
      if (node) handleNodeClick(node);
    },
    [nodeById, handleNodeClick],
  );

  /* Arrow-key selection (plan Task 10): moves through the selected node's
     neighbours (hopFilter.neighboursOf), Right/Down next, Left/Up previous,
     wrapping. The cursor ref keeps "next" stable across repeated presses —
     without it, recomputing neighboursOf after every jump would ping-pong
     between two nodes. Any selection change from another control (click,
     table, hop filter) resets the cursor on the next press. With nothing
     selected, the first visible node is selected. */
  const navCursor = useRef({ anchor: null, ids: [], index: -1 });
  const selectViaKeyboard = useCallback(
    (node) => {
      if (!node) return;
      handleNodeClick(node);
      focusRef.current?.(node); // camera follows, same flight as a node click
    },
    [handleNodeClick],
  );
  const moveSelection = useCallback(
    (dir) => {
      if (!visible.nodes.length) return;
      if (!selectedNodeId) {
        navCursor.current = { anchor: null, ids: [], index: -1 };
        selectViaKeyboard(visible.nodes[0]);
        return;
      }
      const cursor = navCursor.current;
      if (cursor.anchor !== selectedNodeId) {
        const ids = [...neighboursOf(visible.links, selectedNodeId)];
        if (!ids.length) return;
        const index = dir > 0 ? 0 : ids.length - 1;
        navCursor.current = { anchor: selectedNodeId, ids, index };
        selectViaKeyboard(nodeById.get(ids[index]));
        return;
      }
      const index = (cursor.index + dir + cursor.ids.length) % cursor.ids.length;
      navCursor.current = { ...cursor, index };
      selectViaKeyboard(nodeById.get(cursor.ids[index]));
    },
    [visible, selectedNodeId, nodeById, selectViaKeyboard],
  );

  /* Canvas keyboard shortcuts, implemented here (the tab owns selection
     state and the visible links) on a wrapper around the canvas — the canvas
     itself stays renderer-only. Events bubble up from the focusable canvas
     wrapper; anything typed into an input/select/textarea is left alone. */
  const handleCanvasKeyDown = useCallback(
    (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case 'Enter': {
          const node = nodeById.get(selectedNodeId);
          if (node) {
            e.preventDefault();
            handleNodeClick(node);
          }
          break;
        }
        case 'Escape': {
          /* No onClearSelection prop exists above this tab, but the page
             already syncs selection FROM the URL (LemuLogsPage effect on the
             `node` param, same mechanism closeDrawer uses) — deleting the
             param clears selection and closes the drawer. */
          if (!selectedNodeId) break;
          e.preventDefault();
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('node');
            return next;
          }, { replace: true });
          break;
        }
        case 'f':
          e.preventDefault();
          fitRef.current?.();
          break;
        case '/':
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          moveSelection(e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
          break;
        }
        default:
          break;
      }
    },
    [nodeById, selectedNodeId, handleNodeClick, setSearchParams, moveSelection],
  );

  /* Rail freshness: the page stamps dataUpdatedAt after every successful
     liveness fetch; this tick recomputes the age label every 5s and drives
     the dot (accent <60s, amber 60-120s, danger beyond). */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const freshAgeSec = dataUpdatedAt ? Math.max(0, Math.floor((now - dataUpdatedAt) / 1000)) : 0;
  const freshState = freshAgeSec < 60 ? 'ok' : freshAgeSec <= 120 ? 'warn' : 'stale';

  const counts = useMemo(() => {
    const c = {};
    graph.nodes.forEach((n) => { c[n.kind] = (c[n.kind] || 0) + 1; });
    return c;
  }, [graph.nodes]);

  // Snapshot is a 2D-only control (spec §4.3-4: incident-report capture of
  // the canvas); the canvas publishes the actual handler through snapshotRef.
  const handleSnapshot = useCallback(() => snapshotRef.current?.(), []);

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
          searchRef={searchRef}
          showRoutes={showRoutes}
          onShowRoutes={setShowRoutes}
          routeCount={(manifest.routes || []).length}
          hopDepth={hopDepth}
          onHopDepth={setHopDepth}
          hasSelection={!!selectedNodeId}
          onFit={() => fitRef.current?.()}
          focusMatches={focusMatches}
          onFocusMatches={setFocusMatches}
          mode={mode}
          onMode={setMode}
          view={view}
          onView={setView}
          showSnapshot={effectiveMode === '2d' && view === 'graph'}
          onSnapshot={handleSnapshot}
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

      {view === 'table' ? (
        /* The table and the canvas never mount at the same time (perf): the
           ForceGraph simulation is thrown away on every switch, by design. */
        <LemuGraphTable graph={visible} onSelectNode={handleTableSelect} />
      ) : (
        <div onKeyDown={handleCanvasKeyDown}>
          <GraphErrorBoundary>
            <LemuGraphCanvas
              graph={visible}
              selectedNodeId={selectedNodeId}
              matches={matches}
              mode={mode}
              onNodeClick={handleNodeClick}
              latchRef={latch}
              fitRef={fitRef}
              focusRef={focusRef}
              snapshotRef={snapshotRef}
            />
          </GraphErrorBoundary>
        </div>
      )}

      <p className="lemu-meta lemu-graph3d__foot lemu-graph3d__rail">
        Drag to rotate, scroll to zoom, click a sphere to focus it — modules, models and jobs
        also open in the node drawer. Colour encodes kind; particles along an edge mean
        recent traffic.
        {dataUpdatedAt && (
          <span
            className={`lemu-graph3d__fresh lemu-graph3d__fresh--${freshState}`}
            aria-live="off"
            title={`Data updated ${new Date(dataUpdatedAt).toLocaleString()}`}
          >
            <i className="lemu-graph3d__fresh-dot" aria-hidden="true" />
            updated {freshAgeSec}s ago
          </span>
        )}
      </p>
    </div>
  );
};

export default LemuGraphTab;
