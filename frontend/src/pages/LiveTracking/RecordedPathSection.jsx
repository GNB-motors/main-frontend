import renderIconSvg from './renderIconSvg.jsx';

export default function RecordedPathSection({ isTrailVisible, trailPoints, trailKm }) {
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
          </>
        ) : (
          <div className="secnote">
            Trip/dispatch data (origin, destination, ETA, planned route) is not provided by
            telematics. Use <b>Trail</b> or <b>Replay</b> to load this vehicle&apos;s recorded GPS
            path.
          </div>
        )}
      </div>
    </details>
  );
}
