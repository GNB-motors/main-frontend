import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, PolylineF, useLoadScript } from '@react-google-maps/api';
import { googleMapsLoaderOptions } from '../../../../utils/googleMapsLoader';
import { LIGHT_MAP_STYLE } from '../../../LiveTracking/mapStyles';
import { vehicleLocationName } from './referenceOverviewModel';
import { fitMapToPositions } from '../../../LiveTracking/mapPlotting';

const mapStyle = { width: '100%', height: '100%' };
const mapOptions = {
  styles: LIGHT_MAP_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'cooperative',
};
const routeStyle = { strokeColor: '#315be1', strokeWeight: 3 };

function coordinates(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
}

function mapData(track, livePosition) {
  const fix = coordinates(livePosition?.latitude, livePosition?.longitude);
  const gaps = (track?.segments || []).filter((segment) => segment.kind === 'GAP');
  const points = (track?.points || []).filter((point) => coordinates(point.lat, point.lng));
  const paths = [];
  let path = [];
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (previous && gaps.some((gap) => gap.fromT < point.t && gap.toT > previous.t)) {
      if (path.length > 1) paths.push(path);
      path = [];
    }
    path.push({ lat: point.lat, lng: point.lng });
  });
  if (path.length > 1) paths.push(path);

  const stops = new Map();
  for (const stop of track?.stops || []) {
    const place = stop.place;
    const position = coordinates(place?.lat, place?.lng) ?? coordinates(stop.lat, stop.lng);
    if (!position) continue;
    const recordedName = place?.name === 'Unnamed place' ? null : place?.name;
    const locality = place?.locality || place?.town || place?.siteAddress?.locality;
    const name = recordedName || (locality ? `Unnamed stop near ${locality}` : 'Unnamed stop');
    const key = place?.id ?? `${position.lat},${position.lng}`;
    if (!stops.has(key)) stops.set(key, { key, name, position });
  }

  return {
    paths,
    stops: [...stops.values()],
    fix,
    positions: [
      ...points,
      ...Array.from(stops.values(), (stop) => stop.position),
      ...(fix ? [fix] : []),
    ].map(({ lat, lng }) => ({ latitude: lat, longitude: lng })),
  };
}

function RoadMap({ data, location }) {
  const { isLoaded, loadError } = useLoadScript(googleMapsLoaderOptions);
  const [map, setMap] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  useEffect(() => fitMapToPositions(map, data.positions), [map, data.positions]);

  if (loadError) return <p role="alert">The road map could not load.</p>;
  if (!isLoaded) return <p role="status">Loading road map…</p>;

  return (
    <>
      <div className="vdo-road-map" role="region" aria-label="30-day truck route and stops">
        <GoogleMap
          mapContainerStyle={mapStyle}
          options={mapOptions}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
        >
          {data.paths.map((path, index) => (
            <PolylineF key={index} path={path} options={routeStyle} />
          ))}
          {data.stops.map((stop) => (
            <MarkerF
              key={stop.key}
              position={stop.position}
              title={stop.name}
              onClick={() => setSelectedStop(stop.key)}
            />
          ))}
          {data.fix ? (
            <MarkerF position={data.fix} title={`Last known position · ${location}`} label="●" />
          ) : null}
        </GoogleMap>
      </div>
      <p className="vdo-map-legend">
        <span>
          <i className="vdo-map-key" /> Recorded route
        </span>
        <span>● Last known position</span>
        <span>Pins mark recorded stops</span>
        {data.stops.find((stop) => stop.key === selectedStop)?.name || null}
      </p>
    </>
  );
}

export default function ReferenceOverviewMap({ track, livePosition, error, onRetry }) {
  const data = useMemo(() => mapData(track, livePosition), [track, livePosition]);
  return (
    <div className="vdo-map">
      {error ? (
        <p role="alert">
          Could not load the 30-day route.{' '}
          <button type="button" className="v360-btn" onClick={onRetry}>
            Try again
          </button>
        </p>
      ) : null}
      {!data.positions.length ? (
        error ? null : (
          <p>No recorded positions for this period.</p>
        )
      ) : googleMapsLoaderOptions.googleMapsApiKey ? (
        <RoadMap data={data} location={vehicleLocationName(livePosition)} />
      ) : (
        <p>The road map is unavailable. Use Open in tracking to view the route.</p>
      )}
    </div>
  );
}
