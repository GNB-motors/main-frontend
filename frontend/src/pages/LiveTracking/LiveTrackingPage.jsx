import TrackTollStatus from './TrackTollStatus';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import useSelectedDriver from './useSelectedDriver.js';
import useVehicleShareDialog from './useVehicleShareDialog.js';
import renderIconSvg from './renderIconSvg.jsx';
import LiveTopbar from './LiveTopbar.jsx';
import useStatusCards from './useStatusCards.js';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import MapOverlayControls from './MapOverlayControls.jsx';
import TelemetryTicker from './TelemetryTicker.jsx';
import FleetListView from './FleetListView.jsx';
import VehicleDetailPanel from './VehicleDetailPanel.jsx';
import { useKnownEtas } from '../../hooks/useKnownEtas';
import ShareLinkDialog from './ShareLinkDialog.jsx';
import useTrackPlaces from './useTrackPlaces.js';
import PlacesListView from './PlacesListView.jsx';
import PlaceDetailPanel from './PlaceDetailPanel.jsx';
import TrackLegend from './TrackLegend.jsx';
import MapSearchBox from './MapSearchBox.jsx';
import TrafficToggle from './TrafficToggle.jsx';
import useMapPlaces from './useMapPlaces.js';
import useTrackMode from './useTrackMode.js';
import TrackTimeline from './TrackTimeline.jsx';
import TrackLog from './TrackLog.jsx';
import TrackRangePicker from './TrackRangePicker.jsx';
import { nextEventAt, previousEventAt } from './trackPlayback.js';
import { toggleSelection } from './trackLegendModel.js';
import TrackClickMenu from './TrackClickMenu.jsx';
import TrackPlaceDraft from './TrackPlaceDraft.jsx';
import TrackZoneDraft from './TrackZoneDraft.jsx';
import TrackReviewLayer from './TrackReviewLayer.jsx';
import TrackReviewPanel from './TrackReviewPanel.jsx';
import TrackIdlingLayer from './TrackIdlingLayer.jsx';
import TrackRouteDetailPanel from './TrackRouteDetailPanel.jsx';
import useTrackReviewQueue from './useTrackReviewQueue.js';
import useTrackRoutes from './useTrackRoutes.js';
import { clickDraft, clampRadius, declareOutcome } from './trackClickModel.js';
import { alertsForVehicle, alertCountsByVehicle } from './trackAlertsModel.js';
import { idlingMinutesByPlate, plateKey } from './trackIdlingModel.js';
import { useLiveAlerts } from '../../hooks/useLiveAlerts.js';
import { useLiveIdling } from '../../hooks/useLiveIdling.js';
import { useLiveIntents } from '../../hooks/useLiveIntents.js';
import { canEditPlaces } from '../PlaceHub/model/placeHubConfig.js';
import { newDraft, payloadFor, validateDraft } from '../PlaceHub/model/placeDraft.js';
import PlaceHubService from '../PlaceHub/PlaceHubService.js';
import { ErpSiteService } from '../../services/erpSiteService.js';
import { getUserRole } from '../../utils/session.js';
import { openInGoogleMaps } from '../../utils/googleMapsLink.js';
import '../PlaceHub/PlaceHub.css';
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
    error: positionsError,
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
  const [whereNext, setWhereNext] = useState(null);

  // The top toolbar is the filter: one status at a time, and a set of makes
  // (empty means every make). The floating legend keeps only the Places layers.
  const [filter, setFilter] = useState('all');
  const [selectedManufacturers, setSelectedManufacturers] = useState([]);
  const [layerSelection, setLayerSelection] = useState(() => readLayerSelection());
  const [isTrafficOn, setIsTrafficOn] = useState(() => readTrafficOn());

  // The control room: what a click on the map can start, and the live layers
  // the owner has switched on.
  const [mapClick, setMapClick] = useState(null);
  const [placeDraft, setPlaceDraft] = useState(null);
  const [zoneDraft, setZoneDraft] = useState(null);
  const [draftError, setDraftError] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [reviewSite, setReviewSite] = useState(null);
  const [openRouteId, setOpenRouteId] = useState(null);
  const canEditPlacesHere = canEditPlaces(getUserRole());

  const handleMapClick = useCallback((click) => {
    setMapClick(click);
    setPlaceDraft(null);
    setZoneDraft(null);
    setDraftError(null);
  }, []);

  // Track mode lives in the URL, so every link in the product can open one
  // truck's history on a given range (F3.2).
  const [searchParams, setSearchParams] = useSearchParams();
  const trackMode = useTrackMode({ searchParams, setSearchParams });
  const isTrackMode = trackMode.isTrackMode;

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
      filter,
      searchQuery,
      selectedId,
      selectedManufacturers,
    });

  useEffect(() => {
    if (selectedId && !selectedVehicle) setSelectedId(null);
  }, [selectedId, selectedVehicle]);

  // The toolbar's status cards. Counts follow the make filter so the numbers
  // match the list the owner is looking at.
  const statusCards = useStatusCards(counts);

  const handleToggleLayer = (key) => {
    // "Our places" is the fleet's own confirmed places, which the Track page
    // already has; the rest come from the map places endpoint. It is a real
    // layer like any other, so it also flips in `layerSelection` — otherwise the
    // layer says one thing and the map does another.
    if (key === 'ourPlaces') {
      trackPlaces.toggle();
      setLayerSelection((prev) => {
        const next = toggleSelection(prev, key);
        writeLayerSelection(next);
        return next;
      });
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
    selectedStatusColor,
    trailCoords,
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
  } = useLiveMap({
    theme,
    mapMode,
    vehicles,
    selectedId,
    selectedVehicle,
    showToast,
    onMapClick: handleMapClick,
  });

  const selectedDriver = useSelectedDriver(selectedVehicle, vehiclesMeta, driverAssignments);

  // Places layer (Place Hub's confirmed places) — off until the user turns it on.
  const trackPlaces = useTrackPlaces();
  const [railTab, setRailTab] = useState('fleet'); // 'fleet' | 'places'

  // The live control room: idling, alerts and destinations, all from the
  // stream. The new map layers are asked for only when they are switched on.
  const { idling: idlingRows, error: idlingError } = useLiveIdling({ enabled: true });
  const { alerts } = useLiveAlerts({ enabled: true });
  const { intents } = useLiveIntents({ enabled: Boolean(selectedId) });
  // Destinations we actually know, with the arrival band (refreshed every 5 min).
  const knownEtas = useKnownEtas();
  const idlingByPlate = useMemo(() => idlingMinutesByPlate(idlingRows), [idlingRows]);
  const alertCounts = useMemo(() => alertCountsByVehicle(alerts), [alerts]);
  const reviewQueue = useTrackReviewQueue({ enabled: Boolean(layerSelection.reviewQueue) });
  const routes = useTrackRoutes({ enabled: Boolean(layerSelection.routes) });

  // The plates that have a destination on the way — only those trucks get the
  // destination section in their panel.
  const intentPlates = useMemo(
    () =>
      new Set(
        intents
          .map((intent) => plateKey(intent?.registrationNumber || intent?.vehicleNumber || intent?.plate))
          .filter(Boolean),
      ),
    [intents],
  );
  const hasIntentFor = useCallback((plate) => intentPlates.has(plateKey(plate)), [intentPlates]);

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
  const focusPlace = useCallback((place) => {
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
  }, [mapRef]);

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

  /* ---- The click menu: a click is an offer, never an action. ---- */
  const closeClickMenu = useCallback(() => setMapClick(null), []);

  const handleClickChoice = useCallback(
    (action) => {
      const click = mapClick;
      setMapClick(null);
      if (!click) return;
      if (action === 'openInGoogleMaps') {
        openInGoogleMaps({ lat: click.lat, lng: click.lng });
        return;
      }
      setDraftError(null);
      if (action === 'makePlace') {
        setPlaceDraft(clickDraft({ lat: click.lat, lng: click.lng }));
        return;
      }
      if (action === 'alertZone') {
        setZoneDraft(newDraft('ZONE', { center: { lat: click.lat, lng: click.lng } }));
      }
    },
    [mapClick],
  );

  const changePlaceDraft = useCallback((patch) => {
    setPlaceDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const changeZoneDraft = useCallback((patch) => {
    setZoneDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const zoneErrors = useMemo(() => (zoneDraft ? validateDraft(zoneDraft) : {}), [zoneDraft]);

  // "Make this a place" writes to the fleet's own places: the same endpoint the
  // delivery orders use for a pickup point, so a place is a place everywhere.
  const savePlaceDraft = useCallback(async () => {
    const draft = placeDraft;
    if (!draft?.center) return;
    const name = String(draft.name || '').trim();
    if (name.length < 2) {
      setDraftError('Give the place a name (2 characters or more)');
      return;
    }
    setSavingDraft(true);
    setDraftError(null);
    try {
      const result = await ErpSiteService.declare({
        name,
        lat: draft.center.lat,
        lng: draft.center.lng,
        radiusM: clampRadius(draft.radiusM),
        address: '',
      });
      const outcome = declareOutcome(result);
      const site = outcome.site;
      setPlaceDraft(null);
      showToast(outcome.message);
      trackPlaces.show();
      trackPlaces.retry?.();
      if (site) {
        focusPlace(site);
        if (site._id) {
          trackPlaces.selectPlace(site._id);
          setRailTab('places');
          setIsRailOpen(true);
        }
      }
    } catch (error) {
      setDraftError(error?.message || 'Could not save the place');
    } finally {
      setSavingDraft(false);
    }
  }, [placeDraft, showToast, trackPlaces, focusPlace]);

  // "Alert zone here" writes a geofence zone: Place Hub's own fence.
  const saveZoneDraft = useCallback(async () => {
    const draft = zoneDraft;
    if (!draft?.center) return;
    const problem = Object.values(validateDraft(draft))[0];
    if (problem) {
      setDraftError(problem);
      return;
    }
    setSavingDraft(true);
    setDraftError(null);
    try {
      const body = payloadFor(draft);
      const editing = draft.mode === 'edit' && draft.sourceId;
      if (editing) await PlaceHubService.updateZone(draft.sourceId, body);
      else await PlaceHubService.createZone(body);
      setZoneDraft(null);
      showToast(editing ? `Zone updated: ${body.name}` : `Alert zone added: ${body.name}`);
      trackPlaces.retry?.();
    } catch (error) {
      setDraftError(error?.message || 'Could not save the zone');
    } finally {
      setSavingDraft(false);
    }
  }, [zoneDraft, showToast, trackPlaces]);

  // The truck panel's "add this spot": a zone to watch, or a place to work at.
  const handleAddAtSpot = useCallback((kind, seed) => {
    const center = seed?.center;
    if (!center) return;
    if (kind === 'WAREHOUSE') {
      setPlaceDraft(clickDraft({ lat: center.lat, lng: center.lng, name: seed?.name || '' }));
      return;
    }
    setZoneDraft(newDraft('ZONE', { center, name: seed?.name || '' }));
  }, []);

  // A place nobody has answered for yet.
  const selectReviewSite = useCallback(
    (site) => {
      setReviewSite(site);
      setSelectedId(null);
      trackPlaces.selectPlace(null);
      setRailTab('fleet');
      setIsRailOpen(true);
    },
    [trackPlaces],
  );

  const handleSiteAnswered = useCallback(() => {
    setReviewSite(null);
    reviewQueue.reload();
  }, [reviewQueue]);

  // Its fence is edited with Place Hub's own editor.
  const editFenceForSite = useCallback((site) => {
    const lat = Number(site?.centroidLat ?? site?.lat);
    const lng = Number(site?.centroidLng ?? site?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const sourceId = site?.zoneId || site?.geofenceId || null;
    const draft = newDraft('ZONE', { center: { lat, lng }, name: site?.name || '' });
    if (sourceId) {
      draft.mode = 'edit';
      draft.sourceId = sourceId;
    }
    draft.radiusM = clampRadius(Number(site?.radiusM) || 500, 50, 50000);
    setZoneDraft(draft);
    setReviewSite(null);
  }, []);

  const handleRoutePick = useCallback((id) => setOpenRouteId(id), []);

  // An idling marker is a truck: clicking it opens the truck.
  const selectIdlingRow = useCallback(
    (row) => {
      const plate = plateKey(row?.registrationNumber || row?.vehicleNumber || row?.plate);
      const vehicle = vehicles.find((v) => plateKey(v.plate) === plate);
      if (!vehicle) return;
      setSelectedId(vehicle.id);
      setRailTab('fleet');
      setIsRailOpen(true);
    },
    [vehicles],
  );

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
        return;
      }
      // In Track mode the keyboard drives the drive: Space plays and pauses,
      // the arrows jump between events, Esc leaves.
      if (isTrackMode) {
        if (e.key === ' ') {
          e.preventDefault();
          trackMode.setIsPlaying((playing) => !playing);
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const events = trackMode.track?.events ?? [];
          const at =
            e.key === 'ArrowRight'
              ? nextEventAt(events, trackMode.playheadTime)
              : previousEventAt(events, trackMode.playheadTime);
          if (at) trackMode.seekToTime(at);
          return;
        }
        if (e.key === 'Escape') {
          trackMode.exitTrackMode();
          return;
        }
      }
      if (e.key === 'Escape') {
        if (replayState.on) exitReplay();
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replayState.on, exitReplay, isTrackMode, trackMode]);

  const { shareDialog, setShareDialog, shareCreating, handleShareVehicle, submitShareLink } =
    useVehicleShareDialog(showToast);

  // In Track mode the truck is the one in the URL, not the one the owner
  // happened to click.
  const trackVehicle = useMemo(
    () => (trackMode.reg ? (vehicles.find((v) => v.plate === trackMode.reg) ?? null) : null),
    [trackMode.reg, vehicles],
  );
  const activeVehicle = isTrackMode ? trackVehicle : selectedVehicle;
  const activeSelectedId = isTrackMode ? (trackVehicle?.id ?? null) : selectedId;

  return (
    <div className="gnb-lt-page">
      {/* Main Console Container */}
      <main className="console">
        {/* Top toolbar: manufacturer + status filters (Places stay on the map legend) */}
        <LiveTopbar
          isLiveLoading={isLiveLoading}
          statusCards={statusCards}
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
        <div
          className={`stage ${!isRailOpen ? 'railoff' : ''} ${
            selectedVehicle && isTrailVisible && !replayState.on ? 'has-trail-dates' : ''
          }`}
        >
          {/* Map Column */}
          <div className="mapcol">
            <LiveMapCanvas
              whereNext={whereNext?.registrationNumber === activeVehicle?.plate && !isTrackMode && !replayState.on ? whereNext : null}
              whereNextPosition={activeVehicle}
              isLoaded={isLoaded}
              loadError={loadError}
              mapZoom={mapZoom}
              setMapZoom={setMapZoom}
              onMapLoad={onMapLoad}
              onMapIdle={onMapIdle}
              mapRef={mapRef}
              mapOptions={mapOptions}
              mapVehicles={mapVehicles}
              selectedId={activeSelectedId}
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
              track={isTrackMode ? trackMode.track : null}
              trackPlayheadTime={isTrackMode ? trackMode.playheadTime : null}
              trackRoad={isTrackMode ? trackMode.roadTrail : null}
              trackTolls={isTrackMode ? trackMode.tolls : null}
              reviewItems={reviewQueue.items}
              selectedReviewId={reviewSite?._id ?? null}
              onSelectReviewSite={selectReviewSite}
              idlingRows={layerSelection.idling ? idlingRows : []}
              onSelectIdling={selectIdlingRow}
              routeLines={routes.lines}
              routeSites={routes.sites}
              onPickRoute={handleRoutePick}
              draft={placeDraft || zoneDraft}
              onDraftChange={placeDraft ? changePlaceDraft : changeZoneDraft}
            />

            {/* A click on the map is an offer: make it a place, watch it as a
                zone, or open it in Google Maps. */}
            <TrackClickMenu
              click={mapClick}
              canEdit={canEditPlacesHere}
              onChoose={handleClickChoice}
              onClose={closeClickMenu}
            />

            {placeDraft ? (
              <TrackPlaceDraft
                draft={placeDraft}
                onChange={changePlaceDraft}
                onCancel={() => setPlaceDraft(null)}
                onSave={savePlaceDraft}
                saving={savingDraft}
                error={draftError}
              />
            ) : null}

            {zoneDraft ? (
              <TrackZoneDraft
                draft={zoneDraft}
                errors={zoneErrors}
                saving={savingDraft}
                onChange={changeZoneDraft}
                onKind={changeZoneDraft}
                onPick={(loc) => focusPlace({ lat: loc?.lat, lng: loc?.lng })}
                onCancel={() => setZoneDraft(null)}
                onSave={saveZoneDraft}
              />
            ) : null}

            {openRouteId ? (
              <TrackRouteDetailPanel
                id={openRouteId}
                onChanged={routes.reload}
                onClose={() => setOpenRouteId(null)}
              />
            ) : null}

            {/* Floating controls: the search, live telemetry and the legend
                (which IS the filter) down the left; traffic at the top-right.
                MapOverlayControls owns the corners so nothing overlaps. */}
            <MapOverlayControls
              searchBox={
                <MapSearchBox
                  value={searchQuery}
                  onChange={setSearchQuery}
                  inputRef={searchInputRef}
                />
              }
              trafficToggle={<TrafficToggle on={isTrafficOn} onToggle={handleToggleTraffic} />}
              trackTollStatus={
                isTrackMode ? (
                  <TrackTollStatus
                    data={trackMode.tolls}
                    loading={trackMode.tollsLoading}
                    error={trackMode.tollsError}
                    onRetry={trackMode.retryTolls}
                    playheadTime={trackMode.playheadTime}
                  />
                ) : null
              }

              legend={
                <TrackLegend
                  layerSelection={layerSelection}
                  onToggleLayer={handleToggleLayer}
                  lastEventAt={lastEventAt}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  zoom={mapZoom}
                  placesNotAvailable={mapPlaces.notAvailable}
                  placesTruncated={mapPlaces.truncated}
                  placesCount={mapPlaces.items.length}
                  unmatchedRoutes={routes.error ? null : routes.unmatchedCount}
                  liveCounts={{
                    reviewQueue: reviewQueue.count,
                    routes: routes.error ? null : routes.lines.length,
                    idling: idlingError ? null : idlingRows.length,
                  }}
                  error={positionsError}
                  onRetry={handleRefresh}
                />
              }
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
              isTrackMode={isTrackMode}
              trackFrom={trackMode.from}
              trackTo={trackMode.to}
              onApplyTrackRange={(range) => trackMode.applyRange(range)}
            />

            {/* Overlay Bottom-Center: the live telemetry ticker. Hidden in Track
                mode, where the timeline owns the bottom band. */}
            {!isTrackMode ? (
              <div className="ov ov--bc">
                {/* Live Telemetry Ticker */}
                <TelemetryTicker
                  selectedVehicle={selectedVehicle}
                  vehicles={vehicles}
                  rotating={isTelemetryOn}
                  highlighted={isTelemetryOn && !replayState.on}
                  icon={renderIconSvg('radio', 14)}
                />
              </div>
            ) : null}

            {/* Track mode: the timeline at the bottom of the map. */}
            {isTrackMode ? (
              <TrackTimeline
                track={trackMode.track}
                points={trackMode.points}
                playheadIndex={trackMode.playheadIndex}
                isPlaying={trackMode.isPlaying}
                speed={trackMode.speed}
                onTogglePlay={() => trackMode.setIsPlaying((playing) => !playing)}
                onSpeedChange={trackMode.setSpeed}
                onSeek={(percent) => {
                  const index = Math.round(
                    (percent / 100) * Math.max(1, trackMode.points.length - 1),
                  );
                  trackMode.seekToIndex(index);
                }}
                onExit={trackMode.exitTrackMode}
                from={trackMode.from}
                to={trackMode.to}
              />
            ) : null}
          </div>

          {/* Right Rail: the trip log in Track mode, the fleet and places otherwise */}
          <aside className="rail">
            {isTrackMode ? (
              <>
                <div className="track-rail-header">
                  <button
                    type="button"
                    className="track-rail-back"
                    onClick={trackMode.exitTrackMode}
                    aria-label="Back to fleet"
                    title="Back to fleet"
                  >
                    {renderIconSvg('chevLeft', 16)}
                  </button>
                  <h2 className="track-rail-title">Track mode</h2>
                  {trackMode.reg ? (
                    <span className="track-rail-registration">{trackMode.reg}</span>
                  ) : null}
                </div>
                <div className="rail-body">
                  {trackMode.notDeployed ? (
                    <p className="track-log-message">Stops and landmarks will appear here soon.</p>
                  ) : trackMode.loading ? (
                    <p className="track-log-message">Loading the drive…</p>
                  ) : (
                    <TrackLog
                      track={trackMode.track}
                      onSeek={(at) => trackMode.seekToTime(new Date(at))}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
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
                        error={positionsError}
                        onRetry={handleRefresh}
                        idlingByPlate={idlingByPlate}
                        alertCounts={alertCounts}
                        knownEtas={knownEtas}
                      />

                      {/* Vehicle Detail Slide-in Drawer */}
                      <VehicleDetailPanel
                        onWhereNext={setWhereNext}
                        selectedVehicle={activeVehicle}
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
                        idlingMinutes={
                          activeVehicle ? (idlingByPlate.get(plateKey(activeVehicle.plate)) ?? null) : null
                        }
                        vehicleAlerts={activeVehicle ? alertsForVehicle(alerts, activeVehicle.plate) : []}
                        showIntent={activeVehicle ? hasIntentFor(activeVehicle.plate) : false}
                        knownEtas={knownEtas}
                        canEditPlaces={canEditPlacesHere}
                        onAddAtSpot={handleAddAtSpot}
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

                  {/* A place nobody has answered for yet. */}
                  <TrackReviewPanel
                    site={reviewSite}
                    onAnswered={handleSiteAnswered}
                    onEditFence={editFenceForSite}
                    onClose={() => setReviewSite(null)}
                  />
                </div>
              </>
            )}
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
