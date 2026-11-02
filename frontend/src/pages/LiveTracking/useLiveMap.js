import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService';
import { decodePolyline6 } from '../../lib/polyline6';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from './mapStyles.js';
import useTrailGeometry from './useTrailGeometry.js';
import useTrackReplay from './useTrackReplay.js';
import useTrailHistory from './useTrailHistory.js';

/* Map viewport, trail layers and replay share the same map instance. */
export default function useLiveMap({
  theme,
  mapMode,
  vehicles,
  selectedId,
  selectedVehicle,
  showToast,
}) {
  // Trail & Replay state
  const [trailLoading, setTrailLoading] = useState(false);
  const [isTrailVisible, setIsTrailVisible] = useState(false);
  const [trailPoints, setTrailPoints] = useState([]);
  // Raw trail payload, kept so useTrailGeometry can split per trip / recognise breaks.
  const [rawTrailPoints, setRawTrailPoints] = useState([]);
  // Trip metadata from the trail endpoint (tripId -> { number, origin, destination, distance }).
  const [trips, setTrips] = useState([]);
  // Plan stops (origin / destination) lifted from the trail response.
  const [planStops, setPlanStops] = useState([]);
  const [roadTrail, setRoadTrail] = useState(null); // road geometry from our engine (plan P4.10)

  // Habitual halts are independent of the current trail.
  const [habitualHalts, setHabitualHalts] = useState([]);
  const [habitualHaltsLoading, setHabitualHaltsLoading] = useState(false);
  const [isHabitualHaltsVisible, setIsHabitualHaltsVisible] = useState(false);
  const [habitualHaltsLoadedFor, setHabitualHaltsLoadedFor] = useState(null);
  // Per-trip colours are enabled by default.
  const [segmentByTrip, setSegmentByTrip] = useState(true);

  // Use this org's road edges; pooled congestion needs three contributing orgs.
  const [congestion, setCongestion] = useState(null);
  const [congestionLoading, setCongestionLoading] = useState(false);
  const [isCongestionVisible, setIsCongestionVisible] = useState(false);
  const [congestionNotice, setCongestionNotice] = useState('');

  const toggleCongestion = useCallback(
    async (v = true) => {
      if (isCongestionVisible && v !== true) {
        setIsCongestionVisible(false);
        return;
      }
      if (congestion) {
        setIsCongestionVisible(true);
        return;
      }
      setCongestionLoading(true);
      try {
        const data = await RoadService.getOrgCongestionIfEnabled({ live: true, limit: 400 });
        if (!data) {
          setCongestionNotice(
            'The road engine is off, so there is no road-matched traffic to draw.',
          );
          setCongestion({ rows: [], coverage: null });
          setIsCongestionVisible(true);
          return;
        }
        setCongestion({ rows: data.rows || [], coverage: data.coverage || null });
        setIsCongestionVisible(true);
        const live = data.coverage?.live;
        if (live) {
          setCongestionNotice(
            `Live crossings in the last ${live.windowMin} min: ${live.crossings} on ${live.edgesLive} shown edge(s).`,
          );
        }
        fitToCongestion(data.rows || []);
      } finally {
        setCongestionLoading(false);
      }
    },
    [congestion, isCongestionVisible],
  );

  // Frame congestion when its geometry first arrives.
  function fitToCongestion(rows) {
    if (!mapRef.current || !window.google) return;
    const withGeom = rows.filter((r) => r.geom).slice(0, 400);
    if (!withGeom.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    withGeom.forEach((r) => decodePolyline6(r.geom).forEach((p) => bounds.extend(p)));
    mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
  }

  const [mapZoom, setMapZoom] = useState(12);

  // Map & interaction refs
  const mapRef = useRef(null);
  const didAutoFitRef = useRef(false);
  // Zoom once per selection, so live updates preserve the user's zoom.
  const zoomedSelectionRef = useRef(null);
  const trailHistory = useTrailHistory({
    selectedId,
    mapRef,
    showToast,
    setTrailLoading,
    setTrailPoints,
    setRawTrailPoints,
    setTrips,
    setPlanStops,
    setRoadTrail,
    setIsTrailVisible,
  });
  const { replayState, setReplayState, enterReplay, exitReplay } = useTrackReplay({
    trailSelection: trailHistory.selection,
    beforeLoad: trailHistory.cancel,
    selectedId,
    mapRef,
    showToast,
    setTrailLoading,
    setTrailPoints,
    setRawTrailPoints,
    setTrips,
    setPlanStops,
    setRoadTrail,
    setIsTrailVisible,
  });

  /* ---------------- Google Map Configuration & State ---------------- */
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      mapTypeId: mapMode === 'sat' ? 'satellite' : 'roadmap',
      gestureHandling: 'greedy',
    }),
    [theme, mapMode],
  );

  // Sync MapTypeId dynamically
  useEffect(() => {
    if (mapRef.current && window.google) {
      mapRef.current.setMapTypeId(mapMode === 'sat' ? 'satellite' : 'roadmap');
    }
  }, [mapMode]);

  // Fit GPS-live vehicles, with a zoom cap for tightly clustered fleets.
  const fitToLiveVehicles = useCallback(
    (map) => {
      if (!map || !window.google) return false;
      const live = vehicles.filter((v) => v.live && v.hasFix);
      if (!live.length) return false;
      const bounds = new window.google.maps.LatLngBounds();
      live.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        // Land a little closer than a bare fit — one notch in, capped so a tight
        // cluster doesn't rocket to street level and a spread fleet still nudges in.
        const z = map.getZoom() || 6;
        map.setZoom(Math.min(z + 1, 13));
      });
      return true;
    },
    [vehicles],
  );

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      const initialZ = map.getZoom();
      if (typeof initialZ === 'number') {
        setMapZoom(initialZ);
      }
      map.addListener('zoom_changed', () => {
        const z = map.getZoom();
        if (typeof z === 'number') {
          setMapZoom(z);
        }
      });
      // Try fitting to live vehicles immediately; if positions haven't loaded
      // yet, the auto-fit effect below handles it once they arrive.
      if (fitToLiveVehicles(map)) {
        didAutoFitRef.current = true;
      }
    },
    [fitToLiveVehicles],
  );

  // Frame the live fleet once its first positions arrive.
  useEffect(() => {
    if (didAutoFitRef.current || !mapRef.current || selectedId) return;
    if (fitToLiveVehicles(mapRef.current)) {
      didAutoFitRef.current = true;
    }
  }, [fitToLiveVehicles, selectedId]);

  // Pan / focus when selected vehicle changes
  useEffect(() => {
    if (
      replayState.on ||
      isTrailVisible ||
      !selectedVehicle ||
      !selectedVehicle.hasFix ||
      !mapRef.current
    )
      return;
    const map = mapRef.current;
    const center = { lat: selectedVehicle.lat, lng: selectedVehicle.lng };
    if (zoomedSelectionRef.current === selectedVehicle.id) {
      // Live update of the truck we're already following: glide along.
      map.panTo(center);
      return;
    }
    // A NEW vehicle was picked: recenter on it in one camera move. panTo +
    // setZoom must not be paired here — setZoom cancels panTo's animation, so
    // the map zoomed in on the previous spot and seemed to "stay there".
    // Never zoom back out if the user is already closer in.
    zoomedSelectionRef.current = selectedVehicle.id;
    const zoom = Math.max(map.getZoom() || 5, 14);
    if (typeof map.moveCamera === 'function') {
      map.moveCamera({ center, zoom });
    } else {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [selectedVehicle, replayState.on, isTrailVisible]);

  // Clearing the selection re-arms the gentle zoom, so re-picking the same
  // vehicle later zooms in again.
  useEffect(() => {
    if (!selectedId) zoomedSelectionRef.current = null;
  }, [selectedId]);

  const {
    selectedStatusColor,
    trailCoords,
    trailKm,
    trailSegments,
    tripLegend,
    fallbackSingleColor,
    replayPtsCoords,
    replayCurrentPos,
    replayCurrentTs,
    replayRunPaths,
    replayRoadLayers,
    replayBaseLayers,
    replaySpeed,
  } = useTrailGeometry({
    selectedVehicle,
    trailPoints,
    rawTrailPoints,
    trips,
    replayState,
    roadTrail,
  });

  // Cache habitual halts for the selected plate.
  const loadHabitualHalts = useCallback(
    async (plate) => {
      if (!plate) return;
      if (habitualHaltsLoadedFor === plate && habitualHalts.length > 0) return;
      setHabitualHaltsLoading(true);
      try {
        const data = await LiveTrackingService.getHabitualHalts(plate);
        const records = data?.records ?? data?.data?.records ?? [];
        setHabitualHalts(Array.isArray(records) ? records : []);
        setHabitualHaltsLoadedFor(plate);
      } catch {
        setHabitualHalts([]);
        setHabitualHaltsLoadedFor(plate);
      } finally {
        setHabitualHaltsLoading(false);
      }
    },
    [habitualHaltsLoadedFor, habitualHalts.length],
  );

  // A different vehicle needs its own halts.
  useEffect(() => {
    setHabitualHaltsLoadedFor(null);
    setHabitualHalts([]);
    setIsHabitualHaltsVisible(false);
  }, [selectedId]);

  const toggleHabitualHalts = useCallback(
    async (v) => {
      if (isHabitualHaltsVisible) {
        setIsHabitualHaltsVisible(false);
        return;
      }
      if (!v?.plate) return;
      await loadHabitualHalts(v.plate);
      setIsHabitualHaltsVisible(true);
    },
    [isHabitualHaltsVisible, loadHabitualHalts],
  );

  const toggleTrail = useCallback(
    async (vehicle) => {
      if (isTrailVisible && !replayState.on) {
        trailHistory.hide();
        return;
      }
      if (replayState.on) exitReplay();
      await trailHistory.load(vehicle);
    },
    [isTrailVisible, replayState.on, exitReplay, trailHistory],
  );

  // Zoom In / Out
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || 5) + 1);
  }, []);
  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || 5) - 1);
  }, []);

  const triggerMapResize = useCallback(() => {
    if (mapRef.current && window.google) {
      window.google.maps.event.trigger(mapRef.current, 'resize');
    }
  }, []);

  return {
    mapRef,
    mapZoom,
    setMapZoom,
    mapOptions,
    onMapLoad,
    trailLoading,
    isTrailVisible,
    trailPoints,
    rawTrailPoints,
    trips,
    planStops,
    trailSegments,
    tripLegend,
    fallbackSingleColor,
    roadTrail,
    replayState,
    setReplayState,
    selectedStatusColor,
    trailCoords,
    trailKm,
    replayPtsCoords,
    replayCurrentPos,
    replayCurrentTs,
    replayRunPaths,
    replayRoadLayers,
    replayBaseLayers,
    replaySpeed,
    toggleTrail,
    trailSelection: trailHistory.selection,
    trailNotice: trailHistory.notice,
    loadTrail: trailHistory.load,
    enterReplay,
    exitReplay,
    handleZoomIn,
    handleZoomOut,
    triggerMapResize,
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
  };
}
