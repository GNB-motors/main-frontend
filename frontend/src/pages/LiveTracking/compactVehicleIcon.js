import { STATUS_THEME } from './vehicleMarkerIcon';
import { navTruckSvg } from './navTruckIcon.js';

const BODY_HIGHLIGHTS = { moving: '#4ade80', stopped: '#c084fc', idling: '#fb923c', offline: '#cbd5e1' };

/** Navigation's top-down truck, tinted by live fleet status. */
export function compactVehicleIcon(vehicle, selected = false, showLabel = false) {
  const key = String(vehicle.status || 'offline').toLowerCase();
  const theme = STATUS_THEME[key] || STATUS_THEME.offline;
  const course = Number(vehicle.courseDegrees ?? vehicle.heading ?? 0);
  const heading = Number.isFinite(course) ? ((course % 360) + 360) % 360 : 0;
  const label = String(vehicle.plate || vehicle.registrationNumber || '').replace(/[<>&"']/g, '');
  const show = Boolean(label && (selected || showLabel));
  const size = selected ? 56 : 48;
  const width = show ? 120 : size;
  const height = show ? size + 24 : size;
  const centerX = width / 2;
  const centerY = size / 2;
  const truck = navTruckSvg({ heading, color: theme.primary, deep: theme.dark, bodyHighlight: BODY_HIGHLIGHTS[key] || theme.primary })
    .replace('width="96" height="96"', `x="${centerX - size / 2}" y="0" width="${size}" height="${size}"`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${selected ? `<circle cx="${centerX}" cy="${centerY}" r="${size / 2 - 3}" fill="${theme.primary}" fill-opacity="0.12" stroke="${theme.primary}" stroke-width="1.5" stroke-opacity="0.4"/>` : ''}
    ${truck}
    ${show ? `<rect x="8" y="${size + 2}" width="104" height="19" rx="4" fill="#172033"/><text x="60" y="${size + 15}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="white">${label}</text>` : ''}
  </svg>`;
  const maps = typeof window !== 'undefined' ? window.google?.maps : null;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: maps ? new maps.Size(width, height) : undefined,
    anchor: maps ? new maps.Point(centerX, centerY) : undefined };
}
