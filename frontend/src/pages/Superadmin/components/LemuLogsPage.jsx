import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Flag,
  Map,
  RefreshCw,
  ScrollText,
  Server,
  ToggleRight,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import { LemuService } from './LemuService';
import LemuStatsStrip from './lemu/LemuStatsStrip';
import LemuJobsPanel from './lemu/LemuJobsPanel';
import LemuLogsExplorer from './lemu/LemuLogsExplorer';
import LemuErrorsInbox from './lemu/LemuErrorsInbox';
import LemuFlagsTab from './lemu/LemuFlagsTab';
import LemuFindingsRibbon from './lemu/LemuFindingsRibbon';
import LemuSystemMap from './lemu/LemuSystemMap';
import LemuNodeDrawer from './lemu/LemuNodeDrawer';
import LemuChangeFeed from './lemu/LemuChangeFeed';
import { deriveRouteModule, nodeId, relativeTime, routePulseKey } from './lemu/utils';
import './lemu/LemuLogsPage.css';

/* ─────────────────────────────────────────────────────────────────────────
   LemuLogsPage
   Composition + data-fetching owner for the LEMU observability screen.
   Layer 3 adds the System map (manifest + pulse), Change feed (manifest
   history + diffs), and a persistent Findings ribbon. All LEMU state lives
   here so polls, the auto-refresh toggle and pagination behave exactly as
   before and survive tab switches. The Flags tab is self-contained.
──────────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 25;

const TABS = [
  { id: 'system', label: 'System', group: 'structure', icon: <Map size={15} /> },
  { id: 'changes', label: 'Changes', group: 'structure', icon: <BookOpen size={15} /> },
  { id: 'logs', label: 'Logs', group: 'activity', icon: <ScrollText size={15} /> },
  { id: 'jobs', label: 'Jobs', group: 'activity', icon: <Server size={15} /> },
  { id: 'errors', label: 'Errors', group: 'activity', icon: <AlertTriangle size={15} /> },
  { id: 'flags', label: 'Flags', group: 'config', icon: <Flag size={15} /> },
];

const LemuLogsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Tabs ── */
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'system');

  /* ── Dashboard strip ── */
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  /* ── Layer 3: system manifest + pulse + findings ── */
  const [manifest, setManifest] = useState(null);
  const [manifestStatus, setManifestStatus] = useState('loading');
  const [pulse, setPulse] = useState(null);
  const [pulseStatus, setPulseStatus] = useState('loading');
  // Wide-window last-seen per route/collection — distinguishes "quiet this
  // hour" from "no signal all day". Null until loaded; the map degrades to
  // pulse-only behaviour without it.
  const [liveness, setLiveness] = useState(null);
  const [findings, setFindings] = useState(null);
  const [findingsStatus, setFindingsStatus] = useState('loading');
  const [manifestsList, setManifestsList] = useState([]);
  const [manifestsStatus, setManifestsStatus] = useState('loading');
  const [diffsByVersion, setDiffsByVersion] = useState({});
  // Per-version fetch lifecycle: undefined = idle, 'loading' | 'ready' | 'error'.
  // Kept separate from the diff payload so a failed fetch can never render as
  // "no changes" (and vice versa).
  const [diffStatusByVersion, setDiffStatusByVersion] = useState({});
  const [sort, setSort] = useState('activity');
  const [findingsExpanded, setFindingsExpanded] = useState(() => searchParams.get('findings') === 'open');
  const [expandedVersions, setExpandedVersions] = useState(() => {
    const v = searchParams.get('v');
    return v ? new Set([Number(v)]) : new Set();
  });
  const [selectedNodeId, setSelectedNodeId] = useState(() => searchParams.get('node') || null);
  const [drawerOpen, setDrawerOpen] = useState(() => !!searchParams.get('node'));

  /* ── Jobs panel ── */
  const [jobs, setJobs] = useState([]);
  const [jobsCheckedAt, setJobsCheckedAt] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  /* ── Events explorer ── */
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [service, setService] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  /* ── Errors inbox ── */
  const [trackers, setTrackers] = useState([]);
  const [errorsSummary, setErrorsSummary] = useState(null);
  const [trackersLoading, setTrackersLoading] = useState(true);
  const [trackersError, setTrackersError] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('false');
  const [resolvingFp, setResolvingFp] = useState(null);

  /* ── Auto-refresh ── */
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  /* ── Derived status ── */
  const derivedStatus = useMemo(() => {
    if (manifestStatus === 'loading') return 'loading';
    if (manifestStatus === 'error') return 'error';
    if (!manifest) return 'empty';
    const newestBucket = pulse?.buckets?.[0]?.bucketStart;
    if (newestBucket) {
      const ageMin = (Date.now() - new Date(newestBucket).getTime()) / 60000;
      if (ageMin > 5) return 'stale';
    }
    return 'live';
  }, [manifest, manifestStatus, pulse]);

  /* ── Loaders ── */
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setDashboardLoading(true);
    setDashboardError('');
    try {
      const data = await LemuService.getDashboard();
      // The controller responds { dashboard: {...} }; older deployments sent the
      // rollup flat. Read both so the strip never silently renders all dashes.
      setDashboard(data?.dashboard || data || null);
    } catch (e) {
      setDashboardError(e.detail || e.message || 'Failed to load dashboard stats');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

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
    } catch {
      // Liveness is an enhancement layer — pulse heat still renders without it.
      setLiveness(null);
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
      setManifestsList(data.data?.records || []);
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

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setEventsLoading(true);
    setEventsError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (severity) params.severity = severity;
      if (source) params.source = source;
      if (service.trim()) params.service = service.trim();
      if (search.trim()) params.search = search.trim();
      const data = await LemuService.getEvents(params);
      setEvents(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
    } catch (e) {
      setEventsError(e.detail || e.message || 'Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  }, [page, severity, source, service, search]);

  const loadTrackers = useCallback(async (silent = false) => {
    if (!silent) setTrackersLoading(true);
    setTrackersError('');
    try {
      const params = {};
      if (resolvedFilter) params.resolved = resolvedFilter;
      const data = await LemuService.getErrorTrackers(params);
      // Controller responds { data: trackers, summary } — the list and the
      // header counts come from this ONE response so they cannot disagree.
      setTrackers(data.trackers || data.data || []);
      setErrorsSummary(data.summary || null);
    } catch (e) {
      setTrackersError(e.detail || e.message || 'Failed to load error trackers');
    } finally {
      setTrackersLoading(false);
    }
  }, [resolvedFilter]);

  /* Initial loads — all sections fetch up-front, regardless of active tab */
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadManifest(); }, [loadManifest]);
  useEffect(() => { loadPulse(); }, [loadPulse]);
  useEffect(() => {
    loadLiveness();
    const t = setInterval(() => loadLiveness(), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadLiveness]);
  useEffect(() => { loadFindings(); }, [loadFindings]);
  useEffect(() => { loadManifests(); }, [loadManifests]);
  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadTrackers(); }, [loadTrackers]);

  /* Events: debounce filter changes, refetch on page/filter change */
  const eventsTimer = useRef(null);
  useEffect(() => {
    eventsTimer.current = setTimeout(() => loadEvents(), 300);
    return () => clearTimeout(eventsTimer.current);
  }, [loadEvents]);

  /* Auto-refresh (30s) — refreshes stats, jobs, the current events page,
     and Layer 3 state when on system/changes tab. */
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      loadDashboard(true);
      loadJobs(true);
      loadEvents(true);
      if (activeTab === 'system' || activeTab === 'changes') {
        loadManifest(true);
        loadPulse(true);
        loadFindings(true);
        loadManifests(true);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, activeTab, loadDashboard, loadJobs, loadEvents, loadManifest, loadPulse, loadFindings, loadManifests]);

  /* Sync active tab with URL; keep other params intact. */
  const setTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  /* Resolve a selected node ID to a node object + kind + pulse series. */
  const functionsByName = useMemo(() => {
    const map = {};
    (manifest?.functions || []).forEach((fn) => { map[fn.functionName] = fn; });
    return map;
  }, [manifest]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !manifest) return null;
    const kind = selectedNodeId.split(':')[0];

    if (kind === 'route') {
      const route = (manifest.routes || []).find((r) => nodeId.route(r) === selectedNodeId);
      if (!route) return null;
      const pulseSeries = (pulse?.buckets || []).map((b) => {
        const r = (b.routes || []).find((x) => x.key === routePulseKey(route));
        return r || { n: 0, err: 0 };
      });
      return { kind: 'route', node: { ...route, _id: selectedNodeId, _module: deriveRouteModule(route, functionsByName) }, pulseSeries };
    }

    if (kind === 'model') {
      const model = (manifest.models || []).find((m) => nodeId.model(m) === selectedNodeId);
      if (!model) return null;
      const pulseSeries = (pulse?.buckets || []).map((b) => {
        const c = (b.collections || []).find((x) => x.name === model.collectionName);
        return c || { find: 0, insert: 0, update: 0, del: 0, agg: 0 };
      });
      return { kind: 'model', node: { ...model, _id: selectedNodeId }, pulseSeries };
    }

    if (kind === 'job') {
      const job = (manifest.jobs || []).find((j) => nodeId.job(j) === selectedNodeId);
      if (!job) return null;
      const health = (jobs || []).find((j) => j.job === job.name) || {};
      return { kind: 'job', node: { ...job, _id: selectedNodeId }, pulseSeries: { _health: health } };
    }

    if (kind === 'module') {
      const module = (manifest.modules || []).find((m) => nodeId.module(m) === selectedNodeId);
      if (!module) return null;
      const routes = (manifest.routes || []).filter((r) => deriveRouteModule(r, functionsByName) === module.name);
      const funcs = (manifest.functions || []).filter((f) => f.module === module.name);
      return { kind: 'module', node: { ...module, _id: selectedNodeId, _routes: routes, _functions: funcs }, pulseSeries: [] };
    }

    return null;
  }, [selectedNodeId, manifest, pulse, jobs, functionsByName]);

  const findingIds = useMemo(() => {
    const ids = new Set();
    (findings?.untenantedRoutes || []).forEach((r) => ids.add(nodeId.route(r)));
    (findings?.uninstrumentedJobs || []).forEach((j) => ids.add(nodeId.job(j)));
    (findings?.modelsWithoutCollection || []).forEach((m) => ids.add(`model:${m}`));
    (findings?.collectionsWithoutModel || []).forEach((c) => ids.add(`collection:${c}`));
    return ids;
  }, [findings]);

  const openNode = useCallback((nodeIdValue) => {
    setSelectedNodeId(nodeIdValue);
    setDrawerOpen(true);
    setActiveTab((current) => {
      if (current !== 'system') {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', 'system');
          next.set('node', nodeIdValue);
          return next;
        }, { replace: true });
        return 'system';
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('node', nodeIdValue);
        return next;
      }, { replace: true });
      return current;
    });
  }, [setSearchParams]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNodeId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('node');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleFindings = useCallback(() => {
    setFindingsExpanded((v) => {
      const next = !v;
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        if (next) p.set('findings', 'open');
        else p.delete('findings');
        return p;
      }, { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const toggleVersion = useCallback((version) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      setSearchParams((p) => {
        const params = new URLSearchParams(p);
        if (next.size) params.set('v', Array.from(next).join(','));
        else params.delete('v');
        return params;
      }, { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const resetPageAnd = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResolve = async (tracker) => {
    const fp = tracker.fingerprint;
    if (!fp || resolvingFp) return;
    setResolvingFp(fp);
    setTrackersError('');
    try {
      await LemuService.resolveError(fp, { resolvedBy: localStorage.getItem('user_email') || undefined });
      setTrackers((prev) => prev.filter((t) => t.fingerprint !== fp));
      setErrorsSummary((prev) => prev && {
        ...prev,
        totalUnresolved: Math.max(0, (prev.totalUnresolved ?? 0) - 1),
        totalResolved: (prev.totalResolved ?? 0) + 1,
      });
      loadDashboard(true);
    } catch (e) {
      setTrackersError(e.detail || e.message || 'Failed to resolve error');
    } finally {
      setResolvingFp(null);
    }
  };

  const refreshAll = () => {
    loadDashboard(true);
    loadJobs(true);
    loadEvents(true);
    loadTrackers(true);
    loadManifest(true);
    loadPulse(true);
    loadFindings(true);
    loadManifests(true);
  };

  /* Keep URL params in sync with local state when they change externally. */
  useEffect(() => {
    const tab = searchParams.get('tab') || 'system';
    if (tab !== activeTab) setActiveTab(tab);
    const node = searchParams.get('node');
    if (node !== selectedNodeId) {
      setSelectedNodeId(node);
      setDrawerOpen(!!node);
    }
    setFindingsExpanded(searchParams.get('findings') === 'open');
  }, [searchParams, activeTab, selectedNodeId]);

  const tabButtons = () => {
    let lastGroup = null;
    return TABS.map((tab) => {
      const separator = tab.group !== lastGroup && lastGroup !== null ? (
        <span key={`sep-${tab.id}`} className="lemu-tab__sep" aria-hidden="true">‖</span>
      ) : null;
      lastGroup = tab.group;
      return [
        separator,
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`lemu-tab${activeTab === tab.id ? ' lemu-tab--active' : ''}`}
          onClick={() => setTab(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>,
      ];
    });
  };

  return (
    <div className="lemu-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="LEMU Logs"
        title="LEMU Observability"
        description="Cross-surface event logs, cron job health, system map and structural findings."
      />

      <div className="lemu-toolbar">
        <span className="lemu-meta">
          {jobsCheckedAt && <>Jobs checked <strong>{relativeTime(jobsCheckedAt)}</strong></>}
        </span>
        <div className="lemu-toolbar__actions">
          <button
            type="button"
            className={`lemu-switch${autoRefresh ? ' lemu-switch--on' : ''}`}
            role="switch"
            aria-checked={autoRefresh}
            onClick={() => setAutoRefresh((v) => !v)}
            title="Auto-refresh every 30s"
          >
            <span className="lemu-switch__thumb" />
          </button>
          <span className="lemu-meta">Auto-refresh (30s)</span>
          <button type="button" className="lemu-btn lemu-btn--secondary" onClick={refreshAll}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats strip stays visible above the tabs */}
      <LemuStatsStrip dashboard={dashboard} loading={dashboardLoading} error={dashboardError} />

      {/* Persistent findings ribbon */}
      <LemuFindingsRibbon
        findings={findings}
        version={manifest?.version}
        onOpenNode={openNode}
        expanded={findingsExpanded}
        onToggle={toggleFindings}
        status={findingsStatus}
      />

      <div className="lemu-tabs" role="tablist" aria-label="LEMU sections">
        {tabButtons()}
      </div>

      <div className={`lemu-tab-body ${drawerOpen ? 'lemu-tab-body--drawer-open' : ''}`}>
        {activeTab === 'system' && (
          <LemuSystemMap
            manifest={manifest}
            pulse={pulse}
            liveness={liveness}
            status={derivedStatus}
            sort={sort}
            onSortChange={setSort}
            onSelectNode={openNode}
            selectedNodeId={selectedNodeId}
            jobHealth={jobs}
            onRebuild={rebuildManifest}
          />
        )}

        {activeTab === 'changes' && (
          <LemuChangeFeed
            manifests={manifestsList}
            diffsByVersion={diffsByVersion}
            diffStatusByVersion={diffStatusByVersion}
            status={manifestsStatus}
            onLoadDiff={loadManifestDiff}
            expandedVersions={expandedVersions}
            onToggleVersion={toggleVersion}
          />
        )}

        {activeTab === 'logs' && (
          <LemuLogsExplorer
            events={events}
            pagination={pagination}
            loading={eventsLoading}
            error={eventsError}
            severity={severity}
            source={source}
            service={service}
            search={search}
            page={page}
            expandedIds={expandedIds}
            onSeverityChange={resetPageAnd(setSeverity)}
            onSourceChange={resetPageAnd(setSource)}
            onServiceChange={resetPageAnd(setService)}
            onSearchChange={resetPageAnd(setSearch)}
            onToggleExpanded={toggleExpanded}
            onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => p + 1)}
          />
        )}

        {activeTab === 'jobs' && (
          <LemuJobsPanel jobs={jobs} loading={jobsLoading} error={jobsError} />
        )}

        {activeTab === 'errors' && (
          <LemuErrorsInbox
            trackers={trackers}
            summary={errorsSummary}
            loading={trackersLoading}
            error={trackersError}
            resolvedFilter={resolvedFilter}
            onResolvedFilterChange={(e) => setResolvedFilter(e.target.value)}
            resolvingFp={resolvingFp}
            onResolve={handleResolve}
          />
        )}

        {activeTab === 'flags' && <LemuFlagsTab />}
      </div>

      {drawerOpen && selectedNode && (
        <LemuNodeDrawer
          node={selectedNode.node}
          kind={selectedNode.kind}
          pulseSeries={selectedNode.pulseSeries}
          findingIds={findingIds}
          pulseStatus={pulseStatus}
          edges={manifest?.edges || []}
          liveness={liveness}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
};

export default LemuLogsPage;
