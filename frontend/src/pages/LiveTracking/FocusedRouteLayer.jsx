import { OverlayView, PolylineF } from '@react-google-maps/api';

export default function FocusedRouteLayer({ route }) {
  if (!route) return null;
  const longitudes = route.points.map((point) => point.lng);
  const middleLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
  return <>
    {route.segments.map((path, index) => <span key={index}>
      <PolylineF path={path} options={{ strokeColor: '#ffffff', strokeWeight: 10, strokeOpacity: 0.95, clickable: false, zIndex: 11000 }} />
      <PolylineF path={path} options={{ strokeColor: '#2563eb', strokeWeight: 5, strokeOpacity: route.source === 'ENGINE' ? 0.6 : 1, clickable: false, zIndex: 11001,
        icons: [{ icon: { path: 'M -2,2 0,0 2,2', strokeColor: '#ffffff', strokeWeight: 2, scale: 2 }, offset: '50%', repeat: '140px' }] }} />
    </span>)}
    {[{ ...route.start, key: 'start', letter: 'A', label: 'Start' }, { ...route.end, key: 'end', letter: 'B', label: 'End' }].map((end) => end.position ? (
      <OverlayView key={end.key} position={end.position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
        <div className={`lt-route-map-end lt-route-map-end--${end.key} ${end.position.lng > middleLng ? 'is-label-left' : ''}`} aria-label={`${end.label}: ${end.name}`}>
          <span className="lt-route-map-pin">{end.letter}</span>
          <div className="lt-route-map-label"><small>{end.label}</small><strong>{end.name}</strong></div>
        </div>
      </OverlayView>
    ) : null)}
  </>;
}
