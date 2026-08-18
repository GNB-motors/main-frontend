import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Map, Search, SlidersHorizontal } from 'lucide-react';
import LemuMapRegion from './LemuMapRegion';
import LemuModulePlate from './LemuModulePlate';
import LemuMapNode from './LemuMapNode';
import LemuMapEmpty from './LemuMapEmpty';
import LemuStatusChip from './LemuStatusChip';
import { deriveRouteModule, fullRoutePath, heatFromCount, jobStatusToTrio, nodeId } from './utils';

const SORT_OPTIONS = [
  { id: 'activity', label: 'Activity' },
  { id: 'name', label: 'Name' },
  { id: 'size', label: 'Size' },
  { id: 'state', label: 'State' },
];

const LemuSystemMap = ({ manifest, pulse, status, sort, onSortChange, onSelectNode, selectedNodeId, jobHealth, onRebuild }) => {
  const boardRef = useRef(null);
  /* Text filter across route plates — 40+ modules flat is not browsable. */
  const [routeFilter, setRouteFilter] = useState('');

  const functionsByName = useMemo(() => {
    const map = {};
    (manifest?.functions || []).forEach((fn) => { map[fn.functionName] = fn; });
    return map;
  }, [manifest]);

  const collectionPulseMap = useMemo(() => {
    const latestBucket = pulse?.buckets?.[0];
    const pulseCollections = latestBucket?.collections || [];
    const map = {};
    pulseCollections.forEach((c) => { map[c.name] = c; });
    return map;
  }, [pulse]);

  const findingIds = useMemo(() => {
    const ids = new Set();
    (manifest?.findings?.untenantedRoutes || []).forEach((r) => ids.add(nodeId.route(r)));
    (manifest?.findings?.uninstrumentedJobs || []).forEach((j) => ids.add(nodeId.job(j)));
    (manifest?.findings?.modelsWithoutCollection || []).forEach((m) => ids.add(`model:${m}`));
    (manifest?.findings?.collectionsWithoutModel || []).forEach((c) => ids.add(`collection:${c}`));
    return ids;
  }, [manifest]);

  const plates = useMemo(() => {
    const groups = {};
    (manifest?.routes || []).forEach((route) => {
      const moduleName = deriveRouteModule(route, functionsByName);
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(route);
    });

    const modules = (manifest?.modules || []).map((m) => ({
      ...m,
      routes: groups[m.name] || [],
    }));

    Object.keys(groups).forEach((moduleName) => {
      if (!modules.find((m) => m.name === moduleName)) {
        modules.push({ name: moduleName, fileCount: 0, totalLoc: 0, functionCount: 0, routes: groups[moduleName] });
      }
    });

    return modules.filter((m) => m.routes.length > 0).sort((a, b) => (b.totalLoc || 0) - (a.totalLoc || 0));
  }, [manifest, functionsByName]);

  const visiblePlates = useMemo(() => {
    const query = routeFilter.trim().toLowerCase();
    if (!query) return plates;
    return plates
      .map((module) => {
        // A module-name match keeps the whole plate; otherwise match routes.
        if (module.name.toLowerCase().includes(query)) return module;
        return {
          ...module,
          routes: module.routes.filter((r) => `${r.method} ${fullRoutePath(r)}`.toLowerCase().includes(query)),
        };
      })
      .filter((module) => module.routes.length > 0);
  }, [plates, routeFilter]);

  const models = useMemo(() => {
    return (manifest?.models || []).map((model) => {
      const pulseColl = collectionPulseMap[model.collectionName] || {};
      const sum = (pulseColl.find || 0) + (pulseColl.insert || 0) + (pulseColl.update || 0) + (pulseColl.del || 0) + (pulseColl.agg || 0);
      const id = nodeId.model(model);
      return {
        id,
        model,
        heat: heatFromCount(sum),
        state: 'nothing',
        hasFinding: findingIds.has(id) || findingIds.has(`collection:${model.collectionName}`),
        extra: pulseColl,
      };
    }).sort((a, b) => (b.model.estimatedDocs || 0) - (a.model.estimatedDocs || 0));
  }, [manifest, collectionPulseMap, findingIds]);

  const jobs = useMemo(() => {
    const healthMap = {};
    (jobHealth || []).forEach((j) => { healthMap[j.job] = j; });
    return (manifest?.jobs || []).map((job) => {
      const health = healthMap[job.name] || {};
      const id = nodeId.job(job);
      return {
        id,
        job,
        heat: 0,
        state: jobStatusToTrio(health.status || 'unmonitored'),
        hasFinding: findingIds.has(id) || !job.instrumented,
        extra: health,
      };
    });
  }, [manifest, jobHealth, findingIds]);

  /* Roving tabindex across all visible .lemu-node elements. */
  const handleKeyDown = useCallback((e) => {
    if (!boardRef.current) return;
    const nodes = Array.from(boardRef.current.querySelectorAll('.lemu-node'));
    const current = document.activeElement;
    const idx = nodes.indexOf(current);
    if (idx === -1 && !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;

    let next = idx;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = nodes.length - 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(nodes.length - 1, idx + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
    else return;

    if (next !== idx) {
      e.preventDefault();
      nodes.forEach((n, i) => { n.tabIndex = i === next ? 0 : -1; });
      nodes[next]?.focus();
    }
  }, []);

  if (status === 'loading' || status === 'empty' || status === 'error') {
    return <LemuMapEmpty status={status} onRebuild={onRebuild} />;
  }

  const newestBucket = pulse?.buckets?.[0]?.bucketStart;
  const isStale = status === 'stale';

  return (
    <div className={`lemu-system-map ${isStale ? 'lemu-system-map--stale' : ''}`}>
      <div className="lemu-system-map__bar">
        <div className="lemu-system-map__title">
          <Map size={18} />
          System
        </div>
        <div className="lemu-system-map__controls">
          <div className="lemu-search lemu-search--compact">
            <span className="lemu-search__icon"><Search size={14} /></span>
            <input
              type="text"
              placeholder="Filter routes or modules…"
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              aria-label="Filter routes or modules"
            />
          </div>
          <label className="lemu-meta" htmlFor="lemu-sort">Sort</label>
          <select
            id="lemu-sort"
            className="lemu-select lemu-select--small"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div className="lemu-meta" title="Layout select is module-only per spec">
            <SlidersHorizontal size={14} /> module
          </div>
        </div>
      </div>

      {isStale && (
        <div className="lemu-alert lemu-alert--warn" role="status">
          Structure v{manifest?.version} · {manifest?.createdAt ? new Date(manifest.createdAt).toLocaleDateString() : '—'}.
          Pulse tint frozen — last bucket {newestBucket ? `${Math.round((Date.now() - new Date(newestBucket).getTime()) / 60000)}m` : '—'} ago, flush timer may be off.
        </div>
      )}

      <div className="lemu-system-map__board" ref={boardRef} onKeyDown={handleKeyDown}>
        <LemuMapRegion kind="code" count={visiblePlates.length}>
          {visiblePlates.length === 0 && (
            <div className="lemu-meta lemu-system-map__no-match">No routes or modules match “{routeFilter}”.</div>
          )}
          <div className="lemu-plates">
            {visiblePlates.map((module) => (
              <LemuModulePlate
                key={module.name}
                module={module}
                routes={module.routes}
                functions={manifest?.functions || []}
                pulse={pulse}
                findings={manifest?.findings}
                sort={sort}
                onSelectNode={onSelectNode}
                selectedNodeId={selectedNodeId}
              />
            ))}
          </div>
        </LemuMapRegion>

        <LemuMapRegion kind="data" count={models.length}>
          <div className="lemu-models" role="list">
            {models.map((m) => (
              <LemuMapNode
                key={m.id}
                node={{ ...m.model, _id: m.id }}
                kind="model"
                heat={m.heat}
                state={m.state}
                hasFinding={m.hasFinding}
                selected={selectedNodeId === m.id}
                onSelectNode={onSelectNode}
                extra={m.extra}
              />
            ))}
          </div>
        </LemuMapRegion>

        <LemuMapRegion kind="schedule" count={jobs.length}>
          <div className="lemu-jobs" role="list">
            {jobs.map((j) => (
              <div key={j.id} className="lemu-job-row">
                <LemuMapNode
                  node={{ ...j.job, _id: j.id }}
                  kind="job"
                  heat={j.heat}
                  state={j.state}
                  hasFinding={j.hasFinding}
                  selected={selectedNodeId === j.id}
                  onSelectNode={onSelectNode}
                  extra={j.extra}
                />
                <LemuStatusChip state={j.state} />
              </div>
            ))}
          </div>
        </LemuMapRegion>
      </div>
    </div>
  );
};

export default LemuSystemMap;
