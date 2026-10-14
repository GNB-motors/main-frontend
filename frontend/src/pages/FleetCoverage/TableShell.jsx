export default function TableShell({ title, caption, actions = null, children }) {
  return (
    <div className="cluster-panel overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <h2 className="cluster-title text-sm">{title}</h2>
          {caption ? <p className="text-dim mt-1 text-xs leading-relaxed">{caption}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
