import { useMemo } from 'react';
import { fitPlaceLabel, placeLabelArea } from './placeAreaLabels.js';

export default function usePlaceAreaLabels(places, zoom, showCircles, selectedId) {
  const close = zoom > 12;
  const areas = useMemo(
    () => (close ? places.map((place) => [place, placeLabelArea(place)]) : []),
    [places, close],
  );
  const labels = useMemo(() => {
    const result = new Map();
    for (const [place, area] of areas) {
      const label = fitPlaceLabel(place, area, zoom, showCircles || place.id === selectedId);
      if (label) result.set(place.id, label);
    }
    return result;
  }, [areas, zoom, showCircles, selectedId]);
  const markerPlaces = useMemo(
    () => places.filter((place) => !labels.has(place.id)),
    [places, labels],
  );
  return { labels, markerPlaces };
}
