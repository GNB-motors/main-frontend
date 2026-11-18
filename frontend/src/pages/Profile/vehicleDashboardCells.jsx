import { Check, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { bucketFor, formatDocumentExpiry, BUCKET_STYLES } from './vehicleDashboardLogic';

/**
 * Cell/presentational components for the Vehicle Dashboard. Kept separate
 * from vehicleDashboardColumns.jsx because that module exports a plain
 * function; react-refresh requires a file to export components OR
 * non-components, never both (rule 15).
 */

export const DocBadge = ({ docEntry, onClick, isSelected = false }) => {
  const bucket = bucketFor(docEntry);
  const expiry = formatDocumentExpiry(docEntry?.expiryDate);

  let icon = null;
  let text = '';
  let badgeClass = 'v-dash-badge';

  if (bucket === 'expired') {
    icon = <XCircle size={13} strokeWidth={2.4} className="v-dash-badge-icon" />;
    text = expiry || 'Expired';
    badgeClass += ' v-dash-badge--expired';
  } else if (bucket === 'verified') {
    icon = <Check size={13} strokeWidth={2.6} className="v-dash-badge-icon" />;
    text = expiry || 'Verified';
    badgeClass += ' v-dash-badge--valid';
  } else if (bucket === 'healthy') {
    icon = <Check size={13} strokeWidth={2.6} className="v-dash-badge-icon" />;
    text = expiry || 'Valid';
    badgeClass += ' v-dash-badge--valid';
  } else if (bucket === 'warning') {
    icon = <AlertCircle size={13} strokeWidth={2.4} className="v-dash-badge-icon" />;
    text = expiry || 'Expiring soon';
    badgeClass += ' v-dash-badge--warning';
  } else if (bucket === 'critical') {
    icon = <AlertCircle size={13} strokeWidth={2.4} className="v-dash-badge-icon" />;
    text = expiry || 'Expiring soon';
    badgeClass += ' v-dash-badge--critical';
  } else if (bucket === 'rejected') {
    icon = <XCircle size={13} strokeWidth={2.2} className="v-dash-badge-icon" />;
    text = 'Rejected';
    badgeClass += ' v-dash-badge--expired';
  } else if (bucket === 'pending') {
    icon = <HelpCircle size={13} strokeWidth={2.2} className="v-dash-badge-icon" />;
    text = docEntry?.ocrStatus === 'FAILED' ? 'Verify needed' : 'OCR pending';
    badgeClass += ' v-dash-badge--pending';
  } else if (bucket === 'uploaded') {
    icon = <Check size={13} strokeWidth={2.2} className="v-dash-badge-icon" />;
    text = 'Uploaded';
    badgeClass += ' v-dash-badge--valid';
  } else {
    // genuinely missing (never uploaded)
    icon = <HelpCircle size={13} strokeWidth={2.2} className="v-dash-badge-icon" />;
    text = 'Missing';
    badgeClass += ' v-dash-badge--missing';
  }

  if (isSelected) {
    badgeClass += ' v-dash-badge--selected';
  }

  const title = expiry
    ? `${BUCKET_STYLES[bucket]?.label || 'Document'}. Expiry: ${expiry}`
    : docEntry?.uploaded
      ? 'Uploaded — click to view'
      : 'No document uploaded — click to view';

  return (
    <button
      type="button"
      className={badgeClass}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      title={title}
      aria-label={`${text}. ${title}`}
    >
      {icon}
      <span>{text}</span>
    </button>
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
