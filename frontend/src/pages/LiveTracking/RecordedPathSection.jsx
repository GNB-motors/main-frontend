import renderIconSvg from './renderIconSvg.jsx';
import TripsLegend from './TripsLegend.jsx';

/* RecordedPathSection — explains what's currently on the map's trail layer.

   Before the live-page merge this slot called itself a placeholder
   ("telematics doesn't provide trip data"). It does — the trail endpoint
   returns points[].tripId, points[].break, and trips[] in every response,
   we just weren't wiring any of it to the UI. Now the legend lists actual
   trips when the response carries them and explains what's missing in the
   empty case instead of implying the data doesn't exist. */
export default function RecordedPathSection({
  isTrailVisible,
  trailPoints,
  trailKm,
  tripLegend,
  habitualHalts = [],
  isHabitualHaltsVisible = false,
}) {
  return (
    <details className="sec" open>
      <summary>
        {renderIconSvg('trip', 16)}
        Recorded path
        <span className="chev">{renderIconSvg('chevDown', 16)}</span>
      </summary>
      <div className="secbody">
        {isTrailVisible && trailPoints.length > 1 ? (
          <>
            <div className="kv">
              <span className="k">Path distance</span>
              <span className="v">{trailKm.toFixed(1)} km</span>
            </div>
            <div className="kv">
              <span className="k">GPS points</span>
              <span className="v">{trailPoints.length}</span>
            </div>
            {isHabitualHaltsVisible && (
              <div className="kv">
                <span className="k">Habitual halts shown</span>
                <span className="v">{habitualHalts.length}</span>
              </div>
            )}
            <TripsLegend tripLegend={tripLegend} totalKm={trailKm} />
          </>
        ) : (
          <div className="secnote">
            Trail, trip segments, and habitual-halts surfaces come from telematics. Use the
            <b> Trail</b> button below or the <b>Replay</b> action in the rail to load this
            vehicle&apos;s recorded GPS path.
          </div>
        )}
      </div>
    </details>
  );
}
