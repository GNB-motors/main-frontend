import React, { useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import LemuFindingsPanel from './LemuFindingsPanel';

const LemuFindingsRibbon = ({ findings, version, onOpenNode, expanded, onToggle, status }) => {
  const total = useMemo(() => {
    if (!findings || status === 'error') return null;
    return ['untenantedRoutes', 'uninstrumentedJobs', 'modelsWithoutCollection', 'collectionsWithoutModel']
      .reduce((sum, k) => sum + ((findings[k] || []).length), 0);
  }, [findings, status]);

  const summary = useMemo(() => {
    if (status === 'error') return 'Findings unavailable';
    if (total === 0) return 'No standing findings';
    // Label every number: total findings first, then the per-type breakdown —
    // two bare adjacent counts ("856 851") read as a typo, not information.
    const parts = [];
    const routes = findings?.untenantedRoutes?.length || 0;
    const jobs = findings?.uninstrumentedJobs?.length || 0;
    const models = findings?.modelsWithoutCollection?.length || 0;
    const collections = findings?.collectionsWithoutModel?.length || 0;
    if (routes > 0) parts.push(`${routes} untenanted route${routes === 1 ? '' : 's'}`);
    if (jobs > 0) parts.push(`${jobs} uninstrumented job${jobs === 1 ? '' : 's'}`);
    if (models > 0) parts.push(`${models} model${models === 1 ? '' : 's'} without collection`);
    if (collections > 0) parts.push(`${collections} collection${collections === 1 ? '' : 's'} without model`);
    return `finding${total === 1 ? '' : 's'}: ${parts.join(' · ')}`;
  }, [findings, total, status]);

  return (
    <div className={`lemu-findings-ribbon ${expanded ? 'lemu-findings-ribbon--expanded' : ''}`}>
      <button
        type="button"
        className={`lemu-findings-ribbon__bar ${total > 0 ? 'lemu-findings-ribbon__bar--alert' : 'lemu-findings-ribbon__bar--clean'}`}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="lemu-findings-panel"
      >
        {total > 0 || status === 'error' ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
        <span className="lemu-findings-ribbon__count">
          {status === 'error' ? '—' : total}
        </span>
        <span className="lemu-findings-ribbon__summary">{summary}</span>
        <span className="lemu-findings-ribbon__more">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      {expanded && (
        <div id="lemu-findings-panel" className="lemu-findings-ribbon__panel">
          <LemuFindingsPanel
            findings={findings}
            version={version}
            onOpenNode={onOpenNode}
            status={status}
          />
        </div>
      )}
    </div>
  );
};

export default LemuFindingsRibbon;
