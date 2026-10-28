import { Play } from 'lucide-react';
import { fmtClock, fmtDay } from './autoTripFormat';
import { evidenceNote, fareText, passName } from './tripTolls';

/**
 * A toll plaza the truck drove through without stopping, as its own row between the stops it happened
 * between. A pass not read off the matched road says what it came from.
 */
export default function TollTimelineRow({ item, playable, onPlay }) {
  const { pass } = item;
  const fare = fareText(pass);
  return (
    <li className="atx-tl-step atx-tl-step--toll">
      <div className="atx-tl-when">
        <span className="atx-tl-day">{fmtDay(pass.at)}</span>
        <span className="atx-tl-clock">
          {pass.inferred ? '~' : ''}
          {fmtClock(pass.at)}
        </span>
      </div>
      <span className="atx-tl-mark atx-tl-mark--toll" aria-hidden="true" />
      <div className="atx-tl-body">
        <div className="atx-tl-title-row">
          <h3 className="atx-tl-title">Toll plaza</h3>
          {fare ? <span className="atx-tl-pill atx-tl-pill--toll">{fare}</span> : null}
        </div>
        <p className="atx-tl-place">
          {passName(pass)}
          {evidenceNote(pass) ? ` · ${evidenceNote(pass)}` : ''}
        </p>
      </div>
      {playable(item.playAt) ? (
        <button
          type="button"
          className="atx-btn atx-btn--sm atx-tl-play"
          aria-label={`Play the replay from ${passName(pass)}`}
          onClick={() => onPlay(item.playAt)}
        >
          <Play size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          <span className="atx-tl-play-text">Play</span>
        </button>
      ) : null}
    </li>
  );
}
