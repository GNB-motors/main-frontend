import PlaceHoverTooltip from './PlaceHoverTooltip.jsx';
import { placeTypeLabel } from '../model/placeGroups.js';
import { memo, useCallback, useMemo, useState } from 'react';
import { CircleF, PolygonF } from '@react-google-maps/api';
import { RISK_COLOR, styleOfType } from '../placeHubStyle.js';
import { purposeColor } from '../model/placePurpose.js';

const PlaceShapeGeometry = memo(function PlaceShapeGeometry({
  place,
  selected,
  showCircle,
  interactive,
  onSelect,
  onMouseOver,
  onMouseOut,
  highlightRisk = false,
}) {
  const { color } = styleOfType(place.type);
  const proposed = place.status === 'PROPOSED';
  const risk = highlightRisk && Boolean(place.risk);
  const purpose = risk ? RISK_COLOR : purposeColor(place.purpose);
  const shapeColor = risk ? RISK_COLOR : color;
  const options = useMemo(
    () => ({
      strokeColor: shapeColor,
      strokeOpacity: proposed ? 0.6 : 0.9,
      strokeWeight: selected ? 3 : 1.5,
      fillColor: shapeColor,
      fillOpacity: selected ? 0.22 : 0.08,
      clickable: interactive,
    }),
    [shapeColor, proposed, selected, interactive],
  );
  // An area is drawn in the colour of what the place is for, not of its type.
  const areaOptions = useMemo(
    () => ({
      strokeColor: purpose,
      strokeOpacity: proposed ? 0.6 : 0.9,
      strokeWeight: selected ? 3 : risk ? 2.5 : 2,
      fillColor: purpose,
      fillOpacity: risk ? (selected ? 0.22 : 0.12) : selected ? 0.3 : 0.18,
      clickable: interactive,
    }),
    [purpose, proposed, selected, interactive, risk],
  );
  // The busiest part sits on top, same colour, darker, with no edge of its own.
  const coreOptions = useMemo(
    () => ({
      ...areaOptions,
      strokeOpacity: 0,
      strokeWeight: 0,
      fillOpacity: risk ? 0.24 : 0.45,
    }),
    [areaOptions, risk],
  );
  const click = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  // A real area: one polygon per part, each with its holes — no circle on top.
  if (place.polygonParts?.length || place.coreParts?.length) {
    return (
      <>
        {place.polygonParts?.map((part, i) => (
          <PolygonF
            key={`a-${i}`}
            paths={part}
            options={areaOptions}
            onClick={click}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
          />
        ))}
        {place.coreParts?.map((part, i) => (
          <PolygonF
            key={`c-${i}`}
            paths={part}
            options={coreOptions}
            onClick={click}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
          />
        ))}
      </>
    );
  }
  if (place.polygon)
    return (
      <PolygonF
        paths={place.polygon}
        options={areaOptions}
        onClick={click}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      />
    );
  if (!showCircle || !place.radiusM) return null;
  return (
    <CircleF
      center={{ lat: place.lat, lng: place.lng }}
      radius={place.radiusM}
      options={options}
      onClick={click}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    />
  );
});

export default memo(function PlaceShape(props) {
  const [position, setPosition] = useState(null);
  // When the place also has a pin, that marker owns the hover card — the shape
  // staying silent avoids two identical tooltips stacking on the same place.
  const { place, interactive, showTooltip = true } = props;
  return (
    <>
      <PlaceShapeGeometry
        {...props}
        onMouseOver={(event) =>
          interactive && setPosition(event?.latLng || { lat: place.lat, lng: place.lng })
        }
        onMouseOut={() => setPosition(null)}
      />
      {position && interactive && showTooltip && (
        <PlaceHoverTooltip
          position={position}
          label={place.name || 'Unnamed place'}
          details={[
            placeTypeLabel(place.type),
            props.highlightRisk && place.risk ? 'Fuel risk' : null,
          ]}
        />
      )}
    </>
  );
});
