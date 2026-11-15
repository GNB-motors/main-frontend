import PlaceHoverTooltip from './PlaceHoverTooltip.jsx';
import { memo, useCallback, useMemo, useState } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { styleOfType } from '../placeHubStyle.js';
import { mapPlaceIcon } from '../../LiveTracking/mapPlaceIcon.js';
import { PLACE_ICON_SIZES } from '../../../config/placeIcons.js';
import { placeTypeLabel } from '../model/placeGroups.js';

const PlaceMarker = memo(function PlaceMarker({
  place,
  selected,
  interactive,
  onSelect,
  clusterer,
}) {
  const [hovered, setHovered] = useState(false);
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const icon = useMemo(
    () =>
      mapPlaceIcon(place, {
        color,
        size: selected ? 32 : PLACE_ICON_SIZES.default,
        selected,
        hollow: proposed,
        risk: place.risk,
      }),
    [place, color, selected, proposed],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  return (
    <>
      <MarkerF
        position={{ lat: place.lat, lng: place.lng }}
        icon={icon}
        title={[place.name, placeTypeLabel(place.type)].filter(Boolean).join(' · ')}
        onMouseOver={() => interactive && setHovered(true)}
        onMouseOut={() => setHovered(false)}
        clickable={interactive}
        zIndex={selected ? 1000 : proposed ? 1 : 10}
        onClick={click}
        clusterer={clusterer}
        noClustererRedraw
      />
      {hovered && interactive && (
        <PlaceHoverTooltip
          position={{ lat: place.lat, lng: place.lng }}
          label={place.name || 'Unnamed place'}
          details={[
            placeTypeLabel(place.type),
            proposed ? 'To review' : null,
            place.risk ? 'Fuel risk' : null,
          ]}
        />
      )}
    </>
  );
});

export default PlaceMarker;
