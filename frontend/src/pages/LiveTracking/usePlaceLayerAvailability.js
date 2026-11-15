import { useApi } from '../../hooks/useApi.js';
import { getMapPlaces } from '../../services/fleetViewService.js';
import { PLACE_LAYERS, LAYER_API_NAMES } from './trackLegendModel.js';

// Coverage is checked independently of the current map and selected layers.
// Empty local views must never make a populated category disappear.
export async function loadPlaceLayerAvailability(signal) {
  const layers = PLACE_LAYERS.filter((layer) => !['ourPlaces', 'tolls'].includes(layer.id));
  return Object.fromEntries(await Promise.all(layers.map(async (layer) => {
    try {
      const data = await getMapPlaces({ bbox: '68,6,98,38', layers: LAYER_API_NAMES[layer.id], signal });
      if (data.held || !Array.isArray(data.items)) return [layer.id, { count: null }];
      return [layer.id, { count: data.items.length, truncated: Boolean(data.truncated) }];
    } catch (error) {
      if (signal?.aborted) throw error;
      return [layer.id, { count: null, failed: true }];
    }
  })));
}

export default function usePlaceLayerAvailability(enabled) {
  return useApi(loadPlaceLayerAvailability, [], { enabled });
}
