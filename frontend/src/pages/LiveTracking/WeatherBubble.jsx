import { OverlayView } from '@react-google-maps/api';
import WeatherIcon from './WeatherIcon.jsx';
import { categoryOf, isDayAt, labelOf, num } from './weatherGlyph.js';

/** Anchor the overlay's top-left at the vehicle point; the CSS on `.wx-anchor`
 *  does the centering + lift, which is reliable regardless of render timing
 *  (measuring width/height in JS mis-placed the bubble to the side). */
const anchorAtPoint = () => ({ x: 0, y: 0 });

/**
 * The floating weather card centered directly above the vehicle on the map
 * (selected truck live, or the moving marker during replay). Non-interactive
 * (pointer-events: none) so it never blocks map dragging. The provider credit is
 * not shown on the map; the full, clickable attribution lives in the detail
 * panel's weather section.
 */
export default function WeatherBubble({ position, weather }) {
  if (!position || !weather || weather.state !== 'OK') return null;
  const c = weather.conditions || {};
  const category = categoryOf(c);
  const temp = num(c.tempC);
  const rain = num(c.rainMmPerH, 1);
  const isDay = isDayAt(weather.hour ?? Date.now(), position.lng);

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={anchorAtPoint}
    >
      <div className="wx-anchor">
        <div className={`wx-bubble wx-bubble--${category}`}>
          <div className="wx-bubble-row">
            <WeatherIcon category={category} size={38} animated isDay={isDay} />
            <div className="wx-bubble-read">
              {temp != null && <span className="wx-bubble-temp">{temp}°</span>}
              <span className="wx-bubble-label">{labelOf(category)}</span>
            </div>
          </div>
          {rain != null && rain > 0 && <div className="wx-bubble-rain">{rain} mm/h rain</div>}
          <span className="wx-bubble-tail" />
        </div>
      </div>
    </OverlayView>
  );
}
