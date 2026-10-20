import { Pause, Play } from 'lucide-react';

const SPEEDS = [1, 10, 50];

/** Play/pause, the scrubber with its start and end labels, and the speed buttons under the replay map. */
const ReplayPlayer = ({
  togglePlay,
  canPlay,
  playing,
  progress,
  setPlaying,
  seekTo,
  span,
  leftLabel,
  rightLabel,
  speed,
  setSpeed,
}) => (
  <div className="atx-player">
    <button
      type="button"
      className="atx-play"
      onClick={togglePlay}
      disabled={!canPlay}
      aria-label={playing ? 'Pause replay' : 'Play replay'}
    >
      {playing ? (
        <Pause size={16} fill="currentColor" strokeWidth={0} />
      ) : (
        <Play size={16} fill="currentColor" strokeWidth={0} />
      )}
    </button>
    <label className="atx-scrub">
      <span className="atx-sr">Replay position</span>
      <input
        type="range"
        aria-label="Replay position"
        min={0}
        max={1000}
        step={1}
        value={Math.round(progress * 1000)}
        disabled={!canPlay}
        onChange={(e) => {
          setPlaying(false);
          seekTo((Number(e.target.value) / 1000) * span);
        }}
      />
      <span className="atx-scrub-labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </span>
    </label>
    <div role="group" aria-label="Replay speed" className="atx-speeds">
      {SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={speed === s}
          aria-label={`Play at ${s}× speed`}
          onClick={() => setSpeed(s)}
        >
          {s}×
        </button>
      ))}
    </div>
  </div>
);

export default ReplayPlayer;
