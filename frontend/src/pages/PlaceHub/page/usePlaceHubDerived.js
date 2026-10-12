import { useCallback, useMemo } from 'react';
import {
  mergePlaces,
  filterPlaces,
  countByGroup,
  placeTotals,
  liveIdleTotals,
  clusterIdleEvents,
  idleHistoryTotals,
  fromHotspot,
  drainCellsOf,
  fuelTotals,
  hasPosition,
  stopGroupsOf,
} from '../placeHubModel.js';

const MAX_IDLE_SPOTS = 150;

export default function usePlaceHubDerived({ data, group, query, showContext, selectedId, tab }) {
  const places = useMemo(
    () => mergePlaces({ warehouses: data.warehouses, zones: data.zones, sites: data.sites }),
    [data.warehouses, data.zones, data.sites],
  );
  // Only the 200 busiest of each kind of suggestion are loaded; the counts use the real totals.
  const counts = useMemo(() => {
    const c = countByGroup(places);
    return {
      ...c,
      review: Math.max(c.review || 0, data.proposedTotal),
      low: Math.max(c.low || 0, data.lowEvidenceTotal || 0),
    };
  }, [places, data.proposedTotal, data.lowEvidenceTotal]);
  const totals = useMemo(
    () => ({ ...placeTotals(places), toReview: counts.review }),
    [places, counts.review],
  );
  const reviewLoaded = useMemo(() => places.filter((p) => p.group === 'review').length, [places]);
  const lowLoaded = useMemo(() => places.filter((p) => p.group === 'low').length, [places]);
  const visiblePlaces = useMemo(
    () => filterPlaces(places, { group, query }),
    [places, group, query],
  );
  const contextPlaces = useMemo(
    () => (showContext ? places.filter((p) => p.status === 'CONFIRMED') : []),
    [places, showContext],
  );
  const sitesById = useMemo(
    () => new Map(places.filter((p) => p.source === 'site').map((p) => [p.sourceId, p])),
    [places],
  );
  const siteOf = useCallback((id) => (id ? sitesById.get(String(id)) || null : null), [sitesById]);
  const stopGroups = useMemo(() => stopGroupsOf(data.breaks), [data.breaks]);

  const live = useMemo(
    () => data.live.filter(hasPosition).sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0)),
    [data.live],
  );
  const liveTotals = useMemo(() => liveIdleTotals(data.live), [data.live]);
  const idleSpots = useMemo(
    () => clusterIdleEvents(data.history).slice(0, MAX_IDLE_SPOTS),
    [data.history],
  );
  const historyTotals = useMemo(() => idleHistoryTotals(data.history), [data.history]);

  const hotspots = useMemo(
    () =>
      data.hotspots
        .map(fromHotspot)
        .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng))
        .sort((a, b) => Number(b.active) - Number(a.active) || b.incidentCount - a.incidentCount),
    [data.hotspots],
  );
  const drainCells = useMemo(() => drainCellsOf(data.drain), [data.drain]);
  const fuel = useMemo(() => fuelTotals(hotspots, drainCells), [hotspots, drainCells]);

  const selection = useMemo(() => {
    if (!selectedId) return null;
    const [prefix] = selectedId.split(':');
    if (prefix === 'live')
      return { kind: 'live', item: live.find((e) => `live:${e._id}` === selectedId) };
    if (prefix === 'idle')
      return { kind: 'idleSpot', item: idleSpots.find((s) => s.id === selectedId) };
    if (prefix === 'hotspot')
      return { kind: 'hotspot', item: hotspots.find((h) => h.id === selectedId) };
    if (prefix === 'drain')
      return { kind: 'drain', item: drainCells.find((c) => c.id === selectedId) };
    if (prefix === 'stop')
      return { kind: 'stops', item: stopGroups.find((g) => g.id === selectedId) };
    return { kind: 'place', item: places.find((p) => p.id === selectedId) };
  }, [selectedId, live, idleSpots, hotspots, drainCells, stopGroups, places]);

  const fitPoints = useMemo(() => {
    if (tab === 'places') return visiblePlaces;
    if (tab === 'stops') return stopGroups.slice(0, 40);
    if (tab === 'idling')
      return [
        ...live.map((e) => ({ lat: Number(e.lat), lng: Number(e.lng) })),
        ...idleSpots.slice(0, 40),
      ];
    // Network hotspots span the country; fitting to them would zoom out to India.
    return [...hotspots.filter((h) => h.provenance !== 'network'), ...drainCells.slice(0, 40)];
  }, [tab, visiblePlaces, stopGroups, live, idleSpots, hotspots, drainCells]);

  return {
    places,
    counts,
    totals,
    reviewLoaded,
    lowLoaded,
    visiblePlaces,
    contextPlaces,
    siteOf,
    stopGroups,
    live,
    liveTotals,
    idleSpots,
    historyTotals,
    hotspots,
    drainCells,
    fuel,
    selection,
    fitPoints,
  };
}
