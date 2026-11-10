import { memo, useCallback, useMemo } from 'react';
import { CircleF, PolygonF } from '@react-google-maps/api';
import { styleOfType } from '../placeHubStyle.js';
import { purposeColor } from '../model/placePurpose.js';

const PlaceShape = memo(function PlaceShape({
  place,
  selected,
  showCircle,
  interactive,
  onSelect,
}) {
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const purpose = purposeColor(place.purpose);
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
  // An area is drawn in the colour of what the place is for, not of its type.
  const areaOptions = useMemo(
    () => ({
      strokeColor: purpose,
      strokeOpacity: proposed ? 0.6 : 0.9,
      strokeWeight: selected ? 3 : 2,
      fillColor: purpose,
      fillOpacity: selected ? 0.3 : 0.18,
      clickable: interactive,
    }),
    [purpose, proposed, selected, interactive],
  );
  // The busiest part sits on top, same colour, darker, with no edge of its own.
  const coreOptions = useMemo(
    () => ({
      ...areaOptions,
      strokeOpacity: 0,
      strokeWeight: 0,
      fillOpacity: 0.45,
    }),
    [areaOptions],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  // A real area: one polygon per part, each with its holes — no circle on top.
  if (place.polygonParts?.length || place.coreParts?.length) {
    return (
      <>
        {place.polygonParts?.map((part, i) => (
          <PolygonF key={`a-${i}`} paths={part} options={areaOptions} onClick={click} />
        ))}
        {place.coreParts?.map((part, i) => (
          <PolygonF key={`c-${i}`} paths={part} options={coreOptions} onClick={click} />
        ))}
      </>
    );
  }
  if (place.polygon)
    return <PolygonF paths={place.polygon} options={areaOptions} onClick={click} />;
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
