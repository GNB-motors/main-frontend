import { RISK_COLOR } from '../placeHubStyle.js';

const PIN_PATH = 'M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z';
const DIAMOND_PATH = 'M 0 -7 L 7 0 L 0 7 L -7 0 z';

export function pinIcon(color, { selected = false, hollow = false, risk = false } = {}) {
  return {
    path: PIN_PATH,
    fillColor: hollow ? '#ffffff' : color,
    fillOpacity: 1,
    strokeColor: risk ? RISK_COLOR : hollow ? color : '#ffffff',
    strokeWeight: risk ? 3 : hollow ? 2.5 : 1.5,
    scale: selected ? 1.5 : 1.1,
    anchor: new window.google.maps.Point(12, 24),
  };
}

export function dotIcon(color, scale, { selected = false, opacity = 0.85 } = {}) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: opacity,
    strokeColor: selected ? '#0b1220' : '#ffffff',
    strokeWeight: selected ? 3 : 1.5,
    scale,
  };
}

export function diamondIcon(color, selected) {
  return {
    path: DIAMOND_PATH,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: selected ? 1.6 : 1.1,
  };
}
