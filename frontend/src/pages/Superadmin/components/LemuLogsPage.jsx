import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  Flag,
  Fuel,
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
import LemuGraphDoorway from './lemu/LemuGraphDoorway';
import LemuNodeDrawer from './lemu/LemuNodeDrawer';
import LemuChangeFeed from './lemu/LemuChangeFeed';
import FuelIntegrityLineagePanel from './lemu/FuelIntegrityLineagePanel';
import { useLemuGraphData, useLemuSelectedNode } from './lemu/graph/useLemuGraphData';
import { relativeTime } from './lemu/utils';
import { getUserRole, getUserEmail } from '../../../utils/session';
import './lemu/LemuLogsPage.css';

/* ─────────────────────────────────────────────────────────────────────────
   LemuLogsPage
   Composition + data-fetching owner for the LEMU observability screen.
   Layer 3 adds the System map (manifest + pulse), Change feed (manifest
   history + diffs), and a persistent Findings ribbon.

   The knowledge graph moved to its own route (/superadmin/graph, see
   LemuGraphPage) — the Graph tab here is a doorway. The graph-shaped data
   the rest of this page still consumes (manifest, pulse, liveness, topology,
   error attribution, job health, findings, versions/diffs — the System map,
   ribbon, Change feed and node drawer all read it) comes from the shared
   useLemuGraphData hook, so both pages poll on the same cadence and read
   the same payload shapes.
──────────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 25;

const TABS = [
  { id: 'system', label: 'System', group: 'structure', icon: <Map size={15} /> },
  { id: 'graph', label: 'Graph', group: 'structure', icon: <Boxes size={15} /> },
  { id: 'changes', label: 'Changes', group: 'structure', icon: <BookOpen size={15} /> },
  { id: 'logs', label: 'Logs', group: 'activity', icon: <ScrollText size={15} /> },
  { id: 'jobs', label: 'Jobs', group: 'activity', icon: <Server size={15} /> },
  { id: 'errors', label: 'Errors', group: 'activity', icon: <AlertTriangle size={15} /> },
  { id: 'flags', label: 'Flags', group: 'config', icon: <Flag size={15} /> },
  { id: 'lineage', label: 'Lineage', group: 'config', icon: <Fuel size={15} /> },
];

const LemuLogsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* Graph-shaped data (manifest/pulse/liveness/topology/attribution/jobs/
     findings/versions/diffs) — shared with the standalone graph page. */
  const graph = useLemuGraphData();

  /* ── Tabs ── */
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'system');

  /* ── Dashboard strip ── */
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  /* ── Selection / drawer ── */
  const [selectedNodeId, setSelectedNodeId] = useState(() => searchParams.get('node') || null);
  const [drawerOpen, setDrawerOpen] = useState(() => !!searchParams.get('node'));
  const [sort, setSort] = useState('activity');
  const [findingsExpanded, setFindingsExpanded] = useState(() => searchParams.get('findings') === 'open');
  const [expandedVersions, setExpandedVersions] = useState(() => {
    const v = searchParams.get('v');
    return v ? new Set([Number(v)]) : new Set();
  });

  /* ── Jobs panel ── */
  // (job health itself is fetched by useLemuGraphData; the panel reads it)

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
    if (getUserRole() !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const { manifest, pulse, jobs, topology, liveness } = graph;
  const { loadJobs, refreshLayer3 } = graph;

  /* ── Derived status ── */
  const derivedStatus = useMemo(() => {
    if (graph.manifestStatus === 'loading') return 'loading';
    if (graph.manifestStatus === 'error') return 'error';
    if (!manifest) return 'empty';
    const newestBucket = pulse?.buckets?.[0]?.bucketStart;
    if (newestBucket) {
      const ageMin = (Date.now() - new Date(newestBucket).getTime()) / 60000;
      if (ageMin > 5) return 'stale';
    }
    return 'live';
  }, [graph.manifestStatus, manifest, pulse]);

  /* ── Loaders (page-owned data only; graph-shaped data loads in the hook) ── */
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

  /* Initial loads — page-owned sections fetch up-front, regardless of tab.
     (Manifest/pulse/liveness/topology/attribution/jobs/findings/versions all
     load inside useLemuGraphData.) */
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
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
        refreshLayer3(true);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, activeTab, loadDashboard, loadJobs, refreshLayer3, loadEvents]);

  /* Sync active tab with URL; keep other params intact. */
  const setTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  /* Resolve a selected node ID to a node object + kind + pulse series
     (shared resolver — the standalone graph page uses the same one). */
  const selectedNode = useLemuSelectedNode({ selectedNodeId, manifest, pulse, jobs, topology });

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
      await LemuService.resolveError(fp, { resolvedBy: getUserEmail() || undefined });
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
    refreshLayer3(true);
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
          {graph.jobsCheckedAt && <>Jobs checked <strong>{relativeTime(graph.jobsCheckedAt)}</strong></>}
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
        findings={graph.findings}
        version={manifest?.version}
        onOpenNode={openNode}
        expanded={findingsExpanded}
        onToggle={toggleFindings}
        status={graph.findingsStatus}
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
            onRebuild={graph.rebuildManifest}
          />
        )}

        {activeTab === 'graph' && <LemuGraphDoorway />}

        {activeTab === 'changes' && (
          <LemuChangeFeed
            manifests={graph.manifests}
            diffsByVersion={graph.diffsByVersion}
            diffStatusByVersion={graph.diffStatusByVersion}
            status={graph.manifestsStatus}
            onLoadDiff={graph.loadManifestDiff}
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
          <LemuJobsPanel jobs={jobs} loading={graph.jobsLoading} error={graph.jobsError} />
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

        {activeTab === 'lineage' && <FuelIntegrityLineagePanel />}
      </div>

      {drawerOpen && selectedNode && (
        <LemuNodeDrawer
          node={selectedNode.node}
          kind={selectedNode.kind}
          pulseSeries={selectedNode.pulseSeries}
          findingIds={graph.findingIds}
          pulseStatus={graph.pulseStatus}
          edges={manifest?.edges || []}
          liveness={liveness}
          topology={topology}
          errorAttribution={graph.errorAttribution}
          onSelectNode={openNode}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
};

export default LemuLogsPage;
