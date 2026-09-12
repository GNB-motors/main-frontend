import { useCallback, useEffect, useMemo, useState } from 'react';
import { LemuService } from '../../LemuService';
import { deriveRouteModule, nodeId, routePulseKey } from '../utils';

/* Shared data layer for the LEMU knowledge graph.

   Extracted from LemuLogsPage when the graph was promoted from an embedded
   tab to its own /superadmin/graph route: everything the graph (and the node
   drawer it opens) needs — topology polling, attribution, versions/diff, job
   health, findings — lives here so BOTH the standalone LemuGraphPage and
   LemuLogsPage (whose System tab still opens the drawer) read the same
   payload shapes and poll on the same cadence.

   The loaders, failure semantics and the 30s visibility-gated poll are
   copied verbatim from the old LemuLogsPage implementation. */

export const INFRA_KINDS = ['host', 'store', 'collection', 'table', 'pipe', 'source', 'surface'];

export const useLemuGraphData = () => {
  /* ── Manifest (CODE layer source) ── */
  const [manifest, setManifest] = useState(null);
  const [manifestStatus, setManifestStatus] = useState('loading');

  /* ── Pulse + liveness ── */
  const [pulse, setPulse] = useState(null);
  const [pulseStatus, setPulseStatus] = useState('loading');
  // Wide-window last-seen per route/collection — distinguishes "quiet this
  // hour" from "no signal all day". Null until loaded; the map degrades to
  // pulse-only behaviour without it.
  const [liveness, setLiveness] = useState(null);
  // INFRA topology payload ({nodes, edges, degraded, summary}).
  const [topology, setTopology] = useState(null);
  // Error attribution (Phase 4): error groups joined to manifest functions,
  // with byNode rollups for the graph pips.
  const [errorAttribution, setErrorAttribution] = useState(null);
  // Stamp of the last successful liveness fetch — drives the graph's
  // freshness dot. Unset until the first success; a failed poll never moves it.
  const [dataUpdatedAt, setDataUpdatedAt] = useState(null);

  /* ── Findings + manifest versions/diffs ── */
  const [findings, setFindings] = useState(null);
  const [findingsStatus, setFindingsStatus] = useState('loading');
  const [manifests, setManifests] = useState([]);
  const [manifestsStatus, setManifestsStatus] = useState('loading');
  const [diffsByVersion, setDiffsByVersion] = useState({});
  // Per-version fetch lifecycle: undefined = idle, 'loading' | 'ready' | 'error'.
  // Kept separate from the diff payload so a failed fetch can never render as
  // "no changes" (and vice versa).
  const [diffStatusByVersion, setDiffStatusByVersion] = useState({});

  /* ── Job health ── */
  const [jobs, setJobs] = useState([]);
  const [jobsCheckedAt, setJobsCheckedAt] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  /* ── Loaders ── */
  const loadManifest = useCallback(async (silent = false) => {
    if (!silent) setManifestStatus('loading');
    try {
      const data = await LemuService.getManifest();
      setManifest(data.data || null);
      setManifestStatus('live');
    } catch {
      setManifestStatus('error');
    }
  }, []);

  const loadPulse = useCallback(async (silent = false) => {
    if (!silent) setPulseStatus('loading');
    try {
      const data = await LemuService.getPulse({ limit: 60 });
      setPulse(data.data || null);
      setPulseStatus('live');
    } catch {
      setPulseStatus('error');
    }
  }, []);

  const loadLiveness = useCallback(async () => {
    try {
      const data = await LemuService.getLiveness({ windowHours: 24 });
      setLiveness(data.data || null);
      setDataUpdatedAt(Date.now());
    } catch {
      // Liveness is an enhancement layer — pulse heat still renders without it.
      setLiveness(null);
    }
  }, []);

  /* INFRA topology for the graph's Infra layer. Refreshed by the same
     30s poll as liveness; a failure degrades the layer to "no board" rather
     than failing the page. */
  const loadTopology = useCallback(async () => {
    try {
      const data = await LemuService.getTopology();
      setTopology(data.data || null);
    } catch {
      setTopology(null);
    }
  }, []);

  /* Error attribution — the drawer's error rows and the graph's pips read
     this ONE payload. Failure degrades to "no attribution", never an error. */
  const loadErrorAttribution = useCallback(async () => {
    try {
      const data = await LemuService.getErrorAttribution();
      setErrorAttribution(data.data || null);
    } catch {
      setErrorAttribution(null);
    }
  }, []);

  const loadFindings = useCallback(async (silent = false) => {
    if (!silent) setFindingsStatus('loading');
    try {
      const data = await LemuService.getFindings();
      setFindings(data.data || null);
      setFindingsStatus('live');
    } catch {
      setFindingsStatus('error');
    }
  }, []);

  const loadManifests = useCallback(async (silent = false) => {
    if (!silent) setManifestsStatus('loading');
    try {
      const data = await LemuService.getManifests({ page: 1, limit: 20 });
      setManifests(data.data?.records || []);
      setManifestsStatus('live');
    } catch {
      setManifestsStatus('error');
    }
  }, []);

  const loadManifestDiff = useCallback(async (version) => {
    setDiffStatusByVersion((prev) => ({ ...prev, [version]: 'loading' }));
    try {
      const data = await LemuService.getManifestDiff(version);
      setDiffsByVersion((prev) => ({ ...prev, [version]: data.data || null }));
      setDiffStatusByVersion((prev) => ({ ...prev, [version]: 'ready' }));
    } catch {
      // Leave the diff itself absent — status alone drives the error UI.
      setDiffStatusByVersion((prev) => ({ ...prev, [version]: 'error' }));
    }
  }, []);

  const rebuildManifest = useCallback(async () => {
    try {
      await LemuService.rebuildManifest();
      await loadManifest();
    } catch {
      setManifestStatus('error');
    }
  }, [loadManifest]);

  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setJobsLoading(true);
    setJobsError('');
    try {
      const data = await LemuService.getJobs();
      setJobs(data.data || []);
      setJobsCheckedAt(data.checkedAt || null);
    } catch (e) {
      setJobsError(e.detail || e.message || 'Failed to load job health');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  /* Initial loads */
  useEffect(() => { loadManifest(); }, [loadManifest]);
  useEffect(() => { loadPulse(); }, [loadPulse]);
  useEffect(() => {
    loadLiveness();
    loadTopology();
    loadErrorAttribution();
    /* Live poll: liveness + job health + topology + error attribution every
       30s so the graph's numbers stay honest. Paused while the document is
       hidden — no catch-up ticks. Jobs load silently so the poll never fires
       a spinner storm. */
    const visibleRef = { current: document.visibilityState === 'visible' };
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibility);
    const t = setInterval(() => {
      if (!visibleRef.current) return;
      loadLiveness();
      loadJobs(true);
      loadTopology();
      loadErrorAttribution();
    }, 30 * 1000);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadLiveness, loadJobs, loadTopology, loadErrorAttribution]);
  useEffect(() => { loadFindings(); }, [loadFindings]);
  useEffect(() => { loadManifests(); }, [loadManifests]);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  /* Manifest-derived state (freshness ribbon counts for the drawer). */
  const findingIds = useMemo(() => {
    const ids = new Set();
    (findings?.untenantedRoutes || []).forEach((r) => ids.add(nodeId.route(r)));
    (findings?.uninstrumentedJobs || []).forEach((j) => ids.add(nodeId.job(j)));
    (findings?.modelsWithoutCollection || []).forEach((m) => ids.add(`model:${m}`));
    (findings?.collectionsWithoutModel || []).forEach((c) => ids.add(`collection:${c}`));
    return ids;
  }, [findings]);

  /* Silent refresh of the slow-moving Layer-3 payloads (auto-refresh /
     Refresh button). */
  const refreshLayer3 = useCallback((silent = true) => {
    loadManifest(silent);
    loadPulse(silent);
    loadFindings(silent);
    loadManifests(silent);
  }, [loadManifest, loadPulse, loadFindings, loadManifests]);

  return {
    manifest,
    manifestStatus,
    pulse,
    pulseStatus,
    liveness,
    topology,
    errorAttribution,
    dataUpdatedAt,
    findings,
    findingsStatus,
    findingIds,
    manifests,
    manifestsStatus,
    diffsByVersion,
    diffStatusByVersion,
    loadManifestDiff,
    rebuildManifest,
    jobs,
    jobsCheckedAt,
    jobsLoading,
    jobsError,
    loadJobs,
    refreshLayer3,
  };
};

/* Resolve a selected node ID to a node object + kind + pulse series.

   INFRA kinds resolve from the topology payload — those nodes carry
   state/evidence/metrics, which is what the drawer's evidence block
   renders. `job:` stays on the manifest branch but picks up the topology
   row (`_topo`) so its state is visible there too. */
export const useLemuSelectedNode = ({ selectedNodeId, manifest, pulse, jobs, topology }) => {
  const functionsByName = useMemo(() => {
    const map = {};
    (manifest?.functions || []).forEach((fn) => { map[fn.functionName] = fn; });
    return map;
  }, [manifest]);

  return useMemo(() => {
    if (!selectedNodeId || !manifest) return null;
    const kind = selectedNodeId.split(':')[0];

    if (INFRA_KINDS.includes(kind)) {
      const topoNode = (topology?.nodes || []).find((n) => n.id === selectedNodeId);
      if (!topoNode) return null;
      return { kind, node: { ...topoNode, _id: selectedNodeId }, pulseSeries: null };
    }

    if (kind === 'route') {
      const route = (manifest.routes || []).find((r) => nodeId.route(r) === selectedNodeId);
      if (route) {
        const pulseSeries = (pulse?.buckets || []).map((b) => {
          const r = (b.routes || []).find((x) => x.key === routePulseKey(route));
          return r || { n: 0, err: 0 };
        });
        return { kind: 'route', node: { ...route, _id: selectedNodeId, _module: deriveRouteModule(route, functionsByName) }, pulseSeries };
      }
    }

    if (kind === 'model') {
      const model = (manifest.models || []).find((m) => nodeId.model(m) === selectedNodeId);
      if (model) {
        const pulseSeries = (pulse?.buckets || []).map((b) => {
          const c = (b.collections || []).find((x) => x.name === model.collectionName);
          return c || { find: 0, insert: 0, update: 0, del: 0, agg: 0 };
        });
        return { kind: 'model', node: { ...model, _id: selectedNodeId }, pulseSeries };
      }
    }

    if (kind === 'job') {
      const job = (manifest.jobs || []).find((j) => nodeId.job(j) === selectedNodeId);
      if (job) {
        const health = (jobs || []).find((j) => j.job === job.name) || {};
        const topoJob = (topology?.nodes || []).find((n) => n.id === selectedNodeId);
        return { kind: 'job', node: { ...job, _id: selectedNodeId, _topo: topoJob }, pulseSeries: { _health: health } };
      }
    }

    if (kind === 'module') {
      const module = (manifest.modules || []).find((m) => nodeId.module(m) === selectedNodeId);
      if (module) {
        const routes = (manifest.routes || []).filter((r) => deriveRouteModule(r, functionsByName) === module.name);
        const funcs = (manifest.functions || []).filter((f) => f.module === module.name);
        return { kind: 'module', node: { ...module, _id: selectedNodeId, _routes: routes, _functions: funcs }, pulseSeries: [] };
      }
    }

    /* A well-formed id that resolves to nothing in the current manifest still
       gets an honest name-only drawer — diff ghosts and stale deep links land
       here. INFRA kinds keep the null above: their absence means the topology
       has no such node. */
    if (['model', 'job', 'module', 'route'].includes(kind)) {
      return { kind, node: { _id: selectedNodeId, label: selectedNodeId.slice(kind.length + 1), _unresolved: true }, pulseSeries: null };
    }

    return null;
  }, [selectedNodeId, manifest, pulse, jobs, functionsByName, topology]);
};
