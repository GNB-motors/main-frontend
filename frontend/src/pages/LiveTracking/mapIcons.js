export const pinIcon = (color, dimmed) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" opacity="${dimmed ? 0.55 : 1}">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${color}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>`,
  )}`,
  scaledSize:
    typeof window !== 'undefined' && window.google
      ? new window.google.maps.Size(32, 40)
      : undefined,
});

/**
 * Dark plate-pill marker matching the live-tracking map's selected-vehicle
 * marker — a dark chip with a status dot + the plate and a pointer. Used by the
 * internal map and the public single-vehicle share page so a pin means the same
 * thing in both.
 */
export const plateMarkerIcon = (plate, color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="124" height="48" viewBox="0 0 124 48">
    <defs>
      <filter id="pm" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#pm)">
      <rect x="2" y="2" width="120" height="32" rx="7" fill="#0C1020" stroke="${color}" stroke-width="1.75"/>
      <circle cx="14" cy="18" r="5" fill="${color}"/>
      <text x="25" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" letter-spacing="0.4">${plate}</text>
      <polygon points="56,34 68,34 62,43" fill="#0C1020"/>
      <polygon points="57,34 67,34 62,42" fill="${color}"/>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(124, 48),
    anchor: new window.google.maps.Point(62, 45),
  };
};

/**
 * Repeating direction arrows for a breadcrumb polyline — gives the trail a clear
 * sense of travel direction (points run oldest→newest). Used by both the
 * internal live map and the public share page. Returns undefined until the
 * Google Maps SDK is ready.
 */
export const trailArrowIcons = (color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  return [
    {
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 2.6,
        strokeColor: '#ffffff',
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 1,
      },
      offset: '3%',
      repeat: '110px',
    },
  ];
};

/**
 * Cluster badge style generator
 */
export const CLUSTER_STYLES = [
  {
    textColor: '#FFFFFF',
    textSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '700',
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
        <circle cx="20" cy="20" r="14" fill="#3B82F6" opacity="0.2"/>
      </svg>`,
    )}`,
    height: 40,
    width: 40,
  },
  {
    textColor: '#FFFFFF',
    textSize: 13,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '700',
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#1E293B" stroke="#6366F1" stroke-width="2.5"/>
        <circle cx="24" cy="24" r="17" fill="#6366F1" opacity="0.25"/>
      </svg>`,
    )}`,
    height: 48,
    width: 48,
  },
  {
    textColor: '#FFFFFF',
    textSize: 14,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '800',
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="26" fill="#0F172A" stroke="#8B5CF6" stroke-width="3"/>
        <circle cx="28" cy="28" r="20" fill="#8B5CF6" opacity="0.3"/>
      </svg>`,
    )}`,
    height: 56,
    width: 56,
  },
];
