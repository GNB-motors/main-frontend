import { useCallback, useRef } from 'react';
import { useApi, dedupeRequest } from '../../hooks/useApi.js';
import { getMapPlaces } from '../../services/fleetViewService.js';
import { PLACE_LAYERS, LAYER_API_NAMES, apiLayerNames } from './trackLegendModel.js';
import { getOrgId, getToken } from '../../utils/session.js';

// Coverage is checked independently of the current map and selected layers.
// Empty local views must never make a populated category disappear.

// The endpoint takes a comma list of layers, so every legend layer is asked
// in ONE call: seven calls per Places-tab open become one.
const AVAILABILITY_LAYERS = PLACE_LAYERS.filter(
  (layer) => !['ourPlaces', 'tolls'].includes(layer.id),
);
const AVAILABILITY_API_LAYERS = apiLayerNames(AVAILABILITY_LAYERS.map((layer) => layer.id));
const AVAILABILITY_BBOX = '68,6,98,38'; // all of India

// The counts describe the country, not the view: they are kept for the
// session (this tab only), per org, and are dropped when the org changes or
// nobody is signed in any more. A reload starts empty.
const sessionCounts = new Map(); // `${orgId}|${layerSet}` -> counts
let sessionOrg = null;

/** The org the kept counts belong to; another org must never see them. */
function sessionScope() {
  const org = getOrgId() || '';
  if (!getToken() || org !== sessionOrg) {
    sessionCounts.clear();
    sessionOrg = getToken() ? org : null;
  }
  return org;
}

function readSessionCounts() {
  return sessionCounts.get(`${sessionScope()}|${AVAILABILITY_API_LAYERS}`);
}

function writeSessionCounts(counts) {
  sessionCounts.set(`${sessionScope()}|${AVAILABILITY_API_LAYERS}`, counts);
}

/** One answer, split into the per-layer coverage the legend shows. */
function coverageOf(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const truncatedLayers = Array.isArray(data?.truncatedLayers) ? data.truncatedLayers : null;
  return Object.fromEntries(
    AVAILABILITY_LAYERS.map((layer) => {
      const apiLayers = LAYER_API_NAMES[layer.id].split(',');
      return [
        layer.id,
        {
          count: items.filter((item) => apiLayers.includes(item?.layer)).length,
          truncated: truncatedLayers
            ? truncatedLayers.some((name) => apiLayers.includes(name))
            : Boolean(data?.truncated),
        },
      ];
    }),
  );
}

/**
 * The coverage of every place layer over the whole country, in one request.
 * `force` asks the server again instead of answering from the session.
 */
export async function loadPlaceLayerAvailability(signal, { force = false } = {}) {
  if (!force) {
    const cached = readSessionCounts();
    if (cached) return cached;
  }
  try {
    const data = await dedupeRequest(
      `map-places:availability:${AVAILABILITY_API_LAYERS}${force ? ':force' : ''}`,
      (sharedSignal) =>
        getMapPlaces({
          bbox: AVAILABILITY_BBOX,
          layers: AVAILABILITY_API_LAYERS,
          signal: sharedSignal,
        }),
      signal,
    );
    if (data.held || !Array.isArray(data.items)) {
      return Object.fromEntries(AVAILABILITY_LAYERS.map((layer) => [layer.id, { count: null }]));
    }
    const counts = coverageOf(data);
    writeSessionCounts(counts);
    return counts;
  } catch (error) {
    if (signal?.aborted) throw error;
    return Object.fromEntries(
      AVAILABILITY_LAYERS.map((layer) => [layer.id, { count: null, failed: true }]),
    );
  }
}

export default function usePlaceLayerAvailability(enabled) {
  const forceRef = useRef(false);
  const fetcher = useCallback((signal) => {
    const force = forceRef.current;
    forceRef.current = false;
    return loadPlaceLayerAvailability(signal, { force });
  }, []);
  const api = useApi(fetcher, [], { enabled });
  const { refetch: askServer } = api;
  const refetch = useCallback(() => {
    // A manual refresh always asks the server, never the session's counts.
    forceRef.current = true;
    const controller = askServer();
    if (!controller) forceRef.current = false;
    return controller;
  }, [askServer]);
  return { ...api, refetch };
}
