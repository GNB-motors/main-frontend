import { CircleF, MarkerF } from '@react-google-maps/api';
import { colorForPlace, mapPlaceIcon } from './mapPlaceIcon.js';

/** Below this zoom a few-hundred-metre circle is a speck; draw the pin only. */
const SHAPE_MIN_ZOOM = 13;

/**
 * MapPlacesLayer — the extra place layers on the Track map.
 *
 * Our own places keep their own pins (Place Hub's look). These are the
 * landmarks around the road: pumps, dhabas, hospitals, workshops. Each
 * layer has its own colour, and the colour is the same one the legend dot
 * uses, so the owner learns the key once.
 */
export default function MapPlacesLayer({ places = [], zoom = 0, selectedId = null, onSelect }) {
  if (!places.length) return null;

  return (
    <>
      {places.map((place) => {
        const selected = place.id === selectedId;
        const color = colorForPlace(place);
        const showCircle = zoom >= SHAPE_MIN_ZOOM && place.radiusM;
        return (
          <span key={place.id}>
            {showCircle ? (
              <CircleF
                center={{ lat: place.lat, lng: place.lng }}
                radius={place.radiusM}
                options={{
                  strokeColor: color,
                  strokeOpacity: 0.9,
                  strokeWeight: selected ? 3 : 1.5,
                  fillColor: color,
                  fillOpacity: 0.08,
                  clickable: true,
                }}
                onClick={() => onSelect?.(place.id)}
              />
            ) : null}
            <MarkerF
              position={{ lat: place.lat, lng: place.lng }}
              icon={mapPlaceIcon(place, { size: 22, selected })}
              title={place.name}
              clickable
              zIndex={selected ? 900 : 20}
              onClick={() => onSelect?.(place.id)}
            />
          </span>
        );
      })}
    </>
  );
}
