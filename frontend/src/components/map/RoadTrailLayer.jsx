import React, { useMemo } from 'react';
import { PolylineF } from '@react-google-maps/api';
import { toLayers } from '../../lib/roadTrail';
import { polylineOptions } from '../../lib/roadTrailGoogle';

/**
 * Draws a road trail on a Google map (ROAD_INTELLIGENCE plan Task P4.9). Gaps draw nothing
 * (maths I.1: never a straight line across a gap). Pass `layers` to draw an already clipped set
 * (replays); otherwise `trail` (the GET /api/road/trail data) is converted here.
 */
export default function RoadTrailLayer({ trail, layers, color, fleetColor }) {
  const drawn = useMemo(() => layers || toLayers(trail), [trail, layers]);
  const symbolCircle =
    typeof window !== 'undefined' &&
    window.google &&
    window.google.maps &&
    window.google.maps.SymbolPath
      ? window.google.maps.SymbolPath.CIRCLE
      : 0;
  return (
    <>
      {drawn.map((l) => (
        <PolylineF
          key={`${l.kind}-${l.t0}-${l.partial ? 'p' : 'f'}`}
          path={l.path}
          options={polylineOptions(l, { color, fleetColor, symbolCircle })}
        />
      ))}
    </>
  );
}
