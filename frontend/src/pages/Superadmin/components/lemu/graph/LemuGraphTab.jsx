import React from 'react';
import LemuGraphControls from './LemuGraphControls';
import LemuGraphFilters from './LemuGraphFilters';
import LemuDeadSurfaces from './LemuDeadSurfaces';
import LemuIncidentList from './LemuIncidentList';
import LemuTimeScrubber from './LemuTimeScrubber';
import LemuGraphTable from './LemuGraphTable';
import LemuGraphEmpty from './LemuGraphEmpty';
import { useGraphTabState } from './tab/useGraphTabState';
import { useGraphModel } from './tab/useGraphModel';
import { useGraphHandlers } from './tab/useGraphHandlers';
import { useGraphReadouts } from './tab/useGraphReadouts';
import GraphNoManifest from './tab/GraphNoManifest';
import GraphRails from './tab/GraphRails';
import GraphCanvasView from './tab/GraphCanvasView';
import GraphFootRail from './tab/GraphFootRail';

/* 3D knowledge graph tab for the LEMU manifest.

   The manifest already ships a real graph — `edges` is a typed adjacency list
   over modules, models, jobs and route mounts — so this view renders that
   directly rather than inventing a topology. Node ids are the SAME ids the flat
   System map and the node drawer use (`module:x`, `model:X`, `job:y`), which is
   why clicking a sphere can open the existing drawer unchanged.

   Routes are deliberately NOT nodes by default: there are ~1700 of them and
   they hang off mounts, so including them buries the structure this view exists
   to show. The toggle is there for when you actually want the full surface. */
const LemuGraphTab = ({
  manifest,
  liveness,
  jobHealth,
  topology,
  errorAttribution,
  onSelectNode,
  onOpenErrors,
  selectedNodeId,
  dataUpdatedAt,
  onBlastChange,
  instanceRef,
  manifests,
  diffsByVersion,
  diffStatusByVersion,
  onLoadDiff,
  isolateRef,
  onThemeChange,
}) => {
  const {
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
  } = useGraphTabState({ onThemeChange, diffStatusByVersion, onLoadDiff });

  const {
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
  } = useGraphModel({
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
  });

  const {
    toggleKind,
    showAllKinds,
    toggleStateOff,
    handleNodeClick,
    nodeById,
    handleTableSelect,
    handleCanvasKeyDown,
    handleClearSelection,
    handleClear,
    handleAutoHop,
    handleFocusSearch,
  } = useGraphHandlers({
    onSelectNode,
    selectedNodeId,
    isolateRef,
    visible,
    focusRef,
    searchRef,
    setSearchParams,
    setHiddenKinds,
    setOffStates,
    setPathTarget,
    setQuery,
    setFocusMatches,
    setHopDepth,
  });

  const {
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
  } = useGraphReadouts({
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
  });

  if (!manifest) {
    return <GraphNoManifest graphRootRef={graphRootRef} theme={theme} />;
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

      <GraphRails
        view={view}
        summary={summary}
        dimmedStates={dimmedStates}
        toggleStateDim={toggleStateDim}
        errorAttribution={errorAttribution}
        attributionQuality={attributionQuality}
        unattributedCount={unattributedCount}
        unattributedLabel={unattributedLabel}
        openErrors={openErrors}
        livePath={livePath}
        diffOverlay={diffOverlay}
        diffVersion={diffVersion}
        blast={blast}
        pathInfo={pathInfo}
        degraded={degraded}
        degradedDismissed={degradedDismissed}
        degradedStripRef={degradedStripRef}
        degradedOpenIdx={degradedOpenIdx}
        setDegradedOpenIdx={setDegradedOpenIdx}
        setDegradedDismissed={setDegradedDismissed}
        topology={topology}
      />

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
        <GraphCanvasView
          visible={visible}
          layer={layer}
          mode={mode}
          theme={theme}
          selectedNodeId={selectedNodeId}
          hopDepth={hopDepth}
          matches={matches}
          analysisNeighbours={analysisNeighbours}
          urgency={urgency}
          overlayMarks={overlayMarks}
          query={query}
          focusMatches={focusMatches}
          tip={tip}
          handleCanvasKeyDown={handleCanvasKeyDown}
          handleNodeClick={handleNodeClick}
          handleAutoHop={handleAutoHop}
          handleHover={handleHover}
          handleClearSelection={handleClearSelection}
          setHopDepth={setHopDepth}
          handleFocusSearch={handleFocusSearch}
          fitRef={fitRef}
          focusRef={focusRef}
          snapshotRef={snapshotRef}
          instanceRef={instanceRef}
        />
      )}

      {/* Time scrubber, docked bottom-centre above the footer rail. */}
      {view === 'graph' && pulseBuckets.length > 0 && (
        <LemuTimeScrubber buckets={pulseBuckets} value={scrubIndex} onChange={setScrubIndex} />
      )}

      {/* Docked bottom-right column: the ranked incident list (I4) above the
          standing dead-surface panel. The list is the companion to the
          on-canvas urgency treatment — it exists so an incident is never
          missed when its node is occluded or outside the hop window. Rows
          click through to the node via the same selection mechanism as a
          sphere click. */}
      {view === 'graph' && (
        <div className="lemu-graph3d__dock">
          <LemuIncidentList incidents={incidents} onFocusNode={handleIncidentFocus} />
          <LemuDeadSurfaces surfaces={deadSurfaces} onSelectNode={(id) => onSelectNode?.(id)} />
        </div>
      )}

      <GraphFootRail
        layer={layer}
        scrubbedBucket={scrubbedBucket}
        dataUpdatedAt={dataUpdatedAt}
        freshState={freshState}
        freshAgeSec={freshAgeSec}
      />
    </div>
  );
};

export default LemuGraphTab;
