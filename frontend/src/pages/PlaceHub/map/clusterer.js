/** Above this zoom places a kilometre apart no longer overlap; show every pin. */
const CLUSTER_MAX_ZOOM = 12;

function clusterStyle(size, textSize, { fill, text }) {
  const r = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${r}" cy="${r}" r="${r - 1}" fill="${fill}" fill-opacity="0.2"/><circle cx="${r}" cy="${r}" r="${r - 6}" fill="${fill}" stroke="#ffffff" stroke-width="2"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    width: size,
    height: size,
    textColor: text,
    textSize,
    fontWeight: '700',
    fontFamily: 'inherit',
  };
}

// Neutral, so a cluster is never mistaken for one place type's colour.
const clusterStyles = (tone) => [
  clusterStyle(34, 12, tone),
  clusterStyle(40, 12, tone),
  clusterStyle(46, 13, tone),
];
export const CLUSTER_STYLES_LIGHT = clusterStyles({ fill: '#1e293b', text: '#ffffff' });
export const CLUSTER_STYLES_DARK = clusterStyles({ fill: '#cbd5e1', text: '#0f172a' });
export const CLUSTER_OPTIONS = { gridSize: 52, maxZoom: CLUSTER_MAX_ZOOM, averageCenter: true };

// MarkerClustererF leaves its overlay on the map when it unmounts, so without
// this the cluster bubbles would linger on the Idling and Fuel risk tabs.
export function detachClusterer(clusterer) {
  clusterer.clearMarkers();
  clusterer.setMap(null);
}
