import { memo, useCallback, useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { styleOfType } from '../placeHubStyle.js';
import { pinIcon } from './mapIcons.js';

const PlaceMarker = memo(function PlaceMarker({
  place,
  selected,
  interactive,
  onSelect,
  clusterer,
}) {
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const icon = useMemo(
    () => pinIcon(color, { selected, hollow: proposed, risk: place.risk }),
    [color, selected, proposed, place.risk],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  return (
    <MarkerF
      position={{ lat: place.lat, lng: place.lng }}
      icon={icon}
      title={place.name}
      clickable={interactive}
      zIndex={selected ? 1000 : proposed ? 1 : 10}
      onClick={click}
      clusterer={clusterer}
      noClustererRedraw
    />
  );
});

export default PlaceMarker;
