import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import LemuStatusChip from './LemuStatusChip';
import { compactNumber, fullRoutePath, relativeTime } from './utils';

const LemuMapNode = ({
  node,
  kind,
  heat,
  state,
  hasFinding,
  selected,
  onSelectNode,
  tabIndex = 0,
  onKeyDown,
  extra,
}) => {
  const [hover, setHover] = useState(false);
  const heatClass = `lemu-heat--${heat ?? 0}`;
  const stateClass = `lemu-node--${state || 'nothing'}`;
  const selectedClass = selected ? 'lemu-node--selected' : '';
  const hasFindingClass = hasFinding ? 'lemu-node--finding' : '';

  const label = useMemo(() => {
    if (kind === 'route') return `${node.method} ${fullRoutePath(node)}`;
    if (kind === 'model') return node.collectionName || node.modelName;
    if (kind === 'job') return node.name;
    if (kind === 'module') return node.name;
    return 'unknown';
  }, [kind, node]);

  const handleClick = () => {
    if (node?._id) onSelectNode(node._id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
    onKeyDown?.(e);
  };

  const tooltipText = useMemo(() => {
    const lastSeen = extra?.lastSeen ? ` · last ${relativeTime(extra.lastSeen)}` : '';
    if (kind === 'route' && extra) {
      return `n ${extra.n ?? 0} · err ${extra.err ?? 0} · p95 ${extra.p95 ?? '—'}ms${lastSeen}`;
    }
    if (kind === 'model' && extra) {
      const sum = (extra.find || 0) + (extra.insert || 0) + (extra.update || 0) + (extra.del || 0) + (extra.agg || 0);
      const base = `ops ${sum} · find ${extra.find ?? 0} · insert ${extra.insert ?? 0} · update ${extra.update ?? 0}`;
      return extra.noSignal ? `${base} · no traffic in 24h` : `${base}${lastSeen}`;
    }
    if (kind === 'job' && extra) {
      return `status ${extra.status || '—'}`;
    }
    return null;
  }, [kind, extra]);

  return (
    <div
      className={`lemu-node lemu-node--${kind} ${heatClass} ${stateClass} ${selectedClass} ${hasFindingClass}`}
      role="button"
      tabIndex={tabIndex}
      aria-pressed={selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="lemu-node__label">{label}</span>
      {state && state !== 'nothing' && (
        <span className="lemu-node__state">
          <LemuStatusChip state={state} label={extra?.stateLabel || state} />
        </span>
      )}
      {hasFinding && (
        <span className="lemu-node__alert" aria-label="finding">
          <AlertTriangle size={12} />
        </span>
      )}
      {hover && tooltipText && (
        <span className="lemu-node__tooltip" role="tooltip">
          {tooltipText}
        </span>
      )}
      {kind === 'model' && (
        <span className="lemu-node__meta">{compactNumber(node.estimatedDocs)}</span>
      )}
    </div>
  );
};

export default LemuMapNode;
