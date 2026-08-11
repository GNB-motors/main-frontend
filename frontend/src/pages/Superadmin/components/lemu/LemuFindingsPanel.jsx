import React, { useMemo } from 'react';
import { Check, Triangle } from 'lucide-react';
import { nodeId } from './utils';

const GROUPS = [
  { key: 'untenantedRoutes', title: 'Untenanted routes', kind: 'route', idFor: (r) => nodeId.route(r) },
  { key: 'uninstrumentedJobs', title: 'Uninstrumented jobs', kind: 'job', idFor: (j) => nodeId.job(j) },
  { key: 'modelsWithoutCollection', title: 'Models without collection', kind: 'model', idFor: (m) => `model:${m}` },
  { key: 'collectionsWithoutModel', title: 'Collections without model', kind: 'collection', idFor: (c) => `collection:${c}` },
];

const LemuFindingsPanel = ({ findings, version, onOpenNode, status }) => {
  const total = useMemo(() => {
    if (!findings) return 0;
    return GROUPS.reduce((sum, g) => sum + ((findings[g.key] || []).length), 0);
  }, [findings]);

  if (status === 'error') {
    return (
      <div className="lemu-findings-panel lemu-findings-panel--error" role="alert">
        <Triangle size={18} />
        /findings failed — could not read current findings. Absence of a result is not absence of findings.
      </div>
    );
  }

  if (status === 'stale') {
    return (
      <div className="lemu-findings-panel lemu-findings-panel--stale" role="status">
        Findings as of v{version}; they refresh when a new manifest is written.
      </div>
    );
  }

  if (findings && total === 0) {
    return (
      <div className="lemu-findings-panel lemu-findings-panel--clean" role="status">
        <Check size={18} />
        No standing findings. Every route tenant-guarded, every job instrumented, every model mapped. Verified at v{version || '—'}.
      </div>
    );
  }

  return (
    <div className="lemu-findings-panel">
      <div className="lemu-findings-panel__header">
        <h3>Standing findings — these clear when the structure changes, not when you click OK</h3>
        <span className="lemu-meta">v{version || '—'}</span>
      </div>
      <div className="lemu-findings-grid">
        {GROUPS.map((group) => {
          const items = findings?.[group.key] || [];
          return (
            <div key={group.key} className={`lemu-findings-group ${items.length === 0 ? 'lemu-findings-group--clean' : 'lemu-findings-group--alert'}`}>
              <h4 className="lemu-findings-group__title">
                {items.length === 0 ? <Check size={14} /> : <Triangle size={14} />}
                {group.title}
                <span className="lemu-findings-group__count">{items.length === 0 ? '✓ verified' : items.length}</span>
              </h4>
              {items.length > 0 && (
                <ul className="lemu-findings-group__list">
                  {items.map((item, i) => {
                    const id = group.idFor(item);
                    const label = typeof item === 'string'
                      ? item
                      : item.method
                        ? `${item.method} ${item.path}`
                        : item.name || item.modelName || id;
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          className="lemu-findings-item"
                          onClick={() => onOpenNode(id)}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LemuFindingsPanel;
