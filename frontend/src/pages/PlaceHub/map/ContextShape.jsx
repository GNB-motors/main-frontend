import { memo, useMemo } from 'react';
import { CircleF, PolygonF } from '@react-google-maps/api';
import { CONTEXT_COLOR } from '../placeHubStyle.js';

const ContextShape = memo(function ContextShape({ place, showCircle }) {
  const options = useMemo(
    () => ({
      strokeColor: CONTEXT_COLOR,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      fillColor: CONTEXT_COLOR,
      fillOpacity: 0.06,
      clickable: false,
    }),
    [],
  );
  if (place.polygon) return <PolygonF paths={place.polygon} options={options} />;
  if (!showCircle || !place.radiusM) return null;
  return (
    <CircleF center={{ lat: place.lat, lng: place.lng }} radius={place.radiusM} options={options} />
  );
});

export default ContextShape;
