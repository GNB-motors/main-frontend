import renderIconSvg from './renderIconSvg.jsx';

/* TripsLegend — readable list of the trips present in the loaded trail.

   The legend answers the question a busy fleet manager can't get from the
   polyline alone: "Where did this truck actually go today, and which trip
   is which?" Each row is colored the same as its polyline segment so the
   user can match swatch → line without reading carefully. The empty state
   stays informative even before telematics fills the data in. */
export default function TripsLegend({ tripLegend = [], totalKm = 0 }) {
  if (!Array.isArray(tripLegend) || tripLegend.length === 0) {
    return (
      <div className="trips-legend trips-legend--empty">
        <div className="trips-legend__hint">
          {renderIconSvg('trip', 14)} No trip metadata in this trail yet. Toggle
          <b> Trip segments</b> off if you only want the raw breadcrumb.
        </div>
      </div>
    );
  }
  const single = tripLegend.length === 1;
  return (
    <div className="trips-legend">
      <div className="trips-legend__head">
        <span className="trips-legend__title">{renderIconSvg('trip', 14)} Trips on this trail</span>
        <span className="trips-legend__sub">
          {tripLegend.length} trip{tripLegend.length === 1 ? '' : 's'} · {totalKm.toFixed(1)} km total
        </span>
      </div>
      <ol className="trips-legend__list">
        {tripLegend.map((t) => {
          const labelParts = [];
          if (t.startName) labelParts.push(t.startName);
          if (t.endName) labelParts.push(t.endName);
          const label = labelParts.length ? labelParts.join(' → ') : single ? 'Single trip' : `Trip ${t.tripId}`;
          return (
            <li key={`legend-${t.tripId}-${t.index}`} className="trips-legend__row">
              <span
                className="trips-legend__swatch"
                style={{ backgroundColor: t.color }}
                aria-hidden="true"
              />
              <div className="trips-legend__text">
                <div className="trips-legend__label">{label}</div>
                <div className="trips-legend__meta">
                  {t.coords} GPS points · color-coded on the map
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
