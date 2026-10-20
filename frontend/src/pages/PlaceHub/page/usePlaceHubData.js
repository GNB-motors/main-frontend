import { useCallback, useEffect, useRef, useState } from 'react';
import PlaceHubService from '../PlaceHubService.js';

const EMPTY_LAYER = { rows: [], error: null };

const isCanceled = (error) => error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';

/**
 * Place Hub's data, loaded as late as each part is needed: places, live idling
 * and fuel hotspots on open (the tab badges count them); idle history with its
 * threshold, the drain map, stops and places said not to exist when their tab
 * or chip is first opened (loadIdleHistory, loadDrain, loadStops, loadRejected).
 * A reload of a part aborts the one still in flight, and leaving the page
 * aborts them all.
 */
export default function usePlaceHubData({ ready, allowZones, allowSites, allowIdling, allowFuel }) {
  const [data, setData] = useState({
    warehouses: [],
    zones: [],
    sites: [],
    proposedTotal: 0,
    hotspots: [],
    drain: null,
    live: [],
    history: [],
    historyTruncated: false,
    idleSetting: null,
    summary: null,
    breaks: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({ places: true, idling: true, fuel: true, stops: true });
  const [loaded, setLoaded] = useState({ places: false, idling: false, fuel: false, stops: false });

  const controllers = useRef({});
  const begin = useCallback((part) => {
    controllers.current[part]?.abort();
    const controller = new AbortController();
    controllers.current[part] = controller;
    setLoading((l) => ({ ...l, [part]: true }));
    return controller.signal;
  }, []);
  const finish = useCallback((part) => {
    setLoading((l) => ({ ...l, [part]: false }));
    setLoaded((l) => ({ ...l, [part]: true }));
  }, []);
  useEffect(() => () => Object.values(controllers.current).forEach((c) => c.abort()), []);

  // Once the "Not a place" chip has been opened, a reload of the places keeps it filled.
  const rejectedWanted = useRef(false);

  const loadPlaces = useCallback(async () => {
    const signal = begin('places');
    try {
      const [w, z, s, summary, rejected] = await Promise.all([
        PlaceHubService.loadWarehouses(),
        allowZones ? PlaceHubService.loadZones({ signal }) : EMPTY_LAYER,
        allowSites ? PlaceHubService.loadSites({ signal }) : EMPTY_LAYER,
        allowSites ? PlaceHubService.loadSummary({ signal }) : { rows: null, error: null },
        allowSites && rejectedWanted.current
          ? PlaceHubService.loadRejectedSites({ signal })
          : EMPTY_LAYER,
      ]);
      if (signal.aborted) return;
      setData((d) => ({
        ...d,
        warehouses: w.rows,
        zones: z.rows,
        sites: [...s.rows, ...rejected.rows],
        proposedTotal: s.proposedTotal || 0,
        lowEvidenceTotal: s.lowEvidenceTotal || 0,
        summary: summary.rows || d.summary,
      }));
      setErrors((e) => ({ ...e, warehouses: w.error, zones: z.error, 'detected places': s.error }));
      finish('places');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowZones, allowSites, begin, finish]);

  const loadRejected = useCallback(async () => {
    if (!allowSites) return;
    rejectedWanted.current = true;
    const signal = begin('rejected');
    try {
      const rejected = await PlaceHubService.loadRejectedSites({ signal });
      if (signal.aborted) return;
      setData((d) => ({
        ...d,
        sites: [...d.sites.filter((s) => s.status !== 'REJECTED'), ...rejected.rows],
      }));
      setErrors((e) => ({ ...e, 'rejected places': rejected.error }));
      finish('rejected');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowSites, begin, finish]);

  const loadIdling = useCallback(async () => {
    if (!allowIdling) return;
    const signal = begin('idling');
    try {
      const live = await PlaceHubService.loadLiveIdling({ signal });
      if (signal.aborted) return;
      setData((d) => ({ ...d, live: live.rows }));
      setErrors((e) => ({ ...e, 'live idling': live.error }));
      finish('idling');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowIdling, begin, finish]);

  const loadIdleHistory = useCallback(async () => {
    if (!allowIdling) return;
    const signal = begin('idleHistory');
    try {
      const [history, idleSetting] = await Promise.all([
        PlaceHubService.loadIdleHistory({ days: 7, signal }),
        PlaceHubService.loadIdleSetting({ signal }),
      ]);
      if (signal.aborted) return;
      setData((d) => ({
        ...d,
        history: history.rows,
        historyTruncated: history.truncated,
        idleSetting,
      }));
      setErrors((e) => ({ ...e, 'idle history': history.error }));
      finish('idleHistory');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowIdling, begin, finish]);

  const loadFuel = useCallback(async () => {
    if (!allowFuel) return;
    const signal = begin('fuel');
    try {
      const hotspots = await PlaceHubService.loadHotspots({ signal });
      if (signal.aborted) return;
      setData((d) => ({ ...d, hotspots: hotspots.rows }));
      setErrors((e) => ({ ...e, 'fuel hotspots': hotspots.error }));
      finish('fuel');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowFuel, begin, finish]);

  const loadDrain = useCallback(async () => {
    if (!allowFuel) return;
    const signal = begin('drain');
    try {
      const drain = await PlaceHubService.loadDrainMap({ signal });
      if (signal.aborted) return;
      setData((d) => ({ ...d, drain: drain.rows }));
      setErrors((e) => ({ ...e, 'drain map': drain.error }));
      finish('drain');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowFuel, begin, finish]);

  const loadStops = useCallback(async () => {
    if (!allowSites) return;
    const signal = begin('stops');
    try {
      const breaks = await PlaceHubService.loadBreaks({ signal });
      if (signal.aborted) return;
      setData((d) => ({ ...d, breaks: breaks.rows }));
      setErrors((e) => ({ ...e, stops: breaks.error }));
      finish('stops');
    } catch (error) {
      if (!isCanceled(error)) throw error;
    }
  }, [allowSites, begin, finish]);

  useEffect(() => {
    if (ready) loadPlaces();
  }, [ready, loadPlaces]);
  useEffect(() => {
    if (ready) loadIdling();
  }, [ready, loadIdling]);
  useEffect(() => {
    if (ready) loadFuel();
  }, [ready, loadFuel]);

  return {
    data,
    setData,
    errors,
    loading,
    loaded,
    loadPlaces,
    loadRejected,
    loadIdling,
    loadIdleHistory,
    loadFuel,
    loadDrain,
    loadStops,
  };
}
