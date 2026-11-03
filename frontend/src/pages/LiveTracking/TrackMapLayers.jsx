import { useMemo } from 'react';
import { MarkerF, PolylineF } from '@react-google-maps/api';
import { buildTrackLayers, playheadAt } from './trackLayersModel';
import { createVehicleMarkerIcon } from './vehicleMarkerIcon.js';

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
  playheadTime = null,
  showOverspeed = true,
}) {
  const layers = useMemo(() => buildTrackLayers(track, { zoom }), [track, zoom]);

  const playhead = useMemo(
    () => (playheadTime ? playheadAt(track?.points ?? [], playheadTime) : null),
    [track, playheadTime],
  );

  const playheadIcon = useMemo(
    () =>
      playhead
        ? createVehicleMarkerIcon({
            status: 'MOVING',
            courseDegrees: playhead.headingDeg ?? 0,
            speed: playhead.speedKmh ?? 0,
            registrationNumber: '',
            showLabel: false,
            zoom,
          })
        : null,
    [playhead, zoom],
  );

  return (
    <>
      {/* 1. The path, coloured by what the truck was doing. */}
      {layers.segments.map((segment) =>
        segment.path.length > 1 ? (
          <PolylineF
            key={segment.key}
            path={segment.path}
            options={{
              strokeColor: segment.color,
              strokeWeight: segment.width,
              strokeOpacity: segment.opacity,
              icons: segment.dash ? [dashIcon(segment.color, segment.dash)] : [],
              zIndex: 20,
            }}
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

      {/* 7. The playhead: the truck, pointing where it was going. */}
      {playhead && playheadIcon ? (
        <MarkerF position={{ lat: playhead.lat, lng: playhead.lng }} icon={playheadIcon} zIndex={100} />
      ) : null}
    </>
  );
}

/**
 * A repeating dash for a polyline.
 * Google's polyline icons are a Symbol with a fixed path and a short
 * stroke, repeated along the line.
 */
function dashIcon(color, dash) {
  const [on, off] = dash;
  return {
    icon: {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeWeight: 2,
      scale: 1,
      strokeColor: color,
    },
    offset: '0',
    repeat: `${on + off}px`,
  };
}

/** A round marker. */
function circleIcon(color, size, stroke = '#ffffff', strokeWidth = 2) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
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
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: size / 10,
    anchor: new window.google.maps.Point(0, 0),
  };
}
