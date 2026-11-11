import { PLACE_ICON_SIZES } from '../../config/placeIcons.js';
import { MarkerF } from '@react-google-maps/api';
import { googleMapsUrl } from '../../utils/googleMapsLink.js';
import { mapPlaceIcon } from '../LiveTracking/mapPlaceIcon.js';

/**
 * The toll plazas on the replay map. A plaza the replay has already passed is filled, one still
 * ahead is hollow, so the map says how far through its tolls the truck is. Clicking a plaza
 * opens it in Google Maps. Render inside GoogleMap.
 */
export default function TollMarkers({ marks }) {
  return marks.map((m) => (
    <MarkerF
      key={m.id}
      position={m.at}
      icon={mapPlaceIcon(
        { layer: 'tolls' },
        {
          size: m.passed ? PLACE_ICON_SIZES.tripTolls.visited : PLACE_ICON_SIZES.tripTolls.upcoming,
          hollow: !m.passed,
        },
      )}
      title={`Toll: ${m.title ?? 'plaza'}`}
      clickable
      onClick={() => {
        if (m.at)
          window.open(
            googleMapsUrl({ lat: m.at.lat, lng: m.at.lng, name: m.title }),
            '_blank',
            'noopener,noreferrer',
          );
      }}
      zIndex={5}
    />
  ));
}
