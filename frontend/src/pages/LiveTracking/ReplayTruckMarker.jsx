import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { navTruckSvg } from './navTruckIcon.js';
import '../../components/map/replayTruck.css';

const THEMES = {
  moving: { color: '#0C9F41', deep: '#088B36', highlight: '#4ade80' },
  stopped: { color: '#9333EA', deep: '#7E22CE', highlight: '#c084fc' },
  idling: { color: '#F97316', deep: '#C2410C', highlight: '#fb923c' },
  fast: { color: '#EF4444', deep: '#DC2626', highlight: '#fca5a5' },
};

function resolveStatusKey(speedKmh, isFast, ignition) {
  if (isFast) return 'fast';
  if (speedKmh > 3) return 'moving';
  if (ignition) return 'idling';
  return 'stopped';
}

/**
 * Authentic telematics top-down truck for replay, matching Live Tracking style.
 *
 * Renders on a Google Maps OverlayView with:
 * - Direction-oriented top-down commercial truck (navTruckSvg) with cab, windshield,
 *   headlights, container body, and taillights (NO circular background disks).
 * - Dynamic status theme for the vehicle SVG: Green (moving), Purple (stopped),
 *   Orange (idling), Red (overspeed).
 * - Rectangular label box with fixed high-contrast color showing vehicle plate and speed.
 * - Smooth transform animation without reconstructing the DOM per frame.
 */
export default function ReplayTruckMarker({
  position,
  fast,
  heading = null,
  speedKmh = 0,
  ignition = false,
  registration = '',
}) {
  const map = useGoogleMap();
  const positionRef = useRef(position);
  positionRef.current = position;
  const overlayRef = useRef(null);
  const elementRef = useRef(null);
  const lastStatusRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google) return undefined;

    const element = document.createElement('div');
    element.className = 'replay-truck-marker';
    element.style.cssText =
      'position:absolute;pointer-events:none;z-index:1200;will-change:transform';
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', 'Replay vehicle');

    element.innerHTML = `
      <div class="replay-truck-vehicle"></div>
      <div class="replay-truck-badge">
        <span class="replay-truck-plate"></span>
        <span class="replay-truck-sep">·</span>
        <span class="replay-truck-speed"></span>
      </div>
    `;

    elementRef.current = element;

    const overlay = new window.google.maps.OverlayView();
    overlay.onAdd = () => overlay.getPanes().overlayMouseTarget.appendChild(element);
    overlay.draw = () => {
      const projection = overlay.getProjection();
      const current = positionRef.current;
      if (!projection || !current) return;
      const pixel = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(current));
      if (pixel) {
        // Anchor at center of 56x56 vehicle
        element.style.transform = `translate3d(${Math.round(pixel.x - 28)}px, ${Math.round(pixel.y - 28)}px, 0)`;
      }
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
    if (!elementRef.current) return;

    const statusKey = resolveStatusKey(Number(speedKmh ?? 0), Boolean(fast), Boolean(ignition));
    const truck = elementRef.current.querySelector('.replay-truck-vehicle');
    const speedEl = elementRef.current.querySelector('.replay-truck-speed');
    const plateEl = elementRef.current.querySelector('.replay-truck-plate');
    const sepEl = elementRef.current.querySelector('.replay-truck-sep');

    // navTruckSvg points north at 0°. Rotate directly to heading.
    if (truck && Number.isFinite(Number(heading))) {
      truck.style.transform = `rotate(${Math.round(Number(heading))}deg)`;
    }

    // Fixed color rectangular badge with vehicle no and speed
    const currentSpeedVal = Math.round(Number(speedKmh ?? 0));
    if (speedEl) {
      speedEl.textContent = `${currentSpeedVal} km/h`;
    }

    if (plateEl) {
      plateEl.textContent = registration || '';
      if (!registration) {
        plateEl.style.display = 'none';
        if (sepEl) sepEl.style.display = 'none';
      } else {
        plateEl.style.display = 'inline';
        if (sepEl) sepEl.style.display = 'inline';
      }
    }

    // Update SVG colors if status transitioned or initial render
    if (lastStatusRef.current !== statusKey || !truck?.innerHTML) {
      lastStatusRef.current = statusKey;
      const theme = THEMES[statusKey] || THEMES.stopped;
      if (truck) {
        truck.innerHTML = navTruckSvg({
          heading: 0,
          color: theme.color,
          deep: theme.deep,
          bodyHighlight: theme.highlight,
        });
      }
    }

    overlayRef.current?.draw();
  }, [position, fast, heading, speedKmh, ignition, registration]);

  return null;
}
