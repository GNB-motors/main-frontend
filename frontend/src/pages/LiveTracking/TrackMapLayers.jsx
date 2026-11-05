import { useMemo } from 'react';
import { MarkerF, PolylineF } from '@react-google-maps/api';
import { buildTrackLayers } from './trackLayersModel';
import { cssToken } from '../../utils/redesign/tone';
import { resolveMapColor } from './mapColor.js';
import { toLayers } from '../../lib/roadTrail';
import { polylineOptions } from '../../lib/roadTrailGoogle';
import replayAppearance from '../../components/map/replayAppearance.js';

/**
 * Google Maps draws on its own canvas and cannot read CSS variables, so a
 * colour like "var(--rd-leg-loaded)" comes out black. Resolve the token to its
 * computed hex before handing any colour to the map.
 */
function resolveColor(color) {
  return resolveMapColor(color);
}

/**
 * TrackMapLayers — the map drawing of one truck's history.
 *
 * The rules live in trackLayersModel.js; this component only draws what it
 * is given. In particular an overspeed is an orange circle marker, never a
 * red line, and a detour is a red diamond.
 */
export default function TrackMapLayers({
  track,
  zoom = 0,
  showOverspeed = true,
  roadTrail = null,
}) {
  const layers = useMemo(() => buildTrackLayers(track, { zoom }), [track, zoom]);

  // One plain colour for the whole route (Google Maps needs a resolved hex).
  const routeColor = cssToken('--rd-leg-loaded', '#2563eb');

  // When the road engine matched these days, draw the route along real roads
  // (it even bridges GPS gaps along the road); otherwise fall back to the raw
  // point line below.
  const roadPaths = useMemo(() => {
    if (roadTrail?.mode !== 'MATCHED') return [];
    return toLayers(roadTrail)
      .filter((layer) => Array.isArray(layer.path) && layer.path.length > 1)
      .map((layer) => ({ ...layer, key: `road-${layer.kind}-${layer.t0}` }));
  }, [roadTrail]);

  return (
    <>
      {/* 1. The path as one plain line — snapped to roads when the engine has a
            match, otherwise the raw-point line. */}
      {roadPaths.length > 0
        ? roadPaths.map((road) => (
            <PolylineF
              key={road.key}
              path={road.path}
              options={polylineOptions(road, { color: routeColor, symbolCircle: window.google.maps.SymbolPath.CIRCLE })}
            />
          ))
        : layers.segments.map((segment) =>
            segment.path.length > 1 ? (
              <PolylineF
                key={segment.key}
                path={segment.path}
                options={replayAppearance.googleRoute(window.google.maps.SymbolPath.CIRCLE)}
              />
            ) : null,
          )}

      {/* 2. Overspeed: orange circles, never a red line. */}
      {showOverspeed
        ? layers.overspeed.map((marker) => (
            <MarkerF
              key={marker.key}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={circleIcon(marker.color, marker.size, marker.stroke, marker.strokeWidth)}
              title={marker.title}
              clickable
              zIndex={60}
            />
          ))
        : null}

      {/* 3. Detours: red diamonds in normal Track mode. */}
      {layers.detours.map((marker) => (
        <MarkerF
          key={marker.key}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={diamondIcon(marker.color, marker.size)}
          title={marker.title}
          clickable
          zIndex={60}
        />
      ))}

      {/* 4. The other events. */}
      {layers.events.map((marker) => (
        <MarkerF
          key={marker.key}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={circleIcon(marker.color, marker.size, '#ffffff', 1.5)}
          title={marker.title}
          clickable
          zIndex={55}
        />
      ))}

      {/* 5. Stops, coloured by their reason. */}
      {layers.stops.map((stop) =>
        stop.lat === null ? null : (
          <MarkerF
            key={stop.key}
            position={{ lat: stop.lat, lng: stop.lng }}
            icon={circleIcon(stop.color, stop.size, '#ffffff', 2)}
            title={`${stop.title}${stop.reasonWhy ? ` — ${stop.reasonWhy}` : ''}`}
            clickable
            zIndex={50}
          />
        ),
      )}

      {/* 6. Landmarks: small grey pins. */}
      {layers.landmarks.map((landmark) => (
        <MarkerF
          key={landmark.key}
          position={{ lat: landmark.lat, lng: landmark.lng }}
          icon={circleIcon(landmark.color, landmark.size, '#ffffff', 1)}
          title={landmark.title}
          clickable
          zIndex={30}
        />
      ))}

      {/* 7. The playhead is NOT drawn here: the truck itself is an overlay
            (ReplayTruckMarker) so it sits above the line and turns with the
            heading. Two trucks on one drive is worse than none. */}
    </>
  );
}

/** A round marker. */
function circleIcon(color, size, stroke = '#ffffff', strokeWidth = 2) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: resolveColor(color),
    fillOpacity: 1,
    strokeColor: stroke,
    strokeWeight: strokeWidth,
    scale: size / 2,
    anchor: new window.google.maps.Point(0, 0),
  };
}

/** A diamond marker, for the detours. */
function diamondIcon(color, size) {
  return {
    path: 'M 0,-8 L 8,0 L 0,8 L -8,0 z',
    fillColor: resolveColor(color),
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: size / 10,
    anchor: new window.google.maps.Point(0, 0),
  };
}
