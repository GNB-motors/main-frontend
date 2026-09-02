import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Crosshair, Search } from 'lucide-react';
import { relativeTime } from './utils';

/* 3D knowledge graph for the LEMU manifest.

   The manifest already ships a real graph — `edges` is a typed adjacency list
   over modules, models, jobs and route mounts — so this view renders that
   directly rather than inventing a topology. Node ids are the SAME ids the flat
   System map and the node drawer use (`module:x`, `model:X`, `job:y`), which is
   why clicking a sphere can open the existing drawer unchanged.

   Routes are deliberately NOT nodes by default: there are ~1700 of them and
   they hang off mounts, so including them buries the structure this view exists
   to show. The toggle is there for when you actually want the full surface.

   three.js is ~600KB, and this page is already lazy-loaded, so the renderer is
   imported lazily again here — opening LEMU should not pay for the graph unless
   you open this tab. */
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));

const KIND_COLOR = {
  module: '#6366f1',
  model: '#14b8a6',
  job: '#f59e0b',
  mount: '#64748b',
  route: '#94a3b8',
};

const KIND_LABEL = {
  module: 'Modules',
  model: 'Models',
  job: 'Jobs',
  mount: 'Route mounts',
  route: 'Routes',
};

const LINK_COLOR = {
  require: 'rgba(99,102,241,0.35)',
  model: 'rgba(20,184,166,0.45)',
  mount: 'rgba(100,116,139,0.40)',
  job: 'rgba(245,158,11,0.45)',
  route: 'rgba(148,163,184,0.25)',
};

const ACTIVE_COLOR = '#22d3ee';

const kindOf = (id) => String(id).split(':')[0];

/** Sphere radius driver. Force-graph squares this, so keep the spread modest. */
const sizeFor = (kind, meta) => {
  if (kind === 'module') return 2 + Math.min(6, Math.sqrt((meta?.totalLoc || 0) / 250));
  if (kind === 'model') return 2 + Math.min(5, Math.sqrt((meta?.pathCount || 0) / 4));
  if (kind === 'job') return 3;
  if (kind === 'mount') return 2;
  return 1.5;
};

const LemuGraph3D = ({ manifest, liveness, jobHealth, onSelectNode, selectedNodeId }) => {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [query, setQuery] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [hovered, setHovered] = useState(null);

  // The canvas needs explicit pixel dimensions; it cannot size itself from CSS.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDims({ width: Math.max(320, r.width), height: Math.max(420, r.height) });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Liveness keys collections by collection name, so model nodes are matched
     through modelName -> collectionName. Until the DB pulse is recording, every
     collection reads as idle and the graph is structurally correct but static —
     that is a data problem upstream, not a rendering one. */
  const activity = useMemo(() => {
    const byNode = new Map();
    const collections = liveness?.collections || {};
    (manifest?.models || []).forEach((m) => {
      const live = collections[m.collectionName];
      if (live?.ops) byNode.set(`model:${m.modelName}`, { ops: live.ops, lastSeen: live.lastSeen });
    });
    (jobHealth || []).forEach((j) => {
      if (j?.name && (j.status === 'ok' || j.status === 'healthy')) {
        byNode.set(`job:${j.name}`, { ops: 1, lastSeen: j.lastRunAt || j.lastSuccessAt || null });
      }
    });
    return byNode;
  }, [manifest, liveness, jobHealth]);

  const graph = useMemo(() => {
    if (!manifest) return { nodes: [], links: [] };

    const meta = new Map();
    (manifest.modules || []).forEach((m) => meta.set(`module:${m.name}`, m));
    (manifest.models || []).forEach((m) => meta.set(`model:${m.modelName}`, m));
    (manifest.jobs || []).forEach((j) => meta.set(`job:${j.name}`, j));

    const wanted = new Set();
    const edges = (manifest.edges || []).filter((e) => e && e.from && e.to);
    edges.forEach((e) => {
      wanted.add(e.from);
      wanted.add(e.to);
    });
    // Modules with no edge at all still belong on the map — an orphaned module
    // is exactly the kind of thing this view should make visible.
    (manifest.modules || []).forEach((m) => wanted.add(`module:${m.name}`));

    const links = edges.map((e) => ({ source: e.from, target: e.to, kind: e.kind }));

    if (showRoutes) {
      (manifest.routes || []).forEach((r) => {
        const mount = r.mountPath ? `mount:${r.mountPath}` : null;
        const id = `route:${r.method}:${r.mountPath || ''}${r.path === '/' ? '' : r.path}`;
        wanted.add(id);
        meta.set(id, r);
        if (mount && wanted.has(mount)) links.push({ source: mount, target: id, kind: 'route' });
      });
    }

    const nodes = [...wanted].map((id) => {
      const kind = kindOf(id);
      const m = meta.get(id);
      const live = activity.get(id);
      return {
        id,
        kind,
        label: id.slice(kind.length + 1) || id,
        meta: m,
        val: sizeFor(kind, m),
        live: Boolean(live),
        ops: live?.ops || 0,
        lastSeen: live?.lastSeen || null,
      };
    });

    const present = new Set(nodes.map((n) => n.id));
    return { nodes, links: links.filter((l) => present.has(l.source) && present.has(l.target)) };
  }, [manifest, activity, showRoutes]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(graph.nodes.filter((n) => n.id.toLowerCase().includes(q)).map((n) => n.id));
  }, [query, graph.nodes]);

  const nodeColor = useCallback(
    (node) => {
      if (matches && !matches.has(node.id)) return 'rgba(148,163,184,0.15)';
      if (node.id === selectedNodeId) return '#f43f5e';
      if (node.live) return ACTIVE_COLOR;
      return KIND_COLOR[node.kind] || '#94a3b8';
    },
    [matches, selectedNodeId],
  );

  const handleClick = useCallback(
    (node) => {
      if (!node) return;
      // The drawer resolves module/model/job ids. Mounts and routes have no
      // drawer view, so focus the camera instead of opening an empty panel.
      if (['module', 'model', 'job'].includes(node.kind)) onSelectNode?.(node.id);
      const fg = fgRef.current;
      if (!fg) return;
      const dist = 90;
      const ratio = 1 + dist / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
      fg.cameraPosition(
        { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
        node,
        900,
      );
    },
    [onSelectNode],
  );

  const resetView = useCallback(() => {
    fgRef.current?.zoomToFit(700, 60);
  }, []);

  const counts = useMemo(() => {
    const c = {};
    graph.nodes.forEach((n) => { c[n.kind] = (c[n.kind] || 0) + 1; });
    return c;
  }, [graph.nodes]);

  const liveCount = useMemo(() => graph.nodes.filter((n) => n.live).length, [graph.nodes]);

  if (!manifest) {
    return (
      <div className="lemu-graph3d">
        <div className="lemu-state">
          <div className="lemu-state__icon"><Boxes size={24} /></div>
          <div className="lemu-state__title">
            No manifest yet — the graph is built from the system manifest.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lemu-graph3d">
      <div className="lemu-graph3d__bar">
        <div className="lemu-system-map__title">
          <Boxes size={16} />
          <h2>Knowledge graph</h2>
        </div>
        <div className="lemu-graph3d__controls">
          <div className="lemu-search lemu-search--compact">
            <span className="lemu-search__icon"><Search size={14} /></span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Highlight nodes…"
              aria-label="Highlight nodes in the graph"
            />
          </div>
          <label className="lemu-graph3d__toggle">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
            />
            <span>Include routes ({(manifest.routes || []).length})</span>
          </label>
          <button type="button" className="lemu-btn lemu-btn--outline" onClick={resetView}>
            <Crosshair size={14} /> Fit
          </button>
        </div>
      </div>

      <div className="lemu-graph3d__legend">
        {Object.keys(KIND_LABEL)
          .filter((k) => counts[k])
          .map((k) => (
            <span key={k} className="lemu-graph3d__legend-item">
              <i style={{ background: KIND_COLOR[k] }} aria-hidden="true" />
              {KIND_LABEL[k]} <b>{counts[k]}</b>
            </span>
          ))}
        <span className="lemu-graph3d__legend-item">
          <i style={{ background: ACTIVE_COLOR }} aria-hidden="true" />
          Live <b>{liveCount}</b>
        </span>
        <span className="lemu-meta">{graph.links.length} edges</span>
      </div>

      <div className="lemu-graph3d__canvas" ref={wrapRef}>
        <Suspense fallback={<div className="lemu-meta lemu-graph3d__loading">Loading 3D renderer…</div>}>
          {dims.width > 0 && (
            <ForceGraph3D
              ref={fgRef}
              width={dims.width}
              height={dims.height}
              graphData={graph}
              backgroundColor="rgba(0,0,0,0)"
              showNavInfo={false}
              nodeId="id"
              nodeVal="val"
              nodeColor={nodeColor}
              nodeOpacity={0.92}
              nodeResolution={12}
              nodeLabel={(n) => `${n.kind} · ${n.label}${n.live ? ' · live' : ''}`}
              linkColor={(l) => LINK_COLOR[l.kind] || 'rgba(148,163,184,0.3)'}
              linkWidth={(l) => (l.kind === 'require' ? 0.4 : 0.7)}
              linkOpacity={0.45}
              /* Particles are the "throb": they only flow along edges touching a
                 node with recent traffic, so motion means live data, not decoration. */
              linkDirectionalParticles={(l) => {
                const s = typeof l.source === 'object' ? l.source : null;
                const t = typeof l.target === 'object' ? l.target : null;
                return s?.live || t?.live ? 3 : 0;
              }}
              linkDirectionalParticleSpeed={0.006}
              linkDirectionalParticleWidth={1.6}
              onNodeClick={handleClick}
              onNodeHover={setHovered}
              onEngineStop={() => fgRef.current?.zoomToFit(500, 60)}
              cooldownTicks={120}
              enableNodeDrag
            />
          )}
        </Suspense>

        {hovered && (
          <div className="lemu-graph3d__hint" role="status">
            <strong>{hovered.label}</strong>
            <span className="lemu-meta">{KIND_LABEL[hovered.kind] || hovered.kind}</span>
            {hovered.live && (
              <span className="lemu-meta">
                {hovered.ops} ops
                {hovered.lastSeen ? ` · ${relativeTime(hovered.lastSeen)}` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <p className="lemu-meta lemu-graph3d__foot">
        Drag to rotate, scroll to zoom, click a sphere to focus it — modules, models and jobs
        also open in the node drawer. Cyan nodes have traffic in the liveness window.
      </p>
    </div>
  );
};

export default LemuGraph3D;
