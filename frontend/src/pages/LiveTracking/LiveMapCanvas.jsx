import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, OverlayView, PolylineF } from '@react-google-maps/api';
import { formatDuration } from '../../utils/redesign/format';
import RoadTrailLayer from '../../components/map/RoadTrailLayer';
import { trailArrowIcons } from './mapIcons.js';
import { createTrailEndpointIcon } from './trailMarkerIcons.js';
import { createHabitualHaltIcon } from './trailMarkerIcons.js';
import AnimatedVehicleMarkers from './AnimatedVehicleMarkers.jsx';
import focusedMapVehicles from './focusedMapVehicles.js';
import TrackPlacesLayer from './TrackPlacesLayer.jsx';
import MapPlacesLayer from './MapPlacesLayer.jsx';
import WeatherBubble from './WeatherBubble.jsx';
import FleetWeatherMarkers from './FleetWeatherMarkers.jsx';
import ReplayTruckMarker from './ReplayTruckMarker.jsx';
import ReplayRouteLayer from './ReplayRouteLayer.jsx';
import TrafficLayer from './TrafficLayer.jsx';
import TrackMapLayers from './TrackMapLayers.jsx';
import replayAppearance from '../../components/map/replayAppearance.js';
import { DEFAULT_LIMIT_KMH } from '../RouteHub/views/replay/replayConstants.js';

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

export default function LiveMapCanvas({
  isLoaded,
  loadError,
  mapZoom,
  setMapZoom,
  onMapLoad,
  onMapIdle,
  mapRef,
  mapOptions,
  mapVehicles,
  selectedId,
  setSelectedId,
  setIsRailOpen,
  isTrailVisible,
  trailCoords,
  roadTrail,
  selectedStatusColor,
  replayState,
  replayPtsCoords,
  replayRunPaths,
  replayRoadLayers,
  replayBaseLayers,
  replayCurrentPos,
  replaySpeed,
  trailSegments,
  fallbackSingleColor,
  habitualHalts,
  isHabitualHaltsVisible,
  segmentByTrip,
  weather,
  weatherBubblePosition,
  fleetWeather,
  places = [],
  extraPlaces = [],
  selectedPlaceId = null,
  onSelectPlace,
  placesDark = false,
  isTrafficOn = false,
  map = null,
  track = null,
  trackPlayheadTime = null,
}) {
  /* When the user disables per-trip segmentation we fall back to a single
     polyline (visual continuity with the legacy behavior). The fallback
     color is palette slot 0 — distinct from the selected status color so
     the user can still see the breadcrumb while a heavy trail is up. */
  const showSegments =
    !replayState.on &&
    isTrailVisible &&
    trailCoords.length > 1 &&
    segmentByTrip &&
    trailSegments &&
    trailSegments.length > 0;
  const showSingleTrail =
    !replayState.on &&
    isTrailVisible &&
    trailCoords.length > 1 &&
    (!segmentByTrip || !trailSegments || trailSegments.length === 0);
  // In Track mode only the tracked truck matters, drawn by TrackMapLayers as
  // the moving playhead; the rest of the live fleet is hidden so the owner
  // watches one truck at a time (back out to pick another).
  const fleetOnMap = track
    ? []
    : focusedMapVehicles(mapVehicles, {
        selectedId,
        replayOn: replayState.on,
      });

  // Clicking a habitual halt isolates it and opens a small card; only that place
  // stays on the map until it is closed (its ×, or a click on the empty map).
  // Reset when the halts change (a new truck, or they are hidden).
  const [selectedHalt, setSelectedHalt] = useState(null);
  useEffect(() => {
    setSelectedHalt(null);
  }, [habitualHalts]);

  // Track mode wants a clean map for one truck's path, so every basemap line is
  // switched off — roads, railways, district/administrative boundaries, and the
  // outlines of rivers and land — while the town labels and the land/water
  // fills stay for context. The live map keeps all of it. Memoised so playback,
  // which re-renders every frame, does not re-apply the whole style each time.
  const effectiveMapOptions = useMemo(
    () =>
      track
        ? {
            ...mapOptions,
            styles: [
              ...(mapOptions?.styles || []),
              { featureType: 'road', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', stylers: [{ visibility: 'off' }] },
              {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{ visibility: 'off' }],
              },
              {
                featureType: 'water',
                elementType: 'geometry.stroke',
                stylers: [{ visibility: 'off' }],
              },
              {
                featureType: 'landscape',
                elementType: 'geometry.stroke',
                stylers: [{ visibility: 'off' }],
              },
            ],
          }
        : mapOptions,
    [track, mapOptions],
  );
  return (
    <div id="map" className="gmap-host">
      {!isLoaded ? (
        <div className="gmap-loading">
          <div className="gmap-spinner" />
          <span>Loading Google Maps…</span>
        </div>
      ) : loadError ? (
        <div className="gmap-error">
          <span>Error loading Google Maps. Please check your connection and API key.</span>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={INDIA_CENTER}
          zoom={mapZoom}
          onLoad={onMapLoad}
          onIdle={onMapIdle}
          onZoomChanged={() => {
            if (mapRef.current) {
              const z = mapRef.current.getZoom();
              if (typeof z === 'number') setMapZoom(z);
            }
          }}
          onClick={() => setSelectedHalt(null)}
          options={effectiveMapOptions}
        >
          {/* Google's live traffic, as a display layer only. The owner acts
              on the congestion in the vehicle panel's ETA, which comes from
              our own road network, not from this layer. */}
          <TrafficLayer map={map} enabled={isTrafficOn} />

          {/* Track mode: one truck's history, drawn over the live map. */}
          {track ? (
            <TrackMapLayers track={track} zoom={mapZoom} playheadTime={trackPlayheadTime} />
          ) : null}

          {/* Places (Place Hub's confirmed places) — under the fleet, never hiding a truck. */}
          <TrackPlacesLayer
            places={places}
            selectedId={selectedPlaceId}
            onSelect={onSelectPlace}
            zoom={mapZoom}
            dark={placesDark}
          />

          {/* The landmark layers (pumps, dhabas, hospitals…) — under the
              fleet too, so a truck is never hidden by a pin. */}
          <MapPlacesLayer
            places={extraPlaces}
            selectedId={selectedPlaceId}
            onSelect={onSelectPlace}
            zoom={mapZoom}
          />

          {/* Fleet Vehicle Markers — imperative markers that glide between
              SSE fixes instead of teleporting (see AnimatedVehicleMarkers).
              Only the selected truck while its Trail or Replay is up. */}
          <AnimatedVehicleMarkers
            vehicles={fleetOnMap}
            selectedId={selectedId}
            mapZoom={mapZoom}
            onSelect={(id) => {
              setSelectedId(id);
              setIsRailOpen(true);
            }}
          />

          {/* Fleet weather — compact chips over UNselected trucks in adverse
              weather (rain/thunder/snow), zoom-gated so a wide view stays clean.
              Rendered before the selected bubble so that bubble sits on top. */}
          <FleetWeatherMarkers
            vehicles={fleetOnMap}
            fleetWeather={fleetWeather}
            selectedId={selectedId}
          />

          {/* Weather — an animated condition bubble floating above the active
              truck: the selected vehicle live, or the moving marker during
              replay (then showing the trip's own hour). Provider credit travels
              with it; the full clickable attribution is in the detail panel. */}
          {!track && weatherBubblePosition && weather && (
            <WeatherBubble position={weatherBubblePosition} weather={weather} />
          )}

          {/* Breadcrumb Trail — split per trip when the trail endpoint
              gave us trip ids, otherwise fall back to a single polyline.
              Trip segments inherit each trip's deterministic color so the
              legend swatch and the polyline match. */}
          {showSegments &&
            (roadTrail && roadTrail.mode === 'MATCHED' ? (
              <RoadTrailLayer trail={roadTrail} color={selectedStatusColor} />
            ) : (
              trailSegments.map((seg, i) => (
                <PolylineF
                  key={`trip-seg-${seg.tripId ?? 'none'}-${i}`}
                  path={seg.coords}
                  options={{
                    strokeColor: seg.color,
                    strokeOpacity: 0.95,
                    strokeWeight: 4,
                    icons: trailArrowIcons(seg.color),
                  }}
                />
              ))
            ))}

          {showSingleTrail &&
            (roadTrail && roadTrail.mode === 'MATCHED' ? (
              <RoadTrailLayer trail={roadTrail} color={selectedStatusColor} />
            ) : (
              <PolylineF
                path={trailCoords}
                options={{
                  strokeColor: fallbackSingleColor || selectedStatusColor,
                  strokeOpacity: 0.9,
                  strokeWeight: 4,
                  icons: trailArrowIcons(fallbackSingleColor || selectedStatusColor),
                }}
              />
            ))}

          {!replayState.on && isTrailVisible && trailCoords.length > 1 && (
            <>
              <MarkerF
                position={trailCoords[0]}
                icon={createTrailEndpointIcon('S', selectedStatusColor)}
              />
              <MarkerF
                position={trailCoords[trailCoords.length - 1]}
                icon={createTrailEndpointIcon('E', selectedStatusColor)}
              />
            </>
          )}

          {/* Habitual-halts (places/hub) layer — recurring stops where the
              selected vehicle regularly dwells. Independent of the trail so
              we render it on top, behind nothing. */}
          {isHabitualHaltsVisible &&
            Array.isArray(habitualHalts) &&
            habitualHalts.map((h, i) => {
              if (h.lat == null || h.lng == null) return null;
              const key = `halt-${h.lat.toFixed(5)}-${h.lng.toFixed(5)}-${i}`;
              // When one halt is picked, hide the rest until it is picked again.
              if (selectedHalt && key !== selectedHalt.key) return null;
              return (
                <MarkerF
                  key={key}
                  position={{ lat: h.lat, lng: h.lng }}
                  icon={createHabitualHaltIcon(h.occurrences || 1)}
                  zIndex={900}
                  clickable
                  onClick={() =>
                    setSelectedHalt((cur) => (cur?.key === key ? null : { key, ...h }))
                  }
                />
              );
            })}

          {/* The habitual-stop card, anchored just to the right of its marker. */}
          {selectedHalt ? (
            <OverlayView
              position={{ lat: selectedHalt.lat, lng: selectedHalt.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={() => ({ x: 22, y: 0 })}
            >
              <div className="habitual-halt-anchor">
                <div className="habitual-halt-card" role="dialog" aria-label="Habitual stop">
                  <button
                    type="button"
                    className="habitual-halt-card__close"
                    onClick={() => setSelectedHalt(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <p className="habitual-halt-card__eyebrow">Habitual stop</p>
                  <p className="habitual-halt-card__stat">
                    <strong>{selectedHalt.occurrences}×</strong> stopped here
                  </p>
                  <p className="habitual-halt-card__sub">
                    Usually ~{formatDuration(Math.round((selectedHalt.medianDwellMs || 0) / 60000))}
                  </p>
                </div>
              </div>
            </OverlayView>
          ) : null}

          {/* Trip Replay */}
          {replayState.on && replayPtsCoords.length > 1 && (
            <>
              <ReplayRouteLayer layers={replayBaseLayers} points={replayPtsCoords} />
              {replayBaseLayers.length
                ? replayRoadLayers.map((layer) => (
                    <PolylineF
                      key={`replay-road-${layer.kind}-${layer.t0}`}
                      path={layer.path}
                      options={replayAppearance.googleTravelled}
                    />
                  ))
                : replayRunPaths.map(({ key, path }) => (
                    <PolylineF
                      key={`replay-run-${key}`}
                      path={path}
                      options={replayAppearance.googleTravelled}
                    />
                  ))}
              <MarkerF
                position={replayPtsCoords[0]}
                icon={createTrailEndpointIcon('S', selectedStatusColor)}
              />
              <MarkerF
                position={replayPtsCoords[replayPtsCoords.length - 1]}
                icon={createTrailEndpointIcon('E', selectedStatusColor)}
              />
              {replayCurrentPos && (
                <ReplayTruckMarker
                  position={replayCurrentPos}
                  fast={replaySpeed > DEFAULT_LIMIT_KMH}
                />
              )}
            </>
          )}
        </GoogleMap>
      )}
    </div>
  );
}
