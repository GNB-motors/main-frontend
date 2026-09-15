/**
 * EmptyState — directive, never a bare "No data".
 * Tell the owner what this surface will show once data exists and why it's empty.
 * Artboard (GNB Components.dc.html §6): illustration-free, centred, one
 * directive title + one explanatory hint with an optional quiet action.
 */
export default function EmptyState({
  title = 'Nothing here yet',
  hint,
  action = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 py-10 text-center ${className}`}
    >
      <div
        className="text-[16px] font-semibold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--ds-ink)' }}
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
