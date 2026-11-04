import { MarkerClustererF } from '@react-google-maps/api';
import PlaceShape from '../PlaceHub/map/PlaceShape.jsx';
import PlaceMarker from '../PlaceHub/map/PlaceMarker.jsx';
import ClusterRepaint from '../PlaceHub/map/ClusterRepaint.jsx';
import {
  CLUSTER_OPTIONS,
  CLUSTER_STYLES_DARK,
  CLUSTER_STYLES_LIGHT,
  detachClusterer,
} from '../PlaceHub/map/clusterer.js';

/** Below this zoom a few-hundred-metre circle is a speck; draw the pin only (as Place Hub). */
const SHAPE_MIN_ZOOM = 11;

/* Place Hub's own pins, shapes and clusters, so a place looks the same on both
   pages. Drawn under the fleet: place pins sit at zIndex 10, trucks at 100+. */
export default function TrackPlacesLayer({ places, selectedId, onSelect, zoom, dark }) {
  if (!places.length) return null;
  const showShapes = zoom >= SHAPE_MIN_ZOOM;
  const styles = dark ? CLUSTER_STYLES_DARK : CLUSTER_STYLES_LIGHT;
  return (
    <>
      {places.map((p) => (
        <PlaceShape
          key={`tp-s-${p.id}`}
          place={p}
          selected={p.id === selectedId}
          showCircle={showShapes || p.id === selectedId}
          interactive
          onSelect={onSelect}
        />
      ))}
      <MarkerClustererF
        options={{ ...CLUSTER_OPTIONS, styles }}
        styles={styles}
        title="Zoom in to see these places"
        onUnmount={detachClusterer}
      >
        {(clusterer) => (
          <>
            {places.map((p) => (
              <PlaceMarker
                key={`tp-m-${p.id}`}
                place={p}
                selected={p.id === selectedId}
                interactive
                onSelect={onSelect}
                clusterer={clusterer}
              />
            ))}
            <ClusterRepaint clusterer={clusterer} styles={styles} places={places} />
          </>
        )}
      </MarkerClustererF>
    </>
  );
}
