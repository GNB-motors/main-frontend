/**
 * EmptyState — directive, never a bare "No data".
 * Tell the owner what this surface will show once data exists and why it's empty.
 * Artboard (GNB Components.dc.html §6): illustration-free, centred, one
 * directive title + one explanatory hint with an optional quiet action.
 *
 * The state contract this component now carries (used by PageState):
 *  - `title`  what is missing, in the owner's words
 *  - `hint`   why it is empty and what would change it
 *  - `action` the single next step
 *  - `tone`   'neutral' (nothing wrong) | 'warning' (something needs attention)
 */
export default function EmptyState({
  title = 'Nothing here yet',
  hint,
  action = null,
  tone = 'neutral',
  icon = null,
  compact = false,
  className = '',
}) {
  const isWarning = tone === 'warning';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center ${
        compact ? 'px-4 py-5' : 'px-6 py-10'
      } ${className}`}
    >
      {icon ? (
        <span aria-hidden="true" className="mb-1 flex items-center">
          {icon}
        </span>
      ) : null}
      <div
        className="text-[16px] font-semibold"
        style={{
          fontFamily: 'var(--font-display)',
          color: isWarning ? 'var(--ds-ink)' : 'var(--ds-ink)',
        }}
      >
        {title}
      </div>
      {hint ? (
        <div
          className="max-w-[330px] text-[13px] leading-relaxed"
          style={{ color: 'var(--ds-ink2)' }}
        >
          {hint}
        </div>
      ) : null}
      {action}
    </div>
  );
}
