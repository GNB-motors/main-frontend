import { GoogleMapsMarkerClusterer } from '@react-google-maps/api';

export const CLUSTER_MAX_ZOOM = 15;

/** Supercluster caches marker identities; live vehicles also move in place. */
export function createLiveClusterAlgorithm() {
  let algorithm;
  let positions;
  return {
    calculate(input) {
      const next = input.markers
        .map((marker) => {
          const point = marker.getPosition();
          return `${point?.lat()},${point?.lng()}`;
        })
        .join('|');
      const moved = next !== positions;
      if (!algorithm || moved) {
        algorithm = new GoogleMapsMarkerClusterer.SuperClusterAlgorithm({
          radius: 65,
          maxZoom: CLUSTER_MAX_ZOOM,
        });
        positions = next;
      }
      const result = algorithm.calculate(input);
      return { ...result, changed: moved || result.changed };
    },
  };
}

export function createClusterRenderer() {
  return {
    render({ count, position }) {
      const g = window.google.maps;
      const size = count >= 100 ? 54 : count >= 10 ? 46 : 40;
      return new g.Marker({
        position,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: size / 2,
          fillColor: '#1d4ed8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: { text: String(count), color: '#ffffff', fontSize: '13px', fontWeight: '700' },
        title: `${count} vehicles. Click to zoom in.`,
        zIndex: 600 + count,
      });
    },
  };
}
