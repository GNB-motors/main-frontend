import { memo } from 'react';
import { PolygonF } from '@react-google-maps/api';

/** The short stroke Google Maps repeats along a line to make it dashed. */
const DASH_ICON = {
  path: 'M 0,-1 0,1',
  strokeOpacity: 1,
  strokeWeight: 2,
  scale: 4,
};

const GROUP_OPTIONS = {
  fillColor: '#eab308',
  fillOpacity: 0.08,
  strokeColor: '#eab308',
  // The dash comes from the repeated icon, so the line itself stays invisible.
  strokeOpacity: 0,
  strokeWeight: 2,
  clickable: false,
  icons: [{ icon: DASH_ICON, offset: '0', repeat: '12px' }],
};

/**
 * The area a group of places shares, drawn under the places themselves: the
 * anchor's outline, dashed, so the group reads before the places do. Only the
 * anchor carries the shape — everyone else joins the same group.
 */
const GroupShape = memo(function GroupShape({ place }) {
  if (!place?.groupAnchor) return null;
  const parts = place.groupParts;
  if (!parts?.length) return null;
  return (
    <>
      {parts.map((part, i) => (
        <PolygonF key={`g-${i}`} paths={part} options={GROUP_OPTIONS} />
      ))}
    </>
  );
});

export default GroupShape;
