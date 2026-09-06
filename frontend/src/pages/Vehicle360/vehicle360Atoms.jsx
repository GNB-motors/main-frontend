/** Shared building blocks for the Vehicle 360 profile's panels. */

export function Panel({ eyebrow, right, children, className = '' }) {
  return (
    <div className={`cluster-panel flex flex-col gap-3 p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="cluster-eyebrow">{eyebrow}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

export function KV({ k, v }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-1"
      style={{ borderBottom: '1px solid var(--hairline)' }}
    >
      <span className="text-dim text-xs">{k}</span>
      <span className="num text-xs font-semibold">{v ?? '—'}</span>
    </div>
  );
}
