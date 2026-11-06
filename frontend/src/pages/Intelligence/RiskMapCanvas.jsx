import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { googleMapsLoaderOptions } from '../../utils/googleMapsLoader.js';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from '../LiveTracking/mapStyles.js';
import LiveIdleMarker from '../PlaceHub/map/LiveIdleMarker.jsx';
import ScaledDot from '../PlaceHub/map/ScaledDot.jsx';
import HotspotShape from '../PlaceHub/map/HotspotShape.jsx';
import { IDLE_COLOR, idleTone, DRAIN_COLOR } from '../PlaceHub/placeHubStyle.js';
import { formatInrCompact } from '../../utils/formatters.js';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%', minHeight: '520px' };
const INDIA_CENTER = { lat: 22.5, lng: 82 };

const scaleFor = (value, max, lo = 7, hi = 20) =>
  max > 0 ? lo + (hi - lo) * Math.sqrt(Math.max(0, value) / max) : lo;

function RiskMapCanvas({
  type = 'idling',
  idleLive = [],
  idleSpots = [],
  hotspots = [],
  drainCells = [],
  selectedId = null,
  onSelect,
  isDark = false,
}) {
  const { isLoaded, loadError } = useLoadScript(googleMapsLoaderOptions);
  const [map, setMap] = useState(null);
  const hasFitInitially = useRef(false);

  const maxIdle = useMemo(
    () => Math.max(0, ...idleSpots.map((s) => s.rupees || 0)),
    [idleSpots],
  );
  const maxDrain = useMemo(
    () => Math.max(0, ...drainCells.map((c) => c.rupees || c.events || 0)),
    [drainCells],
  );

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
    }),
    [isDark],
  );

  // Auto-fit bounds once when points arrive
  useEffect(() => {
    if (!map || hasFitInitially.current || !window.google?.maps?.LatLngBounds) return;
    const bounds = new window.google.maps.LatLngBounds();
    let pointCount = 0;

    if (type === 'idling') {
      idleLive.forEach((e) => {
        if (Number.isFinite(Number(e.lat)) && Number.isFinite(Number(e.lng))) {
          bounds.extend({ lat: Number(e.lat), lng: Number(e.lng) });
          pointCount++;
        }
      });
      idleSpots.forEach((s) => {
        if (Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))) {
          bounds.extend({ lat: Number(s.lat), lng: Number(s.lng) });
          pointCount++;
        }
      });
    } else if (type === 'fuel') {
      hotspots.forEach((h) => {
        if (Number.isFinite(Number(h.lat)) && Number.isFinite(Number(h.lng))) {
          bounds.extend({ lat: Number(h.lat), lng: Number(h.lng) });
          pointCount++;
        }
      });
      drainCells.forEach((c) => {
        if (Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))) {
          bounds.extend({ lat: Number(c.lat), lng: Number(c.lng) });
          pointCount++;
        }
      });
    }

    if (pointCount > 0) {
      map.fitBounds(bounds, 50);
      hasFitInitially.current = true;
    }
  }, [map, type, idleLive, idleSpots, hotspots, drainCells]);

  // Pan to selected point if selectedId changes
  useEffect(() => {
    if (!map || !selectedId) return;
    let target = null;
    if (type === 'idling') {
      if (selectedId.startsWith('live:')) {
        const id = selectedId.replace(/^live:/, '');
        const item = idleLive.find((e) => String(e._id) === id);
        if (item) target = { lat: Number(item.lat), lng: Number(item.lng) };
      } else {
        const item = idleSpots.find((s) => s.id === selectedId);
        if (item) target = { lat: Number(item.lat), lng: Number(item.lng) };
      }
    } else if (type === 'fuel') {
      if (selectedId.startsWith('hotspot:')) {
        const item = hotspots.find((h) => h.id === selectedId);
        if (item) target = { lat: Number(item.lat), lng: Number(item.lng) };
      } else {
        const item = drainCells.find((c) => c.id === selectedId);
        if (item) target = { lat: Number(item.lat), lng: Number(item.lng) };
      }
    }

    if (target && Number.isFinite(target.lat) && Number.isFinite(target.lng)) {
      map.panTo(target);
      if (map.getZoom() < 12) {
        map.setZoom(12);
      }
    }
  }, [map, selectedId, type, idleLive, idleSpots, hotspots, drainCells]);

  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  if (loadError) {
    return (
      <div className="intel-map-fallback" role="alert">
        <p>Could not load Google Maps.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="intel-map-fallback">
        <p>Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={INDIA_CENTER}
      zoom={5}
      options={mapOptions}
      onLoad={handleMapLoad}
    >
      {type === 'idling' && (
        <>
          {idleSpots.map((s) => (
            <ScaledDot
              key={s.id}
              id={s.id}
              lat={s.lat}
              lng={s.lng}
              color={IDLE_COLOR[idleTone(s.excessShare)]}
              scale={scaleFor(s.rupees, maxIdle)}
              title={`${s.events} idles · ${formatInrCompact(s.rupees)} burned`}
              selected={s.id === selectedId}
              interactive={true}
              onSelect={onSelect}
            />
          ))}
          {idleLive.map((e) => (
            <LiveIdleMarker
              key={`live-${e._id}`}
              event={e}
              selected={`live:${e._id}` === selectedId}
              interactive={true}
              onSelect={onSelect}
            />
          ))}
        </>
      )}

      {type === 'fuel' && (
        <>
          {drainCells.map((c) => (
            <ScaledDot
              key={c.id}
              id={c.id}
              lat={c.lat}
              lng={c.lng}
              color={DRAIN_COLOR}
              scale={scaleFor(c.rupees || c.events, maxDrain)}
              title={`${c.events} fuel drops · ${formatInrCompact(c.rupees)}`}
              selected={c.id === selectedId}
              interactive={true}
              onSelect={onSelect}
            />
          ))}
          {hotspots.map((h) => (
            <HotspotShape
              key={h.id}
              hotspot={h}
              selected={h.id === selectedId}
              interactive={true}
              onSelect={onSelect}
            />
          ))}
        </>
      )}
    </GoogleMap>
  );
}

export default memo(RiskMapCanvas);

