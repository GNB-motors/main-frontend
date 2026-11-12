import { tollMarkerIcon } from './mapPlaceIcon.js';
import FocusedRouteLayer from './FocusedRouteLayer.jsx';
import TollLayer from './TrackPlacesTollLayer.jsx';
import PassiveTrailLayer from './PassiveTrailLayer.jsx';
import TrackTollLayers from './TrackTollLayers';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, OverlayView, PolylineF } from '@react-google-maps/api';
import { formatDuration } from '../../utils/redesign/format';
import RoadTrailLayer from '../../components/map/RoadTrailLayer';
import { createTrailEndpointIcon } from './trailMarkerIcons.js';
import { createHabitualHaltIcon } from './trailMarkerIcons.js';
import AnimatedVehicleMarkers from './AnimatedVehicleMarkers.jsx';
import focusedMapVehicles from './focusedMapVehicles.js';
import TrackPlacesLayer from './TrackPlacesLayer.jsx';
import TrackReviewLayer from './TrackReviewLayer.jsx';
import TrackIdlingLayer from './TrackIdlingLayer.jsx';
import RouteLayer from '../PlaceHub/map/RouteLayer.jsx';
import DraftLayer from '../PlaceHub/map/DraftLayer.jsx';
import MapPlacesLayer from './MapPlacesLayer.jsx';
import ReplayTruckMarker from './ReplayTruckMarker.jsx';
import ReplayRouteLayer from './ReplayRouteLayer.jsx';
import TrafficLayer from './TrafficLayer.jsx';
import TrackMapLayers from './TrackMapLayers.jsx';
import replayAppearance from '../../components/map/replayAppearance.js';
import { DEFAULT_LIMIT_KMH } from '../RouteHub/views/replay/replayConstants.js';
import { destinationHeading, routeLines as predictionLines } from './whereNextModel';
import { resolveMapColor } from './mapColor';
import { playheadAt } from './trackLayersModel';
import { isNearEdge, trackFitPadding } from './trackMapCamera';

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

/** The routes layer has no sites until the owner turns it on. */
const NO_SITES = new Map();

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
  tollPlazas = [],
  places = [],
  extraPlaces = [],
  selectedPlaceId = null,
  onSelectPlace,
  placesDark = false,
  isTrafficOn = false,
  map = null,
  track = null,
  trackPlayheadTime = null,
  trackRoad = null,
  trackTolls = null,
  reviewItems = [],
  selectedReviewId = null,
  onSelectReviewSite,
  idlingRows = [],
  onSelectIdling,
  focusedRoute = null,
  routeKind = 'movement',
  routeLines = [],
  routeSites = NO_SITES,
  onPickRoute,
  draft = null,
  onDraftChange,
  onDraftMapClick,
  placesPanelOpen = false,
  passiveTrail = null,
  whereNext = null,
  whereNextPosition = null,
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

  // In Track mode the truck being watched is drawn by ReplayTruckMarker: an
  // overlay that sits above the line and turns with the heading. Its position
  // is interpolated from the fixes around the playhead time.
  const trackPoints = useMemo(() => (Array.isArray(track?.points) ? track.points : []), [track]);
  const trackPlayhead = useMemo(
    () => (track && trackPlayheadTime ? playheadAt(trackPoints, trackPlayheadTime) : null),
    [track, trackPoints, trackPlayheadTime],
  );

  // Fit the whole trail once when it arrives, so the owner sees the whole
  // drive instead of a three-kilometre slice of it. The fit happens once per
  // trail: a change of range is a new trail and gets its own fit.
  const fittedTrailRef = useRef(null);
  const mapInstance = mapRef?.current || map;
  useEffect(() => {
    if (!track || !mapInstance || !window.google?.maps?.LatLngBounds) return;
    if (trackPoints.length < 2) return;
    const key = `${trackPoints.length}:${trackPoints[0]?.t ?? ''}:${
      trackPoints[trackPoints.length - 1]?.t ?? ''
    }`;
    if (fittedTrailRef.current === key) return;
    fittedTrailRef.current = key;
    const bounds = new window.google.maps.LatLngBounds();
    trackPoints.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
    mapInstance.fitBounds(bounds, trackFitPadding({ placesPanelOpen }));
  }, [track, trackPoints, mapInstance, placesPanelOpen]);

  // Keep the truck in view while the drive plays: when it comes close to an
  // edge of the visible box the map is panned to it. The zoom never changes.
  useEffect(() => {
    if (!track || !trackPlayhead || !mapInstance) return;
    const box = mapInstance.getBounds?.();
    const ne = box?.getNorthEast?.();
    const sw = box?.getSouthWest?.();
    if (!ne || !sw) return;
    const toPoint = (value) =>
      typeof value?.lat === 'function' ? { lat: value.lat(), lng: value.lng() } : value;
    const point = { lat: trackPlayhead.lat, lng: trackPlayhead.lng };
    if (!isNearEdge(point, { ne: toPoint(ne), sw: toPoint(sw) })) return;
    mapInstance.panTo(point);
  }, [track, trackPlayhead, mapInstance]);

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
          onClick={(event) => {
            setSelectedHalt(null);
            if (draft && event?.latLng) onDraftMapClick?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
          }}
          options={effectiveMapOptions}
        >
          {/* Google's live traffic, as a display layer only. The owner acts
              on the congestion in the vehicle panel's ETA, which comes from
              our own road network, not from this layer. */}
          <TrafficLayer map={map} enabled={isTrafficOn} />
          {!track && !replayState.on && !isTrailVisible ? <PassiveTrailLayer trail={passiveTrail} color={resolveMapColor(selectedStatusColor)} /> : null}
          {predictionLines(whereNext?.data, whereNext?.open, whereNextPosition).map(({ path, index, weak }) => (
            <PolylineF key={`where-next-${index}`} path={path} options={{
              strokeOpacity: 0,
              icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: resolveMapColor(selectedStatusColor), strokeOpacity: index || weak ? 0.35 : 0.9, strokeWeight: index ? 2 : 3, scale: 3 }, offset: '0', repeat: '16px' }],
            }} />
          ))}
          {whereNext?.data && !whereNext.data.held && Number.isFinite(whereNext.data.destinations?.[0]?.place?.lat) && Number.isFinite(whereNext.data.destinations?.[0]?.place?.lng) ? (
            <MarkerF position={{ lat: whereNext.data.destinations[0].place.lat, lng: whereNext.data.destinations[0].place.lng }} title={destinationHeading(whereNext.data.destinations[0])} label={{ text: destinationHeading(whereNext.data.destinations[0]), className: 'where-next-map-label' }} />
          ) : null}

          {/* Track mode: one truck's history, drawn over the live map. */}
          {track ? (
            <TrackMapLayers
              track={track}
              zoom={mapZoom}
              playheadTime={trackPlayheadTime}
              roadTrail={trackRoad}
            />
          ) : null}

          {/* Track mode: the truck being replayed, on an overlay so it sits
              above the line and turns with the heading. */}
          {track && trackPlayhead ? (
            <ReplayTruckMarker
              position={{ lat: trackPlayhead.lat, lng: trackPlayhead.lng }}
              heading={trackPlayhead.headingDeg ?? 0}
              fast={(trackPlayhead.speedKmh ?? 0) > DEFAULT_LIMIT_KMH}
            />
          ) : null}

          {trackTolls ? (
            <TrackTollLayers passes={trackTolls.passes} playheadTime={trackPlayheadTime} />
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
          <TollLayer plazas={tollPlazas} interactive markerIcon={tollMarkerIcon} />
          <MapPlacesLayer
            places={extraPlaces}
            selectedId={selectedPlaceId}
            zoom={mapZoom}
          />

          {/* The live control room's own layers: the places nobody has
              answered for, the routes the fleet runs, and the trucks idling
              right now. They are fleet-wide, so Track mode (one truck's
              history) hides them: drawn under a replay they bury it. */}
          {!track && reviewItems.length ? (
            <TrackReviewLayer
              items={reviewItems}
              selectedId={selectedReviewId}
              onSelect={onSelectReviewSite}
            />
          ) : null}

          {!track && idlingRows.length ? <TrackIdlingLayer rows={idlingRows} onSelect={onSelectIdling} /> : null}

          <FocusedRouteLayer route={focusedRoute} />
          {!focusedRoute && !track && (routeKind === 'delivery' || mapZoom >= 7) && routeLines.length ? (
            <RouteLayer
              dimmed={Boolean(selectedId)}
              map={map}
              lines={routeLines}
              sites={routeSites}
              selectedId={null}
              hoveredId={null}
              onPick={onPickRoute}
              onHover={() => {}}
              onSite={() => {}}
              isDark={placesDark}
              detail={null}
              showEngine={false}
              zoom={mapZoom}
              neutral
            />
          ) : null}

          {/* The place or zone being written right now, drawn where it will sit. */}
          {draft ? <DraftLayer draft={draft} onDraftChange={onDraftChange} /> : null}

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

          {/* Weather — an animated condition bubble floating above the active
              truck: the selected vehicle live, or the moving marker during
              replay (then showing the trip's own hour). Provider credit travels
              with it; the full clickable attribution is in the detail panel. */}

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
                    strokeOpacity: 0,
                    strokeWeight: 4,
                    icons: replayAppearance.googleRoute(window.google.maps.SymbolPath.CIRCLE).icons,
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
                  strokeOpacity: 0,
                  strokeWeight: 4,
                  icons: replayAppearance.googleRoute(window.google.maps.SymbolPath.CIRCLE).icons,
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
                      options={replayAppearance.googleRoad(layer, window.google.maps.SymbolPath.CIRCLE)}
                    />
                  ))
                : replayRunPaths.map(({ key, path }) => (
                    <PolylineF
                      key={`replay-run-${key}`}
                      path={path}
                      options={replayAppearance.googleRoute(window.google.maps.SymbolPath.CIRCLE)}
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
