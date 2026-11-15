import { MarkerF, PolylineF } from '@react-google-maps/api';
import { polylineOptions } from '../../lib/roadTrailGoogle.js';
import { formatIst } from '../../utils/redesign/format';

export default function PassiveTrailLayer({ trail, color }) {
  if (!trail) return null;
  const circle = window.google?.maps?.SymbolPath?.CIRCLE ?? 0;
  const lines = trail.paths.map((layer, index) => {
    const dotted = layer.pattern !== 'solid';
    const base = polylineOptions({ ...layer, pattern: dotted ? 'dotted' : 'solid', tone: 'road' }, { color, symbolCircle: circle });
    const options = dotted ? { ...base, icons: base.icons.map(item => ({ ...item, icon: { ...item.icon, fillColor: color, fillOpacity: 0.7, scale: 1.5 } })), zIndex: 3 } : { ...base, strokeColor: color, strokeWeight: 3, strokeOpacity: 0.7, zIndex: 3 };
    return <PolylineF key={`p${index}`} path={layer.path} options={options} />;
  });
  // One quiet ring per stop; the stop the truck stands at now already has its
  // own marker, so it is not drawn twice.
  const stops = (trail.stops || []).filter((stop) => !stop.current).map((stop) => (
    <MarkerF
      key={`s${stop.from}`}
      position={{ lat: stop.lat, lng: stop.lng }}
      title={`Stopped ${formatIst(stop.from)} – ${formatIst(stop.to)}`}
      zIndex={4}
      icon={{ path: circle, scale: 5, fillColor: '#ffffff', fillOpacity: 1, strokeColor: color, strokeWeight: 2.5 }}
    />
  ));
  return [...lines, ...stops];
}
