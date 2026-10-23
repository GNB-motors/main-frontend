import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService';
import { summaryOf } from '../../lib/roadTrail';
import { decodePolyline6 } from '../../lib/polyline6';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from './mapStyles.js';
import trailDistanceKm from './trailDistanceKm.js';
import useTrailGeometry from './useTrailGeometry.js';

/* Everything that drives the map instance: viewport fitting/zoom, the breadcrumb
   trail and trip replay. Kept in one hook because they all share mapRef and the
   trail/replay setters. */
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

  // Habitual halts (places/hub) layer state — server-side aggregated halt
  // clusters. Independent of the trail so the user can keep it on while
  // replaying a different vehicle.
  const [habitualHalts, setHabitualHalts] = useState([]);
  const [habitualHaltsLoading, setHabitualHaltsLoading] = useState(false);
  const [isHabitualHaltsVisible, setIsHabitualHaltsVisible] = useState(false);
  const [habitualHaltsLoadedFor, setHabitualHaltsLoadedFor] = useState(null);
  // Trip-breaks toggle (defaults on so the per-trip polyline split is
  // visible — flipping it off is for power users who want the legacy
  // single polyline).
  const [segmentByTrip, setSegmentByTrip] = useState(true);

  // Congestion layer (00_PLAN.md item 5): this org's OWN road-matched edges,
  // coloured against the boundary the nightly job learned for each road class,
  // region and IST hour. Not the pooled list — that one needs three contributing
  // orgs to publish and stays empty on a single-org deployment. Independent of the
  // trail, so it can stay on while a different vehicle is replayed.
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
          setCongestionNotice('The road engine is off, so there is no road-matched traffic to draw.');
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

  /* Frame the layer once, when it first has geometry. Declared before the return
     so the toggle callback above can call it. */
  function fitToCongestion(rows) {
    if (!mapRef.current || !window.google) return;
    const withGeom = rows.filter((r) => r.geom).slice(0, 400);
    if (!withGeom.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    withGeom.forEach((r) => decodePolyline6(r.geom).forEach((p) => bounds.extend(p)));
    mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
  }

  const [replayState, setReplayState] = useState({
    on: false,
    playing: false,
    t: 0,
    speed: 4,
    pts: null,
  });
  const [mapZoom, setMapZoom] = useState(12);

  // Map & interaction refs
  const mapRef = useRef(null);
  const didAutoFitRef = useRef(false);
  // Tracks the last vehicle we zoomed to, so the gentle select-zoom fires once
  // per new pick — not on every live position update of the followed vehicle.
  const zoomedSelectionRef = useRef(null);
  const lastReplayTimeRef = useRef(0);

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

  // Callback when Google Map mounts
  // Fit the viewport to the GPS-live vehicles (those with a fix). Clamps the
  // zoom afterwards so a single live vehicle only zooms in "a little" rather
  // than to street level. Returns true if it had something to fit.
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

  // One-time auto-fit to GPS-live vehicles once positions first arrive, so
  // landing on the page frames the moving fleet instead of all of India.
  useEffect(() => {
    if (didAutoFitRef.current || !mapRef.current || selectedId) return;
    if (fitToLiveVehicles(mapRef.current)) {
      didAutoFitRef.current = true;
    }
  }, [fitToLiveVehicles, selectedId]);

  // Pan / focus when selected vehicle changes
  useEffect(() => {
    if (!selectedVehicle || !selectedVehicle.hasFix || !mapRef.current) return;
    const map = mapRef.current;
    map.panTo({ lat: selectedVehicle.lat, lng: selectedVehicle.lng });
    // Gentle zoom-in only when a NEW vehicle is picked — not on every live
    // update of the one we're already following (that would fight the user's
    // own zoom/pan). Never zoom back out if they're already closer in.
    if (zoomedSelectionRef.current !== selectedVehicle.id) {
      if ((map.getZoom() || 5) < 14) map.setZoom(14);
      zoomedSelectionRef.current = selectedVehicle.id;
    }
  }, [selectedVehicle]);

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
    replayRunPath,
    replayBearing,
  } = useTrailGeometry({ selectedVehicle, trailPoints, rawTrailPoints, trips, replayState });

  // Replay animation frame ticker (decoupled from replayState.t so 60fps loop runs smoothly without tearing down)
  useEffect(() => {
    if (!replayState.on || !replayState.playing || !replayState.pts || replayState.pts.length < 2) {
      lastReplayTimeRef.current = 0;
      return;
    }

    let animId;
    const speed = replayState.speed || 1;
    const duration = 24 / speed;

    const step = (ts) => {
      if (!lastReplayTimeRef.current) {
        lastReplayTimeRef.current = ts;
      }
      const dt = (ts - lastReplayTimeRef.current) / 1000;
      lastReplayTimeRef.current = ts;

      setReplayState((prev) => {
        if (!prev.playing) return prev;
        const nextT = prev.t + dt / duration;
        if (nextT >= 1) {
          return { ...prev, t: 1, playing: false };
        }
        return { ...prev, t: nextT };
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [replayState.on, replayState.playing, replayState.speed, replayState.pts]);

  /* Load the habitual-halts (places/hub layer) for a vehicle. Safe to call
     repeatedly — a cache-key check inside short-circuits when the same plate
     was already loaded. */
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

  /* Clear the halts cache when the user picks a different vehicle, so the
     next toggle re-fetches the right plate. */
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

  // Toggle breadcrumb trail
  const toggleTrail = useCallback(
    async (v) => {
      if (isTrailVisible && !replayState.on) {
        setIsTrailVisible(false);
        setTrailPoints([]);
        setRawTrailPoints([]);
        setTrips([]);
        setPlanStops([]);
        setRoadTrail(null);
        return;
      }

      if (replayState.on) {
        setReplayState((prev) => ({ ...prev, on: false, playing: false }));
      }

      setTrailLoading(true);
      let points = [];
      let raw = [];
      let metaTrips = [];
      let metaStops = [];

      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          raw = trailData.points.filter(
            (p) => p.latitude != null && p.longitude != null,
          );
          points = raw.map((p) => [p.latitude, p.longitude]);
          metaTrips = Array.isArray(trailData.trips) ? trailData.trips : [];
          metaStops = Array.isArray(trailData.planStops) ? trailData.planStops : [];
        }
      } catch {
        // Trail is optional; empty-state handled below.
      } finally {
        setTrailLoading(false);
      }

      if (!points || points.length < 2) {
        showToast(`No recorded trail for ${v.plate}`);
        return;
      }

      // Road geometry for the same 24 h window the raw trail uses (backend trailDefaultHours = 24).
      const road = await RoadService.getRoadTrailIfEnabled(v.plate, {
        from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        to: new Date().toISOString(),
      });
      setRoadTrail(road);
      setTrailPoints(points);
      setRawTrailPoints(raw);
      setTrips(metaTrips);
      setPlanStops(metaStops);
      setIsTrailVisible(true);

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
      }
      const roadSummary = summaryOf(road);
      const tripCount = metaTrips.length || new Set(raw.map((p) => p.tripId).filter(Boolean)).size;
      const tripSuffix = tripCount > 0 ? ` · ${tripCount} trip${tripCount === 1 ? '' : 's'}` : '';
      showToast(
        (roadSummary
          ? `Trail · ${roadSummary.km.toFixed(1)} km ${roadSummary.label} · ${points.length} points`
          : `Trail · ${trailDistanceKm(points).toFixed(1)} km straight-line estimate · ${points.length} points`) + tripSuffix,
      );
    },
    [isTrailVisible, replayState.on, showToast],
  );

  // Enter Replay
  const enterReplay = useCallback(
    async (v) => {
      let points = [];
      let raw = [];
      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          raw = trailData.points.filter(
            (p) => p.latitude != null && p.longitude != null,
          );
          points = raw.map((p) => [p.latitude, p.longitude]);
          setRawTrailPoints(raw);
          setTrips(Array.isArray(trailData.trips) ? trailData.trips : []);
          setPlanStops(Array.isArray(trailData.planStops) ? trailData.planStops : []);
        }
      } catch {
        // Trail is optional; empty-state handled below.
      }

      if (!points || points.length < 2) {
        showToast('No recorded trail to replay for this vehicle');
        return;
      }

      setRoadTrail(
        await RoadService.getRoadTrailIfEnabled(v.plate, {
          from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          to: new Date().toISOString(),
        }),
      );
      setTrailPoints(points);
      setReplayState({
        on: true,
        playing: true,
        t: 0,
        speed: 4,
        pts: points,
      });
      setIsTrailVisible(true);

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 170, left: 70 });
      }
    },
    [showToast],
  );

  // Exit Replay
  const exitReplay = useCallback(() => {
    setReplayState({ on: false, playing: false, t: 0, speed: 4, pts: null });
    setIsTrailVisible(false);
    setRoadTrail(null);
  }, []);

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
    replayRunPath,
    replayBearing,
    toggleTrail,
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
