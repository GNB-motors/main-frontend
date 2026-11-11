/** A toll canopy, booth and raised barrier, shared by map markers and their legend. */
function markerUrl(visited) {
  const teal = '#0e7490';
  const ink = visited ? '#ffffff' : teal;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="36" viewBox="0 0 32 36">
    <path d="M9 2h14a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7h-3l-4 4-4-4H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7Z" fill="${visited ? teal : '#ffffff'}" stroke="#ffffff" stroke-width="3"/>
    <path d="M9 2h14a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7h-3l-4 4-4-4H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7Z" fill="none" stroke="${teal}" stroke-width="1.5"/>
    <g fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 12V8h18v4H7Zm2 0v12m14-12v12M7 24h18"/>
      <path d="M9 17h5v7m-3-9h1m5 9v-6l7-4"/>
      <path d="m20 16 .8 1.4"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const TOLL_MARKER_URL = { used: markerUrl(true), other: markerUrl(false) };

export function tollMarkerIcon(visited) {
  return {
    url: visited ? TOLL_MARKER_URL.used : TOLL_MARKER_URL.other,
    scaledSize: new window.google.maps.Size(32, 36),
    anchor: new window.google.maps.Point(16, 34),
  };
}
