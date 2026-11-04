import { useApi } from '../../hooks/useApi';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService';
import { placeApiId, placePanelStats } from './placePanelModel.js';

/**
 * usePlaceStats — the numbers behind one place's panel.
 *
 * The report comes from the place's own record:
 * GET /api/place-intelligence/sites/:id → report (visits, vehicles,
 * dwellP50Min/dwellP90Min, idleCost). A place that is not a site (a warehouse
 * or a zone) has no such record, so the numbers fall back to whatever the
 * place's own list row already carried.
 *
 * When the read fails the panel still shows what it knows — a missing number
 * is an em dash, never a zero.
 */
export default function usePlaceStats(place) {
  const siteId = place?.source === 'site' ? placeApiId(place) : null;

  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.getSite(siteId, { signal }),
    [siteId],
    { enabled: Boolean(siteId) },
  );

  return {
    stats: placePanelStats(place, data?.report ?? null),
    loading,
    error,
  };
}
