import React from 'react';
import { Camera, Crosshair } from 'lucide-react';
import { nf } from './graphPanelCounts';

/* Left rail (plan Task 8): layer tabs with live counts, search with a live
   hit count, FOCUS MATCHES / CLEAR, and the hop-depth panel. 296px glass
   panel at left 16 / top 14, styled in LemuLogsPage.css under .lemu-kgrail.

   The layer subtitles come from the real payload (`layerCounts`) — the
   design's hard-coded `40 n · 52 e` was prototype fiction and must never
   ship. Likewise the hop hint mirrors the tab's actual hop semantics:
   hopFilter.nodesWithinHops is an UNDIRECTED BFS, so a live hop filter
   reads "from selection". `tracing` (upstream trace, Task 13) narrows the
   walk to ancestors only, which is when the design's "upstream only" copy
   applies. */

const LAYERS = [
  { key: 'infra', label: 'INFRA' },
  { key: 'code', label: 'CODE' },
];

const HOPS = [1, 2, 3, 4, 'all'];

const segCls = (on) => (on ? 'lemu-graph3d__seg-item lemu-graph3d__seg-item--on' : 'lemu-graph3d__seg-item');

const LemuGraphControls = ({
  /* layer */
  layer,
  onLayer,
  layerCounts,
  /* search */
  query,
  onQuery,
  searchRef,
  matchCount,
  focusMatches,
  onFocusMatches,
  onClear,
  /* hop depth */
  hopDepth,
  onHopDepth,
  hasSelection,
  tracing,
  /* preserved analysis / view controls */
  showRoutes,
  onShowRoutes,
  routeCount,
  blastOn,
  onBlast,
  livePathOn,
  onLivePath,
  versions,
  diffVersion,
  onDiffVersion,
  mode,
  onMode,
  theme,
  onTheme,
  view,
  onView,
  onFit,
  showSnapshot,
  onSnapshot,
}) => {
  const q = (query || '').trim();
  const hopLive = !!hasSelection;
  const hopHint = !hasSelection
    ? 'select a node'
    : tracing
      ? 'upstream only'
      : hopDepth === 'all'
        ? 'whole graph'
        : 'from selection';

  return (
    <div className="lemu-kgrail">
      <div className="lemu-kgrail__panel">
        <div className="lemu-kgrail__layers" role="group" aria-label="Graph layer">
          {LAYERS.map((t) => {
            const on = layer === t.key;
            const c = layerCounts?.[t.key] || { nodes: 0, edges: 0 };
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                className={`lemu-kgrail__tab${on ? ' lemu-kgrail__tab--on' : ''}`}
                onClick={() => onLayer(t.key)}
              >
                <span className="lemu-kgrail__tab-label">{t.label}</span>
                <span className="lemu-kgrail__tab-sub">{nf(c.nodes)} n · {nf(c.edges)} e</span>
              </button>
            );
          })}
        </div>

        <div className="lemu-kgrail__body">
          <div className="lemu-kgrail__search">
            <span className="lemu-kgrail__glyph" aria-hidden="true">/</span>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="search name, path, collection…"
              aria-label="Highlight nodes in the graph"
            />
            <span
              className="lemu-kgrail__hits"
              data-tone={q ? (matchCount > 0 ? 'ok' : 'fault') : 'idle'}
            >
              {q ? `${nf(matchCount)} hit${matchCount === 1 ? '' : 's'}` : '⌘ /'}
            </span>
          </div>
          <div className="lemu-kgrail__row">
            <button
              type="button"
              aria-pressed={focusMatches}
              className={`lemu-kgrail__focus${focusMatches ? ' lemu-kgrail__focus--on' : ''}`}
              onClick={() => onFocusMatches(!focusMatches)}
            >
              FOCUS MATCHES
            </button>
            <button
              type="button"
              className="lemu-kgrail__clear"
              data-dim={!hasSelection && !q}
              onClick={onClear}
            >
              CLEAR
            </button>
          </div>
        </div>

        <div className={`lemu-kgrail__hop${hopLive ? ' lemu-kgrail__hop--live' : ''}`}>
          <div className="lemu-kgrail__hop-head">
            <span className="lemu-kgrail__hop-label">HOP DEPTH</span>
            <span className="lemu-kgrail__hop-hint">{hopHint}</span>
          </div>
          <div className="lemu-kgrail__hop-row" role="group" aria-label="Filter graph to nodes within this many hops of the selected node">
            {HOPS.map((h) => {
              const on = hopLive && hopDepth === h;
              return (
                <button
                  key={h}
                  type="button"
                  disabled={!hopLive}
                  aria-pressed={on}
                  className={`lemu-kgrail__hop-btn${on ? ' lemu-kgrail__hop-btn--on' : ''}`}
                  onClick={() => onHopDepth(h)}
                >
                  {h === 'all' ? 'ALL' : h}
                </button>
              );
            })}
          </div>
        </div>

        {/* Analysis and view controls carried over from the pre-redesign bar.
           The design distributes these across the right toolbar and drawer;
           until those land they stay here so blast radius, live path, diff,
           view/mode switching, fit and snapshot remain reachable. */}
        <div className="lemu-kgrail__tools">
          <div className="lemu-kgrail__tools-row">
            <div className="lemu-graph3d__seg" role="group" aria-label="Graph view">
              {[['graph', 'Graph'], ['table', 'Table']].map(([v, label]) => (
                <button key={v} type="button" aria-pressed={view === v} className={segCls(view === v)} onClick={() => onView(v)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="lemu-graph3d__seg" role="group" aria-label="Graph render mode">
              {['3d', '2d'].map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} className={segCls(mode === m)} onClick={() => onMode(m)}>
                  {m === '3d' ? '3D' : '2D'}
                </button>
              ))}
            </div>
            <div className="lemu-graph3d__seg" role="group" aria-label="Graph theme">
              {[['dark', 'Dark'], ['light', 'Light']].map(([t, label]) => (
                <button key={t} type="button" aria-pressed={theme === t} className={segCls(theme === t)} onClick={() => onTheme(t)}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="lemu-btn lemu-btn--outline lemu-kgrail__fit" onClick={onFit}>
              <Crosshair size={14} /> Fit
            </button>
            {showSnapshot && (
              <button type="button" className="lemu-btn lemu-btn--outline" onClick={onSnapshot}>
                <Camera size={14} /> PNG
              </button>
            )}
          </div>
          <div className="lemu-kgrail__tools-row">
            <label className="lemu-graph3d__toggle" title="Highlight everything that depends on the selected node, and everything it depends on">
              <input type="checkbox" checked={blastOn} onChange={(e) => onBlast(e.target.checked)} aria-label="Highlight the blast radius of the selected node" />
              <span>Blast radius</span>
            </label>
            <label className="lemu-graph3d__toggle" title="Light measured nodes on the source→table data path (reads/mirrors edges); everything else dims">
              <input type="checkbox" checked={livePathOn} onChange={(e) => onLivePath(e.target.checked)} disabled={layer !== 'infra'} aria-label="Highlight the healthy data path from sources to tables" />
              <span>Live path</span>
            </label>
            <label className="lemu-graph3d__toggle">
              <input type="checkbox" checked={showRoutes} onChange={(e) => onShowRoutes(e.target.checked)} />
              <span>Routes ({routeCount})</span>
            </label>
          </div>
          {versions.length > 0 && (
            <div className="lemu-kgrail__tools-row">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LemuGraphControls;
