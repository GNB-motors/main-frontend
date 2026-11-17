import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import useTrackTolls from './useTrackTolls.js';
import usePlaceLayerAvailability from './usePlaceLayerAvailability.js';
import { routeFocusModel } from './routeFocusModel.js';
import { animateCamera } from './mapCameraAnimate.js';
import { fitRouteOnMap } from './fitRouteOnMap.js';
import usePassiveTrail from './usePassiveTrail.js';
import { googleMapsLoaderOptions } from '../../utils/googleMapsLoader.js';
import TrackTollStatus from './TrackTollStatus';
import { getPref } from '../../utils/session';
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
import FleetListView from './FleetListView.jsx';
import VehicleDetailPanel from './VehicleDetailPanel.jsx';
import { useKnownEtas } from '../../hooks/useKnownEtas';
import ShareLinkDialog from './ShareLinkDialog.jsx';
import useTrackPlaces from './useTrackPlaces.js';
import RoutesListView from './RoutesListView.jsx';
import PlacesListView from './PlacesListView.jsx';
import PlaceDetailPanel from './PlaceDetailPanel.jsx';
import EditPlaceDialog from './EditPlaceDialog.jsx';
import IdentifyJourneyPlaceDialog from './IdentifyJourneyPlaceDialog.jsx';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog.jsx';
import { fromSite } from '../PlaceHub/model/mergePlaces.js';
import TrackLegend from './TrackLegend.jsx';
import TrackMapKey from './TrackMapKey.jsx';
import MapSearchBox from './MapSearchBox.jsx';
import TrafficToggle from './TrafficToggle.jsx';
import useMapPlaces from './useMapPlaces.js';
import useTrackMode from './useTrackMode.js';
import { toIso } from './trackUrlModel.js';
import { formatIst } from '../../utils/redesign/format';
import VehicleJourneyPanel from './VehicleJourneyPanel.jsx';
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
import {
  newDraft,
  draftFromPlace,
  payloadFor,
  validateDraft,
} from '../PlaceHub/model/placeDraft.js';
import PlaceHubService from '../PlaceHub/PlaceHubService.js';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { ringOf } from '../PlaceHub/model/placeGeometry.js';
import { useConfirm } from '../../components/ui/confirmContext';
import { impactSummary, isImpactGate } from '../PlaceHub/intelligence/model/requestOutcome.js';
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

/* ---------------- Main LiveTrackingPage Component ---------------- */
const LiveTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const fenceRequest = useRef(0);
  const [editingPlace, setEditingPlace] = useState(null);
  const [identifyingStop, setIdentifyingStop] = useState(null);
  const [journeyPlace, setJourneyPlace] = useState(null);
  const journeyPlaceRequest = useRef(0);
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

  // The Places panel (the legend down the left of the map) covers that side of
  // the map, so a track is fitted to the right of it while it is open. The
  // legend remembers whether it is open; when it has never been touched it is
  // open on a desktop and closed on a phone.
  const placesPanelOpen = useMemo(() => {
    const stored = getPref('track.legend.open');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return !window.matchMedia('(max-width: 780px)').matches;
  }, []);

  // Filters & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedIdState] = useState(null);
  const [whereNext, setWhereNext] = useState(null);

  // The top toolbar is the filter: one status at a time, and a set of makes
  // (empty means every make). The floating legend keeps only the Places layers.
  const requestedStatus = searchParams.get('status');
  const filter = ['moving', 'stopped', 'idling', 'offline'].includes(requestedStatus)
    ? requestedStatus
    : 'all';
  const setFilter = (status) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (status === 'all') next.delete('status');
      else next.set('status', status);
      return next;
    });
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
  const reviewBeforeFence = useRef(null);
  const [openRouteId, setOpenRouteId] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const routeOverviewCamera = useRef(null);
  const routesOverviewFitted = useRef({});
  const { isEnabled } = useFeatureFlags();
  const canCreateZoneHere = canEditPlaces(getUserRole()) && isEnabled('geofence');
  const canEditPlacesHere = canEditPlaces(getUserRole());

  const handleMapClick = useCallback(
    (click) => {
      if (openRouteId || placeDraft || zoneDraft || savingDraft) return;
      reviewBeforeFence.current = null;
      setMapClick(click);
      setPlaceDraft(null);
      setZoneDraft(null);
      setDraftError(null);
    },
    [openRouteId, placeDraft, zoneDraft, savingDraft],
  );

  // Track mode lives in the URL, so every link in the product can open one
  // truck's history on a given range (F3.2).
  const trackMode = useTrackMode({ searchParams, setSearchParams });
  const isTrackMode = trackMode.isTrackMode;
  const isPlacesView = searchParams.get('view') === 'places';
  const contextReg = trackMode.contextReg;
  useEffect(() => {
    journeyPlaceRequest.current += 1;
    setIdentifyingStop(null);
    setJourneyPlace(null);
  }, [contextReg]);
  const isVehiclePlaces = isPlacesView && Boolean(contextReg);
  const deliveryRoutesEnabled =
    canEditPlacesHere && isEnabled('fleetIntelligence') && isEnabled('routesV2');
  const routeKind =
    deliveryRoutesEnabled && searchParams.get('routeView') !== 'movements'
      ? 'delivery'
      : 'movement';
  useEffect(() => {
    setOpenRouteId(null);
    setRouteDetail(null);
  }, [routeKind]);

  // Google Maps Load Script
  const { isLoaded, loadError } = useLoadScript(googleMapsLoaderOptions);

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

  // The URL keeps the vehicle selected across views, reloads and browser history.
  const selectedPlate = contextReg;
  useEffect(() => {
    const vehicle = vehicles.find((item) => plateKey(item.plate) === plateKey(selectedPlate));
    setSelectedIdState(vehicle?.id ?? null);
  }, [selectedPlate, vehicles]);
  const setSelectedId = useCallback(
    (id) => {
      const vehicle = vehicles.find((item) => item.id === id);
      setSelectedIdState(vehicle?.id ?? null);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (vehicle) next.set('vehicle', vehicle.plate);
          else next.delete('vehicle');
          return next;
        },
        { replace: true },
      );
    },
    [vehicles, setSearchParams],
  );

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

  const passiveTrail = usePassiveTrail(
    selectedId,
    selectedVehicle?.plate,
    !isTrackMode && !isPlacesView,
  );

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
    suspendFollow: isPlacesView || isTrackMode || Boolean(passiveTrail),
    showToast,
    onMapClick: handleMapClick,
  });

  const selectedVehicleForFit = useRef(selectedVehicle);
  selectedVehicleForFit.current = selectedVehicle;
  useEffect(() => {
    if (
      !passiveTrail ||
      !mapRef.current ||
      !window.google?.maps?.LatLngBounds ||
      replayState.on ||
      isTrailVisible
    )
      return;
    const bounds = new window.google.maps.LatLngBounds();
    const points = [...passiveTrail.points];
    const vehicle = selectedVehicleForFit.current;
    if (vehicle?.hasFix) points.push({ lat: vehicle.lat, lng: vehicle.lng });
    if (points.length < 2) return;
    points.forEach((point) => bounds.extend(point));
    const panel = document.querySelector('.gnb-lt-page .rail');
    const right = panel?.getBoundingClientRect().width || 0;
    const mapBounds = mapRef.current.getDiv().getBoundingClientRect();
    const overlays = document.querySelectorAll('.gnb-lt-page .ov-search, .gnb-lt-page .ov-legend');
    const left = Math.max(
      70,
      ...Array.from(
        overlays,
        (overlay) => overlay.getBoundingClientRect().right - mapBounds.left + 20,
      ),
    );
    mapRef.current.fitBounds(bounds, { top: 70, bottom: 70, left, right: right + 70 });
  }, [passiveTrail, mapRef, replayState.on, isTrailVisible]);

  const selectedDriver = useSelectedDriver(selectedVehicle, vehiclesMeta, driverAssignments);

  // Places layer (Place Hub's confirmed places) — off until the user turns it on.
  const trackPlaces = useTrackPlaces();
  const placesTab = searchParams.get('placesTab') === 'routes' ? 'routes' : 'places';
  const setPlacesTab = useCallback(
    (tab) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('placesTab', tab);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );
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
  const reviewQueue = useTrackReviewQueue({ enabled: isPlacesView && !isVehiclePlaces });
  const routes = useTrackRoutes({
    enabled: isPlacesView && !isVehiclePlaces && placesTab === 'routes',
    kind: routeKind,
  });
  const [showAllTolls, setShowAllTolls] = useState(false);
  const [placeScopes, setPlaceScopes] = useState({ pumps: 'visited', dhabas: 'visited' });
  const tolls = useTrackTolls({
    enabled: isPlacesView && !isVehiclePlaces && placesTab === 'places',
    showAll: showAllTolls && Boolean(layerSelection.tolls),
    bbox: mapBounds,
    zoom: mapZoom,
  });
  const layerAvailability = usePlaceLayerAvailability(
    isPlacesView && !isVehiclePlaces && placesTab === 'places',
  );

  const selectedRoute = routes.legs.find((leg) => String(leg._id) === String(openRouteId));
  const focusedRoute = useMemo(
    () =>
      isPlacesView && placesTab === 'routes' && selectedRoute
        ? routeFocusModel(selectedRoute, routes.sites, routeDetail)
        : null,
    [isPlacesView, placesTab, selectedRoute, routes.sites, routeDetail],
  );
  const showPlaceLayers = isPlacesView && !isVehiclePlaces && placesTab === 'places';

  // The plates that have a destination on the way — only those trucks get the
  // destination section in their panel.
  const intentPlates = useMemo(
    () =>
      new Set(
        intents
          .map((intent) =>
            plateKey(intent?.registrationNumber || intent?.vehicleNumber || intent?.plate),
          )
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
    scopes: placeScopes,
    enabled: isPlacesView && !isVehiclePlaces,
  });
  // Picking a vehicle anywhere (map, list, a place's "vehicles here") shows its details.
  useEffect(() => {
    if (selectedId) setRailTab('fleet');
  }, [selectedId]);

  const showPlaces = trackPlaces.show;
  useEffect(() => {
    if (isPlacesView && !isVehiclePlaces && layerSelection.ourPlaces) showPlaces();
  }, [isPlacesView, isVehiclePlaces, layerSelection.ourPlaces, showPlaces]);

  const changeView = (view) => {
    reviewBeforeFence.current = null;
    trackMode.setIsPlaying(false);
    setReplayState((current) => ({ ...current, playing: false }));
    setSearchQuery('');
    setMapClick(null);
    setReviewSite(null);
    setOpenRouteId(null);
    setRouteDetail(null);
    routeOverviewCamera.current = null;
    setPlaceDraft(null);
    setZoneDraft(null);
    setIsRailOpen(true);
    setRailTab(view === 'places' ? 'places' : 'fleet');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (contextReg) {
        next.set('from', toIso(trackMode.from));
        next.set('to', toIso(trackMode.to));
        if (isTrackMode) next.set('at', toIso(trackMode.playheadTime));
      }
      if (view === 'places') next.set('view', 'places');
      else next.delete('view');
      return next;
    });
    setTimeout(triggerMapResize, 240);
  };

  // Recenter on a place picked from the Places list.
  const focusPlace = useCallback(
    (place) => {
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
      animateCamera(map, { center, zoom });
    },
    [mapRef],
  );

  const pickPlace = (place) => {
    fenceRequest.current += 1;
    setReviewSite(null);
    trackPlaces.show();
    trackPlaces.selectPlace(place.id);
    focusPlace(place);
  };

  const selectPlaceFromMap = (id) => {
    setReviewSite(null);
    setPlacesTab('places');
    setOpenRouteId(null);
    trackPlaces.selectPlace(id);
    setRailTab('places');
    setIsRailOpen(true);
    // Recenter and zoom to the place, the same as picking it from the list — a
    // single pin should frame itself, not just highlight in place.
    const place = trackPlaces.places.find((p) => p.id === id);
    if (place) focusPlace(place);
  };

  const pickVehicleFromPlace = (id) => {
    changeView('live');
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
      if (action === 'makePlace' && canEditPlacesHere) {
        setPlaceDraft(clickDraft({ lat: click.lat, lng: click.lng }));
        return;
      }
      if (action === 'alertZone' && canCreateZoneHere) {
        setZoneDraft(newDraft('ZONE', { center: { lat: click.lat, lng: click.lng } }));
      }
    },
    [mapClick, canEditPlacesHere, canCreateZoneHere],
  );

  const changePlaceDraft = useCallback(
    (patch) => {
      if (savingDraft) return;
      setPlaceDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [savingDraft],
  );

  const changeZoneDraft = useCallback(
    (patch) => {
      if (savingDraft) return;
      setZoneDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [savingDraft],
  );

  const closeZoneDraft = useCallback(() => {
    fenceRequest.current += 1;
    setDraftError(null);
    setZoneDraft(null);
    if (reviewBeforeFence.current) setReviewSite(reviewBeforeFence.current);
    reviewBeforeFence.current = null;
  }, []);

  const zoneErrors = useMemo(() => (zoneDraft ? validateDraft(zoneDraft) : {}), [zoneDraft]);

  // "Make this a place" writes to the fleet's own places: the same endpoint the
  // delivery orders use for a pickup point, so a place is a place everywhere.
  const savePlaceDraft = useCallback(async () => {
    const draft = placeDraft;
    if (!draft?.center) return;
    const name = String(draft.name || '').trim();
    if (name.length < 2 || name.length > 120) {
      setDraftError('Give the place a name (2–120 characters)');
      return;
    }
    if (
      !Number.isFinite(Number(draft.radiusM)) ||
      Number(draft.radiusM) < 50 ||
      Number(draft.radiusM) > 5000
    ) {
      setDraftError('Radius must be 50–5,000 m');
      return;
    }
    setSavingDraft(true);
    setDraftError(null);
    try {
      const body = {
        name,
        lat: draft.center.lat,
        lng: draft.center.lng,
        radiusM: clampRadius(draft.radiusM),
        ...(draft.mode === 'edit' ? {} : { address: draft.address || '' }),
      };
      const result =
        draft.mode === 'edit'
          ? await ErpSiteService.update(draft.sourceId, body)
          : await ErpSiteService.declare(body);
      const outcome =
        draft.mode === 'edit'
          ? { site: result?.site || result, message: `Place updated: ${name}` }
          : declareOutcome(result);
      const site = outcome.site;
      setPlaceDraft(null);
      showToast(outcome.message);
      trackPlaces.show();
      trackPlaces.retry?.();
      if (site) {
        focusPlace(site);
        if (site._id) {
          trackPlaces.selectPlace(`site:${site._id}`);
          setRailTab('places');
          setIsRailOpen(true);
        }
      }
    } catch (error) {
      setDraftError(error?.response?.data?.message || error?.message || 'Could not save the place');
    } finally {
      setSavingDraft(false);
    }
  }, [placeDraft, showToast, trackPlaces, focusPlace]);

  // "Alert zone here" writes a geofence zone: Place Hub's own fence.
  const saveZoneDraft = useCallback(async () => {
    const draft = zoneDraft;
    if (!draft || (draft.shape !== 'polygon' && !draft.center)) return;
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
      let updatedSite = null;
      if (draft.targetSource === 'site') {
        const geometry =
          draft.shape === 'polygon'
            ? { polygon: draft.polygon.map((point) => [point.lat, point.lng]) }
            : { lat: draft.center.lat, lng: draft.center.lng, radiusM: Number(draft.radiusM) };
        let result;
        try {
          result = await PlaceIntelligenceService.move({ id: draft.sourceId, ...geometry });
        } catch (error) {
          if (!isImpactGate(error)) throw error;
          const approved = await confirm({
            title: 'Update this warehouse boundary?',
            body: impactSummary(error.body.impact),
            confirmLabel: 'Save boundary',
          });
          if (!approved) return;
          result = await PlaceIntelligenceService.move({
            id: draft.sourceId,
            ...geometry,
            confirmImpact: true,
          });
        }
        updatedSite = result?.site;
      } else if (draft.kind === 'WAREHOUSE') {
        await PlaceHubService.updateWarehouse(draft.sourceId, body);
      } else if (editing) await PlaceHubService.updateZone(draft.sourceId, body);
      else await PlaceHubService.createZone(body);
      if (updatedSite && reviewBeforeFence.current) reviewBeforeFence.current = updatedSite;
      closeZoneDraft();
      showToast(
        draft.targetSource === 'site'
          ? 'Place boundary updated'
          : editing
            ? `Place updated: ${body.name}`
            : `Alert zone added: ${body.name}`,
      );
      trackPlaces.retry?.();
      if (draft.targetSource === 'site') reviewQueue.reload();
    } catch (error) {
      setDraftError(
        error?.response?.data?.message || error?.message || 'Could not save the place boundary',
      );
    } finally {
      setSavingDraft(false);
    }
  }, [zoneDraft, showToast, trackPlaces, closeZoneDraft, confirm, reviewQueue]);

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
      fenceRequest.current += 1;
      reviewBeforeFence.current = null;
      setZoneDraft(null);
      setPlaceDraft(null);
      setReviewSite(site);
      setOpenRouteId(null);
      setRouteDetail(null);
      routeOverviewCamera.current = null;
      setPlacesTab('places');
      trackPlaces.selectPlace(null);
      setRailTab('fleet');
      setIsRailOpen(true);
      const rawLat = site?.centroidLat ?? site?.lat;
      const rawLng = site?.centroidLng ?? site?.lng;
      const lat = Number(rawLat);
      const lng = Number(rawLng);
      if (
        rawLat != null &&
        rawLng != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        animateCamera(mapRef.current, { center: { lat, lng }, zoom: 16 });
      }
    },
    [trackPlaces, setPlacesTab, mapRef],
  );

  const handleSiteAnswered = useCallback(
    (id) => {
      setReviewSite(null);
      reviewQueue.resolve?.(id);
      reviewQueue.reload();
      trackPlaces.retry?.();
    },
    [reviewQueue, trackPlaces],
  );

  // Edit the original site/warehouse/zone rather than creating a second place.
  const editFenceForSite = useCallback(
    async (record) => {
      const request = ++fenceRequest.current;
      setDraftError(null);
      try {
        const site = record.source === 'site' ? record.raw : record;
        if (record.erp || (site.origins || []).includes('ERP_DECLARED')) {
          const center = {
            lat: Number(site.centroidLat ?? record.lat),
            lng: Number(site.centroidLng ?? record.lng),
          };
          if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;
          setPlaceDraft({
            ...clickDraft({ ...center, name: site.name || record.name || '' }),
            mode: 'edit',
            sourceId: String(site._id || record.sourceId),
            radiusM: clampRadius(Number(site.radiusM || record.radiusM) || 100),
            address:
              typeof site.address === 'string' ? site.address : site.address?.formatted || '',
          });
          setReviewSite(null);
          setZoneDraft(null);
          focusPlace(center);
          return;
        }
        if (record.source === 'warehouse' || record.source === 'zone') {
          const draft = draftFromPlace(record);
          if (!draft) return;
          reviewBeforeFence.current = null;
          setZoneDraft(draft);
          setReviewSite(null);
          focusPlace(record);
          return;
        }
        const id = site?._id || record.sourceId;
        if (!id) return;
        const full = await PlaceHubService.siteDetail(id);
        if (request !== fenceRequest.current || !full) return;
        const lat = Number(full.centroidLat);
        const lng = Number(full.centroidLng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const draft = newDraft('ZONE', {
          center: { lat, lng },
          name: full.name || record.name || 'Place boundary',
        });
        draft.mode = 'edit';
        draft.targetSource = 'site';
        draft.sourceId = String(id);
        draft.radiusM = clampRadius(Number(full.radiusM) || 500, 50, 50000);
        const polygon = ringOf(full.polygon);
        if (polygon) Object.assign(draft, { shape: 'polygon', polygon, polygonDone: true });
        reviewBeforeFence.current = full;
        setPlaceDraft(null);
        setZoneDraft(draft);
        setReviewSite(null);
        focusPlace({ lat, lng, polygon });
      } catch (error) {
        showToast(error?.displayMessage || 'Could not open the place boundary. Please try again.');
      }
    },
    [focusPlace, showToast],
  );

  const editSavedPlace = useCallback((place) => {
    setEditingPlace(place);
  }, []);

  const openJourneyPlace = useCallback(
    async (row) => {
      const request = ++journeyPlaceRequest.current;
      trackMode.setIsPlaying(false);
      if (row.unidentified) {
        if (!canEditPlacesHere) {
          showToast('Only owners and managers can identify a place.');
          return;
        }
        if (!row.stopId && !row.fixAt) {
          showToast(
            'Refresh this journey after the updated backend is available to identify this stop.',
          );
          return;
        }
        setIdentifyingStop(row);
        return;
      }
      const place = row.place;
      if (!place) return;
      const fallback = {
        id: `${place.kind === 'SITE' ? 'site' : 'poi'}:${place.id}`,
        sourceId: place.id,
        source: 'landmark',
        name: place.name,
        type: place.category,
        lat: place.lat,
        lng: place.lng,
        radiusM: place.radiusM,
        subtitle: row.description || '',
      };
      setJourneyPlace(fallback);
      if (place.kind === 'SITE') {
        try {
          const site = await PlaceHubService.siteDetail(place.id);
          if (request === journeyPlaceRequest.current && site) setJourneyPlace(fromSite(site));
        } catch {
          /* The known name/location remain usable when extra details are unavailable. */
        }
      }
    },
    [canEditPlacesHere, showToast, trackMode.setIsPlaying],
  );

  const fitSelectedRoute = useCallback(() => {
    fitRouteOnMap(mapRef.current, focusedRoute?.points || []);
  }, [focusedRoute, mapRef]);

  useEffect(() => {
    fitSelectedRoute();
  }, [fitSelectedRoute]);

  // Frame the whole routes overview the first time its lines arrive for a kind,
  // so going to the Routes tab lands on the corridors instead of a continent-wide
  // view where the lines are too small to read. Once per kind: a reload or a
  // manual zoom afterwards is left alone.
  useEffect(() => {
    if (!(isPlacesView && placesTab === 'routes') || openRouteId) return;
    if (!routes.lines.length || !mapRef.current || !window.google?.maps?.LatLngBounds) return;
    if (routesOverviewFitted.current[routeKind]) return;
    const bounds = new window.google.maps.LatLngBounds();
    let any = false;
    for (const line of routes.lines)
      for (const segment of line.segments || [])
        for (const point of segment) {
          bounds.extend(point);
          any = true;
        }
    if (!any) return;
    mapRef.current.fitBounds(bounds, { top: 80, right: 380, bottom: 80, left: 80 });
    routesOverviewFitted.current[routeKind] = true;
  }, [isPlacesView, placesTab, routeKind, openRouteId, routes.lines, mapRef]);
  const closeRoute = useCallback(() => {
    setOpenRouteId(null);
    setRouteDetail(null);
    const camera = routeOverviewCamera.current;
    if (camera && mapRef.current) mapRef.current.moveCamera(camera);
    routeOverviewCamera.current = null;
  }, [mapRef]);

  const changeRouteKind = (kind) => {
    if (savingDraft) return;
    closeRoute();
    setSearchQuery('');
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('routeView', kind === 'delivery' ? 'deliveries' : 'movements');
      return next;
    });
  };

  const changePlacesTab = (tab) => {
    if (savingDraft) return;
    reviewBeforeFence.current = null;
    setReviewSite(null);
    setPlaceDraft(null);
    setZoneDraft(null);
    setMapClick(null);
    trackPlaces.selectPlace(null);
    closeRoute();
    setPlacesTab(tab);
    setSearchQuery('');
  };

  // Escape dismisses only the topmost local panel. Confirmation dialogs and
  // popovers get first refusal; saving an answer must not hide its result.
  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || savingDraft) return;
      const overlay = event.target?.closest?.(
        '[role="dialog"], [role="alertdialog"], [role="menu"]',
      );
      if (
        overlay &&
        ![
          'Make this a place',
          'Alert zone here',
          'Edit place',
          'Edit saved place',
          'Route detail',
        ].includes(overlay.getAttribute('aria-label'))
      )
        return;
      if (zoneDraft) closeZoneDraft();
      else if (placeDraft) setPlaceDraft(null);
      else if (reviewSite) setReviewSite(null);
      else if (openRouteId) closeRoute();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [savingDraft, zoneDraft, placeDraft, reviewSite, openRouteId, closeZoneDraft, closeRoute]);
  const selectTrackPlace = trackPlaces.selectPlace;
  const handleRoutePick = useCallback(
    (id) => {
      if (!routeOverviewCamera.current && mapRef.current) {
        routeOverviewCamera.current = {
          center: mapRef.current.getCenter().toJSON(),
          zoom: mapRef.current.getZoom(),
        };
      }
      setRouteDetail(null);
      setOpenRouteId(id);
      setReviewSite(null);
      selectTrackPlace(null);
      setMapClick(null);
      setPlaceDraft(null);
      setZoneDraft(null);
      setPlacesTab('routes');
      setIsRailOpen(true);
    },
    [mapRef, selectTrackPlace, setPlacesTab],
  );

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
    [vehicles, setSelectedId],
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
    enabled: !isTrackMode && !replayState.on && !isPlacesView,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.defaultPrevented ||
        e.target?.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')
      )
        return;
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setIsRailOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
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
        if (openRouteId) {
          closeRoute();
          return;
        }
        if (replayState.on) exitReplay();
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replayState.on, exitReplay, isTrackMode, trackMode, openRouteId, closeRoute, setSelectedId]);

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
          view={isPlacesView ? 'places' : 'live'}
          onViewChange={changeView}
          viewSwitchDisabled={savingDraft}
          isLiveLoading={isLiveLoading}
          statusCards={statusCards}
          filter={filter}
          setFilter={setFilter}
          handleRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          manufacturers={manufacturers}
          manufacturerCounts={Object.fromEntries(
            manufacturers
              .map((name) => [name, vehicles.filter((v) => v.manufacturer === name).length])
              .concat([['Unclassified', vehicles.filter((v) => !v.manufacturer).length]]),
          )}
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
              passiveTrail={passiveTrail}
              whereNext={
                whereNext?.registrationNumber === activeVehicle?.plate &&
                !isTrackMode &&
                !replayState.on
                  ? whereNext
                  : null
              }
              whereNextPosition={activeVehicle}
              isLoaded={isLoaded}
              loadError={loadError}
              mapZoom={mapZoom}
              setMapZoom={setMapZoom}
              onMapLoad={onMapLoad}
              onMapIdle={onMapIdle}
              mapRef={mapRef}
              mapOptions={mapOptions}
              mapVehicles={
                isTrackMode
                  ? []
                  : isPlacesView
                    ? isVehiclePlaces && selectedVehicle
                      ? [selectedVehicle]
                      : []
                    : mapVehicles
              }
              selectedId={activeSelectedId}
              setSelectedId={setSelectedId}
              setIsRailOpen={setIsRailOpen}
              isTrailVisible={!isTrackMode && !isVehiclePlaces && isTrailVisible}
              trailCoords={trailCoords}
              roadTrail={roadTrail}
              selectedStatusColor={selectedStatusColor}
              replayState={
                isTrackMode || isVehiclePlaces ? { ...replayState, on: false } : replayState
              }
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
              places={showPlaceLayers && layerSelection.ourPlaces ? trackPlaces.shownPlaces : []}
              extraPlaces={showPlaceLayers ? mapPlaces.items : []}
              selectedPlaceId={trackPlaces.selectedPlace?.id ?? null}
              onSelectPlace={selectPlaceFromMap}
              placesDark={theme === 'dark' && mapMode !== 'sat'}
              isTrafficOn={isTrafficOn}
              map={mapRef.current}
              track={isTrackMode || isVehiclePlaces ? trackMode.track : null}
              trackPlayheadTime={isTrackMode ? trackMode.playheadTime : null}
              trackRoad={isTrackMode || isVehiclePlaces ? trackMode.roadTrail : null}
              trackTolls={isTrackMode ? trackMode.tolls : null}
              trackReg={contextReg}
              trackReplay={isTrackMode}
              placesPanelOpen={isPlacesView && !isVehiclePlaces && placesPanelOpen}
              reviewItems={showPlaceLayers && layerSelection.reviewQueue ? reviewQueue.items : []}
              tollPlazas={showPlaceLayers && layerSelection.tolls ? tolls.plazas : []}
              selectedReviewId={reviewSite?._id ?? null}
              onSelectReviewSite={selectReviewSite}
              idlingRows={showPlaceLayers && layerSelection.idling ? idlingRows : []}
              onSelectIdling={selectIdlingRow}
              focusedRoute={focusedRoute}
              routeKind={routeKind}
              routeLines={focusedRoute ? [] : routes.lines}
              routeSites={routes.sites}
              onPickRoute={handleRoutePick}
              draft={placeDraft || zoneDraft}
              onDraftChange={placeDraft ? changePlaceDraft : changeZoneDraft}
              onDraftMapClick={(point) => {
                if (savingDraft || !point) return;
                if (zoneDraft?.shape === 'polygon') {
                  setZoneDraft((current) =>
                    current && !current.polygonDone
                      ? { ...current, polygon: [...current.polygon, point] }
                      : current,
                  );
                } else if (placeDraft) changePlaceDraft({ center: point });
                else if (zoneDraft) changeZoneDraft({ center: point });
              }}
            />

            {/* A click on the map is an offer: make it a place, watch it as a
                zone, or open it in Google Maps. */}
            <TrackClickMenu
              click={mapClick}
              canEdit={canEditPlacesHere}
              canCreateZone={canCreateZoneHere}
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
                backLabel={reviewBeforeFence.current ? 'Back to place' : 'Back to map'}
                draft={zoneDraft}
                errors={draftError ? zoneErrors : {}}
                error={draftError}
                saving={savingDraft}
                onChange={changeZoneDraft}
                onKind={changeZoneDraft}
                onPick={(loc) => focusPlace({ lat: loc?.lat, lng: loc?.lng })}
                onCancel={savingDraft ? undefined : closeZoneDraft}
                onSave={saveZoneDraft}
              />
            ) : null}

            {openRouteId && !isPlacesView ? (
              <TrackRouteDetailPanel
                id={openRouteId}
                leg={routes.legs.find((leg) => String(leg._id) === String(openRouteId))}
                onClose={() => setOpenRouteId(null)}
              />
            ) : null}

            {isPlacesView && !isVehiclePlaces && !placeDraft && !zoneDraft ? (
              <TrackMapKey
                tab={placesTab}
                places={showPlaceLayers && layerSelection.ourPlaces ? trackPlaces.shownPlaces : []}
                reviewCount={
                  showPlaceLayers && layerSelection.reviewQueue ? reviewQueue.items.length : 0
                }
                idlingCount={showPlaceLayers && layerSelection.idling ? idlingRows.length : 0}
                tollCount={showPlaceLayers && layerSelection.tolls ? tolls.plazas.length : 0}
                routeLines={focusedRoute ? [] : routes.lines}
                routeKind={routeKind}
              />
            ) : null}

            {/* Floating controls: the search, live telemetry and the legend
                (which IS the filter) down the left; traffic at the top-right.
                MapOverlayControls owns the corners so nothing overlaps. */}
            {focusedRoute ? (
              <div className="lt-route-focus-bar">
                <span className="lt-route-focus-dot" />
                <span>Selected route</span>
              </div>
            ) : null}
            <MapOverlayControls
              listLabel={
                isPlacesView
                  ? placesTab === 'routes'
                    ? 'Routes list'
                    : 'Places list'
                  : 'Fleet list'
              }
              trafficToggle={<TrafficToggle on={isTrafficOn} onToggle={handleToggleTraffic} />}

              legend={
                showPlaceLayers ? (
                  <TrackLegend
                    hideRoutes
                    initialOpen
                    initialPlacesOpen
                    nearbyInfo={mapPlaces}
                    onRetryNearby={mapPlaces.refetch}
                    layerAvailability={layerAvailability.data}
                    availabilityLoading={layerAvailability.loading}
                    ownPlacesCount={trackPlaces.loaded ? trackPlaces.places.length : null}
                    tollInfo={tolls}
                    showAllTolls={showAllTolls}
                    placeScopes={placeScopes}
                    onPlaceScopeChange={(id, scope) => {
                      if (!layerSelection[id]) handleToggleLayer(id);
                      setPlaceScopes((current) => ({ ...current, [id]: scope }));
                    }}
                    onToggleAllTolls={() => {
                      if (!layerSelection.tolls) handleToggleLayer('tolls');
                      setShowAllTolls(!(showAllTolls && layerSelection.tolls));
                    }}
                    layerSelection={layerSelection}
                    onToggleLayer={handleToggleLayer}
                    lastEventAt={lastEventAt}
                    onRefresh={() => {
                      trackPlaces.retry();
                      mapPlaces.refetch();
                      routes.reload();
                      tolls.refresh();
                      layerAvailability.refetch();
                    }}
                    isRefreshing={isRefreshing}
                    zoom={mapZoom}
                    placesNotAvailable={mapPlaces.notAvailable}
                    placesTruncated={mapPlaces.truncated}
                    placesCount={mapPlaces.items.length}
                    tollsError={layerSelection.tolls ? tolls.error : null}
                    onRetryTolls={tolls.refresh}
                    unmatchedRoutes={routes.error ? null : routes.unmatchedCount}
                    liveCounts={{
                      reviewQueue: reviewQueue.count,
                      routes: !layerSelection.routes
                        ? '—'
                        : routes.error
                          ? null
                          : routes.lines.length,
                      idling: idlingError ? null : idlingRows.length,
                    }}
                  />
                ) : null
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
              isTrackMode={isTrackMode && !isVehiclePlaces}
              trackFrom={trackMode.from}
              trackTo={trackMode.to}
              onApplyTrackRange={(range) => trackMode.applyRange(range)}
            />

            {/* Track mode: the timeline at the bottom of the map. */}
            {isTrackMode ? (
              <TrackTimeline
                track={trackMode.track}
                points={trackMode.points}
                playheadIndex={trackMode.playheadIndex}
                playheadTime={trackMode.playheadTime}
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
                onSeekToTime={(time) => trackMode.seekToTime(time)}
                onExit={trackMode.exitTrackMode}
                from={trackMode.from}
                to={trackMode.to}
                tollStatus={
                  <TrackTollStatus
                    compact
                    data={trackMode.tolls}
                    loading={trackMode.tollsLoading}
                    error={trackMode.tollsError}
                    onRetry={trackMode.retryTolls}
                    playheadTime={trackMode.playheadTime}
                  />
                }
              />
            ) : null}
          </div>

          {/* Right Rail: the trip log in Track mode, the fleet and places otherwise */}
          <aside className="rail">
            {!focusedRoute ? (
              <div className="lt-panel-search">
                <MapSearchBox
                  placement="panel"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  inputRef={searchInputRef}
                  placeholder={
                    isPlacesView
                      ? placesTab === 'routes'
                        ? 'Search routes'
                        : 'Search places'
                      : isTrackMode
                        ? 'Search journey'
                        : 'Search vehicles'
                  }
                />
              </div>
            ) : null}
            {contextReg ? (
              <div className="lt-vehicle-context">
                <div>
                  <strong>{contextReg}</strong>
                  <span>{isTrackMode ? 'Replay' : 'Selected vehicle'}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => {
                    trackMode.setIsPlaying(false);
                    exitReplay();
                    setSelectedIdState(null);
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current);
                      ['v', 'vehicle', 'from', 'to', 'at'].forEach((key) => next.delete(key));
                      return next;
                    });
                  }}
                >
                  Clear vehicle
                </button>
                {isVehiclePlaces ? (
                  <div className="lt-vehicle-period">
                    <span>
                      {formatIst(trackMode.from, { withDate: true })} –{' '}
                      {formatIst(trackMode.to, { withDate: true })}
                    </span>
                    <TrackRangePicker
                      key={`${toIso(trackMode.from)}:${toIso(trackMode.to)}`}
                      from={trackMode.from}
                      to={trackMode.to}
                      onApply={trackMode.applyRange}
                      trigger={
                        <button
                          type="button"
                          className="lt-journey-range"
                          aria-label="Change journey date range"
                        >
                          Range
                        </button>
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            {isTrackMode && !isPlacesView ? (
              <>
                <div className="track-rail-header">
                  <button
                    type="button"
                    className="track-rail-back"
                    onClick={trackMode.exitTrackMode}
                    aria-label="Back to vehicle"
                    title="Back to vehicle"
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
                      query={searchQuery}
                      track={trackMode.track}
                      points={trackMode.points}
                      playheadTime={trackMode.playheadTime}
                      playheadIndex={trackMode.playheadIndex}
                      isPlaying={trackMode.isPlaying}
                      onSeek={(at) => trackMode.seekToTime(new Date(at))}
                      onOpenPlace={openJourneyPlace}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                {isPlacesView ? (
                  <div className="rail-tabs" role="tablist" aria-label="Places and routes">
                    <button
                      type="button"
                      role="tab"
                      className="rail-tab"
                      disabled={savingDraft}
                      aria-selected={placesTab === 'places'}
                      onClick={() => changePlacesTab('places')}
                    >
                      Places
                    </button>
                    <button
                      type="button"
                      role="tab"
                      className="rail-tab"
                      disabled={savingDraft}
                      aria-selected={placesTab === 'routes'}
                      onClick={() => changePlacesTab('routes')}
                    >
                      Routes
                    </button>
                  </div>
                ) : null}
                {isPlacesView &&
                  !isVehiclePlaces &&
                  placesTab === 'routes' &&
                  deliveryRoutesEnabled && (
                    <nav className="rail-tabs lt-route-modes" aria-label="Route types">
                      <button
                        type="button"
                        className="rail-tab"
                        aria-pressed={routeKind === 'delivery'}
                        onClick={() => changeRouteKind('delivery')}
                      >
                        Delivery routes
                      </button>
                      <button
                        type="button"
                        className="rail-tab"
                        aria-pressed={routeKind === 'movement'}
                        onClick={() => changeRouteKind('movement')}
                      >
                        All movements
                      </button>
                    </nav>
                  )}
                <div className="rail-body">
                  {!isPlacesView && railTab === 'fleet' ? (
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
                          activeVehicle
                            ? (idlingByPlate.get(plateKey(activeVehicle.plate)) ?? null)
                            : null
                        }
                        vehicleAlerts={
                          activeVehicle ? alertsForVehicle(alerts, activeVehicle.plate) : []
                        }
                        showIntent={activeVehicle ? hasIntentFor(activeVehicle.plate) : false}
                        knownEtas={knownEtas}
                        canEditPlaces={canEditPlacesHere}
                        onAddAtSpot={handleAddAtSpot}
                      />
                    </>
                  ) : isVehiclePlaces ? (
                    <VehicleJourneyPanel
                      journey={trackMode}
                      onOpenPlace={openJourneyPlace}
                      tab={placesTab}
                      query={searchQuery}
                      onSeek={isTrackMode ? trackMode.seekToTime : undefined}
                      onFocus={(row) => {
                        const map = mapRef.current;
                        if (row.path?.length > 1 && map && window.google?.maps?.LatLngBounds) {
                          const bounds = new window.google.maps.LatLngBounds();
                          row.path.forEach((point) =>
                            bounds.extend({ lat: point.lat, lng: point.lng }),
                          );
                          map.fitBounds(bounds, 80);
                        } else if (Number.isFinite(row.lat) && Number.isFinite(row.lng))
                          focusPlace(row);
                      }}
                    />
                  ) : isPlacesView && placesTab === 'routes' ? (
                    <>
                      {openRouteId ? (
                        <TrackRouteDetailPanel
                          key={`${routeKind}:${openRouteId}`}
                          docked
                          kind={routeKind}
                          showSap={
                            isEnabled('sapV2') && ['OWNER', 'MANAGER'].includes(getUserRole())
                          }
                          id={openRouteId}
                          leg={selectedRoute}
                          focus={focusedRoute}
                          onDetail={setRouteDetail}
                          onClose={closeRoute}
                        />
                      ) : (
                        <RoutesListView
                          routes={routes}
                          kind={routeKind}
                          query={searchQuery}
                          selectedId={openRouteId}
                          onPick={handleRoutePick}
                          onHide={() => {
                            setIsRailOpen(false);
                            setTimeout(triggerMapResize, 240);
                          }}
                        />
                      )}
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
                        onEditPlace={canEditPlacesHere ? editSavedPlace : undefined}
                        onEditFence={canEditPlacesHere ? editFenceForSite : undefined}
                      />
                    </>
                  )}

                  {/* A place nobody has answered for yet. */}
                  <TrackReviewPanel
                    backLabel={isPlacesView ? 'Back to places' : 'Back to fleet'}
                    site={reviewSite}
                    onAnswered={handleSiteAnswered}
                    onEditPlace={(site) => setEditingPlace(fromSite(site))}
                    onEditFence={editFenceForSite}
                    onClose={() => {
                      fenceRequest.current += 1;
                      setReviewSite(null);
                    }}
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

      {identifyingStop ? (
        <IdentifyJourneyPlaceDialog
          key={identifyingStop.stopId || identifyingStop.fixAt}
          registrationNumber={contextReg}
          stop={identifyingStop}
          onClose={() => setIdentifyingStop(null)}
          onSaved={() => {
            setIdentifyingStop(null);
            trackMode.refetch();
            trackPlaces.retry?.();
            reviewQueue.reload();
            showToast('Place saved. Refreshing this journey…');
          }}
        />
      ) : null}
      {journeyPlace ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              journeyPlaceRequest.current += 1;
              setJourneyPlace(null);
            }
          }}
        >
          <DialogContent
            className="lt-journey-place-dialog"
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DialogTitle className="sr-only" render={<span />}>
              {journeyPlace.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Place details. A nearby landmark does not indicate a recorded visit.
            </DialogDescription>
            <PlaceDetailPanel
              place={journeyPlace}
              backLabel="Back to journey"
              vehicles={vehicles}
              onBack={() => {
                journeyPlaceRequest.current += 1;
                setJourneyPlace(null);
              }}
              onPickVehicle={(id) => {
                setJourneyPlace(null);
                pickVehicleFromPlace(id);
              }}
              onEditPlace={
                canEditPlacesHere
                  ? (place) => {
                      setJourneyPlace(null);
                      setEditingPlace(place);
                    }
                  : undefined
              }
              onEditFence={
                canEditPlacesHere
                  ? (place) => {
                      setJourneyPlace(null);
                      editFenceForSite(place);
                    }
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {editingPlace ? (
        <EditPlaceDialog
          key={editingPlace.id}
          place={editingPlace}
          onClose={() => setEditingPlace(null)}
          onEditFence={editFenceForSite}
          onSaved={() => {
            setEditingPlace(null);
            setReviewSite(null);
            trackPlaces.retry?.();
            reviewQueue.reload();
            if (contextReg) trackMode.refetch();
            showToast('Place changes saved');
          }}
        />
      ) : null}

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
