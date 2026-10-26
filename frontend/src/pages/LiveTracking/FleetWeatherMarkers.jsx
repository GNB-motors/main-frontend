import { OverlayView } from '@react-google-maps/api';
import WeatherIcon from './WeatherIcon.jsx';
import { categoryOf, isAdverse, num } from './weatherGlyph.js';

const anchorAtPoint = () => ({ x: 0, y: 0 });

/**
 * Compact weather chips over UNselected trucks that are currently in adverse
 * weather (rain / drizzle / thunder / snow) — so a wet truck is spottable at a
 * glance without selecting it. Clear and cloudy trucks show nothing, and the
 * selected truck is skipped (it carries the full WeatherBubble). Gated by zoom
 * upstream (useFleetWeather) so it never clutters a wide view.
 */
export default function FleetWeatherMarkers({ vehicles = [], fleetWeather, selectedId }) {
  if (!fleetWeather || fleetWeather.size === 0) return null;
  return (
    <>
      {vehicles.map((v) => {
        if (v.id === selectedId || !v.hasFix) return null;
        const w = fleetWeather.get(v.id);
        if (!w || w.state !== 'OK') return null;
        const category = categoryOf(w.conditions);
        if (!isAdverse(category)) return null;
        const rain = num(w.conditions?.rainMmPerH, 1);
        return (
          <OverlayView
            key={`fw-${v.id}`}
            position={{ lat: Number(v.lat), lng: Number(v.lng) }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={anchorAtPoint}
          >
            <div className="wx-anchor wx-anchor--mini">
              <div className={`wx-chip wx-chip--${category}`}>
                <WeatherIcon category={category} size={22} animated />
                {rain != null && rain > 0 && <span className="wx-chip-rain">{rain}</span>}
              </div>
            </div>
          </OverlayView>
        );
      })}
    </>
  );
}
