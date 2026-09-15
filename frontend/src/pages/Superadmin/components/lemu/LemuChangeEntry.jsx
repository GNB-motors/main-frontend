import React, { useEffect } from 'react';
import { ChevronDown, ChevronUp, GitCommit } from 'lucide-react';
import LemuChangeSentence from './LemuChangeSentence';
import { fullRoutePath } from './utils';

const ChangeList = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="lemu-change-list">
      <h5 className="lemu-change-list__title">{title}</h5>
      <ul>
        {items.map((item, i) => (
          <li key={i} className="lemu-change-list__item">
            {typeof item === 'string'
              ? item
              : item.from && item.to
                ? `${item.from} → ${item.to}`
                : item.method
                  ? `${item.method} ${fullRoutePath(item)}`
                : item.key
                  ? `${item.key} (middleware changed)`
                  : item.functionName
                    ? `${item.functionName}${item.file ? ` — ${item.file}` : ''}`
                    : item.name || item.modelName || JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const LemuChangeEntry = ({ version, diff, diffStatus, meta, expanded, onToggle, onLoadDiff }) => {
  useEffect(() => {
    // Fetch once per expand. 'error' is terminal until the user hits Retry —
    // auto-refetching here would loop against a hanging request.
    if (expanded && diffStatus === undefined) {
      onLoadDiff(version);
    }
  }, [expanded, diffStatus, version, onLoadDiff]);

  // Genesis is v1 only. Any other version with an unloaded diff is "not loaded
  // yet", not genesis — the sentence component renders those states distinctly.
  const isGenesis = version === 1;

  return (
    <article className={`lemu-change-entry ${expanded ? 'lemu-change-entry--expanded' : ''}`}>
      <div className="lemu-change-entry__head">
        <div className="lemu-change-entry__version">
          <GitCommit size={14} />
          v{version}
        </div>
        <div className="lemu-change-entry__meta">
          {meta?.gitCommit && <code className="lemu-change-entry__hash">{meta.gitCommit.slice(0, 7)}</code>}
          <span className="lemu-change-entry__date">
            {meta?.createdAt ? new Date(meta.createdAt).toLocaleString() : '—'}
          </span>
        </div>
      </div>
      <LemuChangeSentence diff={diff} isGenesis={isGenesis} meta={meta} />
      <button
        type="button"
        className="lemu-change-entry__toggle"
        onClick={() => onToggle(version)}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        details {expanded ? '▴' : '▾'}
      </button>
      {expanded && (
        <div className="lemu-change-entry__details">
          {diffStatus === 'loading' && (
            <div className="lemu-change-entry__empty">
              <span className="lemu-spinner" /> Loading diff for v{version}…
            </div>
          )}
          {diffStatus === 'error' && (
            <div className="lemu-change-entry__empty lemu-change-entry__empty--error">
              /manifest/diff failed for v{version} — the version exists; this is a fetch error, not
              an empty change set.
              <button
                type="button"
                className="lemu-change-entry__retry"
                onClick={() => onLoadDiff(version)}
              >
                Retry
              </button>
            </div>
          )}
          {diffStatus === 'ready' && diff === null && (
            <div className="lemu-change-entry__empty">No diff available for this version.</div>
          )}
          {typeof diff === 'string' && (
            <div className="lemu-change-entry__empty">
              {diff.includes('[object Object]')
                ? 'This version stored its summary as a pre-rendered string that was mangled before persistence (legacy format). Only the snapshot counts in the sentence above survive.'
                : diff}
            </div>
          )}
          {diff && typeof diff !== 'string' && (
            <div className="lemu-change-grid">
              <div className="lemu-change-group">
                <h4>Routes</h4>
                <ChangeList title="added" items={diff.routes?.added} />
                <ChangeList title="removed" items={diff.routes?.removed} />
                <ChangeList title="changed middleware" items={diff.routes?.middlewareChanged} />
              </div>
              <div className="lemu-change-group">
                <h4>Models</h4>
                <ChangeList title="added" items={diff.models?.added} />
                <ChangeList title="removed" items={diff.models?.removed} />
                <ChangeList title="index changed" items={diff.models?.indexChanged} />
              </div>
              <div className="lemu-change-group">
                <h4>Jobs</h4>
                <ChangeList title="added" items={diff.jobs?.added} />
                <ChangeList title="removed" items={diff.jobs?.removed} />
                <ChangeList title="uninstrumented" items={diff.jobs?.uninstrumented} />
              </div>
              <div className="lemu-change-group">
                <h4>Functions</h4>
                <ChangeList title="added" items={diff.functions?.added} />
                <ChangeList title="removed" items={diff.functions?.removed} />
              </div>
              <div className="lemu-change-group">
                <h4>Modules</h4>
                <ChangeList title="added" items={diff.modules?.added} />
                <ChangeList title="removed" items={diff.modules?.removed} />
              </div>
              <div className="lemu-change-group">
                <h4>Connections</h4>
                <ChangeList title="added" items={diff.edges?.added} />
                <ChangeList title="removed" items={diff.edges?.removed} />
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default LemuChangeEntry;
