import { useEffect, useMemo, useRef, useState } from 'react';
import { MarkerF, useLoadScript } from '@react-google-maps/api';
import VectorGoogleMap from '../../LiveTracking/VectorGoogleMap.jsx';
import { OSM_MAP_TYPE_ID } from '../../LiveTracking/osmGoogleMapType.js';
import OsmAttribution from '../../../components/map/OsmAttribution.jsx';
import { googleMapsLoaderOptions } from '../../../utils/googleMapsLoader.js';
import { boundsOf } from '../intelligence/model/mapBounds.js';
import './PlacePreviewMap.css';

const MAP_STYLE = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

/** The same road/satellite renderer as Live Tracking, sized for Place Hub previews. */
export default function PlacePreviewMap({ points, className = '', label }) {
  const { isLoaded, loadError } = useLoadScript(googleMapsLoaderOptions);
  const host = useRef(null);
  const [map, setMap] = useState(null);
  const [satellite, setSatellite] = useState(false);
  const center = useMemo(() => ({ lat: points[0].lat, lng: points[0].lng }), [points]);
  const options = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      isFractionalZoomEnabled: false,
      mapTypeId: satellite ? 'hybrid' : OSM_MAP_TYPE_ID,
      clickableIcons: false,
      gestureHandling: 'cooperative',
      maxZoom: 17,
    }),
    [satellite],
  );

  useEffect(() => {
    if (!map) return undefined;
    const fit = () => {
      if (
        points.length === 1 ||
        points.every((point) => point.lat === center.lat && point.lng === center.lng)
      ) {
        map.setCenter(center);
        map.setZoom(15);
      } else {
        map.fitBounds(boundsOf(points), 40);
      }
    };
    fit();
    // Modal opening animations change the canvas dimensions after map construction.
    const timer = setTimeout(fit, 150);
    const resize = new ResizeObserver(() => window.google.maps.event.trigger(map, 'resize'));
    resize.observe(host.current);
    return () => {
      clearTimeout(timer);
      resize.disconnect();
    };
  }, [map, points, center]);

  return (
    <div ref={host} className={`ph-preview-map ${className}`} role="region" aria-label={label}>
      {loadError ? (
        <p className="ph-preview-map__status" role="alert">
          The map could not load. Check your connection and refresh.
        </p>
      ) : !isLoaded ? (
        <p className="ph-preview-map__status" role="status">
          Loading map…
        </p>
      ) : (
        <>
          <VectorGoogleMap
            osmBasemap
            mapContainerStyle={MAP_STYLE}
            options={options}
            center={center}
            zoom={15}
            onLoad={setMap}
            onUnmount={() => setMap(null)}
          >
            {points.map((point, index) => (
              <MarkerF
                key={point.id || index}
                position={{ lat: point.lat, lng: point.lng }}
                title={point.label || 'Place'}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: index ? '#c56200' : '#4469f0',
                  fillOpacity: 0.85,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  labelOrigin: new window.google.maps.Point(0, index ? 20 : -20),
                }}
                label={
                  point.label
                    ? {
                        text: point.label,
                        className: 'ph-preview-map__label',
                        fontSize: '12px',
                        fontWeight: '500',
                      }
                    : undefined
                }
              />
            ))}
          </VectorGoogleMap>
          <div className="ph-preview-map__modes" role="group" aria-label="Map style">
            <button type="button" aria-pressed={!satellite} onClick={() => setSatellite(false)}>
              Map
            </button>
            <button type="button" aria-pressed={satellite} onClick={() => setSatellite(true)}>
              Satellite
            </button>
          </div>
          {!satellite && <OsmAttribution />}
        </>
      )}
    </div>
  );
}
