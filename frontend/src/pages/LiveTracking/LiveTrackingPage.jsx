import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import useDocumentTheme from './useDocumentTheme.js';
import useToastAndRefresh from './useToastAndRefresh.js';
import useFleetMasterData from './useFleetMasterData.js';
import useFleetVehicles from './useFleetVehicles.js';
import useLiveMap from './useLiveMap.js';
import useVehicleWeather from './useVehicleWeather.js';
import useFleetWeather from './useFleetWeather.js';
import trailDateWindow from './trailDateWindow.js';
import useSelectedDriver from './useSelectedDriver.js';
import useVehicleShareDialog from './useVehicleShareDialog.js';
import renderIconSvg from './renderIconSvg.jsx';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import MapOverlayControls from './MapOverlayControls.jsx';
import ReplayBar from './ReplayBar.jsx';
import TelemetryTicker from './TelemetryTicker.jsx';
import FleetListView from './FleetListView.jsx';
import VehicleDetailPanel from './VehicleDetailPanel.jsx';
import ShareLinkDialog from './ShareLinkDialog.jsx';
import useTrackPlaces from './useTrackPlaces.js';
import PlacesListView from './PlacesListView.jsx';
import PlaceDetailPanel from './PlaceDetailPanel.jsx';
import TrackLegend from './TrackLegend.jsx';
import MapSearchBox from './MapSearchBox.jsx';
import TrafficToggle from './TrafficToggle.jsx';
import useMapPlaces from './useMapPlaces.js';
import {
  defaultStatusSelection,
  legendMakeRows,
  legendStatusRows,
  selectOnly,
  toggleSelection,
} from './trackLegendModel.js';
import {
  readLayerSelection,
  readTrafficOn,
  writeLayerSelection,
  writeTrafficOn,
} from './trackLegendPrefs.js';
import './LiveTracking.css';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .replace(/['"]/g, '')
  .trim();
const GOOGLE_MAPS_LIBRARIES = ['places', 'drawing'];

/* ---------------- Main LiveTrackingPage Component ---------------- */
const LiveTrackingPage = () => {
  // Live positions hook
  const {
    positions: rawPositions,
    isLoading: isLiveLoading,
    refresh: refreshLivePositions,
    lastEventAt,
  } = useLivePositions();

  // Layout & Theme hooks
  useFullPageLayout();
  const theme = useDocumentTheme();
  const [isRailOpen, setIsRailOpen] = useState(true);
  const [mapMode, setMapMode] = useState('map'); // 'map' | 'sat'
  const [isTelemetryOn, setIsTelemetryOn] = useState(true);

  // Filters & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // The floating legend IS the filter (F1.4). The status set starts with all
  // four on; the make set stores only what the owner turned OFF, so a make
  // the fleet gains later is on without anybody having to touch it.
  const [statusSelection, setStatusSelection] = useState(() => defaultStatusSelection());
  const [makeSelection, setMakeSelection] = useState({});
  const [layerSelection, setLayerSelection] = useState(() => readLayerSelection());
  const [isTrafficOn, setIsTrafficOn] = useState(() => readTrafficOn());

  // Google Maps Load Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const searchInputRef = useRef(null);

  const { isRefreshing, toastMsg, showToast, handleRefresh } =
    useToastAndRefresh(refreshLivePositions);

  const { vehiclesMeta, driverAssignments } = useFleetMasterData();

  const {
    vehicles,
    counts,
    fleetCounts,
    filteredVehicles,
    selectedVehicle,
    mapVehicles,
    manufacturers,
  } = useFleetVehicles({
    rawPositions,
    vehiclesMeta,
    filter: 'all',
    searchQuery,
    selectedId,
    statusSelection,
    makeSelection,
  });

  useEffect(() => {
    if (selectedId && !selectedVehicle) setSelectedId(null);
  }, [selectedId, selectedVehicle]);

  // The legend's rows. The status counts are the FULL fleet counts, so a
  // filter never changes the number the owner sees beside a status.
  const statusRows = useMemo(() => legendStatusRows(fleetCounts), [fleetCounts]);
  const makeRows = useMemo(() => legendMakeRows(manufacturers, vehicles), [manufacturers, vehicles]);
  const effectiveMakeSelection = useMemo(() => {
    const merged = {};
    makeRows.forEach((row) => {
      merged[row.key] = makeSelection[row.key] ?? true;
    });
    return merged;
  }, [makeRows, makeSelection]);

  const handleToggleStatus = (key) => setStatusSelection((prev) => toggleSelection(prev, key));
  const handleOnlyStatus = (key) => setStatusSelection((prev) => selectOnly(prev, key));
  const handleAllStatus = () => setStatusSelection(defaultStatusSelection());
  const handleToggleMake = (key) =>
    setMakeSelection((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  const handleOnlyMake = (key) =>
    setMakeSelection(
      Object.fromEntries(makeRows.map((row) => [row.key, row.key === key])),
    );
  const handleAllMake = () => setMakeSelection({});
  const handleToggleLayer = (key) => {
    // "Our places" is the fleet's own confirmed places, which the Track page
    // already has; the rest come from the map places endpoint.
    if (key === 'ourPlaces') {
      trackPlaces.toggle();
      return;
    }
    setLayerSelection((prev) => {
      const next = toggleSelection(prev, key);
      writeLayerSelection(next);
      return next;
    });
  };
  const handleToggleTraffic = () =>
    setIsTrafficOn((prev) => {
      writeTrafficOn(!prev);
      return !prev;
    });

  const {
    mapRef,
    mapZoom,
    setMapZoom,
    mapBounds,
    onMapIdle,
    mapOptions,
    onMapLoad,
    trailLoading,
    trailSelection,
    trailNotice,
    loadTrail,
    isTrailVisible,
    roadTrail,
    replayState,
    setReplayState,
    selectedStatusColor,
    trailCoords,
    trailKm,
    replayPtsCoords,
    replayCurrentPos,
    replayRunPaths,
    replayRoadLayers,
    replayBaseLayers,
    replaySpeed,
    replayCurrentTs,
    trailSegments,
    tripLegend,
    fallbackSingleColor,
    habitualHalts,
    habitualHaltsLoading,
    isHabitualHaltsVisible,
    toggleHabitualHalts,
    segmentByTrip,
    setSegmentByTrip,
    exitReplay,
    handleZoomIn,
    handleZoomOut,
    triggerMapResize,
  } = useLiveMap({ theme, mapMode, vehicles, selectedId, selectedVehicle, showToast });

  const selectedDriver = useSelectedDriver(selectedVehicle, vehiclesMeta, driverAssignments);

  // Places layer (Place Hub's confirmed places) — off until the user turns it on.
  const trackPlaces = useTrackPlaces();
  const [railTab, setRailTab] = useState('fleet'); // 'fleet' | 'places'

  // The extra place layers (pumps, dhabas, hospitals…) come from the
  // fleet-view map endpoint, asked only for the visible map box and only
  // once the map has settled.
  const mapPlaces = useMapPlaces({
    bbox: mapBounds,
    zoom: mapZoom,
    layers: layerSelection,
  });
  // Picking a vehicle anywhere (map, list, a place's "vehicles here") shows its details.
  useEffect(() => {
    if (selectedId) setRailTab('fleet');
  }, [selectedId]);

  const openPlacesTab = () => {
    setRailTab('places');
    trackPlaces.show();
  };

  // Recenter on a place picked from the Places list.
  const focusPlace = (place) => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    if (place.polygon) {
      const bounds = new window.google.maps.LatLngBounds();
      place.polygon.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, 80);
      return;
    }
    const center = { lat: place.lat, lng: place.lng };
    const zoom = Math.max(map.getZoom() || 5, 15);
    if (typeof map.moveCamera === 'function') map.moveCamera({ center, zoom });
    else {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  };

  const pickPlace = (place) => {
    trackPlaces.show();
    trackPlaces.selectPlace(place.id);
    // A followed vehicle would pull the map back to itself on its next fix.
    if (selectedId && !isTrailVisible && !replayState.on) setSelectedId(null);
    focusPlace(place);
  };

  const selectPlaceFromMap = (id) => {
    trackPlaces.selectPlace(id);
    setRailTab('places');
    setIsRailOpen(true);
  };

  const pickVehicleFromPlace = (id) => {
    // "Vehicles here now" is fleet-wide; a truck hidden by a filter clears it to be shown.
    if (!filteredVehicles.some((v) => v.id === id)) {
      setStatusSelection(defaultStatusSelection());
      setSearchQuery('');
      setMakeSelection({});
    }
    setSelectedId(id);
    setRailTab('fleet');
    setIsRailOpen(true);
  };

  // Weather for the "active" context: the moving marker during replay (at the
  // trip's own hour), otherwise the selected live vehicle (now). One fetch feeds
  // both the floating map bubble and the detail-panel weather section.
  const isReplaying = replayState.on && !!replayCurrentPos;
  const weatherTarget = isReplaying
    ? { lat: replayCurrentPos.lat, lng: replayCurrentPos.lng, at: replayCurrentTs }
    : selectedVehicle?.hasFix
      ? { lat: selectedVehicle.lat, lng: selectedVehicle.lng, at: null }
      : { lat: null, lng: null, at: null };
  const { weather: activeWeather, loading: weatherLoading } = useVehicleWeather({
    lat: weatherTarget.lat,
    lng: weatherTarget.lng,
    at: weatherTarget.at,
    enabled: !!selectedVehicle,
  });
  const weatherBubblePosition = isReplaying
    ? replayCurrentPos
    : selectedVehicle?.hasFix
      ? { lat: selectedVehicle.lat, lng: selectedVehicle.lng }
      : null;

  // Fleet-wide weather for UNselected trucks (rain only, zoom-gated). Off during
  // replay so the replay view stays focused on the one trip.
  const fleetWeather = useFleetWeather({
    vehicles: mapVehicles,
    mapRef,
    mapZoom,
    enabled: !replayState.on,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setIsRailOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (replayState.on) exitReplay();
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replayState.on, exitReplay]);

  const { shareDialog, setShareDialog, shareCreating, handleShareVehicle, submitShareLink } =
    useVehicleShareDialog(showToast);

  return (
    <div className="gnb-lt-page">
      {/* Main Console Container */}
      <main className="console">
        {/* Stage Area: Map + Docked Fleet Rail */}
        <div className={`stage ${!isRailOpen ? 'railoff' : ''}`}>
          {/* Map Column */}
          <div className="mapcol">
            <LiveMapCanvas
              isLoaded={isLoaded}
              loadError={loadError}
              mapZoom={mapZoom}
              setMapZoom={setMapZoom}
              onMapLoad={onMapLoad}
              onMapIdle={onMapIdle}
              mapRef={mapRef}
              mapOptions={mapOptions}
              mapVehicles={mapVehicles}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              setIsRailOpen={setIsRailOpen}
              isTrailVisible={isTrailVisible}
              trailCoords={trailCoords}
              roadTrail={roadTrail}
              selectedStatusColor={selectedStatusColor}
              replayState={replayState}
              replayPtsCoords={replayPtsCoords}
              replayRunPaths={replayRunPaths}
              replayRoadLayers={replayRoadLayers}
              replayBaseLayers={replayBaseLayers}
              replayCurrentPos={replayCurrentPos}
              replaySpeed={replaySpeed}
              trailSegments={trailSegments}
              tripLegend={tripLegend}
              fallbackSingleColor={fallbackSingleColor}
              habitualHalts={habitualHalts}
              isHabitualHaltsVisible={isHabitualHaltsVisible}
              segmentByTrip={segmentByTrip}
              weather={activeWeather}
              weatherBubblePosition={weatherBubblePosition}
              fleetWeather={fleetWeather}
              places={trackPlaces.shownPlaces}
              extraPlaces={mapPlaces.items}
              selectedPlaceId={trackPlaces.selectedPlace?.id ?? null}
              onSelectPlace={selectPlaceFromMap}
              placesDark={theme === 'dark' && mapMode !== 'sat'}
              isTrafficOn={isTrafficOn}
              map={mapRef.current}
            />

            {/* Floating controls: search at the top-left, traffic at the
                top-right, and the legend — which IS the filter — at the
                bottom-left. The old top bar is gone (F1.3). */}
            <MapSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              inputRef={searchInputRef}
            />
            <TrafficToggle on={isTrafficOn} onToggle={handleToggleTraffic} />
            <TrackLegend
              statusRows={statusRows}
              makeRows={makeRows}
              statusSelection={statusSelection}
              makeSelection={effectiveMakeSelection}
              layerSelection={layerSelection}
              onToggleStatus={handleToggleStatus}
              onOnlyStatus={handleOnlyStatus}
              onAllStatus={handleAllStatus}
              onToggleMake={handleToggleMake}
              onOnlyMake={handleOnlyMake}
              onAllMake={handleAllMake}
              onToggleLayer={handleToggleLayer}
              lastEventAt={lastEventAt}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              zoom={mapZoom}
              placesNotAvailable={mapPlaces.notAvailable}
              placesTruncated={mapPlaces.truncated}
              placesCount={mapPlaces.items.length}
            />

            <MapOverlayControls
              selectedVehicle={selectedVehicle}
              replayState={replayState}
              trailSelection={trailSelection}
              trailNotice={trailNotice}
              trailLoading={trailLoading}
              loadTrail={loadTrail}
              isTelemetryOn={isTelemetryOn}
              setIsTelemetryOn={setIsTelemetryOn}
              setIsRailOpen={setIsRailOpen}
              triggerMapResize={triggerMapResize}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              isTrailVisible={isTrailVisible}
              roadTrail={roadTrail}
              mapMode={mapMode}
              setMapMode={setMapMode}
            />

            {/* Overlay Bottom-Center: Replay Bar & Telemetry Ticker */}
            <div className="ov ov--bc">
              {/* Trip Replay Controller */}
              <ReplayBar
                replayState={replayState}
                setReplayState={setReplayState}
                selectedVehicle={selectedVehicle}
                trailKm={trailKm}
                exitReplay={exitReplay}
                dateLabel={trailDateWindow.label(trailSelection)}
              />

              {/* Live Telemetry Ticker */}
              <TelemetryTicker
                selectedVehicle={selectedVehicle}
                vehicles={vehicles}
                rotating={isTelemetryOn}
                highlighted={isTelemetryOn && !replayState.on}
                icon={renderIconSvg('radio', 14)}
              />
            </div>
          </div>

          {/* Right Rail: Fleet and Places tabs */}
          <aside className="rail">
            <div className="rail-tabs" role="tablist" aria-label="Fleet and places">
              <button
                type="button"
                role="tab"
                className="rail-tab"
                aria-selected={railTab === 'fleet'}
                onClick={() => setRailTab('fleet')}
              >
                Fleet <span className="rail-tab__count">{vehicles.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                className="rail-tab"
                aria-selected={railTab === 'places'}
                onClick={openPlacesTab}
              >
                Places
                {trackPlaces.loaded ? (
                  <span className="rail-tab__count">{trackPlaces.places.length}</span>
                ) : null}
              </button>
            </div>

            <div className="rail-body">
              {railTab === 'fleet' ? (
                <>
                  {/* Primary Fleet List View */}
                  <FleetListView
                    isLiveLoading={isLiveLoading}
                    vehicles={vehicles}
                    filteredVehicles={filteredVehicles}
                    counts={counts}
                    setIsRailOpen={setIsRailOpen}
                    triggerMapResize={triggerMapResize}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                  />

                  {/* Vehicle Detail Slide-in Drawer */}
                  <VehicleDetailPanel
                    selectedVehicle={selectedVehicle}
                    setSelectedId={setSelectedId}
                    exitReplay={exitReplay}
                    isTrailVisible={isTrailVisible}
                    shareCreating={shareCreating}
                    handleShareVehicle={handleShareVehicle}
                    selectedDriver={selectedDriver}
                    weather={activeWeather}
                    weatherLoading={weatherLoading}
                    weatherContext={
                      isReplaying
                        ? 'Forecast model, at this point in the replay'
                        : 'Forecast model for this hour, around this location'
                    }
                    segmentByTrip={segmentByTrip}
                    setSegmentByTrip={setSegmentByTrip}
                    isHabitualHaltsVisible={isHabitualHaltsVisible}
                    habitualHaltsLoading={habitualHaltsLoading}
                    toggleHabitualHalts={toggleHabitualHalts}
                    habitualHalts={habitualHalts}
                  />
                </>
              ) : (
                <>
                  <PlacesListView
                    trackPlaces={trackPlaces}
                    vehicles={vehicles}
                    query={searchQuery}
                    onPick={pickPlace}
                    onHide={() => {
                      setIsRailOpen(false);
                      setTimeout(triggerMapResize, 240);
                    }}
                  />
                  <PlaceDetailPanel
                    place={trackPlaces.selectedPlace}
                    vehicles={vehicles}
                    onBack={() => trackPlaces.selectPlace(null)}
                    onPickVehicle={pickVehicleFromPlace}
                  />
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Toast Notification */}
      <div className={`toast ${toastMsg ? 'on' : ''}`}>
        {renderIconSvg('radio', 14)}
        <span>{toastMsg}</span>
      </div>

      {/* Share Link Dialog */}
      {shareDialog && (
        <ShareLinkDialog
          shareDialog={shareDialog}
          setShareDialog={setShareDialog}
          showToast={showToast}
          shareCreating={shareCreating}
          submitShareLink={submitShareLink}
        />
      )}
    </div>
  );
};

export default LiveTrackingPage;
