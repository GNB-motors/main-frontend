import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService.js';
import { PLAYBACK_BASE_SEC } from '../RouteHub/views/replay/replayConstants.js';
import liveReplay from './liveReplay.js';
import trailDateWindow from './trailDateWindow.js';

const initialState = () => ({ on: false, playing: false, t: 0, speed: 4, pts: null });

export default function useTrackReplay({
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
  trailSelection,
  beforeLoad,
}) {
  const [replayState, setReplayState] = useState(initialState);
  const requestRef = useRef(null);
  const sessionRef = useRef(null);
  const replayRef = useRef(replayState);
  replayRef.current = replayState;

  const exitReplay = useCallback(() => {
    requestRef.current?.abort();
    sessionRef.current = null;
    setReplayState(initialState());
    setTrailLoading(false);
    setIsTrailVisible(false);
    setRoadTrail(null);
  }, [setTrailLoading, setIsTrailVisible, setRoadTrail]);

  useEffect(() => {
    // A replay belongs to one selection; late responses must not replace another vehicle's route.
    exitReplay();
    setTrailPoints([]);
    setRawTrailPoints([]);
    setTrips([]);
    setPlanStops([]);
    return () => requestRef.current?.abort();
  }, [selectedId, exitReplay, setTrailPoints, setRawTrailPoints, setTrips, setPlanStops]);

  useEffect(() => {
    if (!replayState.on || !replayState.playing || replayState.pts?.length < 2) return undefined;
    let raf;
    let last = null;
    const tick = (now) => {
      const dt = last == null ? 0 : (now - last) / 1000;
      last = now;
      setReplayState((prev) => {
        if (!prev.on || !prev.playing) return prev;
        const t = Math.min(1, prev.t + (dt * prev.speed) / PLAYBACK_BASE_SEC);
        return { ...prev, t, playing: t < 1 };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [replayState.on, replayState.playing, replayState.speed, replayState.pts]);

  const enterReplay = useCallback(
    async (vehicle) => {
      const session = sessionRef.current;
      const selectionKey = trailDateWindow.key(trailSelection);
      // Replay opens the player; repeated clicks must not reload it or briefly activate Trail.
      if (
        session?.plate === vehicle.plate &&
        session.selectionKey === selectionKey &&
        (session.loading || replayRef.current.on)
      )
        return;
      beforeLoad?.();
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      sessionRef.current = { plate: vehicle.plate, selectionKey, loading: true };
      const { signal } = controller;
      setReplayState(initialState());
      setTrailLoading(true);
      try {
        const trailWindow = trailDateWindow.resolve(trailSelection);
        const trail = await LiveTrackingService.getTrail(
          vehicle.plate,
          // Same cap as Trail, so Trail and Replay of one day show the same path (DC-24).
          { ...trailWindow, limit: 10000 },
          { signal },
        );
        if (signal.aborted) return;
        const model = liveReplay.build(trail.points);
        if (model.fixes.length < 2) {
          showToast('No recorded trail to replay for this vehicle');
          return;
        }
        const road = await RoadService.getRoadTrailIfEnabled(vehicle.plate, trailWindow, signal);
        if (signal.aborted) return;
        setRawTrailPoints(model.fixes);
        setTrailPoints(model.pts);
        setTrips(Array.isArray(trail.trips) ? trail.trips : []);
        setPlanStops(Array.isArray(trail.planStops) ? trail.planStops : []);
        setRoadTrail(road);
        setIsTrailVisible(true);
        setReplayState({
          on: true,
          playing: true,
          t: 0,
          speed: 4,
          pts: model.pts,
          truncated: Boolean(trail.truncated),
          totalCount: trail.totalCount ?? null,
        });
        if (mapRef.current && window.google) {
          const bounds = new window.google.maps.LatLngBounds();
          model.pts.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
          mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 170, left: 70 });
        }
      } catch {
        if (!signal.aborted) showToast(`Could not load replay for ${vehicle.plate}`);
      } finally {
        if (!signal.aborted) {
          sessionRef.current.loading = false;
          setTrailLoading(false);
        }
      }
    },
    [
      mapRef,
      showToast,
      setTrailLoading,
      setRawTrailPoints,
      setTrailPoints,
      setTrips,
      setPlanStops,
      setRoadTrail,
      setIsTrailVisible,
      trailSelection,
      beforeLoad,
    ],
  );

  return { replayState, setReplayState, enterReplay, exitReplay };
}
