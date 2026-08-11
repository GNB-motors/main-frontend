import React, { useEffect } from 'react';
import { ChevronDown, ChevronUp, GitCommit } from 'lucide-react';
import LemuChangeSentence from './LemuChangeSentence';

const ChangeList = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="lemu-change-list">
      <h5 className="lemu-change-list__title">{title}</h5>
      <ul>
        {items.map((item, i) => (
          <li key={i} className="lemu-change-list__item">
            {typeof item === 'string' ? item : (item.method ? `${item.method} ${item.path}` : item.name || item.modelName || JSON.stringify(item))}
          </li>
        ))}
      </ul>
    </div>
  );
};

const LemuChangeEntry = ({ version, diff, meta, expanded, onToggle, onLoadDiff }) => {
  useEffect(() => {
    if (expanded && diff === undefined) {
      onLoadDiff(version);
    }
  }, [expanded, diff, version, onLoadDiff]);

  const isGenesis = version === 1 || !diff;

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
          {diff === null && <div className="lemu-change-entry__empty">No diff available for this version.</div>}
          {diff && (
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
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default LemuChangeEntry;
