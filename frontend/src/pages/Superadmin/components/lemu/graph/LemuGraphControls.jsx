import React from 'react';
import { Boxes, Camera, Crosshair, Search } from 'lucide-react';

const LemuGraphControls = ({
  query,
  onQuery,
  searchRef,
  showRoutes,
  onShowRoutes,
  routeCount,
  hopDepth,
  onHopDepth,
  hasSelection,
  onFit,
  focusMatches,
  onFocusMatches,
  blastOn,
  onBlast,
  mode,
  onMode,
  layer,
  onLayer,
  view,
  onView,
  showSnapshot,
  onSnapshot,
  versions,
  diffVersion,
  onDiffVersion,
  livePathOn,
  onLivePath,
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
          ref={searchRef}
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
      <label className="lemu-graph3d__toggle" title="Highlight everything that depends on the selected node, and everything it depends on">
        <input
          type="checkbox"
          checked={blastOn}
          onChange={(e) => onBlast(e.target.checked)}
          aria-label="Highlight the blast radius of the selected node"
        />
        <span>Blast radius</span>
      </label>
      <label className="lemu-graph3d__toggle" title="Light measured nodes on the source→table data path (reads/mirrors edges); everything else dims">
        <input
          type="checkbox"
          checked={livePathOn}
          onChange={(e) => onLivePath(e.target.checked)}
          disabled={layer !== 'infra'}
          aria-label="Highlight the healthy data path from sources to tables"
        />
        <span>Live path</span>
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
      {versions.length > 0 && (
        /* Manifest-diff overlay (Phase 5): comparing against a version shows
           its changes as outlines on the code graph. The list is versions
           older than the current manifest — the current version has no diff
           to compare against itself. */
        <label className="lemu-graph3d__hop">
          <span>Diff</span>
          <select
            value={diffVersion ?? ''}
            onChange={(e) => onDiffVersion(e.target.value === '' ? null : Number(e.target.value))}
            aria-label="Compare with an older manifest version"
          >
            <option value="">Off</option>
            {versions.map((v) => (
              <option key={v.version} value={v.version}>v{v.version}</option>
            ))}
          </select>
        </label>
      )}
      <div className="lemu-graph3d__seg" role="group" aria-label="Graph layer">
        {[['code', 'Code'], ['infra', 'Infra']].map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={layer === v}
            className={layer === v ? 'lemu-graph3d__seg-item lemu-graph3d__seg-item--on' : 'lemu-graph3d__seg-item'}
            onClick={() => onLayer(v)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="lemu-graph3d__seg" role="group" aria-label="Graph view">
        {[['graph', 'Graph'], ['table', 'Table']].map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            className={view === v ? 'lemu-graph3d__seg-item lemu-graph3d__seg-item--on' : 'lemu-graph3d__seg-item'}
            onClick={() => onView(v)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="lemu-graph3d__seg" role="group" aria-label="Graph render mode">
        {['3d', '2d'].map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            className={mode === m ? 'lemu-graph3d__seg-item lemu-graph3d__seg-item--on' : 'lemu-graph3d__seg-item'}
            onClick={() => onMode(m)}
          >
            {m === '3d' ? '3D' : '2D'}
          </button>
        ))}
      </div>
      <button type="button" className="lemu-btn lemu-btn--outline" onClick={onFit}>
        <Crosshair size={14} /> Fit
      </button>
      {showSnapshot && (
        <button type="button" className="lemu-btn lemu-btn--outline" onClick={onSnapshot}>
          <Camera size={14} /> Snapshot
        </button>
      )}
    </div>
  </div>
);

export default LemuGraphControls;
