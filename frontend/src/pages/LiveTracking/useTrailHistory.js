import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService.js';
import liveReplay from './liveReplay.js';
import trailDateWindow from './trailDateWindow.js';

export default function useTrailHistory({
  selectedId,
  mapRef,
  showToast,
  setTrailLoading,
  setIsTrailVisible,
  setTrailPoints,
  setRawTrailPoints,
  setTrips,
  setPlanStops,
  setRoadTrail,
}) {
  const [selection, setSelection] = useState({ period: 'today' });
  const [notice, setNotice] = useState('');
  const requestRef = useRef(null);

  const cancel = useCallback(() => requestRef.current?.abort(), []);
  useEffect(() => {
    setNotice('');
    return cancel;
  }, [selectedId, cancel]);

  const clear = useCallback(() => {
    setTrailPoints([]);
    setRawTrailPoints([]);
    setTrips([]);
    setPlanStops([]);
    setRoadTrail(null);
  }, [setTrailPoints, setRawTrailPoints, setTrips, setPlanStops, setRoadTrail]);

  const hide = useCallback(() => {
    cancel();
    clear();
    setNotice('');
    setTrailLoading(false);
    setIsTrailVisible(false);
  }, [cancel, clear, setTrailLoading, setIsTrailVisible]);

  const load = useCallback(
    async (vehicle, nextSelection = selection) => {
      if (!vehicle?.plate) return;
      let trailWindow;
      try {
        trailWindow = trailDateWindow.resolve(nextSelection);
      } catch (error) {
        setNotice(error.message);
        return;
      }
      cancel();
      const controller = new AbortController();
      requestRef.current = controller;
      const { signal } = controller;
      setSelection(nextSelection);
      setNotice('');
      setTrailLoading(true);
      setIsTrailVisible(true);
      // A new date must never leave the previous date's route looking current.
      clear();
      try {
        const data = await LiveTrackingService.getTrail(
          vehicle.plate,
          { ...trailWindow, limit: 10000 },
          { signal },
        );
        if (signal.aborted) return;
        const model = liveReplay.build(data.points);
        if (model.fixes.length < 2) {
          setNotice(`No recorded trail for ${trailDateWindow.label(nextSelection)}.`);
          return;
        }
        const road = await RoadService.getRoadTrailIfEnabled(vehicle.plate, trailWindow, signal);
        if (signal.aborted) return;
        setTrailPoints(model.pts);
        setRawTrailPoints(model.fixes);
        setTrips(Array.isArray(data.trips) ? data.trips : []);
        setPlanStops(Array.isArray(data.planStops) ? data.planStops : []);
        setRoadTrail(road);
        if (data.truncated)
          setNotice('This trail is partial because the position limit was reached.');
        if (mapRef.current && window.google) {
          const bounds = new window.google.maps.LatLngBounds();
          model.pts.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
          mapRef.current.fitBounds(bounds, { top: 140, right: 70, bottom: 70, left: 70 });
        }
        showToast(
          `Trail · ${trailDateWindow.label(nextSelection)} · ${model.pts.length} positions`,
        );
      } catch {
        if (!signal.aborted) setNotice('Could not load this trail. Choose a date to try again.');
      } finally {
        if (!signal.aborted) setTrailLoading(false);
      }
    },
    [
      selection,
      cancel,
      clear,
      mapRef,
      showToast,
      setTrailLoading,
      setIsTrailVisible,
      setTrailPoints,
      setRawTrailPoints,
      setTrips,
      setPlanStops,
      setRoadTrail,
    ],
  );

  return { selection, notice, load, hide, cancel };
}
