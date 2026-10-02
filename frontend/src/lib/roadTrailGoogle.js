/**
 * Google Maps polyline options for road trail layers (ROAD_INTELLIGENCE plan Task P4.9). Pure: the caller
 * passes window.google.maps.SymbolPath.CIRCLE as `symbolCircle` (0 in tests).
 * solid = on a road; dashed = inferred, low confidence, not yet certified or provisional fleet road;
 * dotted = GPS fixes not on a known road.
 */
const TONE_COLOR = { raw: '#64748b', inferred: '#94a3b8' };

export function polylineOptions(
  layer,
  { color = '#0284c7', fleetColor = '#7c3aed', symbolCircle = 0 } = {},
) {
  const stroke = layer.tone === 'fleet' ? fleetColor : TONE_COLOR[layer.tone] || color;
  if (layer.pattern === 'solid') {
    return { strokeColor: stroke, strokeOpacity: 0.95, strokeWeight: 4, zIndex: 3 };
  }
  if (layer.pattern === 'dashed') {
    return {
      strokeOpacity: 0,
      zIndex: 2,
      icons: [
        {
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, strokeColor: stroke, scale: 3 },
          offset: '0',
          repeat: '14px',
        },
      ],
    };
  }
  return {
    strokeOpacity: 0,
    zIndex: 1,
    icons: [
      {
        icon: {
          path: symbolCircle,
          fillOpacity: 0.9,
          fillColor: stroke,
          strokeOpacity: 0,
          scale: 2,
        },
        offset: '0',
        repeat: '10px',
      },
    ],
  };
}
