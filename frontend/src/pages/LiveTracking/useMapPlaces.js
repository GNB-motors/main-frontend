import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { apiLayerNames, layersForZoom, LAYER_API_NAMES } from './trackLegendModel';

/**
 * useMapPlaces — the places inside the visible map box.
 *
 * The caller hands over the map's bounds and zoom, updated only when the
 * map goes idle, so panning does not fire a request per frame. The previous
 * request is aborted when the box changes, so a slow answer for an old box
 * can never overwrite the new one.
 *
 * `available` is false when the endpoint is not deployed yet (404). The
 * legend then shows the layers as "Coming soon" instead of pretending the
 * map is empty.
 */
export default function useMapPlaces({ bbox = null, zoom = 0, layers = null, enabled = true } = {}) {
  const allowedLayers = useMemo(() => layersForZoom(zoom, layers).filter((id) => !['ourPlaces', 'tolls'].includes(id)), [zoom, layers]);

  // useLiveMap stores south/west/north/east; the API expects west/south/east/north.
  const bboxParam = bbox ? [bbox[1], bbox[0], bbox[3], bbox[2]].join(',') : '';
  const layerParam = apiLayerNames(allowedLayers);

  const requestEnabled = enabled && Boolean(bboxParam) && allowedLayers.length > 0;
  const { data, loading, error, refetch } = useApi(
    (signal) => fleetViewService.getMapPlaces({ bbox: bboxParam, layers: layerParam, signal }),
    [bboxParam, layerParam],
    { enabled: requestEnabled, scopeKey: `${bboxParam}|${layerParam}` },
  );

  // A 404 means the backend has not shipped this endpoint, which is not an
  // error the owner should see as a failure.
  const notAvailable = error?.status === 404;
  const items = useMemo(() => {
    if (!enabled || !Array.isArray(data?.items)) return [];
    const activeApiLayers = new Set(layerParam.split(','));
    return data.items.filter((item) => activeApiLayers.has(item.layer));
  }, [enabled, data, layerParam]);
  const held = data?.held === true;

  return {
    items,
    truncated: Boolean(data?.truncated),
    loading: requestEnabled && loading,
    loaded: requestEnabled && !loading && !error && !held && Array.isArray(data?.items),
    counts: Object.fromEntries(allowedLayers.map((id) => [id, items.filter((item) => LAYER_API_NAMES[id].split(',').includes(item.layer)).length])),
    held,
    notAvailable,
    error: notAvailable ? null : error,
    refetch,
    requestedLayers: allowedLayers,
  };
}
