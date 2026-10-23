import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import useDocumentTheme from './useDocumentTheme.js';
import useToastAndRefresh from './useToastAndRefresh.js';
import useFleetMasterData from './useFleetMasterData.js';
import useFleetVehicles from './useFleetVehicles.js';
import useLiveMap from './useLiveMap.js';
import useSelectedDriver from './useSelectedDriver.js';
import useVehicleShareDialog from './useVehicleShareDialog.js';
import useStatusCards from './useStatusCards.js';
import renderIconSvg from './renderIconSvg.jsx';
import LiveTopbar from './LiveTopbar.jsx';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import LiveLayerToggles from './LiveLayerToggles.jsx';
import CongestionPanel from './CongestionPanel.jsx';
import MapOverlayControls from './MapOverlayControls.jsx';
import ReplayBar from './ReplayBar.jsx';
import TelemetryTicker from './TelemetryTicker.jsx';
import FleetListView from './FleetListView.jsx';
import VehicleDetailPanel from './VehicleDetailPanel.jsx';
import ShareLinkDialog from './ShareLinkDialog.jsx';
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
    isTrailVisible,
    trailPoints,
    roadTrail,
    replayState,
    setReplayState,
    selectedStatusColor,
    trailCoords,
    trailKm,
    replayPtsCoords,
    replayCurrentPos,
    replayRunPath,
    replayBearing,
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
              replayRunPath={replayRunPath}
              replayCurrentPos={replayCurrentPos}
              replayBearing={replayBearing}
              trailSegments={trailSegments}
              tripLegend={tripLegend}
              fallbackSingleColor={fallbackSingleColor}
              habitualHalts={habitualHalts}
              isHabitualHaltsVisible={isHabitualHaltsVisible}
              isCongestionVisible={isCongestionVisible}
              congestionRows={congestion?.rows || []}
              segmentByTrip={segmentByTrip}
            />

            <MapOverlayControls
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

          {/* Right Rail: Fleet List & Vehicle Detail View */}
          <aside className="rail">
            {/* Layer toggles for the unified Live page (Task 4): trip
                segments + habitual-halts surfaces. Sits above the fleet list
                so users discover the new layers without scrolling. */}
            <LiveLayerToggles
              selectedVehicle={selectedVehicle}
              isTrailVisible={isTrailVisible}
              segmentByTrip={segmentByTrip}
              setSegmentByTrip={setSegmentByTrip}
              isHabitualHaltsVisible={isHabitualHaltsVisible}
              habitualHaltsLoading={habitualHaltsLoading}
              toggleHabitualHalts={toggleHabitualHalts}
              habitualHalts={habitualHalts}
              isCongestionVisible={isCongestionVisible}
              congestionLoading={congestionLoading}
              congestionCount={congestion?.rows?.length || 0}
              toggleCongestion={toggleCongestion}
            />
            {/* What the congestion colours actually mean — the learned quantile,
                the evidence behind it, and the edges that were left undrawn. */}
            {isCongestionVisible && <CongestionPanel congestion={congestion} notice={congestionNotice} />}

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
              mapRef={mapRef}
              isTrailVisible={isTrailVisible}
              replayState={replayState}
              trailLoading={trailLoading}
              toggleTrail={toggleTrail}
              enterReplay={enterReplay}
              shareCreating={shareCreating}
              handleShareVehicle={handleShareVehicle}
              trailPoints={trailPoints}
              trailKm={trailKm}
              selectedDriver={selectedDriver}
              tripLegend={tripLegend}
              habitualHalts={habitualHalts}
              isHabitualHaltsVisible={isHabitualHaltsVisible}
            />
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
