import { useState } from 'react';
import { MarkerClustererF } from '@react-google-maps/api';
import { placeTypeLabel } from '../model/placeGroups.js';
import PlaceHoverTooltip from './PlaceHoverTooltip.jsx';

const coordinateKey = (lat, lng) => `${lat},${lng}`;

/** Show the places inside a cluster before the user clicks to zoom in. */
export default function PlaceClusterer({ places, children, ...props }) {
  const [hovered, setHovered] = useState(null);
  const showCluster = (cluster) => {
    const positions = new Set(
      cluster.getMarkers().map((marker) => {
        const position = marker.getPosition();
        return coordinateKey(position.lat(), position.lng());
      }),
    );
    const members = places.filter((place) => positions.has(coordinateKey(place.lat, place.lng)));
    setHovered({ position: cluster.getCenter(), members });
  };
  return (
    <>
      <MarkerClustererF
        {...props}
        title=""
        onMouseOver={showCluster}
        onMouseOut={() => setHovered(null)}
        onClusteringBegin={() => setHovered(null)}
        onClick={() => setHovered(null)}
      >
        {children}
      </MarkerClustererF>
      {hovered && (
        <PlaceHoverTooltip
          position={hovered.position}
          label={`${hovered.members.length} places`}
          details={[
            ...hovered.members
              .slice(0, 6)
              .map((place) => `${place.name || 'Unnamed place'} · ${placeTypeLabel(place.type)}`),
            hovered.members.length > 6 ? `+${hovered.members.length - 6} more places` : null,
            'Click to zoom in',
          ]}
        />
      )}
    </>
  );
}
