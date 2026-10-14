import { useCallback, useEffect, useState } from 'react';
import PlaceHubService from '../PlaceHubService.js';

const EMPTY_LAYER = { rows: [], error: null };

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

  const loadPlaces = useCallback(async () => {
    setLoading((l) => ({ ...l, places: true }));
    const [w, z, s, summary] = await Promise.all([
      PlaceHubService.loadWarehouses(),
      allowZones ? PlaceHubService.loadZones() : EMPTY_LAYER,
      allowSites ? PlaceHubService.loadSites() : EMPTY_LAYER,
      allowSites ? PlaceHubService.loadSummary() : { rows: null, error: null },
    ]);
    setData((d) => ({
      ...d,
      warehouses: w.rows,
      zones: z.rows,
      sites: s.rows,
      proposedTotal: s.proposedTotal || 0,
      lowEvidenceTotal: s.lowEvidenceTotal || 0,
      summary: summary.rows || d.summary,
    }));
    setErrors((e) => ({ ...e, warehouses: w.error, zones: z.error, 'detected places': s.error }));
    setLoading((l) => ({ ...l, places: false }));
    setLoaded((l) => ({ ...l, places: true }));
  }, [allowZones, allowSites]);

  const loadIdling = useCallback(async () => {
    if (!allowIdling) return;
    setLoading((l) => ({ ...l, idling: true }));
    const [live, history, idleSetting] = await Promise.all([
      PlaceHubService.loadLiveIdling(),
      PlaceHubService.loadIdleHistory({ days: 7 }),
      PlaceHubService.loadIdleSetting(),
    ]);
    setData((d) => ({
      ...d,
      live: live.rows,
      history: history.rows,
      historyTruncated: history.truncated,
      idleSetting,
    }));
    setErrors((e) => ({ ...e, 'live idling': live.error, 'idle history': history.error }));
    setLoading((l) => ({ ...l, idling: false }));
    setLoaded((l) => ({ ...l, idling: true }));
  }, [allowIdling]);

  const loadFuel = useCallback(async () => {
    if (!allowFuel) return;
    setLoading((l) => ({ ...l, fuel: true }));
    const [hotspots, drain] = await Promise.all([
      PlaceHubService.loadHotspots(),
      PlaceHubService.loadDrainMap(),
    ]);
    setData((d) => ({ ...d, hotspots: hotspots.rows, drain: drain.rows }));
    setErrors((e) => ({ ...e, 'fuel hotspots': hotspots.error, 'drain map': drain.error }));
    setLoading((l) => ({ ...l, fuel: false }));
    setLoaded((l) => ({ ...l, fuel: true }));
  }, [allowFuel]);

  const loadStops = useCallback(async () => {
    if (!allowSites) return;
    setLoading((l) => ({ ...l, stops: true }));
    const breaks = await PlaceHubService.loadBreaks();
    setData((d) => ({ ...d, breaks: breaks.rows }));
    setErrors((e) => ({ ...e, stops: breaks.error }));
    setLoading((l) => ({ ...l, stops: false }));
    setLoaded((l) => ({ ...l, stops: true }));
  }, [allowSites]);

  useEffect(() => {
    if (ready) loadPlaces();
  }, [ready, loadPlaces]);
  useEffect(() => {
    if (ready) loadIdling();
  }, [ready, loadIdling]);
  useEffect(() => {
    if (ready) loadFuel();
  }, [ready, loadFuel]);

  return { data, setData, errors, loading, loaded, loadPlaces, loadIdling, loadFuel, loadStops };
}
