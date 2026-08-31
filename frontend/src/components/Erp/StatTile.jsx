import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * StatTile — a headline number on a dashboard.
 *
 * ── THE RULE ──────────────────────────────────────────────────────────────
 * A StatTile whose value is MONEY MUST have a `to` (or an `onClick`).
 *
 * This is the whole reason the financial UX was unusable: the ERP home showed
 * "Receivables Due ₹4.2 Cr" and "Payables Due ₹1.1 Cr" as dead text, while the
 * non-money tiles beside them navigated. A number an accountant cannot click
 * is a number they have to go hunt for by hand, which is the definition of
 * "can't keep track". If you cannot name a destination for a money tile, the
 * tile does not belong on the dashboard.
 *
 * The only legitimate exception is a *derived* figure with no underlying list
 * (e.g. "net position" = receivables − payables). Pass `derived` for those so
 * the omission is explicit rather than an oversight.
 */
const StatTile = ({
  label,
  value,
  sublabel = null,
  sublabelTone = null,
  asOf = null,
  icon: Icon = null,
  to = null,
  onClick = null,
  cta = null,
  loading = false,
  derived = false,
  children = null,
}) => {
  const interactive = Boolean(to || onClick);

  if (import.meta.env.DEV && !interactive && !derived) {
    const looksLikeMoney = typeof value === 'string' && value.includes('₹');
    if (looksLikeMoney) {
      console.warn(
        `[StatTile] "${label}" shows money but has no \`to\`/\`onClick\`. `
        + 'Give it a destination, or pass `derived` if it genuinely has no underlying list.',
      );
    }
  }

  const body = (
    <>
      <div className="erp-stat-label">
        {Icon && <Icon size={14} />}
        {label}
      </div>

      {loading ? (
        <div
          style={{
            height: '29px',
            width: '60%',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'erpShimmer 1.5s infinite',
            borderRadius: '4px',
          }}
        />
      ) : (
        <div className="erp-stat-value">{value}</div>
      )}

      {sublabel && !loading && (
        <div className={`erp-stat-sub ${sublabelTone || ''}`}>{sublabel}</div>
      )}
      {children}
      {asOf && <div className="erp-stat-asof">{asOf}</div>}
      {interactive && (
        <div className="erp-stat-cta">
          {cta || 'View'}
          <ArrowRight size={13} />
        </div>
      )}
    </>
  );

  const className = `erp-stat${interactive ? ' clickable' : ''}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} style={{ textAlign: 'left', width: '100%' }}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
};

export default StatTile;
