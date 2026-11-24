import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContext } from '@react-google-maps/api';

/** Set the renderer only at construction; replace the map when 3D is toggled. */
export default function VectorGoogleMap({
  children,
  options,
  renderingType = 'RASTER',
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
  const [loaded, setLoaded] = useState(null);
  // Detach layers from the previous renderer before attaching to its replacement.
  const map = loaded?.renderingType === renderingType ? loaded.instance : null;
  const lastView = useRef(null);
  const mutableOptions = useMemo(() => {
    const next = { ...options };
    delete next.renderingType;
    // Embedded colour styles work on the normal raster map only.
    if (renderingType === 'VECTOR') delete next.styles;
    return next;
  }, [options, renderingType]);
  const current = useRef(null);
  current.current = {
    options: mutableOptions,
    renderingType,
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
    const mapsApi = window.google.maps;
    const instance = new mapsApi.Map(container.current, {
      ...initial.options,
      center: initial.center,
      zoom: initial.zoom,
      ...lastView.current,
      heading: 0,
      tilt: 0,
      renderingType: initial.renderingType,
    });
    applied.current = {
      options: initial.options,
      renderingType: initial.renderingType,
      center: initial.center,
      zoom: initial.zoom,
    };
    const listeners = [
      instance.addListener('idle', () => current.current.onIdle?.()),
      instance.addListener('zoom_changed', () => current.current.onZoomChanged?.()),
      instance.addListener('click', (event) => current.current.onClick?.(event)),
    ];
    setLoaded({ instance, renderingType: initial.renderingType });
    initial.onLoad?.(instance);
    return () => {
      const cameraCenter = instance.getCenter?.();
      const cameraZoom = instance.getZoom?.();
      lastView.current = {
        ...(cameraCenter ? { center: { lat: cameraCenter.lat(), lng: cameraCenter.lng() } } : {}),
        ...(Number.isFinite(cameraZoom) ? { zoom: cameraZoom } : {}),
      };
      instance.__cameraAnim = null;
      listeners.forEach((listener) => listener.remove());
      current.current.onUnmount?.(instance);
      mapsApi.event?.clearInstanceListeners?.(instance);
    };
  }, [renderingType]);

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
      if (typeof zoom === 'number' && map.getZoom?.() !== zoom) map.setZoom(zoom);
      applied.current.zoom = zoom;
    }
  }, [map, mutableOptions, renderingType, center, zoom]);

  return (
    <div ref={container} style={mapContainerStyle}>
      <MapContext.Provider value={map}>{map ? children : null}</MapContext.Provider>
    </div>
  );
}
