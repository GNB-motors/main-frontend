import React from 'react';
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
import LemuJobKpisPanel from './lemu/LemuJobKpisPanel';
import LemuLogsExplorer from './lemu/LemuLogsExplorer';
import LemuErrorsInbox from './lemu/LemuErrorsInbox';
import LemuFlagsTab from './lemu/LemuFlagsTab';
import LemuFindingsRibbon from './lemu/LemuFindingsRibbon';
import LemuSystemMap from './lemu/LemuSystemMap';
import LemuGraphDoorway from './lemu/LemuGraphDoorway';
import LemuNodeDrawer from './lemu/LemuNodeDrawer';
import LemuChangeFeed from './lemu/LemuChangeFeed';
import FuelIntegrityLineagePanel from './lemu/FuelIntegrityLineagePanel';
import { relativeTime } from './lemu/utils';
import { getUserEmail } from '../../../utils/session';
import useLemuLogsPage from './lemuLogs/useLemuLogsPage';
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
  const {
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
  } = useLemuLogsPage();

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
      setErrorsSummary(
        (prev) =>
          prev && {
            ...prev,
            totalUnresolved: Math.max(0, (prev.totalUnresolved ?? 0) - 1),
            totalResolved: (prev.totalResolved ?? 0) + 1,
          },
      );
      loadDashboard(true);
    } catch (e) {
      setTrackersError(e.message || 'Failed to resolve error');
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

  const tabButtons = () => {
    let lastGroup = null;
    return TABS.map((tab) => {
      const separator =
        tab.group !== lastGroup && lastGroup !== null ? (
          <span key={`sep-${tab.id}`} className="lemu-tab__sep" aria-hidden="true">
            ‖
          </span>
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
          {graph.jobsCheckedAt && (
            <>
              Jobs checked <strong>{relativeTime(graph.jobsCheckedAt)}</strong>
            </>
          )}
        </span>
        <div className="lemu-toolbar__actions">
          <button
            type="button"
            className={`lemu-switch${autoRefresh ? ' lemu-switch--on' : ''}`}
            role="switch"
            aria-checked={autoRefresh}
            aria-label="Auto-refresh every 30s"
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
          <>
            <LemuJobsPanel jobs={jobs} loading={graph.jobsLoading} error={graph.jobsError} />
            <LemuJobKpisPanel />
          </>
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
