import { STATUS_THEME } from './vehicleMarkerIcon';

export function compactVehicleIcon(vehicle, selected = false, showLabel = false) {
  const key = String(vehicle.status || 'offline').toLowerCase();
  const theme = STATUS_THEME[key] || STATUS_THEME.offline;
  const offline = key === 'offline';
  const moving = key === 'moving';
  const heading = Number.isFinite(Number(vehicle.courseDegrees)) ? Number(vehicle.courseDegrees) : 0;
  const label = String(vehicle.plate || vehicle.registrationNumber || '').replace(/[<>&"']/g, '');
  const show = Boolean(label && (selected || showLabel));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${show ? 120 : 28}" height="${show ? 52 : 28}" viewBox="0 0 ${show ? 120 : 28} ${show ? 52 : 28}"><g transform="translate(${show ? 60 : 14} 14)"><circle r="10" fill="${offline ? '#fff' : theme.primary}" stroke="${offline ? theme.primary : '#fff'}" stroke-width="2"/>${moving ? `<path d="M-4 3 L0 -5 L4 3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${heading})"/>` : ''}</g>${show ? `<rect x="8" y="30" width="104" height="19" rx="4" fill="#172033"/><text x="60" y="43" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="white">${label}</text>` : ''}</svg>`;
  const maps = typeof window !== 'undefined' ? window.google?.maps : null;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: maps ? new maps.Size(show ? 120 : 28, show ? 52 : 28) : undefined, anchor: maps ? new maps.Point(show ? 60 : 14, 14) : undefined };
}
