import React, { useState, useEffect, useRef } from 'react';
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
import useStatusCards from './useStatusCards.js';
import renderIconSvg from './renderIconSvg.jsx';
import LiveTopbar from './LiveTopbar.jsx';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import MapLayerPills from './MapLayerPills.jsx';
import CongestionPanel from './CongestionPanel.jsx';
import MapOverlayControls from './MapOverlayControls.jsx';
import ReplayBar from './ReplayBar.jsx';
import TelemetryTicker from './TelemetryTicker.jsx';
import FleetListView from './FleetListView.jsx';
import VehicleDetailPanel from './VehicleDetailPanel.jsx';
import ShareLinkDialog from './ShareLinkDialog.jsx';
import useTrackPlaces from './useTrackPlaces.js';
import PlacesListView from './PlacesListView.jsx';
import PlaceDetailPanel from './PlaceDetailPanel.jsx';
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
    error: positionsError,
  } = useLivePositions();

  // Layout & Theme hooks
  useFullPageLayout();
  const theme = useDocumentTheme();
  const [isRailOpen, setIsRailOpen] = useState(true);
  const [mapMode, setMapMode] = useState('map'); // 'map' | 'sat'
  const [isTelemetryOn, setIsTelemetryOn] = useState(true);

  // Filters & selection
  const [filter, setFilter] = useState('all');
  const [selectedManufacturers, setSelectedManufacturers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Google Maps Load Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const searchInputRef = useRef(null);

  const { isRefreshing, toastMsg, showToast, handleRefresh } =
    useToastAndRefresh(refreshLivePositions);

  const { vehiclesMeta, driverAssignments } = useFleetMasterData();

  const { vehicles, counts, filteredVehicles, selectedVehicle, mapVehicles, manufacturers } =
    useFleetVehicles({
      rawPositions,
      vehiclesMeta,
      selectedManufacturers,
      filter,
      searchQuery,
      selectedId,
    });

  useEffect(() => {
    if (selectedId && !selectedVehicle) setSelectedId(null);
  }, [selectedId, selectedVehicle]);

  const {
    mapRef,
    mapZoom,
    setMapZoom,
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
    congestion,
    congestionLoading,
    congestionNotice,
    isCongestionVisible,
    toggleCongestion,
    segmentByTrip,
    setSegmentByTrip,
    toggleTrail,
    enterReplay,
    exitReplay,
    handleZoomIn,
    handleZoomOut,
    triggerMapResize,
  } = useLiveMap({ theme, mapMode, vehicles, selectedId, selectedVehicle, showToast });

  const selectedDriver = useSelectedDriver(selectedVehicle, vehiclesMeta, driverAssignments);

  // Places layer (Place Hub's confirmed places) — off until the user turns it on.
  const trackPlaces = useTrackPlaces();
  const [railTab, setRailTab] = useState('fleet'); // 'fleet' | 'places'
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
      setFilter('all');
      setSearchQuery('');
      setSelectedManufacturers([]);
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

  const STATUS_CARDS = useStatusCards(counts);

  return (
    <div className="gnb-lt-page">
      {/* Main Console Container */}
      <main className="console">
        {/* Topbar Command Strip */}
        <LiveTopbar
          isLiveLoading={isLiveLoading}
          counts={counts}
          statusCards={STATUS_CARDS}
          filter={filter}
          setFilter={setFilter}
          handleRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          manufacturers={manufacturers}
          selectedManufacturers={selectedManufacturers}
          setSelectedManufacturers={setSelectedManufacturers}
          lastEventAt={lastEventAt}
          positionsError={positionsError}
          onMapCount={mapVehicles.length}
          unclassifiedCount={vehicles.filter((v) => !v.manufacturer).length}
          layerPills={
            <MapLayerPills
              isPlacesVisible={trackPlaces.visible}
              placesLoading={trackPlaces.loading}
              placesCount={trackPlaces.shownPlaces.length}
              togglePlaces={trackPlaces.toggle}
              isCongestionVisible={isCongestionVisible}
              congestionLoading={congestionLoading}
              congestionCount={congestion?.rows?.length || 0}
              toggleCongestion={toggleCongestion}
              congestionDetails={
                congestion ? (
                  <CongestionPanel congestion={congestion} notice={congestionNotice} />
                ) : null
              }
            />
          }
        />

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
              isCongestionVisible={isCongestionVisible}
              congestionRows={congestion?.rows || []}
              segmentByTrip={segmentByTrip}
              weather={activeWeather}
              weatherBubblePosition={weatherBubblePosition}
              fleetWeather={fleetWeather}
              places={trackPlaces.shownPlaces}
              selectedPlaceId={trackPlaces.selectedPlace?.id ?? null}
              onSelectPlace={selectPlaceFromMap}
              placesDark={theme === 'dark' && mapMode !== 'sat'}
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
                    searchInputRef={searchInputRef}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                  />

                  {/* Vehicle Detail Slide-in Drawer */}
                  <VehicleDetailPanel
                    selectedVehicle={selectedVehicle}
                    setSelectedId={setSelectedId}
                    exitReplay={exitReplay}
                    showToast={showToast}
                    isTrailVisible={isTrailVisible}
                    replayState={replayState}
                    trailLoading={trailLoading}
                    toggleTrail={toggleTrail}
                    enterReplay={enterReplay}
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
