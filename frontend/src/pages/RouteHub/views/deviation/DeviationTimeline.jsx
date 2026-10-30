import { clock } from './deviationRules';

/**
 * One bar for the whole trip: empty run, loaded run, and a red band per detour.
 * Clicking another detour of the same trip selects it.
 */
export default function DeviationTimeline({ model, onSelect }) {
  if (!model) return null;
  return (
    <div className="dev-tl" aria-label="Trip timeline">
      <div className="dev-tl-bar">
        {model.ladenLeft != null ? (
          <>
            <span className="dev-tl-leg approach" style={{ width: `${model.ladenLeft}%` }} />
            <span
              className="dev-tl-leg laden"
              style={{ left: `${model.ladenLeft}%`, width: `${100 - model.ladenLeft}%` }}
            />
          </>
        ) : (
          <span className="dev-tl-leg neutral" style={{ width: '100%' }} />
        )}
        {model.bands.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`dev-tl-band${b.current ? ' current' : ''}`}
            style={{ left: `${b.left}%`, width: `${b.width}%` }}
            title={`Detour at ${b.label}`}
            aria-label={`Detour at ${b.label}${b.current ? ' (selected)' : ''}`}
            aria-pressed={b.current}
            onClick={() => !b.current && onSelect(b.id)}
          />
        ))}
      </div>
      <div className="dev-tl-axis">
        <span>{clock(model.start)}</span>
        {model.ladenLeft != null ? (
          <span className="dev-tl-key">
            <i className="approach" /> Empty, going to load <i className="laden" /> Loaded{' '}
            <i className="band" /> Off usual route
          </span>
        ) : (
          <span className="dev-tl-key">
            <i className="band" /> Off usual route
          </span>
        )}
        <span>{clock(model.end)}</span>
      </div>
    </div>
  );
}
