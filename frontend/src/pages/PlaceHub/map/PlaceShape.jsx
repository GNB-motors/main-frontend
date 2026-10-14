import { memo, useCallback, useMemo } from 'react';
import { CircleF, PolygonF } from '@react-google-maps/api';
import { styleOfType } from '../placeHubStyle.js';

const PlaceShape = memo(function PlaceShape({
  place,
  selected,
  showCircle,
  interactive,
  onSelect,
}) {
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const options = useMemo(
    () => ({
      strokeColor: color,
      strokeOpacity: proposed ? 0.6 : 0.9,
      strokeWeight: selected ? 3 : 1.5,
      fillColor: color,
      fillOpacity: selected ? 0.22 : 0.08,
      clickable: interactive,
    }),
    [color, proposed, selected, interactive],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  if (place.polygon) return <PolygonF paths={place.polygon} options={options} onClick={click} />;
  if (!showCircle || !place.radiusM) return null;
  return (
    <CircleF
      center={{ lat: place.lat, lng: place.lng }}
      radius={place.radiusM}
      options={options}
      onClick={click}
    />
  );
});

export default PlaceShape;
