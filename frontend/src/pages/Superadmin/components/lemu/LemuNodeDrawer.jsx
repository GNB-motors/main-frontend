import React, { useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import LemuNodePulse from './LemuNodePulse';
import LemuNodeStatus from './LemuNodeStatus';
import LemuStatusChip from './LemuStatusChip';
import LemuGraphEvidence from './graph/LemuGraphEvidence';
import { formatDuration, fullRoutePath, jobStatusToTrio, relativeTime } from './utils';

/* Inline arrow handlers/middleware have no fn.name, so the manifest records
   them as "anonymous". Never render that bare word — attach the derived module
   (or a count, for middleware) so the operator still learns something. */
const namedOrNull = (name) => (name && name !== 'anonymous' ? name : null);

/* INFRA kinds: the drawer resolves them from the topology payload (the page
   passes it through), and the metrics block picks a few key facts per kind. */
const INFRA_KINDS = ['host', 'store', 'collection', 'table', 'pipe', 'source', 'surface'];

const INFRA_METRICS = {
  host: [['rssMb', 'RSS (MB)'], ['eventLoopLagMs', 'Event-loop lag (ms)'], ['uptimeSec', 'Uptime (s)']],
  store: [['collectionCount', 'Collections'], ['tableCount', 'Tables']],
  collection: [['ops', 'Ops (24h)'], ['fail', 'Failed (24h)']],
  pipe: [['lagSeconds', 'CDC lag (s)'], ['watermarks', 'Watermarks']],
  source: [['calls', 'Calls (24h)'], ['failures', 'Failures (24h)']],
  surface: [['n', 'Requests (24h)'], ['err', 'Errors (24h)']],
};

const handlerLabel = (route, moduleName) => namedOrNull(route.handlerName)
  || `anonymous · ${moduleName ? `${moduleName} module` : 'unattributed'}`;

const middlewareLabels = (middlewares) => {
  const labels = [];
  let anon = 0;
  (middlewares || []).forEach((m) => {
    const named = namedOrNull(m);
    if (named) labels.push(named);
    else anon += 1;
  });
  if (anon > 0) labels.push(`anonymous ×${anon}`);
  return labels;
};

const LemuNodeDrawer = ({ node, kind, pulseSeries, findingIds, pulseStatus, edges, liveness, topology, onClose }) => {
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, [node, kind]);

  /* Simple focus trap: keep focus cycling through focusable elements. */
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return undefined;
    const focusable = () => Array.from(drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const elements = focusable();
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    drawer.addEventListener('keydown', handleKeyDown);
    return () => drawer.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hasFinding = findingIds?.has(node?._id);

  /* The node's key in the knowledge graph. Route nodes connect through their
     module — edges are stored against mounts/modules/models/jobs, not routes. */
  const graphKey = !node ? null
    : kind === 'route' ? (node._module ? `module:${node._module}` : null)
      : kind === 'model' ? `model:${node.modelName}`
        : kind === 'job' ? `job:${node.name}`
          : kind === 'module' ? `module:${node.name}`
            : null;

  const outgoing = graphKey ? (edges || []).filter((e) => e.from === graphKey) : [];
  const incoming = graphKey ? (edges || []).filter((e) => e.to === graphKey) : [];

  const livenessLine = () => {
    if (!liveness || !node) return null;
    if (kind === 'route') {
      const live = liveness.routes?.[`${node.method} ${fullRoutePath(node)}`];
      return live?.lastSeen ? relativeTime(live.lastSeen) : 'no traffic in 24h';
    }
    if (kind === 'model') {
      const live = liveness.collections?.[node.collectionName];
      return live?.lastSeen ? relativeTime(live.lastSeen) : 'no traffic in 24h';
    }
    return null;
  };
  const lastTraffic = livenessLine();

  const renderConnections = () => {
    if (!graphKey) return null;
    if (!outgoing.length && !incoming.length) {
      return (
        <div className="lemu-drawer__section">
          <h4>Connections</h4>
          <div className="lemu-muted">No graph edges recorded for this node.</div>
        </div>
      );
    }
    return (
      <div className="lemu-drawer__section">
        <h4>Connections</h4>
        {outgoing.length > 0 && (
          <>
            <div className="lemu-muted">Depends on / owns</div>
            <ul className="lemu-drawer__list">
              {outgoing.map((e, i) => <li key={i}>{e.to} <span className="lemu-muted">({e.kind}, {e.confidence})</span></li>)}
            </ul>
          </>
        )}
        {incoming.length > 0 && (
          <>
            <div className="lemu-muted">Used by</div>
            <ul className="lemu-drawer__list">
              {incoming.map((e, i) => <li key={i}>{e.from} <span className="lemu-muted">({e.kind}, {e.confidence})</span></li>)}
            </ul>
          </>
        )}
      </div>
    );
  };

  const renderRouteDetail = () => {
    const route = node;
    const latest = pulseSeries?.[0] || {};
    const state = latest.err > 0 ? 'broken' : latest.n > 0 ? 'nothing' : 'nothing';
    return (
      <>
        <div className="lemu-drawer__head">
          <div className="lemu-drawer__kind">Route</div>
          <h2 className="lemu-drawer__title">{route.method} {fullRoutePath(route)}</h2>
          {hasFinding && <span className="lemu-drawer__badge lemu-drawer__badge--finding">▲ Finding</span>}
        </div>
        <dl className="lemu-drawer__grid">
          <dt>Mount</dt><dd>{route.mountPath || '/'}</dd>
          <dt>Handler</dt><dd>{handlerLabel(route, node._module)}</dd>
          <dt>Derived module</dt><dd>{node._module || 'unattributed'}</dd>
          <dt>Auth</dt><dd>{route.hasAuth ? 'yes' : 'no'}</dd>
          <dt>Tenant guard</dt><dd>{route.hasTenantGuard ? 'yes' : 'no'}</dd>
          {lastTraffic && <><dt>Last traffic</dt><dd>{lastTraffic}</dd></>}
        </dl>
        {route.middlewares?.length > 0 && (
          <div className="lemu-drawer__section">
            <h4>Middleware</h4>
            <ul className="lemu-drawer__list">
              {middlewareLabels(route.middlewares).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}
        <LemuNodeStatus state={state} />
        <div className="lemu-drawer__section">
          <h4>Pulse</h4>
          <div className="lemu-drawer__metrics">
            <div className="lemu-metric"><span>n</span><strong>{latest.n ?? '—'}</strong></div>
            <div className="lemu-metric"><span>err</span><strong>{latest.err ?? '—'}</strong></div>
            <div className="lemu-metric"><span>p50</span><strong>{formatDuration(latest.p50)}</strong></div>
            <div className="lemu-metric"><span>p95</span><strong>{formatDuration(latest.p95)}</strong></div>
            <div className="lemu-metric"><span>p99</span><strong>{formatDuration(latest.p99)}</strong></div>
          </div>
          <LemuNodePulse series={pulseSeries} kind="route" />
        </div>
      </>
    );
  };

  const renderModelDetail = () => {
    const model = node;
    const latest = pulseSeries?.[0] || {};
    const state = 'nothing';
    return (
      <>
        <div className="lemu-drawer__head">
          <div className="lemu-drawer__kind">Model</div>
          <h2 className="lemu-drawer__title">{model.modelName}</h2>
          {hasFinding && <span className="lemu-drawer__badge lemu-drawer__badge--finding">▲ Finding</span>}
        </div>
        <dl className="lemu-drawer__grid">
          <dt>Collection</dt><dd>{model.collectionName || '—'}</dd>
          <dt>Paths</dt><dd>{model.pathCount ?? '—'}</dd>
          <dt>Indexes</dt><dd>{model.indexCount ?? '—'}</dd>
          <dt>Tenant field</dt><dd>{model.hasTenantField ? 'yes' : 'no'}</dd>
          <dt>Estimated docs</dt>
          <dd>{model.estimatedDocs === null ? 'doc count unavailable' : model.estimatedDocs}</dd>
          {lastTraffic && <><dt>Last traffic</dt><dd>{lastTraffic}</dd></>}
        </dl>
        {model.indexes?.length > 0 && (
          <div className="lemu-drawer__section">
            <h4>Index list</h4>
            <ul className="lemu-drawer__list">
              {model.indexes.map((ix, i) => <li key={i}><code>{ix}</code></li>)}
            </ul>
          </div>
        )}
        <LemuNodeStatus state={state} />
        <div className="lemu-drawer__section">
          <h4>Pulse</h4>
          <div className="lemu-drawer__metrics lemu-drawer__metrics--wide">
            <div className="lemu-metric"><span>find</span><strong>{latest.find ?? '—'}</strong></div>
            <div className="lemu-metric"><span>insert</span><strong>{latest.insert ?? '—'}</strong></div>
            <div className="lemu-metric"><span>update</span><strong>{latest.update ?? '—'}</strong></div>
            <div className="lemu-metric"><span>del</span><strong>{latest.del ?? '—'}</strong></div>
            <div className="lemu-metric"><span>agg</span><strong>{latest.agg ?? '—'}</strong></div>
          </div>
          <LemuNodePulse series={pulseSeries} kind="model" />
        </div>
      </>
    );
  };

  const renderJobDetail = () => {
    const job = node;
    const health = pulseSeries?._health || {};
    const state = jobStatusToTrio(health.status || 'unmonitored');
    const trioReason = health.reason
      ? health.reason
      : health.status === 'never-ran'
        ? 'Structurally cannot emit; job has never run.'
        : health.status === 'unmonitored'
          ? 'No heartbeat instrumentation registered.'
          : '';
    return (
      <>
        <div className="lemu-drawer__head">
          <div className="lemu-drawer__kind">Job</div>
          <h2 className="lemu-drawer__title">{job.name}</h2>
          {hasFinding && <span className="lemu-drawer__badge lemu-drawer__badge--finding">▲ Finding</span>}
        </div>
        <dl className="lemu-drawer__grid">
          <dt>Interval</dt><dd>{job.intervalMs ? `${job.intervalMs}ms` : '—'}</dd>
          <dt>Cron</dt><dd>{job.cronExpression || '—'}</dd>
          <dt>Instrumented</dt><dd>{job.instrumented ? 'yes' : 'no'}</dd>
          <dt>Live status</dt><dd>{health.status || '—'}</dd>
          <dt>Last OK</dt><dd>{health.lastOkAt ? relativeTime(health.lastOkAt) : '—'}</dd>
        </dl>
        <LemuNodeStatus state={state} reason={trioReason} />
        {health.lastError && (
          <div className="lemu-drawer__section lemu-drawer__section--error">
            <h4>Last error</h4>
            <pre>{health.lastError}</pre>
          </div>
        )}
      </>
    );
  };

  const renderModuleDetail = () => {
    const module = node;
    const routes = node._routes || [];
    const funcs = node._functions || [];
    return (
      <>
        <div className="lemu-drawer__head">
          <div className="lemu-drawer__kind">Module</div>
          <h2 className="lemu-drawer__title">{module.name}</h2>
        </div>
        <dl className="lemu-drawer__grid">
          <dt>Files</dt><dd>{module.fileCount ?? '—'}</dd>
          <dt>Total LOC</dt><dd>{module.totalLoc ?? '—'}</dd>
          <dt>Functions</dt><dd>{module.functionCount ?? '—'}</dd>
          <dt>Attributed routes</dt><dd>{routes.length}</dd>
        </dl>
        <div className="lemu-drawer__section">
          <h4>Functions</h4>
          <ul className="lemu-drawer__list lemu-drawer__list--two">
            {funcs.slice(0, 30).map((fn, i) => (
              <li key={i}>{fn.functionName} <span className="lemu-muted">({fn.loc} loc)</span></li>
            ))}
          </ul>
        </div>
        <div className="lemu-drawer__section">
          <h4>Routes</h4>
          <ul className="lemu-drawer__list lemu-drawer__list--two">
            {routes.slice(0, 30).map((r, i) => (
              <li key={i}>{r.method} {fullRoutePath(r)}</li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  const renderInfraDetail = () => {
    const metrics = node.metrics || {};
    const facts = INFRA_METRICS[node.kind] || [];
    const topoEdges = topology?.edges || [];
    const outgoing = topoEdges.filter((e) => e.from === node.id);
    const incoming = topoEdges.filter((e) => e.to === node.id);
    const live = metrics.liveness || {};
    return (
      <>
        <div className="lemu-drawer__head">
          <div className="lemu-drawer__kind">{kind}</div>
          <h2 className="lemu-drawer__title">{node.label}</h2>
        </div>
        {node.hostId && (
          <dl className="lemu-drawer__grid">
            <dt>Host</dt><dd>{node.hostId.replace(/^host:/, '')}</dd>
          </dl>
        )}
        {(facts.length > 0 || node.kind === 'table') && (
          <div className="lemu-drawer__section">
            <h4>Key facts</h4>
            <div className="lemu-drawer__metrics lemu-drawer__metrics--wide">
              {facts.map(([key, label]) => (
                <div className="lemu-metric" key={key}>
                  <span>{label}</span>
                  <strong>{metrics[key] ?? '—'}</strong>
                </div>
              ))}
              {node.kind === 'table' && (
                <>
                  <div className="lemu-metric"><span>Liveness ok</span><strong>{live.ok == null ? '—' : live.ok ? 'yes' : 'no'}</strong></div>
                  <div className="lemu-metric"><span>Checked</span><strong>{live.checkedAt ? relativeTime(live.checkedAt) : '—'}</strong></div>
                </>
              )}
            </div>
          </div>
        )}
        {(outgoing.length > 0 || incoming.length > 0) && (
          <div className="lemu-drawer__section">
            <h4>Connections</h4>
            {outgoing.length > 0 && (
              <>
                <div className="lemu-muted">Flows to</div>
                <ul className="lemu-drawer__list">
                  {outgoing.map((e, i) => <li key={i}>{e.to} <span className="lemu-muted">({e.kind})</span></li>)}
                </ul>
              </>
            )}
            {incoming.length > 0 && (
              <>
                <div className="lemu-muted">Fed by</div>
                <ul className="lemu-drawer__list">
                  {incoming.map((e, i) => <li key={i}>{e.from} <span className="lemu-muted">({e.kind})</span></li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (!node) {
      return (
        <div className="lemu-drawer__empty">
          <div className="lemu-state__title">Select a node on the map</div>
          <div>Click any route, model, job, or module plate to inspect it.</div>
        </div>
      );
    }
    /* P2: any node carrying a `state` (INFRA nodes directly; code-layer jobs
       enriched with `_topo` from the topology payload) names the row behind
       its colour at the very top of the drawer. */
    const evidenceNode = node.state ? node : node._topo;
    const evidenceBlock = evidenceNode ? <LemuGraphEvidence node={evidenceNode} /> : null;
    if (pulseStatus === 'error') {
      return (
        <>
          {evidenceBlock}
          {kind === 'route' && renderRouteDetail()}
          {kind === 'model' && renderModelDetail()}
          {kind === 'job' && renderJobDetail()}
          {kind === 'module' && renderModuleDetail()}
          {INFRA_KINDS.includes(kind) && renderInfraDetail()}
          {renderConnections()}
          <div className="lemu-alert lemu-alert--error" role="alert">
            Structure loaded; pulse unavailable (503). Structural fields still shown.
          </div>
        </>
      );
    }
    return (
      <>
        {evidenceBlock}
        {(() => {
          switch (kind) {
            case 'route': return renderRouteDetail();
            case 'model': return renderModelDetail();
            case 'job': return renderJobDetail();
            case 'module': return renderModuleDetail();
            default: return INFRA_KINDS.includes(kind) ? renderInfraDetail() : null;
          }
        })()}
        {renderConnections()}
      </>
    );
  };

  return (
    <>
      <motion.div
        className="lemu-drawer-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        ref={drawerRef}
        className="lemu-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lemu-drawer-title"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="lemu-drawer__header">
          <h3 id="lemu-drawer-title" className="lemu-drawer__heading">Node detail</h3>
          <button
            ref={closeBtnRef}
            type="button"
            className="lemu-drawer__close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="lemu-drawer__body">
          {renderContent()}
        </div>
      </motion.aside>
    </>
  );
};

export default LemuNodeDrawer;
