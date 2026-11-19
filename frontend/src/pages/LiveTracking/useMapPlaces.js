import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { filterIndianPumps } from './indiaPumpFilter';
import { fleetViewService } from '../../services/fleetViewService';
import { dedupeRequest } from '../../hooks/useApi.js';
import { apiLayerNames, layersForZoom, LAYER_API_NAMES } from './trackLegendModel';

const EMPTY = [];
const CACHE_LIMIT = 8;
const CACHE_MS = 5 * 60 * 1000;
const SETTLE_MS = 180;
const contains = (outer, inner) =>
  outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];
// A pan keeps the size of the box; a zoom changes it.
const sameSize = (a, b) =>
  Math.abs(a[2] - a[0] - (b[2] - b[0])) <= (a[2] - a[0]) * 0.02 &&
  Math.abs(a[3] - a[1] - (b[3] - b[1])) <= (a[3] - a[1]) * 0.02;
const padded = ([south, west, north, east]) => {
  const lat = (north - south) * 0.25;
  const lng = (east - west) * 0.25;
  return [
    Math.max(-90, south - lat),
    Math.max(-180, west - lng),
    Math.min(90, north + lat),
    Math.min(180, east + lng),
  ];
};

/** Keep the last good markers while fetching a settled, buffered viewport.
 * Complete responses cover nearby pans/zoom-ins; truncated responses are a
 * nearest-N sample around the box they were asked for, so a pan inside the
 * padded box may show that sample as it is, while a zoom needs a fresh
 * sample centred on the tighter box.
 * Cache is bounded and belongs to this mounted page (reset on branch change).
 */
export default function useMapPlaces({
  bbox = null,
  zoom = 0,
  layers = null,
  scopes = {},
  enabled = true,
} = {}) {
  const allowedLayers = useMemo(
    () => layersForZoom(zoom, layers).filter((id) => !['ourPlaces', 'tolls'].includes(id)),
    [zoom, layers],
  );
  const layerParam = apiLayerNames(allowedLayers);
  const visitedLayers = allowedLayers
    .filter((id) => scopes[id] === 'visited')
    .map((id) => LAYER_API_NAMES[id])
    .join(',');
  const queryKey = `${layerParam}:${visitedLayers}`;
  const boxKey = bbox?.join(',') || '';
  const requestEnabled = enabled && Boolean(boxKey) && Boolean(layerParam);
  const cache = useRef([]);
  const [state, setState] = useState({ data: null, loading: false, error: null, held: false });
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => {
    cache.current = [];
    setRevision((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!requestEnabled) return undefined;
    const view = boxKey.split(',').map(Number);
    const hit = cache.current.find(
      (entry) =>
        entry.layers === queryKey &&
        Date.now() - entry.at < CACHE_MS &&
        contains(entry.bounds, view) &&
        (!entry.data.truncated || sameSize(entry.view, view)),
    );
    if (hit) {
      setState({
        data: hit.data,
        bounds: hit.bounds,
        queryKey,
        loading: false,
        error: null,
        held: false,
      });
      return undefined;
    }
    const controller = new AbortController();
    // Retain the previous dataset: a viewport change is a background refresh.
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const timer = setTimeout(async () => {
      const bounds = padded(view);
      try {
        // The same read asked for at the same moment is one request, not N.
        let data = await dedupeRequest(
          `map-places:${layerParam}|${visitedLayers}|${bounds.join(',')}`,
          (sharedSignal) =>
            fleetViewService.getMapPlaces({
              bbox: [bounds[1], bounds[0], bounds[3], bounds[2]].join(','),
              layers: layerParam,
              visitedLayers,
              signal: sharedSignal,
            }),
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (!data?.held && Array.isArray(data?.items)) {
          data = { ...data, items: await filterIndianPumps(data.items, ['pumps', 'dhabas']) };
          if (controller.signal.aborted) return;
          cache.current.unshift({ view, bounds, layers: queryKey, data, at: Date.now() });
          cache.current = cache.current.slice(0, CACHE_LIMIT);
        }
        setState((previous) => ({
          data: data?.held ? previous.data : data,
          bounds: data?.held ? previous.bounds : bounds,
          queryKey: data?.held ? previous.queryKey : queryKey,
          held: data?.held === true,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (!controller.signal.aborted)
          setState((previous) => ({ ...previous, loading: false, error }));
      }
    }, SETTLE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [boxKey, layerParam, visitedLayers, queryKey, requestEnabled, revision]);

  const { data, loading, error, held } = state;
  const items = useMemo(() => {
    if (!requestEnabled || !Array.isArray(data?.items)) return EMPTY;
    const active = new Set(layerParam.split(','));
    const visited = new Set(visitedLayers.split(','));
    return data.items.filter(
      (item) =>
        active.has(item.layer) &&
        (!visited.has(item.layer) || item.visited === true) &&
        (!bbox ||
          (item.lat >= bbox[0] &&
            item.lng >= bbox[1] &&
            item.lat <= bbox[2] &&
            item.lng <= bbox[3])),
    );
  }, [requestEnabled, data, layerParam, visitedLayers, boxKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const viewReady =
    state.queryKey === queryKey && state.bounds && (!bbox || contains(state.bounds, bbox));
  const truncatedByLayer = Object.fromEntries(
    allowedLayers.map((id) => [
      id,
      Array.isArray(data?.truncatedLayers)
        ? LAYER_API_NAMES[id].split(',').some((layer) => data.truncatedLayers.includes(layer))
        : Boolean(data?.truncated),
    ]),
  );
  const notAvailable = error?.status === 404;
  return {
    items,
    truncated: Boolean(data?.truncated),
    truncatedByLayer,
    loading: requestEnabled && (loading || (!error && !viewReady)),
    loaded:
      requestEnabled && viewReady && !loading && !error && !held && Array.isArray(data?.items),
    counts: Object.fromEntries(
      allowedLayers.map((id) => [
        id,
        items.filter(
          (item) =>
            LAYER_API_NAMES[id].split(',').includes(item.layer) &&
            (!bbox ||
              (item.lat >= bbox[0] &&
                item.lng >= bbox[1] &&
                item.lat <= bbox[2] &&
                item.lng <= bbox[3])),
        ).length,
      ]),
    ),
    held,
    notAvailable,
    error: notAvailable ? null : error,
    refetch,
    requestedLayers: allowedLayers,
  };
}
