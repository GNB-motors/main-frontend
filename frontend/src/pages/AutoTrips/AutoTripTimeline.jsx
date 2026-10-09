import { Play, Truck } from 'lucide-react';
import {
  LONG_PLANT_MIN,
  canMarkPlace,
  fmtClock,
  fmtDay,
  fmtDayTime,
  fmtDuration,
} from './autoTripModel';

const TITLE = { loading: 'Loading at plant', drop: 'Unloading at drop', unknown: 'Unknown stop' };
/** "drop place" only repeats the title; a guessed or hand-set drop is worth saying. */
const SHOWN_DROP_NOTES = ['guessed', 'set by a person'];

function When({ step }) {
  const leftOtherDay = step.leftAt && fmtDay(step.leftAt) !== fmtDay(step.at);
  return (
    <div className="atx-tl-when">
      <span className="atx-tl-day">{fmtDay(step.at)}</span>
      <span className="atx-tl-clock">{fmtClock(step.at)}</span>
      {step.leftAt ? (
        <span className="atx-tl-left">
          left {leftOtherDay ? fmtDayTime(step.leftAt) : fmtClock(step.leftAt)}
        </span>
      ) : null}
    </div>
  );
}

function StayPill({ step }) {
  if (step.stayMin == null) return null;
  const long = step.kind === 'loading' && step.stayMin > LONG_PLANT_MIN;
  return (
    <span className={`atx-tl-pill atx-tl-pill--${long ? 'long' : step.kind}`}>
      {fmtDuration(step.stayMin)}
      {long ? ' · long wait' : ''}
    </span>
  );
}

function placeText(step, asking) {
  const note =
    step.kind === 'drop' && SHOWN_DROP_NOTES.includes(step.placeNote) ? ` · ${step.placeNote}` : '';
  return `${step.place}${note}${asking ? ' — was this the drop?' : ''}`;
}

/**
 * The trip as a vertical timeline: where the time went (bar + legend), then each stop with
 * the drive before it. A stop after the plant that is not the drop can be made the drop.
 */
export default function AutoTripTimeline({ plan, canEdit, busy, playable, onPlay, onSetDrop }) {
  const steps = plan.items.filter((it) => it.type === 'step');
  const lastStepId = steps.length ? steps[steps.length - 1].id : null;

  return (
    <section className="atx-card atx-tl" aria-labelledby="atx-tl-title">
      <div className="atx-tl-head">
        <div className="atx-tl-head-row">
          <h2 id="atx-tl-title" className="atx-card-title">
            Trip timeline
          </h2>
          {plan.totalMin > 0 ? (
            <span className="atx-tl-total">
              Total <strong>{fmtDuration(plan.totalMin)}</strong> · {plan.totalOf}
            </span>
          ) : null}
        </div>
        {plan.spans.length ? (
          <>
            <div
              className="atx-tl-bar"
              role="img"
              aria-label={plan.legend.map((l) => `${l.label} ${fmtDuration(l.min)}`).join(', ')}
            >
              {plan.spans.map((s, i) => (
                <span
                  key={`${s.kind}-${i}`}
                  className={`atx-tl-span atx-tl-span--${s.kind}`}
                  style={{ flexGrow: s.min }}
                  title={`${plan.legend.find((l) => l.kind === s.kind)?.label} · ${fmtDuration(s.min)}`}
                />
              ))}
            </div>
            <ul className="atx-tl-legend">
              {plan.legend.map((l) => (
                <li key={l.kind}>
                  <span className={`atx-tl-swatch atx-tl-span--${l.kind}`} aria-hidden="true" />
                  {l.label}
                  <strong>{fmtDuration(l.min)}</strong>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {plan.items.length ? (
        <ol className="atx-tl-list">
          {plan.items.map((it, i) => {
            if (it.type === 'leg') {
              const prev = plan.items[i - 1];
              const next = plan.items[i + 1];
              const cls = [
                'atx-tl-leg',
                it.driveMin ? '' : 'is-quiet',
                prev?.kind === 'unknown' ? 'atx-tl-leg--after-card' : '',
                next?.kind === 'unknown' ? 'atx-tl-leg--before-card' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <li key={it.id} className={cls}>
                  {it.driveMin ? (
                    <span className="atx-tl-drive">
                      <Truck size={14} strokeWidth={2.2} aria-hidden="true" />
                      Drove {fmtDuration(it.driveMin)}
                      {it.load ? `, ${it.load}` : ''}
                    </span>
                  ) : null}
                </li>
              );
            }

            const fixable = Boolean(it.stop) && it.kind !== 'drop' && canEdit;
            const title = TITLE[it.kind] || it.label;
            const cls = [
              'atx-tl-step',
              `atx-tl-step--${it.kind}`,
              i === 0 ? 'is-first' : '',
              it.id === lastStepId ? 'is-last' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <li key={it.id} className={cls}>
                <When step={it} />
                <span className="atx-tl-mark" aria-hidden="true" />
                <div className="atx-tl-body">
                  <div className="atx-tl-title-row">
                    <h3 className="atx-tl-title">{title}</h3>
                    <StayPill step={it} />
                  </div>
                  <p className="atx-tl-place">{placeText(it, fixable && it.kind === 'unknown')}</p>
                  {fixable ? (
                    <div className="atx-tl-actions">
                      <button
                        type="button"
                        className="atx-btn atx-btn--sm"
                        disabled={busy}
                        onClick={() => onSetDrop(it.stop, false)}
                      >
                        Mark as drop
                      </button>
                      {canMarkPlace(it.stop) ? (
                        <button
                          type="button"
                          className="atx-btn atx-btn--sm atx-btn--primary"
                          disabled={busy}
                          title="Also save this place as a drop place, so other trips that stopped here settle too"
                          onClick={() => onSetDrop(it.stop, true)}
                        >
                          Mark as drop &amp; save place
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {playable(it.playAt) ? (
                  <button
                    type="button"
                    className="atx-btn atx-btn--sm atx-tl-play"
                    aria-label={`Play the replay from ${title.toLowerCase()}`}
                    onClick={() => onPlay(it.playAt)}
                  >
                    <Play size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                    <span className="atx-tl-play-text">Play</span>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="atx-tl-empty">
          No steps yet — this trip has no plant visit or stops recorded.
        </p>
      )}
    </section>
  );
}
