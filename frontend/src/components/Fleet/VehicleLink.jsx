import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A registration plate that goes somewhere.
 *
 * Vehicle 360 (/vehicles/:registrationNumber) is one of the better screens in
 * the product — profile, health, telemetry and documents for a single truck —
 * and it was addressable ONLY by typing the URL. Meanwhile the app rendered
 * registration numbers as inert `.reg-plate` spans in 15 places: alert rows,
 * fuel spend, compliance, coverage, integrity, the attention table.
 *
 * So this replaces the span. Anywhere a plate appears, it is now the way in.
 *
 * Field names differ by feed — `vehicleNumber` in the owner-alert feed,
 * `registrationNumber` in the warehouse services, `reg` in a couple of
 * aggregates — so callers pass whatever they hold as `reg`. An absent or
 * placeholder value renders the plain plate rather than a link to nowhere.
 */
const VehicleLink = ({ reg, className = '', title, onClick }) => {
  const value = typeof reg === 'string' ? reg.trim() : reg == null ? '' : String(reg);
  const cls = `reg-plate ${className}`.trim();

  // '—' and '-' are the app's own empty markers; they must not become links.
  if (!value || value === '—' || value === '-') {
    return <span className={cls}>{value || '—'}</span>;
  }

  return (
    <Link
      to={`/vehicles/${encodeURIComponent(value)}`}
      className={`${cls} reg-plate--link`}
      title={title || `Open ${value}`}
      // Plates sit inside clickable table rows in several places; without this
      // the row's own handler fires too and the user lands somewhere else.
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {value}
    </Link>
  );
};

export default VehicleLink;
