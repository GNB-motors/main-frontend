import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import replayAppearance from '../../components/map/replayAppearance.js';
import '../../components/map/replayTruck.css';

/**
 * The truck of the replay, drawn as an overlay so it sits above the line.
 *
 * The marker is one DOM node that is moved, never replaced: replacing the SVG
 * every frame makes the icon flicker. The heading turns the truck to the way
 * it was going (the icon points east, so a northbound truck is turned -90°).
 */
export default function ReplayTruckMarker({ position, fast, heading = null }) {
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
    const truck = elementRef.current?.querySelector('.rh-truck');
    truck?.classList.toggle('fast', Boolean(fast));
    if (truck && Number.isFinite(Number(heading))) {
      const inner = truck.querySelector('div');
      // The truck icon points east; north (0°) is a quarter turn back.
      if (inner) inner.style.transform = `rotate(${Number(heading) - 90}deg)`;
    }
    overlayRef.current?.draw();
  }, [position, fast, heading]);

  return null;
}
