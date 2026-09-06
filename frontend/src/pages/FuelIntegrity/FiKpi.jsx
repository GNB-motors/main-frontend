export default function FiKpi({ icon: Icon, label, value, sub, accent, emphasis }) {
  return (
    <div className="ov-kpi" style={emphasis ? { borderLeft: `3px solid ${accent}` } : undefined}>
      <span className="ov-kpi-label">
        {Icon ? <Icon size={13} style={{ color: accent }} /> : null}
        {label}
      </span>
      <span className="ov-kpi-value" style={emphasis ? { color: accent } : undefined}>
        {value}
      </span>
      {sub && <span className="ov-kpi-sub">{sub}</span>}
    </div>
  );
}
