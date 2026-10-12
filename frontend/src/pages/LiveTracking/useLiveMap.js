import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService';
import { summaryOf } from '../../lib/roadTrail';
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
  const [roadTrail, setRoadTrail] = useState(null); // road geometry from our engine (plan P4.10)
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
    replayPtsCoords,
    replayCurrentPos,
    replayRunPath,
    replayBearing,
  } = useTrailGeometry({ selectedVehicle, trailPoints, replayState });

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

  // Toggle breadcrumb trail
  const toggleTrail = useCallback(
    async (v) => {
      if (isTrailVisible && !replayState.on) {
        setIsTrailVisible(false);
        setTrailPoints([]);
        setRoadTrail(null);
        return;
      }

      if (replayState.on) {
        setReplayState((prev) => ({ ...prev, on: false, playing: false }));
      }

      setTrailLoading(true);
      let points = [];

      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          points = trailData.points
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => [p.latitude, p.longitude]);
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
      setIsTrailVisible(true);

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
      }
      const roadSummary = summaryOf(road);
      showToast(
        roadSummary
          ? `Trail · ${roadSummary.km.toFixed(1)} km ${roadSummary.label} · ${points.length} points`
          : `Trail · ${trailDistanceKm(points).toFixed(1)} km straight-line estimate · ${points.length} points`,
      );
    },
    [isTrailVisible, replayState.on, showToast],
  );

  // Enter Replay
  const enterReplay = useCallback(
    async (v) => {
      let points = [];
      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          points = trailData.points
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => [p.latitude, p.longitude]);
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
  };
}
