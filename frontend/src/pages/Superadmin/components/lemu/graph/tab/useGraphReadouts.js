import { useCallback, useEffect, useMemo, useState } from 'react';
import { countQueryMatches } from '../graphPanelCounts';
import { formatUnattributed } from '../unattributedReasons';
import { rankIncidents, urgencyByNode } from '../incidentRank';

/* LemuGraphTab's readouts: hover tooltip, data freshness, layer and hit
   counts, ranked incidents, the degraded/empty payload flags and the
   attribution-quality headline. */
export const useGraphReadouts = ({
  dataUpdatedAt,
  errorAttribution,
  topology,
  onSelectNode,
  onOpenErrors,
  layer,
  query,
  graph,
  infraGraph,
  codeGraph,
  nodeById,
  focusRef,
  snapshotRef,
  setDegradedDismissed,
}) => {
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
  const layerCounts = useMemo(
    () => ({
      infra: { nodes: infraGraph.nodes.length, edges: infraGraph.links.length },
      code: { nodes: codeGraph.nodes.length, edges: codeGraph.links.length },
    }),
    [infraGraph, codeGraph],
  );

  /* The rail's live `N hits` label: pure query matches over the whole
     layer graph — the state-dimming / live-path overlays that shape the
     `matches` set must not pollute it. */
  const hitCount = useMemo(() => countQueryMatches(graph.nodes, query), [graph.nodes, query]);

  /* Incident urgency (I4): rank the attributed, unresolved error groups
     (severity → blast radius → age — see incidentRank) and map node id →
     visual weight. The canvas draws the weight; the companion list renders
     the same ranked objects. `now` is the 5s ticker above, so ages stay
     honest without an extra timer. */
  const incidents = useMemo(
    () => rankIncidents(errorAttribution?.groups || [], now),
    [errorAttribution, now],
  );
  const urgency = useMemo(() => urgencyByNode(incidents), [incidents]);

  /* Row click in the incident list: select the node (opens the drawer, same
     as a sphere click) and fly the camera when the node is in the current
     view. A node hidden by the hop filter has no laid-out position to fly
     to — selecting still opens its drawer, and the canvas keeps pulsing it
     the moment the view includes it again. */
  const handleIncidentFocus = useCallback(
    (id) => {
      onSelectNode?.(id);
      const node = nodeById.get(id);
      if (node) focusRef.current?.(node);
    },
    [nodeById, onSelectNode, focusRef],
  );

  const summary = layer === 'infra' ? topology?.summary : null;
  const degraded = layer === 'infra' ? topology?.degraded || [] : [];

  /* Empty payload (plan Task 12): distinguish "the endpoint returned zero
     nodes" — a real product state, LemuGraphEmpty — from "filters hid
     everything", which is the table/canvas's own empty hint. Judged on the
     UNFILTERED layer graph, and only when a payload actually arrived: a
     null payload (still loading, or the fetch failed) is not "no graph on
     record". */
  const payloadEmpty =
    layer === 'infra'
      ? Boolean(topology) && Array.isArray(topology.nodes) && topology.nodes.length === 0
      : graph.nodes.length === 0;

  /* A fresh topology payload re-arms the degraded strip even after the
     operator dismissed an earlier one. */
  useEffect(() => {
    setDegradedDismissed(false);
  }, [topology?.generatedAt, setDegradedDismissed]);

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
  const unattributedLabel = useMemo(
    () =>
      formatUnattributed({
        count: unattributedCount,
        reasons: errorAttribution?.unattributedReasons || null,
      }),
    [unattributedCount, errorAttribution],
  );
  const openErrors = useCallback(() => onOpenErrors?.(), [onOpenErrors]);

  // Snapshot is a 2D-only control (spec §4.3-4: incident-report capture of
  // the canvas); the canvas publishes the actual handler through snapshotRef.
  const handleSnapshot = useCallback(() => snapshotRef.current?.(), [snapshotRef]);

  return {
    tip,
    handleHover,
    freshAgeSec,
    freshState,
    layerCounts,
    hitCount,
    incidents,
    urgency,
    handleIncidentFocus,
    summary,
    degraded,
    payloadEmpty,
    attributionQuality,
    unattributedCount,
    unattributedLabel,
    openErrors,
    handleSnapshot,
  };
};
