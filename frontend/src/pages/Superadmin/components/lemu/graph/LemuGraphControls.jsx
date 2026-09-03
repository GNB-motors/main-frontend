import React from 'react';
import { Boxes, Crosshair, Search } from 'lucide-react';

const LemuGraphControls = ({
  query,
  onQuery,
  showRoutes,
  onShowRoutes,
  routeCount,
  hopDepth,
  onHopDepth,
  hasSelection,
  onFit,
  focusMatches,
  onFocusMatches,
}) => (
  <div className="lemu-graph3d__bar">
    <div className="lemu-system-map__title">
      <Boxes size={16} />
      <h2>Knowledge graph</h2>
    </div>
    <div className="lemu-graph3d__controls">
      <div className="lemu-search lemu-search--compact">
        <span className="lemu-search__icon"><Search size={14} /></span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Highlight nodes…"
          aria-label="Highlight nodes in the graph"
        />
      </div>
      <label className="lemu-graph3d__toggle">
        <input
          type="checkbox"
          checked={focusMatches}
          onChange={(e) => onFocusMatches(e.target.checked)}
          disabled={!query.trim()}
          aria-label="Filter the graph to nodes matching the search query"
        />
        <span>Focus matches</span>
      </label>
      <label className="lemu-graph3d__toggle">
        <input
          type="checkbox"
          checked={showRoutes}
          onChange={(e) => onShowRoutes(e.target.checked)}
        />
        <span>Include routes ({routeCount})</span>
      </label>
      <label className="lemu-graph3d__hop">
        <span>Hop depth</span>
        <select
          value={hopDepth}
          onChange={(e) => onHopDepth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          disabled={!hasSelection}
          aria-label="Filter graph to nodes within this many hops of the selected node"
        >
          {[1, 2, 3, 4].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          <option value="all">All</option>
        </select>
        {!hasSelection && <span className="lemu-graph3d__hop-hint lemu-meta">select a node to filter</span>}
      </label>
      <button type="button" className="lemu-btn lemu-btn--outline" onClick={onFit}>
        <Crosshair size={14} /> Fit
      </button>
    </div>
  </div>
);

export default LemuGraphControls;
