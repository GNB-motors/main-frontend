import { PolylineF } from '@react-google-maps/api';
import { polylineOptions } from '../../lib/roadTrailGoogle.js';

export default function PassiveTrailLayer({ trail, color }) {
  if (!trail) return null;
  const circle = window.google?.maps?.SymbolPath?.CIRCLE ?? 0;
  return trail.paths.map((layer, index) => {
    const dotted = layer.pattern !== 'solid';
    const base = polylineOptions({ ...layer, pattern: dotted ? 'dotted' : 'solid', tone: 'road' }, { color, symbolCircle: circle });
    const options = dotted ? { ...base, icons: base.icons.map(item => ({ ...item, icon: { ...item.icon, fillColor: color, fillOpacity: 0.7, scale: 1.5 } })), zIndex: 3 } : { ...base, strokeColor: color, strokeWeight: 3, strokeOpacity: 0.7, zIndex: 3 };
    return <PolylineF key={index} path={layer.path} options={options} />;
  });
}
