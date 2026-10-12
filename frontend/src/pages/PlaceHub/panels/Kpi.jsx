export default function Kpi({ label, value, hint, tone }) {
  return (
    <div className={`ph-kpi${tone ? ` ph-kpi--${tone}` : ''}`}>
      <span className="ph-kpi-label">{label}</span>
      <strong className="ph-kpi-value">{value}</strong>
      {hint && <span className="ph-kpi-hint">{hint}</span>}
    </div>
  );
}
