export default function Empty({ title, hint, action }) {
  return (
    <div className="v360-empty">
      <span className="v360-empty-title">{title}</span>
      {hint ? <span className="v360-empty-hint">{hint}</span> : null}
      {action}
    </div>
  );
}
