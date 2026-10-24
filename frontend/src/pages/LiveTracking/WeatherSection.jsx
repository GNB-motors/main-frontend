import WeatherIcon from './WeatherIcon.jsx';
import { categoryOf, labelOf, num } from './weatherGlyph.js';

/**
 * Weather section for the vehicle detail panel. Shows the measured conditions at
 * the vehicle's cell (live) or at the replay position+hour, with the provider's
 * credit — which the backend attaches to every conditions payload and whose
 * terms require it be shown next to any weather rendered.
 */
export default function WeatherSection({
  weather,
  loading,
  contextLabel = 'Now, at this location',
}) {
  const state = weather?.state;
  const c = weather?.conditions || {};
  const category = categoryOf(c);
  const attr = weather?.attribution;

  const rows = [
    ['Temperature', num(c.tempC) != null ? `${num(c.tempC)} °C` : null],
    ['Rain', num(c.rainMmPerH, 1) != null ? `${num(c.rainMmPerH, 1)} mm/h` : null],
    ['Wind', num(c.windKmh) != null ? `${num(c.windKmh)} km/h` : null],
    ['Gusts', num(c.windGustsKmh) != null ? `${num(c.windGustsKmh)} km/h` : null],
    ['Visibility', num(c.visibilityM) != null ? `${(c.visibilityM / 1000).toFixed(1)} km` : null],
  ].filter(([, v]) => v != null);

  return (
    <details className="sec">
      <summary>
        <span className="wx-sec-ico">
          <WeatherIcon
            category={state === 'OK' ? category : 'cloudy'}
            size={18}
            animated={state === 'OK'}
          />
        </span>
        Weather
        {state === 'OK' && num(c.tempC) != null && (
          <span className="wx-sec-badge">
            {num(c.tempC)}° · {labelOf(category)}
          </span>
        )}
        <span className="chev">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="secbody">
        {loading && !weather ? (
          <div className="wx-sec-note">Loading weather…</div>
        ) : state === 'OK' ? (
          <>
            <div className="wx-sec-context">{contextLabel}</div>
            {rows.map(([k, v]) => (
              <div className="kv" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
            {weather.ageMinutes != null && (
              <div className="wx-sec-fresh">
                Forecast fetched{' '}
                {weather.ageMinutes < 1 ? 'just now' : `${weather.ageMinutes} min ago`}
              </div>
            )}
            {attr && (
              <div className="wx-sec-attr">
                Source:{' '}
                <a href={attr.url} target="_blank" rel="noopener noreferrer">
                  {attr.name}
                </a>
                {attr.license ? ` · ${attr.license}` : ''}
                {attr.inferred ? ' (inferred)' : ''}
              </div>
            )}
          </>
        ) : state === 'NO_ROW' ? (
          <div className="wx-sec-note">
            No weather recorded for this cell and hour. It is only pulled where the fleet has
            recently driven.
          </div>
        ) : (
          <div className="wx-sec-note">Weather unavailable.</div>
        )}
      </div>
    </details>
  );
}
