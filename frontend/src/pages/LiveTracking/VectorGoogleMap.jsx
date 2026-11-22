import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContext } from '@react-google-maps/api';

/** Keep constructor-only options out of setOptions while sharing the map with existing layers. */
export default function VectorGoogleMap({
  children,
  options,
  center,
  zoom,
  mapContainerStyle,
  onLoad,
  onUnmount,
  onIdle,
  onZoomChanged,
  onClick,
}) {
  const container = useRef(null);
  const [map, setMap] = useState(null);
  const mutableOptions = useMemo(() => {
    const next = { ...options };
    delete next.renderingType;
    return next;
  }, [options]);
  const current = useRef(null);
  current.current = {
    options: mutableOptions,
    center,
    zoom,
    onLoad,
    onUnmount,
    onIdle,
    onZoomChanged,
    onClick,
  };
  const applied = useRef(null);

  useEffect(() => {
    const initial = current.current;
    const instance = new window.google.maps.Map(container.current, {
      ...initial.options,
      center: initial.center,
      zoom: initial.zoom,
      renderingType: 'VECTOR',
    });
    applied.current = { options: initial.options, center: initial.center, zoom: initial.zoom };
    const listeners = [
      instance.addListener('idle', () => current.current.onIdle?.()),
      instance.addListener('zoom_changed', () => current.current.onZoomChanged?.()),
      instance.addListener('click', (event) => current.current.onClick?.(event)),
    ];
    setMap(instance);
    initial.onLoad?.(instance);
    return () => {
      listeners.forEach((listener) => listener.remove());
      current.current.onUnmount?.(instance);
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    if (applied.current.options !== mutableOptions) {
      map.setOptions(mutableOptions);
      applied.current.options = mutableOptions;
    }
    if (applied.current.center !== center) {
      if (center) map.setCenter(center);
      applied.current.center = center;
    }
    if (applied.current.zoom !== zoom) {
      if (typeof zoom === 'number') map.setZoom(zoom);
      applied.current.zoom = zoom;
    }
  }, [map, mutableOptions, center, zoom]);

  return (
    <div ref={container} style={mapContainerStyle}>
      <MapContext.Provider value={map}>{map ? children : null}</MapContext.Provider>
    </div>
  );
}
