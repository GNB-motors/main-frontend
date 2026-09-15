import React, { useMemo } from 'react';
import LemuMapNode from './LemuMapNode';
import { compactNumber, fullRoutePath, heatFromCount, nodeId, routePulseKey } from './utils';

const SORTERS = {
  activity: (a, b) => (b.heat || 0) - (a.heat || 0) || a.label.localeCompare(b.label),
  name: (a, b) => a.label.localeCompare(b.label),
  size: (a, b) => (b.loc || 0) - (a.loc || 0) || a.label.localeCompare(b.label),
  state: (a, b) => (b.stateRank || 0) - (a.stateRank || 0) || a.label.localeCompare(b.label),
};

const STATE_RANK = {
  broken: 3,
  degraded: 2,
  off: 1,
  nothing: 0,
};

const LemuModulePlate = ({ module, routes, functions, pulse, livenessRoutes, findings, sort, onSelectNode, selectedNodeId }) => {
  const routePulseMap = useMemo(() => {
    const latestBucket = pulse?.buckets?.[0];
    const pulseRoutes = latestBucket?.routes || [];
    const map = {};
    pulseRoutes.forEach((r) => { map[r.key] = r; });
    return map;
  }, [pulse]);

  const findingIds = useMemo(() => {
    const ids = new Set();
    (findings?.untenantedRoutes || []).forEach((r) => ids.add(nodeId.route(r)));
    return ids;
  }, [findings]);

  const nodeItems = useMemo(() => {
    return (routes || []).map((route) => {
      const id = nodeId.route(route);
      const pulseRoute = routePulseMap[routePulseKey(route)] || {};
      const live = livenessRoutes?.[routePulseKey(route)] || null;
      const heat = heatFromCount(pulseRoute.n);
      const state = pulseRoute.n > 0 ? 'nothing' : pulseRoute.err > 0 ? 'broken' : 'nothing';
      return {
        id,
        route,
        label: `${route.method} ${fullRoutePath(route)}`,
        heat,
        state,
        stateRank: STATE_RANK[state] || 0,
        hasFinding: findingIds.has(id),
        extra: { ...pulseRoute, lastSeen: live?.lastSeen || null },
        loc: route.path.length,
      };
    }).sort(SORTERS[sort] || SORTERS.activity);
  }, [routes, routePulseMap, livenessRoutes, findingIds, sort]);

  const dots = nodeItems.slice(0, 12).map((n) => n.heat);
  const gridSpan = Math.min(4, Math.max(1, Math.ceil((module.totalLoc || 0) / 600)));

  return (
    <article
      className={`lemu-plate lemu-plate--span-${gridSpan}`}
      style={{ '--module-loc': module.totalLoc || 0 }}
    >
      <header className="lemu-plate__head">
        <div className="lemu-plate__title">
          {module.name}
          <span className="lemu-plate__loc">{compactNumber(module.totalLoc)}</span>
        </div>
        <div className="lemu-plate__meta">
          {nodeItems.length} routes · {(functions || []).filter((f) => f.module === module.name).length} functions
        </div>
      </header>
      <div className="lemu-plate__heat" aria-hidden="true">
        {dots.map((h, i) => (
          <span key={i} className={`lemu-plate__dot lemu-heat--${h}`} />
        ))}
      </div>
      <div className="lemu-plate__body" role="list">
        {nodeItems.map((item) => (
          <LemuMapNode
            key={item.id}
            node={{ ...item.route, _id: item.id }}
            kind="route"
            heat={item.heat}
            state={item.state}
            hasFinding={item.hasFinding}
            selected={selectedNodeId === item.id}
            onSelectNode={onSelectNode}
            extra={item.extra}
          />
        ))}
      </div>
    </article>
  );
};

export default LemuModulePlate;
