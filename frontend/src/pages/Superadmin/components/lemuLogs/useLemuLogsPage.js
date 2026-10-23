import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LemuService } from '../LemuService';
import { useLemuGraphData, useLemuSelectedNode } from '../lemu/graph/useLemuGraphData';
import { getUserRole } from '../../../../utils/session';

const PAGE_SIZE = 25;

// The LEMU page's state, loaders, effects and URL-synced selection, in their original hook order.
const useLemuLogsPage = () => {
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
  const [findingsExpanded, setFindingsExpanded] = useState(
    () => searchParams.get('findings') === 'open',
  );
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
      navigate('/profile');
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
      setDashboardError(e.message || 'Failed to load dashboard stats');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadEvents = useCallback(
    async (silent = false) => {
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
        setEventsError(e.message || 'Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    },
    [page, severity, source, service, search],
  );

  const loadTrackers = useCallback(
    async (silent = false) => {
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
        setTrackersError(e.message || 'Failed to load error trackers');
      } finally {
        setTrackersLoading(false);
      }
    },
    [resolvedFilter],
  );

  /* Initial loads — page-owned sections fetch up-front, regardless of tab.
     (Manifest/pulse/liveness/topology/attribution/jobs/findings/versions all
     load inside useLemuGraphData.) */
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    loadTrackers();
  }, [loadTrackers]);

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
  const setTab = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', tabId);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /* Resolve a selected node ID to a node object + kind + pulse series
     (shared resolver — the standalone graph page uses the same one). */
  const selectedNode = useLemuSelectedNode({ selectedNodeId, manifest, pulse, jobs, topology });

  const openNode = useCallback(
    (nodeIdValue) => {
      setSelectedNodeId(nodeIdValue);
      setDrawerOpen(true);
      setActiveTab((current) => {
        if (current !== 'system') {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'system');
              next.set('node', nodeIdValue);
              return next;
            },
            { replace: true },
          );
          return 'system';
        }
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('node', nodeIdValue);
            return next;
          },
          { replace: true },
        );
        return current;
      });
    },
    [setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNodeId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('node');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const toggleFindings = useCallback(() => {
    setFindingsExpanded((v) => {
      const next = !v;
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next) p.set('findings', 'open');
          else p.delete('findings');
          return p;
        },
        { replace: true },
      );
      return next;
    });
  }, [setSearchParams]);

  const toggleVersion = useCallback(
    (version) => {
      setExpandedVersions((prev) => {
        const next = new Set(prev);
        if (next.has(version)) next.delete(version);
        else next.add(version);
        setSearchParams(
          (p) => {
            const params = new URLSearchParams(p);
            if (next.size) params.set('v', Array.from(next).join(','));
            else params.delete('v');
            return params;
          },
          { replace: true },
        );
        return next;
      });
    },
    [setSearchParams],
  );

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

  return {
    activeTab,
    autoRefresh,
    closeDrawer,
    dashboard,
    dashboardError,
    dashboardLoading,
    derivedStatus,
    drawerOpen,
    errorsSummary,
    events,
    eventsError,
    eventsLoading,
    expandedIds,
    expandedVersions,
    findingsExpanded,
    graph,
    jobs,
    liveness,
    loadDashboard,
    loadEvents,
    loadJobs,
    loadTrackers,
    manifest,
    openNode,
    page,
    pagination,
    pulse,
    refreshLayer3,
    resolvedFilter,
    resolvingFp,
    search,
    selectedNode,
    selectedNodeId,
    service,
    setAutoRefresh,
    setErrorsSummary,
    setExpandedIds,
    setPage,
    setResolvedFilter,
    setResolvingFp,
    setSearch,
    setService,
    setSeverity,
    setSort,
    setSource,
    setTab,
    setTrackers,
    setTrackersError,
    severity,
    sort,
    source,
    toggleFindings,
    toggleVersion,
    topology,
    trackers,
    trackersError,
    trackersLoading,
  };
};

export default useLemuLogsPage;
