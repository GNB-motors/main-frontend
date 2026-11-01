import { memo } from 'react';
import { PolylineF } from '@react-google-maps/api';
import replayAppearance from '../../components/map/replayAppearance.js';

function ReplayRouteLayer({ layers, points }) {
  const circle = window.google.maps.SymbolPath.CIRCLE;
  if (layers.length)
    return layers.map((layer) => (
      <PolylineF
        key={`replay-base-${layer.kind}-${layer.t0}`}
        path={layer.path}
        options={replayAppearance.googleRoad(layer, circle)}
      />
    ));
  return <PolylineF path={points} options={replayAppearance.googleRoute(circle)} />;
}

// The full route stays still while the travelled path updates on each animation frame.
export default memo(ReplayRouteLayer);
