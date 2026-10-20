import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * SnapshotCard — one headline figure in the financial snapshot grid.
 *
 * Local to this page on purpose: it needs a card-level semantic `tone` (a tinted
 * icon chip + a subtle inset accent for the attention states) that the shared
 * StatTile does not model, and building it here keeps StatTile untouched for the
 * dozen other screens that use it. The money-tile rule still holds — every
 * figure with a real underlying list passes `to`; `derived` opts out explicitly.
 */
const SnapshotCard = ({
  label,
  icon: Icon,
  tone = 'neutral',
  loading = false,
  value,
  valueSuffix = null,
  context = null,
  asOf = null,
  to = null,
  cta = null,
  derived = false,
}) => {
  const interactive = Boolean(to);
  const body = (
    <>
      <div className="acc-card-head">
        <span className={`acc-card-ic acc-card-ic--${tone}`}>{Icon && <Icon size={16} />}</span>
        <span className="acc-card-label">{label}</span>
      </div>

      {loading ? (
        <div className="acc-skel acc-skel--value" />
      ) : (
        <div className="acc-card-value">
          {value}
          {valueSuffix && <span className="acc-card-suffix">{valueSuffix}</span>}
        </div>
      )}

      {!loading && context && <div className="acc-card-context">{context}</div>}

      <div className="acc-card-foot">
        {asOf && <span className="acc-card-asof">{asOf}</span>}
        {interactive ? (
          <span className="acc-card-cta">
            {cta}
            <ArrowRight size={13} />
          </span>
        ) : (
          derived && <span className="acc-card-derived">Derived</span>
        )}
      </div>
    </>
  );

  const className = `acc-card acc-card--${tone}${interactive ? ' clickable' : ''}`;
  return interactive ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
};

export default SnapshotCard;
