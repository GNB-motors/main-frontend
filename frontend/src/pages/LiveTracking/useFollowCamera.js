import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const normalizeHeading = (value) => ((value % 360) + 360) % 360;

/** Own the map camera only while follow is enabled; retain one view to restore. */
export default function useFollowCamera({
  map,
  enabled,
  target,
  restoreView = true,
  onUnavailable,
}) {
  const saved = useRef(null);
  const restoreRef = useRef(restoreView);
  restoreRef.current = restoreView;
  const unavailableRef = useRef(onUnavailable);
  unavailableRef.current = onUnavailable;
  const [cameraHeading, setCameraHeading] = useState(0);
  const lat = target?.lat;
  const lng = target?.lng;
  const heading = target?.heading;

  // Marker artwork faces the road even when the map itself rotates.
  useEffect(() => {
    if (!map) return undefined;
    const update = () => setCameraHeading(map.getHeading?.() || 0);
    update();
    const listener = map.addListener?.('heading_changed', update);
    return () => listener?.remove();
  }, [map]);

  // Restore the old camera before the map wrapper snapshots/replaces its renderer.
  useLayoutEffect(() => {
    if (!enabled || !map) return undefined;
    if (map.getRenderingType?.() === 'RASTER' || !map.moveCamera) {
      unavailableRef.current?.();
      return undefined;
    }
    const center = map.getCenter?.();
    const view = {
      ...(center ? { center: { lat: center.lat(), lng: center.lng() } } : {}),
      ...(Number.isFinite(map.getZoom?.()) ? { zoom: map.getZoom() } : {}),
      heading: map.getHeading?.() || 0,
      tilt: map.getTilt?.() || 0,
    };
    saved.current = { view, focused: false, heading: view.heading };
    const rendererListener = map.addListener?.('renderingtype_changed', () => {
      if (map.getRenderingType?.() === 'RASTER') unavailableRef.current?.();
    });
    // Cancel an in-flight selection glide before taking over the camera.
    map.__cameraAnim = null;
    return () => {
      rendererListener?.remove();
      saved.current = null;
      map.moveCamera(restoreRef.current ? view : { heading: 0, tilt: 0 });
    };
  }, [map, enabled]);

  useEffect(() => {
    const session = saved.current;
    if (!enabled || !map || !session || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (heading != null && Number.isFinite(Number(heading)))
      session.heading = normalizeHeading(Number(heading));
    map.moveCamera({
      center: { lat, lng },
      tilt: 60,
      heading: session.heading,
      // Zoom in once on entry; respect the owner's zoom for the rest of the drive.
      ...(!session.focused ? { zoom: Math.max(map.getZoom?.() || 12, 16) } : {}),
    });
    session.focused = true;
  }, [map, enabled, lat, lng, heading]);

  return cameraHeading;
}
