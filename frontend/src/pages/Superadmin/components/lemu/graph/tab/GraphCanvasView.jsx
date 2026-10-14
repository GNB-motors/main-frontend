import React from 'react';
import KgCanvas from '../KgCanvas';
import GraphErrorBoundary from '../GraphErrorBoundary';

const GraphCanvasView = ({
  visible,
  layer,
  mode,
  theme,
  selectedNodeId,
  hopDepth,
  matches,
  analysisNeighbours,
  urgency,
  overlayMarks,
  query,
  focusMatches,
  tip,
  handleCanvasKeyDown,
  handleNodeClick,
  handleAutoHop,
  handleHover,
  handleClearSelection,
  setHopDepth,
  handleFocusSearch,
  fitRef,
  focusRef,
  snapshotRef,
  instanceRef,
}) => (
  <div role="presentation" onKeyDown={handleCanvasKeyDown}>
    <GraphErrorBoundary>
      <KgCanvas
        graph={visible}
        layer={layer}
        mode={mode}
        theme={theme}
        selectedNodeId={selectedNodeId}
        hopDepth={hopDepth}
        matches={matches}
        neighbours={analysisNeighbours}
        urgency={urgency}
        overlay={overlayMarks}
        query={query}
        focusMatches={focusMatches}
        drawerOpen={!!selectedNodeId}
        motion
        onSelect={handleNodeClick}
        onAutoHop={handleAutoHop}
        onHover={handleHover}
        onClearSelection={handleClearSelection}
        onHopDepth={setHopDepth}
        onFocusSearch={handleFocusSearch}
        fitRef={fitRef}
        focusRef={focusRef}
        snapshotRef={snapshotRef}
        instanceRef={instanceRef}
      />
    </GraphErrorBoundary>
    {tip.show && (
      /* Canvas-local coords from the shell (design: mx+52, my+44);
               the overlay spans the canvas region and ignores the pointer. */
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div
          className="lemu-graph3d__hint"
          role="status"
          style={{
            left: tip.x,
            top: tip.y,
            borderLeft: `3px solid ${tip.color}`,
          }}
        >
          <strong>{tip.name}</strong>
          <span className="lemu-meta">{tip.meta}</span>
        </div>
      </div>
    )}
  </div>
);

export default GraphCanvasView;
