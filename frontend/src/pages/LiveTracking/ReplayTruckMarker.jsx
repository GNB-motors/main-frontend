import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import replayAppearance from '../../components/map/replayAppearance.js';
import '../../components/map/replayTruck.css';

export default function ReplayTruckMarker({ position, fast }) {
  const map = useGoogleMap();
  const positionRef = useRef(position);
  positionRef.current = position;
  const overlayRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google) return undefined;
    const element = document.createElement('div');
    element.style.cssText =
      'position:absolute;pointer-events:none;z-index:1200;will-change:transform';
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', 'Replay vehicle');
    // Only static, developer-authored markup is shared with Route Hub's Leaflet marker.
    element.innerHTML = replayAppearance.truckHtml;
    elementRef.current = element;
    const overlay = new window.google.maps.OverlayView();
    overlay.onAdd = () => overlay.getPanes().overlayMouseTarget.appendChild(element);
    overlay.draw = () => {
      const projection = overlay.getProjection();
      const current = positionRef.current;
      if (!projection || !current) return;
      const pixel = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(current));
      if (pixel)
        element.style.transform = `translate3d(${pixel.x - replayAppearance.anchor}px, ${pixel.y - replayAppearance.anchor}px, 0)`;
    };
    overlay.onRemove = () => element.remove();
    overlayRef.current = overlay;
    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
      elementRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    // Move the existing DOM node; replacing SVG marker URLs each frame can flicker.
    elementRef.current?.querySelector('.rh-truck').classList.toggle('fast', Boolean(fast));
    overlayRef.current?.draw();
  }, [position, fast]);

  return null;
}
