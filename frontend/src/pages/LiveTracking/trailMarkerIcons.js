export const createReplayTruckIcon = (heading = 0, zoom = 12) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const effectiveZ =
    typeof zoom === 'number' && !isNaN(zoom) ? Math.max(4, Math.min(20, zoom)) : 12;
  const sz = Math.round(38 + (effectiveZ - 4) * 3.2);
  const center = Math.round(sz / 2);
  // Clean directional "navigation cursor": soft halo + white disc + a crisp
  // green arrow that rotates to the direction of travel.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 48 48" data-scale="${sz}">
    <defs>
      <filter id="rsh" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#0B3D1A" flood-opacity="0.35"/>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="21" fill="#187A32" fill-opacity="0.16"/>
    <g filter="url(#rsh)">
      <circle cx="24" cy="24" r="14" fill="#FFFFFF"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="#187A32" stroke-width="2"/>
      <g transform="rotate(${Math.round(heading)}, 24, 24)">
        <path d="M24 13 L31 31 L24 26.5 L17 31 Z"
          fill="#187A32" stroke="#187A32" stroke-width="1" stroke-linejoin="round"/>
      </g>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(sz, sz),
    anchor: new window.google.maps.Point(center, center),
  };
};

export const createTrailEndpointIcon = (text, color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
    <text x="12" y="16" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${text}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  };
};
