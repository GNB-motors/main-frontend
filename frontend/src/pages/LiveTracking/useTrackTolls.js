import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi.js';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { tollLayerPlazas } from '../PlaceHub/model/tollPlazas.js';

/** The toll API accepts boxes no larger than 6 degrees per side. */
export function tollViewBoxes(bbox, zoom) {
  if (!bbox || zoom < 7 || bbox.length !== 4 || !bbox.every(Number.isFinite)) return [];
  const [south, west, north, east] = bbox;
  if (east <= west || north <= south) return [];
  const cols = Math.ceil((east - west) / 6);
  const rows = Math.ceil((north - south) / 6);
  if (cols * rows > 9) return [];
  return Array.from({ length: cols * rows }, (_, i) => ({
    scope: 'all', west: west + (i % cols) * 6, south: south + Math.floor(i / cols) * 6,
    east: Math.min(east, west + (i % cols + 1) * 6), north: Math.min(north, south + (Math.floor(i / cols) + 1) * 6),
  }));
}

export default function useTrackTolls({ enabled, showAll, bbox, zoom }) {
  const visited = useApi((signal) => PlaceIntelligenceService.listTollPlazas({ scope: 'visited' }, { signal }), [], { enabled });
  const bboxKey = bbox?.join(',') || '';
  const boxes = useMemo(() => tollViewBoxes(bboxKey ? bboxKey.split(',').map(Number) : null, zoom), [bboxKey, zoom]);
  const nearby = useApi(async (signal) => {
    const results = await Promise.all(boxes.map((box) => PlaceIntelligenceService.listTollPlazas(box, { signal })));
    const byId = new Map(results.flatMap((result) => result.items || []).map((plaza) => [plaza.id, plaza]));
    return { items: [...byId.values()], truncated: results.some((result) => result.truncated) };
  }, [bboxKey], { enabled: enabled && showAll && boxes.length > 0 });
  const visitedPlazas = visited.data?.items || [];
  const inView = boxes.length ? nearby.data?.items || [] : [];
  return {
    plazas: tollLayerPlazas(visitedPlazas, inView, showAll),
    visitedCount: visited.data ? visitedPlazas.length : null,
    allCount: showAll && boxes.length && nearby.data ? inView.length : null,
    loading: visited.loading || (showAll && boxes.length > 0 && nearby.loading),
    error: visited.error || (showAll ? nearby.error : null),
    truncated: Boolean(nearby.data?.truncated && showAll),
    needsZoom: showAll && boxes.length === 0,
    refresh: () => { visited.refetch(); nearby.refetch(); },
  };
}
