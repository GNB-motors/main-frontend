import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { LemuService } from '../../LemuService';
import { activityAtBucket, buildActivity } from './buildActivity';
import { buildCodeGraph } from './buildCodeGraph';
import { buildTopologyGraph } from './useTopologyGraph';
import { downstreamOf, upstreamOf } from './blastRadius';
import { shortestPath } from './shortestPath';
import { findDeadSurfaces } from './deadSurfaces';
import { overlayFromDiff, ghostNode } from './diffOverlay';
import { healthyPathSet } from './healthyPath';
import { endId, neighboursOf, nodesWithinHops } from './hopFilter';
import { applyKindFilter } from './kindFilter';
import { countQueryMatches } from './graphPanelCounts';
import { readStoredTheme, writeStoredTheme, applyThemeVars, clearThemeVars } from './graphTheme';
import KgCanvas from './KgCanvas';
import LemuGraphControls from './LemuGraphControls';
import LemuGraphFilters from './LemuGraphFilters';
import LemuDeadSurfaces from './LemuDeadSurfaces';
import LemuTimeScrubber from './LemuTimeScrubber';
import LemuGraphTable from './LemuGraphTable';
import LemuGraphEmpty from './LemuGraphEmpty';
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
const LemuGraphTab = ({ manifest, liveness, jobHealth, topology, errorAttribution, onSelectNode, onOpenErrors, selectedNodeId, dataUpdatedAt, onBlastChange, instanceRef, manifests, diffsByVersion, diffStatusByVersion, onLoadDiff }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fitRef = useRef(null);
  const focusRef = useRef(null);
  const snapshotRef = useRef(null);
  const searchRef = useRef(null);

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
  /* State visibility (plan Task 9): nodes whose state is in offStates drop
     out of the visible graph, exactly like hiddenKinds. Nodes that carry no
     state (the CODE layer) are never matched, so state filtering is a
     no-op there — absence is not hidden. */
  const [offStates, setOffStates] = useState(() => new Set());
  const [mode, setMode] = useState(() => {
    const m = searchParams.get('mode');
    if (m === '2d' || m === '3d') return m;
    /* The raw-canvas renderer draws even its 3D projection on one 2D canvas
       (plan §0 C8) — no WebGL probe, and 2D is the design's default board. */
    return '2d';
  });
  /* The layer switch: CODE is the manifest dependency graph, INFRA is the
     topology board (hosts -> stores -> collections -> CDC -> tables). Read
     once at mount like the other view params; the default is deleted from
     the URL by the sync effect below. */
  const [layer, setLayer] = useState(() => (searchParams.get('layer') === 'infra' ? 'infra' : 'code'));
  /* State-rail dimming (INFRA layer): clicking a summary chip dims every
     OTHER state through the SAME opacity channel as search — P3, no new
     colour meaning. */
  const [dimmedStates, setDimmedStates] = useState(() => new Set());
  const [degradedDismissed, setDegradedDismissed] = useState(false);
  /* Blast radius (Phase 5): with a selection, light the transitive closure
     through the SAME outline channel hop-filter highlighting already uses —
     P3, no new colour meaning. */
  const [blastOn, setBlastOn] = useState(false);
  /* Path finding (Phase 5): shift-click sets the second endpoint; Esc
     clears it. */
  const [pathTarget, setPathTarget] = useState(null);
  /* Time scrubber (Phase 5): index into the fetched pulse history, or null
     for live. */
  const [pulseBuckets, setPulseBuckets] = useState([]);
  const [scrubIndex, setScrubIndex] = useState(null);
  /* Manifest-diff overlay (Phase 5): the manifest version to compare
     against, or null for no overlay. Ephemeral like blastOn — not URL
     state. */
  const [diffVersion, setDiffVersion] = useState(null);
  /* Healthy-path highlight (Phase 5): light measured nodes on the
     source→table data path, dim everything else through the existing
     matches opacity channel. INFRA only — code edges are static facts,
     not data flow. */
  const [livePathOn, setLivePathOn] = useState(false);
  /* Theme (plan Task 14): dark is the design's default board; the choice
     persists in localStorage (best-effort — see graphTheme.readStoredTheme). */
  const [theme, setTheme] = useState(readStoredTheme);
  const graphRootRef = useRef(null);

  /* Theme writes ALL DARK/LIGHT tokens onto the graph container as CSS custom
     properties (the design's syncFilters approach), NOT document.documentElement:
     the graph vars are scoped under .lemu-graph3d, and this element is their
     natural owner. The static CSS keeps the dark values as fallbacks; these
     inline properties override them while mounted and are removed on unmount
     so no graph token leaks into the rest of the app shell. */
  useEffect(() => {
    writeStoredTheme(theme);
    const el = graphRootRef.current;
    if (!el) return undefined;
    applyThemeVars(el, theme);
    return () => clearThemeVars(el);
  }, [theme]);

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
      if (layer === 'code') next.delete('layer');
      else next.set('layer', layer);
      return next;
    }, { replace: true });
  }, [view, hopDepth, query, mode, layer, setSearchParams]);

  /* Pulse history for the scrubber. v2-C4: /pulse passes `limit` straight
     into the query (telemetryAdmin.routes.js -> getPulseSummary), so 1440
     one-minute buckets really are a full 24h; no server cap to honour. One
     real bucket doc is ~1.9KB, so 1440 is a ~2.7MB on-demand fetch for a
     SUPER_ADMIN screen — accepted here; downsample server-side if that
     measurement ever hurts. Failure simply leaves the scrubber unloaded. */
  useEffect(() => {
    let alive = true;
    LemuService.getPulse({ limit: 1440 })
      .then((d) => {
        if (!alive) return;
        const buckets = [...(d?.data?.buckets || [])]
          .sort((a, b) => new Date(a.bucketStart) - new Date(b.bucketStart));
        setPulseBuckets(buckets);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const scrubbedBucket = scrubIndex == null ? null : pulseBuckets[scrubIndex] || null;

  /* Diff overlay: fetch the chosen version's diff on demand. The page owns
     the cache (diffsByVersion/diffStatusByVersion — the same objects the
     Changes tab renders from, so the two views can never disagree); this
     effect only asks for a version that has no status yet. */
  useEffect(() => {
    if (diffVersion == null) return;
    if (diffStatusByVersion?.[diffVersion]) return;
    onLoadDiff?.(diffVersion);
  }, [diffVersion, diffStatusByVersion, onLoadDiff]);

  /* Liveness keys collections by collection name, so model nodes are matched
     through modelName -> collectionName. Until the DB pulse is recording, every
     collection reads as idle and the graph is structurally correct but static —
     that is a data problem upstream, not a rendering one.

     While scrubbing, the single bucket at the scrub position REPLACES the
     24h rollup — same Map shape, so the code graph and its identity cache
     consume it unchanged. */
  const activity = useMemo(
    () => (scrubbedBucket
      ? activityAtBucket(scrubbedBucket, manifest)
      : buildActivity({ manifest, liveness, jobHealth })),
    [manifest, liveness, jobHealth, scrubbedBucket],
  );

  /* Node object identity is preserved across rebuilds, and that is what stops
     the graph exploding every 30 seconds.

     The old renderer handed its node objects to d3-force, which MUTATED them with
     x/y/z and velocities. The liveness poll changes `activity` every 30s,
     which rebuilt every node as a fresh object — so d3 got nodes with no
     coordinates, discarded the settled layout and re-simulated from a random
     scatter. Re-using the previous object for an id keeps the coordinates
     d3 wrote, so a poll updates ops/live in place and the layout barely
     moves. Object.assign is safe here precisely because the freshly built
     node carries no x/y/z of its own to clobber with.

     The same pass runs over whichever layer is active, so the INFRA board
     also survives the 30s topology poll, and `job:` ids shared by both
     layers keep their coordinates when switching. */
  const codeGraph = useMemo(
    () => buildCodeGraph({ manifest, activity, showRoutes }),
    [manifest, activity, showRoutes],
  );
  const infraGraph = useMemo(() => buildTopologyGraph(topology), [topology]);
  const built = layer === 'infra' ? infraGraph : codeGraph;
  const nodeCache = useRef(new Map());
  const graphBase = useMemo(() => {
    const nodes = built.nodes.map((n) => {
      const prev = nodeCache.current.get(n.id);
      return prev ? Object.assign(prev, n) : n;
    });
    nodeCache.current = new Map(nodes.map((n) => [n.id, n]));
    return { nodes, links: built.links };
  }, [built]);

  /* Error counts merge onto the identity-cached node objects IN PLACE, after
     the cache pass above: the cached objects carry the x/y/z d3 wrote, and
     in-place mutation (rather than a spread that would swap in a
     coordinate-less fresh object) is what lets a 30s poll update counts
     without re-scattering the layout. A node absent from the new rollup has
     its count deleted in place too — a resolved error must lose its pip on
     the next poll, not keep a stale one. */
  const graph = useMemo(() => {
    const byNode = errorAttribution?.byNode || {};
    const keys = Object.keys(byNode);
    if (!keys.length) {
      graphBase.nodes.forEach((n) => { delete n.errorCount; delete n.errorOccurrences; });
      return graphBase;
    }
    return {
      ...graphBase,
      nodes: graphBase.nodes.map((n) => {
        const e = byNode[n.id];
        if (!e) {
          delete n.errorCount;
          delete n.errorOccurrences;
          return n;
        }
        n.errorCount = e.count;
        n.errorOccurrences = e.occurrences;
        return n;
      }),
    };
  }, [graphBase, errorAttribution]);

  /* Manifest-diff overlay (Phase 5, code layer only — the diff is manifest
     semantics). Marks whose ids resolve in the current graph become outline
     marks; 'removed' marks that do NOT resolve are injected as ghost
     placeholders (metric-free by construction — see diffOverlay.ghostNode).
     Counts describe only RESOLVED marks: ids the graph cannot place are
     dropped, not guessed, and never reach the rail. Declared BEFORE
     graphStable below, which consumes effectiveGraph. */
  const overlayMarks = useMemo(() => {
    if (layer !== 'code' || diffVersion == null) return null;
    const diff = diffsByVersion?.[diffVersion];
    if (!diff) return null;
    const marks = overlayFromDiff(diff);
    return marks.size ? marks : null;
  }, [layer, diffVersion, diffsByVersion]);

  const diffOverlay = useMemo(() => {
    if (!overlayMarks) return null;
    const present = new Set(graph.nodes.map((n) => n.id));
    const ghosts = [];
    const counts = { added: 0, changed: 0, removed: 0 };
    overlayMarks.forEach((mark, id) => {
      if (mark === 'removed') {
        counts.removed += 1;
        if (!present.has(id)) ghosts.push(ghostNode(id));
      } else if (present.has(id)) {
        counts[mark] += 1;
      }
    });
    return {
      counts,
      graph: ghosts.length ? { ...graph, nodes: [...graph.nodes, ...ghosts] } : graph,
    };
  }, [overlayMarks, graph]);

  const effectiveGraph = diffOverlay ? diffOverlay.graph : graph;

  /* Healthy path (Phase 5): measured nodes on a source→table data path over
     reads|mirrors edges. Computed over the FULL layer graph (like blast), so
     the rail count stays true when the view is collapsed. See healthyPath.js
     for why this is a union rather than a literal directed path. */
  const livePath = useMemo(
    () => (livePathOn && layer === 'infra' ? healthyPathSet(graph.nodes, graph.links) : null),
    [livePathOn, layer, graph.nodes, graph.links],
  );

  /* Scrub stability: rebuilding the graph for a new scrub position must NOT
     re-scatter the layout. The identity cache already merges live/ops into
     the SAME node objects, so when the node/link shape is unchanged (the
     only diff is activity), hand the renderer the PREVIOUS graph object
     back — the renderer then sees no data change, does not reheat, and the
     canvas repaints colours/particles via the changed accessors alone. */
  const graphStableRef = useRef(null);
  const graphStable = useMemo(() => {
    const prev = graphStableRef.current;
    let next = effectiveGraph;
    if ((scrubbedBucket || diffOverlay) && prev) {
      const nextById = new Map(effectiveGraph.nodes.map((n) => [n.id, n]));
      const sameShape = prev.nodes.length === effectiveGraph.nodes.length
        && prev.links.length === effectiveGraph.links.length
        && prev.nodes.every((n) => nextById.has(n.id));
      /* the ref must hold the object we RETURNED last time — that is the
         object the renderer still holds; handing back a never-rendered
         sibling with the same shape still reads as a data swap to
         the sim and reheats the layout */
      if (sameShape) next = prev;
    }
    graphStableRef.current = next;
    return next;
  }, [effectiveGraph, scrubbedBucket, diffOverlay]);

  /* Search matches, state-rail dimming and the healthy-path highlight share
     the one opacity channel (nodeAppearance `matches`): a node stays bright
     only if it satisfies the query AND its state is not dimmed AND (when the
     live path is on) it sits on the path. Dimming is INFRA-only — code
     nodes carry no state to dim. */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dim = layer === 'infra' ? dimmedStates : null;
    if (!q && (!dim || !dim.size) && !livePath) return null;
    return new Set(graph.nodes
      .filter((n) => (!q || n.id.toLowerCase().includes(q))
        && (!dim || !dim.size || !dim.has(n.state))
        && (!livePath || livePath.has(n.id)))
      .map((n) => n.id));
  }, [query, graph.nodes, dimmedStates, layer, livePath]);

  const toggleStateDim = useCallback((state) => {
    setDimmedStates((prev) => {
      if (prev.has(state)) return new Set();
      const next = new Set();
      ['measured', 'declared', 'unreachable'].forEach((s) => { if (s !== state) next.add(s); });
      return next;
    });
  }, []);

  /* Blast radius: the closure is computed over the FULL layer graph (not the
     hop-filtered view), so the rail counts stay true even where the view is
     collapsed — the same discipline as the filter panel, whose counts also
     describe the full graph. */
  const blast = useMemo(() => {
    if (!blastOn || !selectedNodeId) return null;
    return {
      down: downstreamOf(graph.links, selectedNodeId),
      up: upstreamOf(graph.links, selectedNodeId),
    };
  }, [blastOn, selectedNodeId, graph.links]);

  /* Path finding over the FULL layer edge set (like blast). Empty array is
     a real result — "no path in this layer" — and stays distinguishable
     from "no target set" (null). */
  const pathInfo = useMemo(() => {
    if (!pathTarget || !selectedNodeId || pathTarget === selectedNodeId) return null;
    return shortestPath(graph.links, selectedNodeId, pathTarget);
  }, [pathTarget, selectedNodeId, graph.links]);

  /* A new selection invalidates the old target. */
  useEffect(() => { setPathTarget(null); }, [selectedNodeId, layer]);

  /* Blast/path highlights feed the canvas through the neighbour-outline
     channel — the SAME treatment hop highlighting already uses (P3). */
  const analysisNeighbours = useMemo(() => {
    const s = new Set();
    if (blast) {
      blast.down.forEach((id) => s.add(id));
      blast.up.forEach((id) => s.add(id));
    }
    (pathInfo || []).forEach((id) => { if (id !== selectedNodeId) s.add(id); });
    return s.size ? s : null;
  }, [blast, pathInfo, selectedNodeId]);

  /* Publish the closure upward so the node drawer can list it (the tab owns
     the links; the page owns the drawer). */
  useEffect(() => {
    onBlastChange?.(blast ? { down: [...blast.down], up: [...blast.up] } : null);
  }, [blast, onBlastChange]);

  /* Dead-surface detection (Phase 5): computed over the full layer graph,
     like the filter-panel counts. `flags` is {} on purpose — see the v2-C3 note
     in deadSurfaces.js: no honest supplier exists yet. */
  const deadSurfaces = useMemo(
    () => findDeadSurfaces({ nodes: graph.nodes, links: graph.links, jobHealth, flags: {} }),
    [graph.nodes, graph.links, jobHealth],
  );

  /* Filters compose in a fixed order inside this memo: hidden kinds drop out
     first, then hidden states, then focus-match search (when on), then the
     hop-depth collapse. The rail and filter-panel counts still describe the
     FULL graph. */
  const visible = useMemo(() => {
    let g = applyKindFilter(graphStable, hiddenKinds);
    if (offStates.size) {
      const nodes = g.nodes.filter((n) => !offStates.has(n.state));
      const present = new Set(nodes.map((n) => n.id));
      g = {
        nodes,
        links: g.links.filter((l) => present.has(endId(l.source)) && present.has(endId(l.target))),
      };
    }
    if (focusMatches && matches) {
      const nodes = g.nodes.filter((n) => matches.has(n.id));
      const present = new Set(nodes.map((n) => n.id));
      g = {
        nodes,
        links: g.links.filter((l) => present.has(endId(l.source)) && present.has(endId(l.target))),
      };
    }
    if (!selectedNodeId || hopDepth === 'all') return g;
    const keep = nodesWithinHops(g.links, selectedNodeId, Number(hopDepth));
    return {
      nodes: g.nodes.filter((n) => keep.has(n.id)),
      links: g.links.filter((l) => keep.has(endId(l.source)) && keep.has(endId(l.target))),
    };
  }, [graphStable, hiddenKinds, offStates, focusMatches, matches, selectedNodeId, hopDepth]);

  /* dagSafe existed for the retired DAG-mode layout engine, which threw on
     cycles. The raw-canvas renderer pins the infra layer to columns in its own sim
     (kgLayout) and never builds a DAG, so the cycle probe is gone with it. */

  const toggleKind = useCallback((kind) => {
    setHiddenKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  const showAllKinds = useCallback(() => setHiddenKinds(new Set()), []);

  /* Task 9 STATE chips: plain visibility toggles, unlike the INFRA status
     rail's dim-the-others semantics above. */
  const toggleStateOff = useCallback((state) => {
    setOffStates((prev) => {
      const next = new Set(prev);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  }, []);

  /* KgCanvas fits explicitly — first graph load and layer switch, both
     internal to the shell — so the old renderer's fit latch (auto-fit on
     engine stop) has no consumer left and is gone. */

  /* The drawer resolves module/model/job ids plus every INFRA kind. Mounts
     and routes have no drawer view, so the canvas focuses the camera instead
     of opening an empty panel (its handleClick does the camera work after
     this fires). */
  const DRAWER_KINDS = ['module', 'model', 'job', 'host', 'store', 'collection', 'table', 'pipe', 'source', 'surface'];
  const handleNodeClick = useCallback(
    (node, event) => {
      /* Shift-click sets the path-finding target instead of moving the
         selection — the two endpoints stay independently visible. Any node
         kind can be a target (mounts and routes included): the question is
         about connection, not drawer eligibility. */
      if (event?.shiftKey) {
        setPathTarget(node.id);
        return;
      }
      if (DRAWER_KINDS.includes(node.kind)) onSelectNode?.(node.id);
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

  /* Canvas keyboard shortcuts, split between owner and shell. KgCanvas
     handles '/', Escape, 1–4/0 hops and 'f' fit (they are canvas-local: it
     calls back through onFocusSearch/onClearSelection/onHopDepth). The tab
     keeps Enter and arrow-key navigation, which move the SELECTION through
     the visible graph and need tab state. Events bubble up from the
     focusable canvas container; anything typed into an input/select/
     textarea is left alone by both handlers. */
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
    [nodeById, selectedNodeId, handleNodeClick, moveSelection],
  );

  /* Esc / click-empty-space, reported by the canvas shell: path finding
     clears first (it is the ephemeral analysis); the selection itself is
     URL state — deleting the `node` param clears it and closes the drawer
     (LemuLogsPage syncs selection FROM the URL, same mechanism closeDrawer
     uses). */
  const handleClearSelection = useCallback(() => {
    setPathTarget(null);
    if (!selectedNodeId) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('node');
      return next;
    }, { replace: true });
  }, [selectedNodeId, setSearchParams]);

  /* Rail CLEAR (design onClearSel): query, focus, hop collapse, path
     target and the selection itself all reset in one gesture. */
  const handleClear = useCallback(() => {
    setQuery('');
    setFocusMatches(false);
    setHopDepth('all');
    setPathTarget(null);
    if (!selectedNodeId) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('node');
      return next;
    }, { replace: true });
  }, [selectedNodeId, setSearchParams]);

  /* The hairball cure (design select()): KgCanvas reports that a node was
   * selected while hop was 'all'; the tab owns hop state and collapses it. */
  const handleAutoHop = useCallback((h) => setHopDepth(h), []);

  const handleFocusSearch = useCallback(() => searchRef.current?.focus(), []);

  /* Hover tooltip content comes from the canvas as data ({ show, x, y,
     color, name, meta }); the tab renders it so styling stays with the
     page chrome. */
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, color: '#fff', name: '', meta: '' });
  const handleHover = useCallback((next) => setTip(next), []);

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

  /* Live layer-tab subtitles for the rail: `N n · M e` from the REAL
     payload of each layer, never the design's hard-coded prototype
     numbers. Both layers are built every render cycle (identity-cached),
     so the inactive tab's count stays honest while it is not shown. */
  const layerCounts = useMemo(() => ({
    infra: { nodes: infraGraph.nodes.length, edges: infraGraph.links.length },
    code: { nodes: codeGraph.nodes.length, edges: codeGraph.links.length },
  }), [infraGraph, codeGraph]);

  /* The rail's live `N hits` label: pure query matches over the whole
     layer graph — the state-dimming / live-path overlays that shape the
     `matches` set must not pollute it. */
  const hitCount = useMemo(
    () => countQueryMatches(graph.nodes, query),
    [graph.nodes, query],
  );

  const summary = layer === 'infra' ? topology?.summary : null;
  const degraded = layer === 'infra' ? (topology?.degraded || []) : [];

  /* Empty payload (plan Task 12): distinguish "the endpoint returned zero
     nodes" — a real product state, LemuGraphEmpty — from "filters hid
     everything", which is the table/canvas's own empty hint. Judged on the
     UNFILTERED layer graph, and only when a payload actually arrived: a
     null payload (still loading, or the fetch failed) is not "no graph on
     record". */
  const payloadEmpty = layer === 'infra'
    ? Boolean(topology) && Array.isArray(topology.nodes) && topology.nodes.length === 0
    : graph.nodes.length === 0;

  /* A fresh topology payload re-arms the degraded strip even after the
     operator dismissed an earlier one. */
  useEffect(() => { setDegradedDismissed(false); }, [topology?.generatedAt]);

  /* Attribution quality headline (v2-F3): the Phase-4 acceptance metric,
     visible at all times rather than buried in a one-off measurement.
     Counted from the groups themselves — not byNode, which has no quality
     dimension. Clicking the chip (or the unattributed line beside it)
     switches to the Errors tab. */
  const attributionQuality = useMemo(() => {
    const q = { exact: 0, file: 0, none: 0 };
    (errorAttribution?.groups || []).forEach((g) => {
      if (g.matchQuality === 'exact') q.exact += 1;
      else if (g.matchQuality === 'file') q.file += 1;
      else q.none += 1;
    });
    return q;
  }, [errorAttribution]);
  const unattributedCount = errorAttribution?.unattributed?.length || 0;
  const openErrors = useCallback(() => onOpenErrors?.(), [onOpenErrors]);

  // Snapshot is a 2D-only control (spec §4.3-4: incident-report capture of
  // the canvas); the canvas publishes the actual handler through snapshotRef.
  const handleSnapshot = useCallback(() => snapshotRef.current?.(), []);

  if (!manifest) {
    return (
      <div ref={graphRootRef} className={`lemu-graph3d${theme === 'light' ? ' lemu-graph3d--light' : ''}`}>
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
    <div
      ref={graphRootRef}
      className={`lemu-graph3d${payloadEmpty ? ' lemu-graph3d--graph-empty' : ''}${theme === 'light' ? ' lemu-graph3d--light' : ''}`}
    >
      <LemuGraphControls
        query={query}
        onQuery={setQuery}
        searchRef={searchRef}
        matchCount={hitCount}
        onClear={handleClear}
        layerCounts={layerCounts}
        showRoutes={showRoutes}
        onShowRoutes={setShowRoutes}
        routeCount={(manifest.routes || []).length}
        hopDepth={hopDepth}
        onHopDepth={setHopDepth}
        hasSelection={!!selectedNodeId}
        onFit={() => fitRef.current?.()}
        focusMatches={focusMatches}
        onFocusMatches={setFocusMatches}
        blastOn={blastOn}
        onBlast={setBlastOn}
        mode={mode}
        onMode={setMode}
        layer={layer}
        onLayer={setLayer}
        view={view}
        onView={setView}
        showSnapshot={view === 'graph'}
        onSnapshot={handleSnapshot}
        versions={(manifests || []).filter((m) => m.version !== manifest?.version)}
        diffVersion={diffVersion}
        onDiffVersion={setDiffVersion}
        livePathOn={livePathOn}
        onLivePath={setLivePathOn}
        theme={theme}
        onTheme={setTheme}
      />

      {/* Task 9 filter panel: state + kind visibility chips, counts from
          the WHOLE layer graph so a filter shows what it is hiding. */}
      <LemuGraphFilters
        nodes={graph.nodes}
        offStates={offStates}
        onToggleState={toggleStateOff}
        offKinds={hiddenKinds}
        onToggleKind={toggleKind}
        onShowAllKinds={showAllKinds}
      />

      {/* INFRA status rail: payload summary as chips. Clicking one dims the
          other states through the search-opacity channel (see `matches`). */}
      {view === 'graph' && summary && (
        <div className="lemu-graph3d__statusrail lemu-graph3d__panel" role="group" aria-label="Node states">
          {[
            ['measured', '●'],
            ['declared', '○'],
            ['unreachable', '⊘'],
          ].map(([state, mark]) => (
            <button
              key={state}
              type="button"
              data-state={state}
              className={`lemu-graph3d__statechip${dimmedStates.has(state) ? '' : ' lemu-graph3d__statechip--on'}`}
              aria-pressed={!dimmedStates.has(state)}
              title={`Dim the other states (${state} stays bright)`}
              onClick={() => toggleStateDim(state)}
            >
              <i aria-hidden="true">{mark}</i> {state} <b>{summary[state] ?? 0}</b>
            </button>
          ))}
        </div>
      )}

      {/* Attribution quality rail: the honest headline of Phase 4 — how many
          errors resolve to a function (exact), to a file only (file), or to
          nothing (none). Same chip styling as the state rail above; clicking
          switches to the Errors tab. The unattributed line shares the click
          target: an error shown as unattributable beats one silently dropped. */}
      {view === 'graph' && (errorAttribution?.groups?.length > 0) && (
        <div className="lemu-graph3d__attribrail lemu-graph3d__panel" role="group" aria-label="Error attribution quality">
          <button
            type="button"
            className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
            title="Open the Errors tab"
            onClick={openErrors}
          >
            <i aria-hidden="true">⚠</i> exact <b>{attributionQuality.exact}</b>
            {' · '}file <b>{attributionQuality.file}</b>
            {' · '}none <b>{attributionQuality.none}</b>
          </button>
          {unattributedCount > 0 && (
            <button
              type="button"
              className="lemu-graph3d__statechip lemu-graph3d__statechip--on"
              title="Open the Errors tab"
              onClick={openErrors}
            >
              {unattributedCount} error{unattributedCount === 1 ? '' : 's'} could not be attributed
            </button>
          )}
        </div>
      )}

      {/* Analysis rail (Phase 5): one chip per active analysis, stacked under
          the attribution rail — readouts, not alarms, reusing statechip
          styling. */}
      {view === 'graph' && (blast || pathInfo || diffOverlay || livePath) && (
        <div className="lemu-graph3d__analysisrail lemu-graph3d__panel" role="group" aria-label="Analysis readouts">
          {livePath && (
            <span className="lemu-graph3d__statechip lemu-graph3d__statechip--on" data-analysis="livepath">
              <i aria-hidden="true">⌁</i> live path: <b>{livePath.size}</b> measured nodes lit
            </span>
          )}
          {diffOverlay && (
            <span className="lemu-graph3d__statechip lemu-graph3d__statechip--on" data-analysis="diff">
              <i aria-hidden="true">±</i> diff (v{diffVersion}): <b>{diffOverlay.counts.added}</b> added · <b>{diffOverlay.counts.changed}</b> changed · <b>{diffOverlay.counts.removed}</b> removed
            </span>
          )}
          {blast && (
            <span className="lemu-graph3d__statechip lemu-graph3d__statechip--on" data-analysis="blast">
              <i aria-hidden="true">◉</i> blast: <b>{blast.down.size}</b> downstream · <b>{blast.up.size}</b> upstream
            </span>
          )}
          {pathInfo && (pathInfo.length > 0 ? (
            <span className="lemu-graph3d__statechip lemu-graph3d__statechip--on" data-analysis="path">
              <i aria-hidden="true">→</i> path: <b>{pathInfo.length - 1}</b> hop{pathInfo.length - 1 === 1 ? '' : 's'}
            </span>
          ) : (
            /* [] is a real answer: the layers have different edge sets, so
               the copy names the layer rather than claiming disconnection. */
            <span className="lemu-graph3d__statechip lemu-graph3d__statechip--on" data-analysis="path">
              <i aria-hidden="true">∅</i> no path in this layer
            </span>
          ))}
        </div>
      )}

      {/* Degraded strip: every measurement the backend could not complete is
          named here instead of failing silently (spec §3.3). Dismissible,
          re-armed by the next payload. */}
      {view === 'graph' && degraded.length > 0 && !degradedDismissed && (
        <div className="lemu-graph3d__degraded lemu-graph3d__panel" role="alert">
          {degraded.map((d, i) => (
            <span key={i}>
              <code>{d.step}</code> — {d.reason}
              {d.affects?.length ? ` (affects ${d.affects.length})` : ''}
            </span>
          ))}
          <button
            type="button"
            className="lemu-graph3d__degraded-x"
            onClick={() => setDegradedDismissed(true)}
            aria-label="Dismiss degraded report"
          >
            ×
          </button>
        </div>
      )}

      {/* Collapsible key removed with the Task 9 filter panel: kind chips,
          state glyphs and counts now live in .lemu-kgfilt (bottom-left),
          and the layer tabs carry the edge count. */}

      {payloadEmpty ? (
        /* The endpoint answered with zero nodes: the empty state owns the
           canvas region while the chrome dims behind it (see
           .lemu-graph3d--graph-empty). The real failure context comes from
           the payload's degraded[]; REBUILD MANIFEST is §0 C4's nearest real
           action. */
        <LemuGraphEmpty
          generatedAt={topology?.generatedAt ?? null}
          degraded={topology?.degraded ?? []}
        />
      ) : view === 'table' ? (
        /* The table and the canvas never mount at the same time (perf). */
        <LemuGraphTable
          graph={visible}
          onSelectNode={handleTableSelect}
          selectedNodeId={selectedNodeId}
          totalCount={graph.nodes.length}
          measuredAt={manifest?.createdAt ?? null}
          onFocusSearch={handleFocusSearch}
          onClear={handleClear}
          onHopDepth={setHopDepth}
        />
      ) : (
        <div onKeyDown={handleCanvasKeyDown}>
          <GraphErrorBoundary>
            <KgCanvas
              graph={visible}
              layer={layer}
              mode={mode}
              theme={theme}
              selectedNodeId={selectedNodeId}
              hopDepth={hopDepth}
              matches={matches}
              neighbours={analysisNeighbours}
              overlay={overlayMarks}
              query={query}
              focusMatches={focusMatches}
              drawerOpen={!!selectedNodeId}
              motion
              onSelect={handleNodeClick}
              onAutoHop={handleAutoHop}
              onHover={handleHover}
              onClearSelection={handleClearSelection}
              onHopDepth={setHopDepth}
              onFocusSearch={handleFocusSearch}
              fitRef={fitRef}
              focusRef={focusRef}
              snapshotRef={snapshotRef}
              instanceRef={instanceRef}
            />
          </GraphErrorBoundary>
          {tip.show && (
            /* Canvas-local coords from the shell (design: mx+52, my+44);
               the overlay spans the canvas region and ignores the pointer. */
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div
                className="lemu-graph3d__hint"
                role="status"
                style={{
                  left: tip.x,
                  top: tip.y,
                  borderLeft: `3px solid ${tip.color}`,
                }}
              >
                <strong>{tip.name}</strong>
                <span className="lemu-meta">{tip.meta}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time scrubber, docked bottom-centre above the footer rail. */}
      {view === 'graph' && pulseBuckets.length > 0 && (
        <LemuTimeScrubber buckets={pulseBuckets} value={scrubIndex} onChange={setScrubIndex} />
      )}

      {/* Standing dead-surface panel, docked under the graph (right side).
          Rows click through to the node via the same selection mechanism
          as a sphere click. */}
      {view === 'graph' && (
        <LemuDeadSurfaces surfaces={deadSurfaces} onSelectNode={(id) => onSelectNode?.(id)} />
      )}

      <p className="lemu-meta lemu-graph3d__foot lemu-graph3d__rail">
        {layer === 'infra'
          ? 'Colour encodes kind; rings encode state (solid measured, hollow declared, fault unreachable); particles mark the CDC spine.'
          : 'Drag to rotate, scroll to zoom, click a sphere to focus it — modules, models and jobs also open in the node drawer. Colour encodes kind; particles along an edge mean recent traffic.'}
        {scrubbedBucket ? (
          /* Scrubbed into the past is a user choice, not staleness — the
             dot reads neutral grey and the label names the shown moment
             instead of an age. */
          <span
            className="lemu-graph3d__fresh lemu-graph3d__fresh--showing"
            aria-live="off"
            title={`Showing activity at ${new Date(scrubbedBucket.bucketStart).toLocaleString()}`}
          >
            <i className="lemu-graph3d__fresh-dot" aria-hidden="true" />
            showing {new Date(scrubbedBucket.bucketStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        ) : dataUpdatedAt && (
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
