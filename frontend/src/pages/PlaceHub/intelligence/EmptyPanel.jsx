/** A calm, specific empty state: what is missing and what to do next. */
export default function EmptyPanel({ Icon, title, hint, action = null }) {
  return (
    <div className="pi-empty">
      {Icon ? <Icon size={28} aria-hidden="true" /> : null}
      <strong>{title}</strong>
      {hint ? <span>{hint}</span> : null}
      {action}
    </div>
  );
}
