import { useCallback, useEffect, useMemo, useRef } from 'react';
import { activityAtBucket, buildActivity } from '../buildActivity';
import { buildCodeGraph } from '../buildCodeGraph';
import { buildTopologyGraph } from '../useTopologyGraph';
import { downstreamOf, upstreamOf } from '../blastRadius';
import { shortestPath } from '../shortestPath';
import { findDeadSurfaces } from '../deadSurfaces';
import { overlayFromDiff, ghostNode } from '../diffOverlay';
import { healthyPathSet } from '../healthyPath';
import { composeVisible } from '../graphFilterCompose';
import { analysisNeighbourSet } from '../graphSelection';

/* LemuGraphTab's graph pipeline: activity -> layer graph (identity-cached)
   -> error counts -> diff overlay -> scrub-stable graph, plus the analyses
   computed over it (matches, live path, blast, path, dead surfaces) and the
   filtered `visible` graph the canvas and table render. */
export const useGraphModel = ({
  manifest,
  liveness,
  jobHealth,
  topology,
  errorAttribution,
  diffsByVersion,
  selectedNodeId,
  onBlastChange,
  scrubbedBucket,
  showRoutes,
  layer,
  diffVersion,
  livePathOn,
  query,
  dimmedStates,
  setDimmedStates,
  blastOn,
  pathTarget,
  setPathTarget,
  hiddenKinds,
  offStates,
  focusMatches,
  hopDepth,
}) => {
  /* Liveness keys collections by collection name, so model nodes are matched
     through modelName -> collectionName. Until the DB pulse is recording, every
     collection reads as idle and the graph is structurally correct but static —
     that is a data problem upstream, not a rendering one.

     While scrubbing, the single bucket at the scrub position REPLACES the
     24h rollup — same Map shape, so the code graph and its identity cache
     consume it unchanged. */
  const activity = useMemo(
    () =>
      scrubbedBucket
        ? activityAtBucket(scrubbedBucket, manifest)
        : buildActivity({ manifest, liveness, jobHealth }),
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
      graphBase.nodes.forEach((n) => {
        delete n.errorCount;
        delete n.errorOccurrences;
      });
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
      const sameShape =
        prev.nodes.length === effectiveGraph.nodes.length &&
        prev.links.length === effectiveGraph.links.length &&
        prev.nodes.every((n) => nextById.has(n.id));
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
    return new Set(
      graph.nodes
        .filter(
          (n) =>
            (!q || n.id.toLowerCase().includes(q)) &&
            (!dim || !dim.size || !dim.has(n.state)) &&
            (!livePath || livePath.has(n.id)),
        )
        .map((n) => n.id),
    );
  }, [query, graph.nodes, dimmedStates, layer, livePath]);

  const toggleStateDim = useCallback(
    (state) => {
      setDimmedStates((prev) => {
        if (prev.has(state)) return new Set();
        const next = new Set();
        ['measured', 'declared', 'unreachable'].forEach((s) => {
          if (s !== state) next.add(s);
        });
        return next;
      });
    },
    [setDimmedStates],
  );

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
  useEffect(() => {
    setPathTarget(null);
  }, [selectedNodeId, layer, setPathTarget]);

  /* Blast/path highlights feed the canvas through the neighbour-outline
     channel — the SAME treatment hop highlighting already uses (P3). */
  const analysisNeighbours = useMemo(
    () => analysisNeighbourSet(blast, pathInfo, selectedNodeId),
    [blast, pathInfo, selectedNodeId],
  );

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

  /* Filters compose in a fixed order inside graphFilterCompose: hidden kinds
     drop out first, then hidden states, then focus-match search (when on),
     then the hop-depth collapse. The rail and filter-panel counts still
     describe the FULL graph. */
  const visible = useMemo(
    () =>
      composeVisible(graphStable, {
        hiddenKinds,
        offStates,
        focusMatches,
        matches,
        selectedNodeId,
        hopDepth,
      }),
    [graphStable, hiddenKinds, offStates, focusMatches, matches, selectedNodeId, hopDepth],
  );

  return {
    codeGraph,
    infraGraph,
    graph,
    overlayMarks,
    diffOverlay,
    livePath,
    matches,
    toggleStateDim,
    blast,
    pathInfo,
    analysisNeighbours,
    deadSurfaces,
    visible,
  };
};
