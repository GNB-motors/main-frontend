import Ico from '../../routeHubIcons.jsx';
import { Seg } from '../../routeHubShared.jsx';
import { fmtT } from '../../routeHubFormat';
import { EVC, SPEEDS } from './replayConstants.js';

export default function ReplayPlayer({
  playing,
  setPlaying,
  trip,
  t,
  setT,
  frame,
  scrubRef,
  scrubTo,
  speed,
  setSpeed,
}) {
  return (
    <div className="player">
      <button
        type="button"
        className="pbtn"
        aria-label={playing ? 'Pause' : 'Play'}
        disabled={!trip}
        onClick={() => {
          if (t >= 1) setT(0);
          setPlaying((p) => !p);
        }}
      >
        <Ico n={playing ? 'pause' : 'play'} s={16} />
      </button>
      <span className="ptime">{frame ? `${fmtT(frame.at)} · ${Math.round(t * 100)}%` : '—'}</span>
      <div
        className="scrub"
        ref={scrubRef}
        role="slider"
        tabIndex={0}
        aria-label="Replay position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(t * 100)}
        onPointerDown={(e) => {
          if (!trip) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setPlaying(false);
          scrubTo(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) scrubTo(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setT((x) => Math.min(1, x + 0.01));
          else if (e.key === 'ArrowLeft') setT((x) => Math.max(0, x - 0.01));
          else if (e.key === ' ') {
            e.preventDefault();
            setPlaying((p) => !p);
          }
        }}
      >
        <div className="tr">
          <div className="fl" style={{ width: `${t * 100}%` }} />
        </div>
        <div>
          {(trip?.events || [])
            .filter((e) => e.type !== 'start' && e.type !== 'end')
            .map((e, i) => (
              <span
                key={`${e.type}-${i}`}
                className="mk"
                title={e.title}
                style={{ left: `${e.t * 100}%`, background: EVC[e.type] }}
              />
            ))}
        </div>
        <div className="kn" style={{ left: `${t * 100}%` }} />
      </div>
      <Seg
        options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
        value={speed}
        onChange={setSpeed}
      />
    </div>
  );
}
