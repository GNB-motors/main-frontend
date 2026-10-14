import React from 'react';

const GraphFootRail = ({ layer, scrubbedBucket, dataUpdatedAt, freshState, freshAgeSec }) => (
  <p className="lemu-meta lemu-graph3d__foot lemu-graph3d__rail">
    {layer === 'infra'
      ? 'Colour encodes kind; rings encode state (solid measured, hollow declared, fault unreachable); particles mark the CDC spine. Hold Space and drag to pan.'
      : 'Drag to rotate, scroll to zoom, click a sphere to focus it — modules, models and jobs also open in the node drawer. Colour encodes kind; particles along an edge mean recent traffic. Hold Space and drag to pan.'}
    {scrubbedBucket ? (
      /* Scrubbed into the past is a user choice, not staleness — the
             dot reads neutral grey and the label names the shown moment
             instead of an age. */
      <span
        className="lemu-graph3d__fresh lemu-graph3d__fresh--showing"
        aria-live="off"
        title={`Showing activity at ${new Date(scrubbedBucket.bucketStart).toLocaleString()}`}
      >
        <i className="lemu-graph3d__fresh-dot" aria-hidden="true" />
        showing{' '}
        {new Date(scrubbedBucket.bucketStart).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </span>
    ) : (
      dataUpdatedAt && (
        <span
          className={`lemu-graph3d__fresh lemu-graph3d__fresh--${freshState}`}
          aria-live="off"
          title={`Data updated ${new Date(dataUpdatedAt).toLocaleString()}`}
        >
          <i className="lemu-graph3d__fresh-dot" aria-hidden="true" />
          updated {freshAgeSec}s ago
        </span>
      )
    )}
  </p>
);

export default GraphFootRail;
