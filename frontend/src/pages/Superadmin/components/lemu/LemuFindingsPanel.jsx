import React, { useMemo, useState } from 'react';
import { Check, Search, Triangle } from 'lucide-react';
import { fullRoutePath, nodeId } from './utils';

const GROUPS = [
  { key: 'untenantedRoutes', title: 'Untenanted routes', kind: 'route', idFor: (r) => nodeId.route(r) },
  { key: 'uninstrumentedJobs', title: 'Uninstrumented jobs', kind: 'job', idFor: (j) => nodeId.job(j) },
  { key: 'modelsWithoutCollection', title: 'Models without collection', kind: 'model', idFor: (m) => `model:${m}` },
  { key: 'collectionsWithoutModel', title: 'Collections without model', kind: 'collection', idFor: (c) => `collection:${c}` },
];

const LemuFindingsPanel = ({ findings, version, onOpenNode, status }) => {
  /* Text filter — 800+ flat findings are not browsable without one. */
  const [filter, setFilter] = useState('');

  const total = useMemo(() => {
    if (!findings) return 0;
    return GROUPS.reduce((sum, g) => sum + ((findings[g.key] || []).length), 0);
  }, [findings]);

  const labelFor = (item, id) => (typeof item === 'string'
    ? item
    : item.method
      ? `${item.method} ${fullRoutePath(item)}`
      : item.name || item.modelName || id);

  const query = filter.trim().toLowerCase();

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
      <div className="lemu-findings-panel__filter lemu-search">
        <span className="lemu-search__icon"><Search size={14} /></span>
        <input
          type="text"
          placeholder={`Filter ${total} findings…`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter findings"
        />
      </div>
      <div className="lemu-findings-grid">
        {GROUPS.map((group) => {
          const allItems = findings?.[group.key] || [];
          const items = query
            ? allItems.filter((item) => labelFor(item, group.idFor(item)).toLowerCase().includes(query))
            : allItems;
          return (
            <div key={group.key} className={`lemu-findings-group ${allItems.length === 0 ? 'lemu-findings-group--clean' : 'lemu-findings-group--alert'}`}>
              <h4 className="lemu-findings-group__title">
                {allItems.length === 0 ? <Check size={14} /> : <Triangle size={14} />}
                {group.title}
                <span className="lemu-findings-group__count">
                  {allItems.length === 0
                    ? '✓ verified'
                    : query && items.length !== allItems.length
                      ? `${items.length} of ${allItems.length}`
                      : allItems.length}
                </span>
              </h4>
              {allItems.length > 0 && items.length === 0 && (
                <div className="lemu-meta lemu-findings-group__no-match">No matches for “{filter}”.</div>
              )}
              {items.length > 0 && (
                <ul className="lemu-findings-group__list">
                  {items.map((item, i) => {
                    const id = group.idFor(item);
                    const label = labelFor(item, id);
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
