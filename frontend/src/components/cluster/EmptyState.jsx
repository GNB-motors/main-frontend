/**
 * EmptyState — directive, never a bare "No data".
 * Tell the owner what this surface will show once data exists and why it's empty.
 */
export default function EmptyState({ title = 'Nothing here yet', hint, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center ${className}`}
      style={{ borderColor: 'var(--hairline)' }}
    >
      <div className="cluster-title text-sm">{title}</div>
      {hint ? <div className="text-dim max-w-md text-xs leading-relaxed">{hint}</div> : null}
      {action}
    </div>
  );
}
