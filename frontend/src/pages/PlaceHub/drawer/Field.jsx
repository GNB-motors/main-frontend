export default function Field({ label, error, children, hint }) {
  return (
    <label className={`ph-field${error ? ' has-error' : ''}`}>
      <span className="ph-field-label">{label}</span>
      {children}
      {error ? <em className="ph-field-error">{error}</em> : hint && <small>{hint}</small>}
    </label>
  );
}
