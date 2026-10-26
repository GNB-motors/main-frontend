import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import RoadTrailLayer from '../../components/map/RoadTrailLayer';
import CongestionLayer from '../../components/map/CongestionLayer';
import { trailArrowIcons } from './mapIcons.js';
import { createReplayTruckIcon, createTrailEndpointIcon } from './trailMarkerIcons.js';
import { createHabitualHaltIcon } from './trailMarkerIcons.js';
import AnimatedVehicleMarkers from './AnimatedVehicleMarkers.jsx';
import WeatherBubble from './WeatherBubble.jsx';
import FleetWeatherMarkers from './FleetWeatherMarkers.jsx';

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

export default function LiveMapCanvas({
  isLoaded,
  loadError,
  mapZoom,
  setMapZoom,
  onMapLoad,
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
  replayRunPath,
  replayCurrentPos,
  replayBearing,
  trailSegments,
  fallbackSingleColor,
  habitualHalts,
  isHabitualHaltsVisible,
  isCongestionVisible,
  congestionRows,
  segmentByTrip,
  weather,
  weatherBubblePosition,
  fleetWeather,
}) {
  /* When the user disables per-trip segmentation we fall back to a single
     polyline (visual continuity with the legacy behavior). The fallback
     color is palette slot 0 — distinct from the selected status color so
     the user can still see the breadcrumb while a heavy trail is up. */
  const showSegments =
    isTrailVisible &&
    trailCoords.length > 1 &&
    segmentByTrip &&
    trailSegments &&
    trailSegments.length > 0;
  const showSingleTrail =
    isTrailVisible &&
    trailCoords.length > 1 &&
    (!segmentByTrip || !trailSegments || trailSegments.length === 0);
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
          onZoomChanged={() => {
            if (mapRef.current) {
              const z = mapRef.current.getZoom();
              if (typeof z === 'number') setMapZoom(z);
            }
          }}
          options={mapOptions}
        >
          {/* Congestion layer (00_PLAN.md item 5) — this org's OWN road-matched
              edges, drawn FIRST so it sits under the fleet, the trail and the
              replay: a vehicle is never hidden by its own road. Edges the
              backend could not rate are not in `rows`; nothing here invents
              geometry for a gap. */}
          {isCongestionVisible && <CongestionLayer rows={congestionRows} />}

          {/* Fleet Vehicle Markers — imperative markers that glide between
              SSE fixes instead of teleporting (see AnimatedVehicleMarkers). */}
          <AnimatedVehicleMarkers
            vehicles={mapVehicles}
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
            vehicles={mapVehicles}
            fleetWeather={fleetWeather}
            selectedId={selectedId}
          />

          {/* Weather — an animated condition bubble floating above the active
              truck: the selected vehicle live, or the moving marker during
              replay (then showing the trip's own hour). Provider credit travels
              with it; the full clickable attribution is in the detail panel. */}
          {weatherBubblePosition && weather && (
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

          {isTrailVisible && trailCoords.length > 1 && (
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
              return (
                <MarkerF
                  key={`halt-${h.lat.toFixed(5)}-${h.lng.toFixed(5)}-${i}`}
                  position={{ lat: h.lat, lng: h.lng }}
                  icon={createHabitualHaltIcon(h.occurrences || 1)}
                  zIndex={900}
                />
              );
            })}

          {/* Trip Replay */}
          {replayState.on && replayPtsCoords.length > 1 && (
            <>
              {roadTrail && roadTrail.mode === 'MATCHED' ? (
                <RoadTrailLayer trail={roadTrail} color="#9A9AA5" fleetColor="#c4b5fd" />
              ) : (
                <PolylineF
                  path={replayPtsCoords}
                  options={{
                    strokeColor: '#9A9AA5',
                    strokeOpacity: 0.45,
                    strokeWeight: 4,
                  }}
                />
              )}
              <PolylineF
                path={replayRunPath}
                options={{
                  strokeColor: selectedStatusColor,
                  strokeOpacity: 0.95,
                  strokeWeight: 5,
                }}
              />
              <MarkerF
                position={replayPtsCoords[0]}
                icon={createTrailEndpointIcon('S', selectedStatusColor)}
              />
              <MarkerF
                position={replayPtsCoords[replayPtsCoords.length - 1]}
                icon={createTrailEndpointIcon('E', selectedStatusColor)}
              />
              {replayCurrentPos && (
                <MarkerF
                  key={`replay-${Math.round(mapZoom * 2) / 2}`}
                  position={replayCurrentPos}
                  icon={createReplayTruckIcon(replayBearing, mapZoom)}
                  zIndex={1200}
                />
              )}
            </>
          )}
        </GoogleMap>
      )}
    </div>
  );
}
