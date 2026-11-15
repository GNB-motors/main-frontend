// Truck artwork adapted from DriverApp/frontend/src/telematics/guidance/navTruckIcon.js.
// The driver's own truck on the navigation map, drawn like Google Maps' car icons: a shaded
// top-down vehicle on a soft ground shadow. The cab faces up at heading 0.
export const NAV_TRUCK_VIEWBOX = 96;

export function navTruckSvg({ heading = 0, color = '#2563eb', deep = '#1e40af', bodyHighlight = '#93c5fd' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
  <defs>
    <filter id="t-shadow" x="-50%" y="-30%" width="200%" height="160%">
      <feGaussianBlur stdDeviation="2.6"/>
    </filter>
    <linearGradient id="t-cab" x1="34" y1="0" x2="62" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${deep}"/>
      <stop offset="0.45" stop-color="${color}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <linearGradient id="t-box" x1="33" y1="0" x2="63" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${deep}"/>
      <stop offset="0.2" stop-color="${color}"/>
      <stop offset="0.5" stop-color="${bodyHighlight}"/>
      <stop offset="0.8" stop-color="${color}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <linearGradient id="t-glass" x1="48" y1="22" x2="48" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5B6B85"/>
      <stop offset="1" stop-color="#1B2433"/>
    </linearGradient>
  </defs>
  <g transform="rotate(${heading}, 48, 48)">
    <rect x="33" y="17" width="31" height="66" rx="7" fill="#0B1B3F" fill-opacity="0.35" filter="url(#t-shadow)"/>
    <rect x="31.5" y="22" width="3" height="5" rx="1.2" fill="${deep}"/>
    <rect x="61.5" y="22" width="3" height="5" rx="1.2" fill="${deep}"/>
    <path d="M36 21 Q36 13 48 13 Q60 13 60 21 L60 36 L36 36 Z" fill="url(#t-cab)"/>
    <rect x="38" y="13.6" width="5" height="1.6" rx="0.8" fill="#FFF6C8"/>
    <rect x="53" y="13.6" width="5" height="1.6" rx="0.8" fill="#FFF6C8"/>
    <path d="M38.5 22 Q48 19 57.5 22 L56.5 29 Q48 27.5 39.5 29 Z" fill="url(#t-glass)"/>
    <path d="M40 22.2 Q44 21 47 20.8 L46 23 Q43 23.2 40.4 24 Z" fill="#FFFFFF" fill-opacity="0.35"/>
    <rect x="40" y="30.5" width="16" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.22"/>
    <rect x="44" y="35.5" width="8" height="3" fill="#2B3445"/>
    <rect x="34.5" y="38" width="27" height="44" rx="2.5" fill="url(#t-box)" stroke="${deep}" stroke-width="1.2"/>
    <rect x="37.5" y="41" width="21" height="38" rx="1.5" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8"/>
    <path d="M48 41 L48 79" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8"/>
    <rect x="34.5" y="80" width="27" height="2" rx="1" fill="#E5484D"/>
  </g>
</svg>`;
}
