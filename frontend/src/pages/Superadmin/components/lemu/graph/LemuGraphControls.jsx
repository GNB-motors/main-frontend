import React from 'react';
import { Boxes, Crosshair, Search } from 'lucide-react';

const LemuGraphControls = ({ query, onQuery, showRoutes, onShowRoutes, routeCount, onFit }) => (
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
          checked={showRoutes}
          onChange={(e) => onShowRoutes(e.target.checked)}
        />
        <span>Include routes ({routeCount})</span>
      </label>
      <button type="button" className="lemu-btn lemu-btn--outline" onClick={onFit}>
        <Crosshair size={14} /> Fit
      </button>
    </div>
  </div>
);

export default LemuGraphControls;
