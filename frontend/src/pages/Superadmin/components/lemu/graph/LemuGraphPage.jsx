import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LemuGraphTab from './LemuGraphTab';
import LemuNodeDrawer from '../LemuNodeDrawer';
import { useLemuGraphData, useLemuSelectedNode } from './useLemuGraphData';
/* The graph chrome styles (.lemu-graph3d*, .lemu-kgrail*, .lemu-kgfilt, the
   drawer-adjacent tokens) live in LemuLogsPage.css — historically loaded as a
   side effect of mounting the graph inside LemuLogsPage. Import it here so
   the standalone route gets the same styles (Vite dedupes the import against
   the LemuLogsPage chunk). */
import '../LemuLogsPage.css';
import './LemuGraphPage.css';

/* Standalone full-page home for the LEMU knowledge graph (/superadmin/graph).

   Promoted from the embedded LEMU tab: the graph owns the whole content area
   below the app navbar — no LEMU header, no tab strip. All graph data
   (topology polling, attribution, versions/diff, job health, dead surfaces,
   scrubber history) comes from useLemuGraphData, so nothing here depends on
   LemuLogsPage being mounted. The selection and the drawer work exactly as
   they did on the LEMU page: `?node=` is the selection's URL state, and the
   drawer renders inside this page's relative wrapper (contained), 12px below
   the navbar through the same --lemu-header-h geometry. */
const LemuGraphPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const data = useLemuGraphData();

  const [selectedNodeId, setSelectedNodeId] = useState(() => searchParams.get('node') || null);
  const [drawerOpen, setDrawerOpen] = useState(() => !!searchParams.get('node'));
  // Blast-radius closure published by the graph tab — the drawer lists it
  // while a selection's blast radius is active.
  const [blastClosure, setBlastClosure] = useState(null);
  /* The graph tab owns hop state and publishes its setter here (same pattern
     as on the LEMU page): the drawer's ISOLATE 1 HOP collapses the board to
     the selected node's 1-hop neighbourhood. */
  const isolateRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const selectedNode = useLemuSelectedNode({
    selectedNodeId,
    manifest: data.manifest,
    pulse: data.pulse,
    jobs: data.jobs,
    topology: data.topology,
  });

  const openNode = useCallback((nodeIdValue) => {
    setSelectedNodeId(nodeIdValue);
    setDrawerOpen(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('node', nodeIdValue);
      return next;
    }, { replace: true });
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

  /* Keep local selection state in sync when the URL changes externally. */
  useEffect(() => {
    const node = searchParams.get('node');
    if (node !== selectedNodeId) {
      setSelectedNodeId(node);
      setDrawerOpen(!!node);
    }
  }, [searchParams, selectedNodeId]);

  return (
    <div className="lemu-graph-page">
      <LemuGraphTab
        manifest={data.manifest}
        liveness={data.liveness}
        jobHealth={data.jobs}
        topology={data.topology}
        errorAttribution={data.errorAttribution}
        onSelectNode={openNode}
        onOpenErrors={() => navigate('/superadmin/lemu?tab=errors')}
        selectedNodeId={selectedNodeId}
        dataUpdatedAt={data.dataUpdatedAt}
        onBlastChange={setBlastClosure}
        isolateRef={isolateRef}
        manifests={data.manifests}
        diffsByVersion={data.diffsByVersion}
        diffStatusByVersion={data.diffStatusByVersion}
        onLoadDiff={data.loadManifestDiff}
      />

      {drawerOpen && selectedNode && (
        <LemuNodeDrawer
          node={selectedNode.node}
          kind={selectedNode.kind}
          pulseSeries={selectedNode.pulseSeries}
          findingIds={data.findingIds}
          pulseStatus={data.pulseStatus}
          edges={data.manifest?.edges || []}
          liveness={data.liveness}
          topology={data.topology}
          errorAttribution={data.errorAttribution}
          closure={blastClosure}
          onSelectNode={openNode}
          onClose={closeDrawer}
          onIsolate={() => isolateRef.current?.(selectedNodeId)}
          contained
        />
      )}
    </div>
  );
};

export default LemuGraphPage;
