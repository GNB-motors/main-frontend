import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LemuService } from '../../../LemuService';
import { applyGraphParams } from '../graphUrlSync';
import { initViewState } from '../graphViewState';
import { sortPulseBuckets } from '../pulseBuckets';
import { readStoredTheme, writeStoredTheme, applyThemeVars, clearThemeVars } from '../graphTheme';

/* LemuGraphTab's own state: view/filter/analysis state (URL-seeded once),
   the degraded popover, the theme, the URL write-back, the pulse history
   for the scrubber and the on-demand diff fetch. */
export const useGraphTabState = ({ onThemeChange, diffStatusByVersion, onLoadDiff }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fitRef = useRef(null);
  const focusRef = useRef(null);
  const snapshotRef = useRef(null);
  const searchRef = useRef(null);

  /* View state reads the URL exactly once at mount (graphViewState owns the
     parsing rules) and is written back on change by the sync effect.
     hiddenKinds and focusMatches are ephemeral and stay out of the URL
     deliberately. */
  const [initialView] = useState(() => initViewState(searchParams));
  const [view, setView] = useState(initialView.view);
  const [query, setQuery] = useState(initialView.query);
  const [showRoutes, setShowRoutes] = useState(false);
  const [hopDepth, setHopDepth] = useState(initialView.hopDepth);
  const [focusMatches, setFocusMatches] = useState(false);
  const [hiddenKinds, setHiddenKinds] = useState(() => new Set());
  /* State visibility (plan Task 9): nodes whose state is in offStates drop
     out of the visible graph, exactly like hiddenKinds. Nodes that carry no
     state (the CODE layer) are never matched, so state filtering is a
     no-op there — absence is not hidden. */
  const [offStates, setOffStates] = useState(() => new Set());
  const [mode, setMode] = useState(initialView.mode);
  /* The layer switch: CODE is the manifest dependency graph, INFRA is the
     topology board (hosts -> stores -> collections -> CDC -> tables). Read
     once at mount like the other view params; the default is deleted from
     the URL by the sync effect below. */
  const [layer, setLayer] = useState(initialView.layer);
  /* State-rail dimming (INFRA layer): clicking a summary chip dims every
     OTHER state through the SAME opacity channel as search — P3, no new
     colour meaning. */
  const [dimmedStates, setDimmedStates] = useState(() => new Set());
  const [degradedDismissed, setDegradedDismissed] = useState(false);
  /* Degraded detail popover (r2): which strip chip is expanded, if any.
     Escape or click-outside closes; rows are built by degradedExplain from
     the entry's REAL fields only (§0 C3). */
  const [degradedOpenIdx, setDegradedOpenIdx] = useState(null);
  const degradedStripRef = useRef(null);
  useEffect(() => {
    if (degradedOpenIdx == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setDegradedOpenIdx(null);
    };
    const onDown = (e) => {
      if (degradedStripRef.current && !degradedStripRef.current.contains(e.target)) {
        setDegradedOpenIdx(null);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [degradedOpenIdx]);
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
     persists best-effort via graphTheme's storage layer — see
     graphTheme.readStoredTheme. */
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

  /* Publish the theme outward so the page-level node drawer (rendered OUTSIDE
     this component, sibling to it) follows the board's theme — without this
     the drawer stays on its dark default in light theme and reads as a dark
     ghost against the light board. */
  useEffect(() => {
    if (onThemeChange) onThemeChange(theme);
  }, [theme, onThemeChange]);

  /* Write-on-change URL sync. Defaults are deleted to keep shared URLs short.

     The mount run is SKIPPED, and that skip is load-bearing. Every value this
     effect writes (view/hopDepth/query/mode) was initialised FROM the URL by
     the lazy initializers above, so writing them back on mount is by
     construction either a no-op or a corruption — never useful.

     The corruption this guards against: the merge must start from the LIVE
     URL, not a render-captured searchParams snapshot. setSearchParams
     functional updaters receive React Router's closed-over snapshot, which
     can predate another writer's param in the same event — a canvas click's
     node= (openNode) followed by this effect firing for the auto-hop it
     triggered used to echo the stale snapshot and clobber node=, losing the
     selection. applyGraphParams reads window.location.search at effect time,
     so concurrent writers survive (see graphUrlSync.js). */
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    setSearchParams(
      applyGraphParams(window.location.search, { view, hopDepth, query, mode, layer }),
      { replace: true },
    );
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
        setPulseBuckets(sortPulseBuckets(d));
      })
      // The pulse strip is decoration; the graph works without it.
      .catch(() => {});
    return () => {
      alive = false;
    };
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

  return {
    setSearchParams,
    fitRef,
    focusRef,
    snapshotRef,
    searchRef,
    view,
    setView,
    query,
    setQuery,
    showRoutes,
    setShowRoutes,
    hopDepth,
    setHopDepth,
    focusMatches,
    setFocusMatches,
    hiddenKinds,
    setHiddenKinds,
    offStates,
    setOffStates,
    mode,
    setMode,
    layer,
    setLayer,
    dimmedStates,
    setDimmedStates,
    degradedDismissed,
    setDegradedDismissed,
    degradedOpenIdx,
    setDegradedOpenIdx,
    degradedStripRef,
    blastOn,
    setBlastOn,
    pathTarget,
    setPathTarget,
    pulseBuckets,
    scrubIndex,
    setScrubIndex,
    diffVersion,
    setDiffVersion,
    livePathOn,
    setLivePathOn,
    theme,
    setTheme,
    graphRootRef,
    scrubbedBucket,
  };
};
