import PlaceClusterer from '../PlaceHub/map/PlaceClusterer.jsx';
import PlaceShape from '../PlaceHub/map/PlaceShape.jsx';
import PlaceMarker from '../PlaceHub/map/PlaceMarker.jsx';
import PlaceAreaLabel from '../PlaceHub/map/PlaceAreaLabel.jsx';
import usePlaceAreaLabels from '../PlaceHub/map/usePlaceAreaLabels.js';
import ClusterRepaint from '../PlaceHub/map/ClusterRepaint.jsx';
import {
  CLUSTER_OPTIONS,
  CLUSTER_STYLES_DARK,
  CLUSTER_STYLES_LIGHT,
  detachClusterer,
} from '../PlaceHub/map/clusterer.js';

/* Place Hub's own pins, shapes and clusters, so a place looks the same on both
   pages. Drawn under the fleet: place pins sit at zIndex 10, trucks at 100+. */
export default function TrackPlacesLayer({ places, selectedId, onSelect, dark, zoom = 5 }) {
  const { labels, markerPlaces } = usePlaceAreaLabels(places, zoom, false, selectedId);
  if (!places.length) return null;
  const styles = dark ? CLUSTER_STYLES_DARK : CLUSTER_STYLES_LIGHT;
  return (
    <>
      {/* A learned area is always drawn. A place with no truck stops has only
          its imported guess circle, so that circle shows only when selected. */}
      {places.map((p) => (
        <PlaceShape
          key={`tp-s-${p.id}`}
          place={p}
          selected={p.id === selectedId}
          showCircle={p.id === selectedId}
          interactive
          onSelect={onSelect}
        />
      ))}
      {places.map(
        (p) =>
          labels.has(p.id) && (
            <PlaceAreaLabel key={`tp-label-${p.id}`} name={p.name} layout={labels.get(p.id)} />
          ),
      )}
      <PlaceClusterer
        places={markerPlaces}
        options={{ ...CLUSTER_OPTIONS, styles }}
        styles={styles}
        title="Zoom in to see these places"
        onUnmount={detachClusterer}
      >
        {(clusterer) => (
          <>
            {markerPlaces.map((p) => (
              <PlaceMarker
                key={`tp-m-${p.id}`}
                place={p}
                selected={p.id === selectedId}
                interactive
                onSelect={onSelect}
                clusterer={clusterer}
              />
            ))}
            <ClusterRepaint clusterer={clusterer} styles={styles} places={markerPlaces} />
          </>
        )}
      </PlaceClusterer>
    </>
  );
}
