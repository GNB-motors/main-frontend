import { memo } from 'react';
import { MarkerF, PolygonF } from '@react-google-maps/api';
import { POI_COLOR, poiBucket } from '../placeHubStyle.js';

const MAX_POI = 1500;

function poiIcon(color) {
  return {
    path: 'M -3.5 -3.5 L 3.5 -3.5 L 3.5 3.5 L -3.5 3.5 z',
    scale: 1,
    fillColor: color,
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 1,
  };
}

function poiTitle(p) {
  const what = (p.category || '').toLowerCase().replace(/_/g, ' ');
  const src = p.source === 'GOOGLE_PLACES' ? 'Google' : 'OpenStreetMap';
  return `${p.name || what} · ${what} · ${src}`;
}

const PoiLayer = memo(function PoiLayer({ pois }) {
  return (
    <>
      {pois
        .filter((p) => Array.isArray(p.footprint) && p.footprint.length > 3)
        .map((p) => {
          const color = POI_COLOR[poiBucket(p.category)];
          return (
            <PolygonF
              key={`fp-${p.source}-${p.sourceId}`}
              paths={p.footprint}
              options={{
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: color,
                fillOpacity: 0.06,
                clickable: false,
              }}
            />
          );
        })}
      {pois.slice(0, MAX_POI).map((p) => (
        <MarkerF
          key={`poi-${p.source}-${p.sourceId}`}
          position={{ lat: p.lat, lng: p.lng }}
          icon={poiIcon(POI_COLOR[poiBucket(p.category)])}
          title={poiTitle(p)}
          clickable={false}
          zIndex={0}
        />
      ))}
    </>
  );
});

export default PoiLayer;
