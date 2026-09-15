import { bucketFor, daysUntil, BUCKET_STYLES } from './vehicleDashboardLogic';

/**
 * Cell/presentational components for the Vehicle Dashboard. Kept separate
 * from vehicleDashboardColumns.jsx because that module exports a plain
 * function; react-refresh requires a file to export components OR
 * non-components, never both (rule 15).
 */

export const DocBadge = ({ docEntry }) => {
  const bucket = bucketFor(docEntry);
  const style = BUCKET_STYLES[bucket];
  const days = daysUntil(docEntry?.expiryDate);

  const text = (() => {
    if (bucket === 'missing') return docEntry?.uploaded ? 'OCR pending' : 'Not uploaded';
    if (bucket === 'expired') return `Expired ${Math.abs(days)}d ago`;
    return `${days}d left`;
  })();

  return (
    <span
      title={docEntry?.expiryDate ? new Date(docEntry.expiryDate).toLocaleDateString() : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.dot}33`,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.dot }} />
      {text}
    </span>
  );
};

export const StatCard = (props) => {
  const { title, value, subtext, icon, accent } = props;
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
        {subtext && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtext}</div>}
      </div>
    </div>
  );
};

export const LegendDot = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    {label}
  </span>
);
