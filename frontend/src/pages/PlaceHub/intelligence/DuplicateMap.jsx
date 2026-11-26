import { useMemo } from 'react';
import PlacePreviewMap from '../map/PlacePreviewMap.jsx';
import useApi from '../../../hooks/useApi';
import PlaceIntelligenceService from './PlaceIntelligenceService';
const hasCoords = (site) =>
  [site?.lat, site?.lng].every((n) => typeof n === 'number' && Number.isFinite(n));
export default function DuplicateMap({ a: first, b: second }) {
  const firstQ = useApi(
    (signal) => PlaceIntelligenceService.getSite(first._id, { signal }),
    [first._id],
    { enabled: !hasCoords(first) },
  );
  const secondQ = useApi(
    (signal) => PlaceIntelligenceService.getSite(second._id, { signal }),
    [second._id],
    { enabled: !hasCoords(second) },
  );
  const a = useMemo(() => {
    const site = hasCoords(first) ? first : firstQ.data?.site;
    return site
      ? { ...site, lat: site.lat ?? site.centroidLat, lng: site.lng ?? site.centroidLng }
      : null;
  }, [first, firstQ.data]);
  const b = useMemo(() => {
    const site = hasCoords(second) ? second : secondQ.data?.site;
    return site
      ? { ...site, lat: site.lat ?? site.centroidLat, lng: site.lng ?? site.centroidLng }
      : null;
  }, [second, secondQ.data]);
  const points = useMemo(
    () =>
      [a, b].map((site, index) => ({
        id: site?._id,
        lat: site?.lat,
        lng: site?.lng,
        label: `${index === 0 ? 'A' : 'B'}: ${site?.name || 'Unnamed place'}`,
      })),
    [a, b],
  );
  if (!hasCoords(a) || !hasCoords(b))
    return (
      <p className="sap-muted">
        {firstQ.loading || secondQ.loading
          ? 'Loading map…'
          : 'Map coordinates unavailable for this pair.'}
      </p>
    );
  return (
    <PlacePreviewMap
      points={points}
      className="sap-mini-map"
      label={`Map of ${a.name || 'place A'} and ${b.name || 'place B'}`}
    />
  );
}
