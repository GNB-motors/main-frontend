import { Fuel, IndianRupee, Gauge, Clock, MapPin } from 'lucide-react';
import { fmt, fmtDate, getVarianceMeta } from './mileageIntervalDetailFormat';

/**
 * Presentational sections for the Mileage Interval Detail page. Kept
 * separate from the page (rule 14) — none of these export plain functions,
 * so there's no rule-15 conflict with mileageIntervalDetailFormat.js.
 */

export const SectionCard = (props) => {
  const { title, icon: Icon, iconColor = '#2A4FD6', children } = props;
  return (
    <div className="mid2-card">
      <div className="mid2-card-header">
        <div className="mid2-card-icon" style={{ background: `${iconColor}14`, color: iconColor }}>
          <Icon size={18} />
        </div>
        <h3 className="mid2-card-title">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export const MetricRow = ({ label, value, highlight }) => (
  <div className="mid2-metric-row">
    <span className="mid2-metric-label">{label}</span>
    <span className={`mid2-metric-value ${highlight ? 'mid2-metric-highlight' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

export const VarianceBlock = ({ label, system, gps, varianceKm, variancePct, unit = '' }) => {
  const meta = getVarianceMeta(variancePct);
  const { Icon: VIcon } = meta;

  // Bar ratio: how much of the bar each value fills.
  const sysVal = system ?? 0;
  const gpsVal = gps ?? 0;
  const maxVal = Math.max(sysVal, gpsVal);
  const sysPct = maxVal > 0 ? (sysVal / maxVal) * 100 : 0;
  const gpsPct = maxVal > 0 ? (gpsVal / maxVal) * 100 : 0;

  return (
    <div className="mid2-variance-block">
      <div className="mid2-vb-title">{label}</div>
      <div className="mid2-vb-values">
        <div className="mid2-vb-col">
          <span className="mid2-vb-sub">SYSTEM</span>
          <span className="mid2-vb-val">
            {system != null ? `${Number(system).toFixed(2)}${unit}` : '—'}
          </span>
        </div>
        <span className="mid2-vb-vs">vs</span>
        <div className="mid2-vb-col">
          <span className="mid2-vb-sub">GPS</span>
          <span className="mid2-vb-val">
            {gps != null ? `${Number(gps).toFixed(2)}${unit}` : '—'}
          </span>
        </div>
      </div>
      <div className="mid2-vb-bars">
        <div className="mid2-vb-bar-track">
          <div className="mid2-vb-bar-fill mid2-vb-bar-sys" style={{ width: `${sysPct}%` }} />
        </div>
        <div className="mid2-vb-bar-track">
          <div className="mid2-vb-bar-fill mid2-vb-bar-gps" style={{ width: `${gpsPct}%` }} />
        </div>
      </div>
      <div
        className="mid2-vb-delta"
        style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}33` }}
      >
        <VIcon size={13} />
        <span>
          {varianceKm != null ? `Δ ${Math.abs(varianceKm).toFixed(1)}${unit}` : ''} {meta.label}
        </span>
      </div>
    </div>
  );
};

export const TimelineEntry = ({ log, label, type, isLast }) => {
  const dotColor = type === 'partial' ? '#f59e0b' : '#22c55e';
  const labelColor = type === 'partial' ? '#b45309' : '#15803d';
  if (!log) return null;
  return (
    <div className="mid2-tl-entry">
      <div className="mid2-tl-track">
        <div className="mid2-tl-dot" style={{ backgroundColor: dotColor }} />
        {!isLast && <div className="mid2-tl-line" />}
      </div>
      <div className="mid2-tl-content">
        <div className="mid2-tl-label" style={{ color: labelColor }}>
          {label.toUpperCase()}
        </div>
        <div className="mid2-tl-details">
          <span className="mid2-tl-item">
            <Fuel size={13} /> {fmt(log.litres, 2, 'L')}
          </span>
          {log.rate != null && (
            <span className="mid2-tl-item">
              <IndianRupee size={13} /> {log.rate}/L
              {log.totalAmount != null
                ? ` = ₹${log.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                : ''}
            </span>
          )}
          <span className="mid2-tl-item">
            <Gauge size={13} />{' '}
            {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}
          </span>
          <span className="mid2-tl-item">
            <Clock size={13} /> {fmtDate(log.refuelTime)}
          </span>
          {log.location && (
            <span className="mid2-tl-item">
              <MapPin size={13} /> {log.location}
            </span>
          )}
          {log.routeSource && (
            <span className="mid2-tl-item">
              <MapPin size={13} /> From: {log.routeSource.name}
              {log.routeSource.city ? `, ${log.routeSource.city}` : ''}
            </span>
          )}
          {log.routeDestination && (
            <span className="mid2-tl-item">
              <MapPin size={13} /> To: {log.routeDestination.name}
              {log.routeDestination.city ? `, ${log.routeDestination.city}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
