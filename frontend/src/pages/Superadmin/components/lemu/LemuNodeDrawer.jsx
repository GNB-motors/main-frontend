import React, { useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import LemuNodePulse from './LemuNodePulse';
import LemuNodeStatus from './LemuNodeStatus';
import LemuStatusChip from './LemuStatusChip';
import { formatDuration, jobStatusToTrio, relativeTime } from './utils';

const LemuNodeDrawer = ({ node, kind, pulseSeries, findingIds, pulseStatus, onClose }) => {
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

  const renderRouteDetail = () => {
    const route = node;
    const latest = pulseSeries?.[0] || {};
    const state = latest.err > 0 ? 'broken' : latest.n > 0 ? 'nothing' : 'nothing';
    return (
      <>
        <div className="lemu-drawer__head">
          <div className="lemu-drawer__kind">Route</div>
          <h2 className="lemu-drawer__title">{route.method} {route.path}</h2>
          {hasFinding && <span className="lemu-drawer__badge lemu-drawer__badge--finding">▲ Finding</span>}
        </div>
        <dl className="lemu-drawer__grid">
          <dt>Mount</dt><dd>{route.mountPath || '/'}</dd>
          <dt>Handler</dt><dd>{route.handlerName || '—'}</dd>
          <dt>Derived module</dt><dd>{node._module || 'unattributed'}</dd>
          <dt>Auth</dt><dd>{route.hasAuth ? 'yes' : 'no'}</dd>
          <dt>Tenant guard</dt><dd>{route.hasTenantGuard ? 'yes' : 'no'}</dd>
        </dl>
        {route.middlewares?.length > 0 && (
          <div className="lemu-drawer__section">
            <h4>Middleware</h4>
            <ul className="lemu-drawer__list">
              {route.middlewares.map((m, i) => <li key={i}>{m}</li>)}
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
              <li key={i}>{r.method} {r.path}</li>
            ))}
          </ul>
        </div>
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
    if (pulseStatus === 'error') {
      return (
        <>
          {kind === 'route' && renderRouteDetail()}
          {kind === 'model' && renderModelDetail()}
          {kind === 'job' && renderJobDetail()}
          {kind === 'module' && renderModuleDetail()}
          <div className="lemu-alert lemu-alert--error" role="alert">
            Structure loaded; pulse unavailable (503). Structural fields still shown.
          </div>
        </>
      );
    }
    switch (kind) {
      case 'route': return renderRouteDetail();
      case 'model': return renderModelDetail();
      case 'job': return renderJobDetail();
      case 'module': return renderModuleDetail();
      default: return null;
    }
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
