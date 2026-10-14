import renderIconSvg from './renderIconSvg.jsx';
import { formatDayText } from './minutesAgoFormat.js';

export default function ReplayBar({
  replayState,
  setReplayState,
  selectedVehicle,
  trailKm,
  exitReplay,
}) {
  return (
    <div className={`replay ${replayState.on ? 'on' : ''}`}>
      {replayState.on && selectedVehicle && (
        <>
          <div className="rp-head">
            <span className="rp-badge">{renderIconSvg('route', 15)}</span>
            <span className="rp-plate">{selectedVehicle.plate}</span>
            <span className="rp-date">
              {selectedVehicle.ago != null ? formatDayText(selectedVehicle.ago) : 'Recorded trail'}
            </span>
            <div className="rp-stats">
              <div className="rp-stat">
                <div className="k">Distance</div>
                <div className="v">{trailKm.toFixed(1)} km</div>
              </div>
              <div className="rp-stat">
                <div className="k">Pings</div>
                <div className="v">{replayState.pts ? replayState.pts.length : 0}</div>
              </div>
            </div>
            <button
              className="btn btn--sm btn--icon rp-x"
              aria-label="Exit replay"
              onClick={exitReplay}
            >
              {renderIconSvg('x', 16)}
            </button>
          </div>

          <div className="rp-controls">
            <button
              className="rp-play"
              aria-label={replayState.playing ? 'Pause replay' : 'Play replay'}
              onClick={() =>
                setReplayState((prev) => {
                  const willPlay = !prev.playing;
                  const nextT = willPlay && prev.t >= 0.999 ? 0 : prev.t;
                  return { ...prev, playing: willPlay, t: nextT };
                })
              }
            >
              {renderIconSvg(replayState.playing ? 'pause' : 'play', 16)}
            </button>

            <span className="rp-time">{Math.round(replayState.t * 100)}%</span>

            <div
              className="rp-scrub"
              role="slider"
              tabIndex={0}
              aria-label="Replay position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(replayState.t * 100)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setReplayState((prev) => ({ ...prev, t, playing: false }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setReplayState((prev) => ({ ...prev, t: Math.min(1, prev.t + 0.02) }));
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setReplayState((prev) => ({ ...prev, t: Math.max(0, prev.t - 0.02) }));
                } else if (e.key === ' ') {
                  e.preventDefault();
                  setReplayState((prev) => ({ ...prev, playing: !prev.playing }));
                }
              }}
            >
              <div className="rp-track">
                <div
                  className="rp-fill"
                  style={{ width: `${(replayState.t * 100).toFixed(1)}%` }}
                />
              </div>
              <div className="rp-knob" style={{ left: `${(replayState.t * 100).toFixed(1)}%` }} />
            </div>

            <div className="rp-speeds">
              {[1, 2, 4].map((sp) => (
                <button
                  key={sp}
                  aria-pressed={replayState.speed === sp}
                  onClick={() => setReplayState((prev) => ({ ...prev, speed: sp }))}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
