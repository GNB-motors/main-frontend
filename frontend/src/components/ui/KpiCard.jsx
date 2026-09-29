/**
 * KpiCard — a small stat tile (icon + label + value) used in KPI strips.
 *
 *   <KpiCard title="Active Alerts" value={12} accent="#3b82f6" icon={<Bell size={18} />} />
 */
export default function KpiCard({ title, value, accent, icon }) {
  return (
    <div
      style={{
        flex: '1 1 220px',
        minWidth: 200,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          background: `${accent}1a`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
