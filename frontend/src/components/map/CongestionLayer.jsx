import React, { useMemo } from 'react';
import { PolylineF } from '@react-google-maps/api';
import { segmentsFrom } from '../../lib/congestion';

/**
 * Draws the congestion layer on the Google map (00_PLAN.md item 5).
 *
 * Rows come from GET /api/road/congestion/org and are already road-matched OSM edges with their own
 * polyline6, so this only turns each one into a polyline. An edge the backend refused to rate is not in the
 * payload at all: nothing here invents geometry for it. Colour comes from the row's learned label, not
 * from a speed the component decides on.
 */
export default function CongestionLayer({ rows }) {
  const segments = useMemo(() => segmentsFrom(rows), [rows]);
  return (
    <>
      {segments.map((s) => (
        <PolylineF key={`cong-${s.key}`} path={s.path} options={s.options} />
      ))}
    </>
  );
}