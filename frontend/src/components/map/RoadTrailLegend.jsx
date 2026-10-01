import React from 'react';
import { legendOf } from '../../lib/roadTrail';

/**
 * Legend for a road trail plus the OpenStreetMap attribution ODbL requires wherever road geometry is drawn
 * (ROAD_INTELLIGENCE plan Task P4.9; maths II.3). Place it next to the map, not inside the map canvas.
 */
const SWATCH = { solid: '━━', dashed: '╍╍', dotted: '┈┈' };

export default function RoadTrailLegend({ layers, calibrated, summary, className = '' }) {
  const items = legendOf(layers || []);
  return (
    <div
      className={`road-trail-legend ${className}`.trim()}
      style={{ fontSize: 12, lineHeight: 1.5 }}
    >
      {summary && (
        <div data-testid="road-distance">
          <strong>{summary.km.toFixed(1)} km</strong> {summary.label}
        </div>
      )}
      {items.map((i) => (
        <div key={i.kind}>
          <span aria-hidden="true" style={{ fontFamily: 'monospace', marginRight: 6 }}>
            {SWATCH[i.pattern]}
          </span>
          {i.label}
        </div>
      ))}
      {calibrated === false && items.some((i) => i.tone === 'road') && (
        <div>Road matching accuracy is not yet certified for this fleet.</div>
      )}
      <div>
        Road data ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap contributors
        </a>
      </div>
    </div>
  );
}
