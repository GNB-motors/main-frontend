import DataTooltip from '../../../../components/ui/DataTooltip';
import { useMemo, useState } from 'react';
import { haversineKm } from '../../../LiveTracking/geoMath';
import { toISTDateString } from '../../../../utils/dateUtils';

// Geometry, city labels and stroke definitions from the supplied Intel Map.
const REGION = { west: 82.5, east: 89, south: 21.3, north: 27.3 };
const CITIES = [
  ['Patna', 85.14, 25.6],
  ['Kolkata', 88.36, 22.57],
  ['Ranchi', 85.33, 23.34],
  ['Kharagpur', 87.32, 22.34],
  ['Dhanbad', 86.43, 23.8],
  ['Durgapur', 87.31, 23.55],
  ['Gaya', 85.0, 24.79],
  ['Jamshedpur', 86.2, 22.8],
  ['Muzaffarpur', 85.39, 26.12],
  ['Bhagalpur', 87.0, 25.25],
  ['Varanasi', 82.99, 25.32],
];
const inside = (point, bounds) =>
  point.lng >= bounds.west &&
  point.lng <= bounds.east &&
  point.lat >= bounds.south &&
  point.lat <= bounds.north;

function mapData(track, livePosition, series) {
  const fix =
    livePosition?.latitude != null && livePosition?.longitude != null
      ? { lat: livePosition.latitude, lng: livePosition.longitude }
      : null;
  const points = (track?.points || []).filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
  );
  const locations = [...points, ...(fix ? [fix] : [])];
  let bounds = REGION;
  if (locations.some((point) => !inside(point, REGION))) {
    const lats = locations.map((point) => point.lat),
      lngs = locations.map((point) => point.lng);
    const padLat = Math.max(0.3, (Math.max(...lats) - Math.min(...lats)) * 0.15);
    const padLng = Math.max(0.3, (Math.max(...lngs) - Math.min(...lngs)) * 0.15);
    bounds = {
      west: Math.min(...lngs) - padLng,
      east: Math.max(...lngs) + padLng,
      south: Math.min(...lats) - padLat,
      north: Math.max(...lats) + padLat,
    };
  }
  const xy = (point) => [
    Math.round(((point.lng - bounds.west) / (bounds.east - bounds.west)) * 600),
    Math.round(((bounds.north - point.lat) / (bounds.north - bounds.south)) * 380),
  ];
  const routes = [];
  const gaps = (track?.segments || []).filter((segment) => segment.kind === 'GAP');
  let current = null;
  points.forEach((point, i) => {
    const gpsOnly = series.find((day) => day.day === toISTDateString(point.t))?.engineKm == null;
    const previous = points[i - 1];
    const gap =
      previous &&
      gaps.some(
        (segment) =>
          new Date(segment.fromT) < new Date(point.t) &&
          new Date(segment.toT) > new Date(previous.t),
      );
    if (!current || current.gpsOnly !== gpsOnly || gap) {
      current = { gpsOnly, points: previous && !gap ? [previous, point] : [point] };
      routes.push(current);
    } else current.points.push(point);
  });
  const stops = [];
  for (const stop of track?.stops || []) {
    if (!Number.isFinite(stop.place?.lat) || !Number.isFinite(stop.place?.lng)) continue;
    const location = { lat: stop.place.lat, lng: stop.place.lng };
    const cluster = stops.find(
      (entry) => haversineKm([entry.lat, entry.lng], [location.lat, location.lng]) <= 2,
    );
    if (cluster) cluster.n += 1;
    else stops.push({ ...location, n: 1, name: stop.place.name });
  }
  return {
    fixedRegion: bounds === REGION,
    cities: CITIES.map(([name, lng, lat]) => ({ name, lng, lat }))
      .filter((point) => inside(point, bounds))
      .map((point) => ({ ...point, xy: xy(point) })),
    routes: routes
      .filter((route) => route.points.length > 1)
      .map((route) => ({
        ...route,
        path: route.points.map((point, i) => `${i ? 'L' : 'M'} ${xy(point).join(' ')}`).join(' '),
      })),
    markers: [
      ...(fix ? [{ ...fix, n: '', kind: 'vehicle', name: 'Last position' }] : []),
      ...stops.map((stop) => ({ ...stop, kind: 'stop' })),
    ].map((point) => ({ ...point, xy: xy(point) })),
  };
}

export default function ReferenceOverviewMap({ track, livePosition, series, loading }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(null);
  const data = useMemo(() => mapData(track, livePosition, series), [track, livePosition, series]);
  return (
    <div className="vdo-map">
      <svg
        viewBox="0 0 600 380"
        role="img"
        aria-label="Vehicle's recorded routes and last position"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="380" stroke="#ECECEE" />
        ))}
        {[1, 2, 3].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 95} x2="600" y2={i * 95} stroke="#ECECEE" />
        ))}
        {data.fixedRegion ? (
          <>
            <path
              d="M 462 380 C 470 350, 500 330, 540 322 C 560 318, 580 300, 600 296"
              fill="none"
              stroke="#DFDFE2"
              strokeWidth="1.5"
            />
            <path
              d="M 0 150 C 80 160, 150 120, 230 135 C 300 148, 360 170, 420 200 C 450 220, 470 250, 500 300"
              fill="none"
              stroke="#E3E7F5"
              strokeWidth="3"
            />
            <text x="520" y="362" fontSize="9.5" fill="#B9B9BA" letterSpacing="1.5">
              BAY OF BENGAL
            </text>
          </>
        ) : null}
        {data.cities.map((city) => (
          <g key={city.name}>
            <circle cx={city.xy[0]} cy={city.xy[1]} r="2" fill="#93939A" />
            <text x={city.xy[0] + 5} y={city.xy[1] - 5} fontSize="10.5" fill="#747476">
              {city.name}
            </text>
          </g>
        ))}
        {data.routes.map((route, i) => (
          <path
            key={i}
            d={route.path}
            fill="none"
            stroke="#4469F0"
            strokeWidth={route.gpsOnly ? 2 : 2.5}
            strokeDasharray={route.gpsOnly ? '4 4' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {data.markers.map((point, i) => {
          const vehicle = point.kind === 'vehicle';
          const radius = Math.max(7, Math.min(22, 5 + Math.sqrt(Number(point.n) || 0) * 2.6));
          const stroke = vehicle ? '#213EA7' : '#747476';
          return (
            <g
              key={i}
              role="button"
              tabIndex="0"
              aria-label={`${point.name}${point.n ? ` · ${point.n} stops` : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={() => {
                setSelected(i);
                setHovered(i);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelected(i);
                }
              }}
            >
              <title>
                {point.name}
                {point.n ? ` · ${point.n} stops` : ''}
              </title>
              <circle
                cx={point.xy[0]}
                cy={point.xy[1]}
                r={radius + 7}
                fill={stroke}
                fillOpacity={selected === i ? 0.16 : 0}
              />
              <circle
                cx={point.xy[0]}
                cy={point.xy[1]}
                r={radius}
                fill={vehicle ? '#4469F0' : '#93939A'}
                fillOpacity={vehicle ? 1 : 0.22}
                stroke={stroke}
                strokeWidth={selected === i ? 2.6 : 1.5}
              />
              <text
                x={point.xy[0]}
                y={point.xy[1] + 3.5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill={vehicle ? '#FFFFFF' : '#121214'}
              >
                {point.n}
              </text>
            </g>
          );
        })}
        {!data.markers.length && !data.routes.length ? (
          <text x="300" y="190" textAnchor="middle" fill="#93939A" fontSize="12">
            {loading ? 'Loading recorded routes…' : 'No recorded positions'}
          </text>
        ) : null}
        {hovered != null && data.markers[hovered]
          ? (() => {
              const point = data.markers[hovered];
              const x = Math.max(8, Math.min(370, point.xy[0] - 110));
              const y = Math.max(8, point.xy[1] - 130);
              return (
                <g transform={`translate(${x}, ${y})`} pointerEvents="none" aria-hidden="true">
                  <foreignObject width="238" height="120" style={{ overflow: 'visible' }}>
                    <DataTooltip
                      label={
                        point.kind === 'vehicle'
                          ? 'Last position'
                          : `${point.n} long ${point.n === 1 ? 'stop' : 'stops'}`
                      }
                      details={[
                        point.name || 'Recorded stop',
                        `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
                        point.kind === 'vehicle' ? null : 'Clustered within 2 km',
                      ]}
                    />
                  </foreignObject>
                </g>
              );
            })()
          : null}
      </svg>
      <div className="vdo-map-legend">
        <span>
          <i className="vdo-map-key vdo-map-key--position" />
          Last position
        </span>
        <span>
          <i className="vdo-map-key vdo-map-key--stops" />
          Long stops
        </span>
        <span className="vdo-map-clusters">Clusters show count within 2 km</span>
      </div>
    </div>
  );
}
