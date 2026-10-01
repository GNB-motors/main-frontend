import React, { useState } from 'react';
import {
  Fuel,
  IndianRupee,
  Gauge,
  Clock,
  MapPin,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Minus,
  Route,
  Droplets,
  Satellite,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fmt, fmtDate, getVarianceMeta } from './mileageIntervalDetailFormat';

/**
 * Presentational components for Mileage Interval Detail page (Layer 3).
 * Redesigned for high information density, clean hierarchy, and executive data presentation.
 */

/* ── 1. Collapsible Telematics Anomaly Alert Dropdown Banner ── */
export const SlimAnomalyAlert = ({ flags }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!flags || flags.length === 0) return null;

  return (
    <div className={`mt-anomaly-dropdown ${isOpen ? 'is-open' : ''}`}>
      <div
        className="mt-anomaly-dropdown__bar"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div className="mt-anomaly-dropdown__left">
          <div className="mt-anomaly-dropdown__icon-wrap">
            <AlertTriangle size={15} />
          </div>
          <span className="mt-anomaly-dropdown__heading">Telematics Flags & Anomalies</span>
          <span className="mt-anomaly-dropdown__badge">
            {flags.length} {flags.length === 1 ? 'Anomaly' : 'Anomalies'}
          </span>
          <span className="mt-anomaly-dropdown__preview">
            {flags[0]}
            {flags.length > 1 && ` (+${flags.length - 1} more)`}
          </span>
        </div>
        <button
          type="button"
          className="mt-anomaly-dropdown__toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-label={isOpen ? 'Collapse anomalies' : 'Expand anomalies'}
        >
          <span>{isOpen ? 'Hide Details' : 'View Details'}</span>
          <ChevronDown
            size={14}
            className={`mt-anomaly-dropdown__chevron ${isOpen ? 'is-flipped' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="mt-anomaly-dropdown__body">
          <div className="mt-anomaly-dropdown__grid">
            {flags.map((reason, idx) => (
              <div key={idx} className="mt-anomaly-dropdown__item">
                <span className="mt-anomaly-dropdown__bullet">
                  <AlertCircle size={14} />
                </span>
                <span className="mt-anomaly-dropdown__text">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── 2. Compact KPI Card ── */
export const CompactKpiCard = (props) => {
  const {
    type = 'mileage',
    title,
    primaryValue,
    unit = '',
    systemValue,
    gpsValue,
    variancePct,
    extraNote,
  } = props;
  const CardIcon = props.icon;
  const meta = getVarianceMeta(variancePct);
  const VIcon = meta.Icon || Minus;

  const sysNum = systemValue != null ? Number(systemValue) : null;
  const gpsNum = gpsValue != null ? Number(gpsValue) : null;

  return (
    <div className={`mt-compact-kpi mt-compact-kpi--${type}`}>
      <div className="mt-compact-kpi__header">
        <span className="mt-compact-kpi__label">
          {CardIcon && <CardIcon size={14} />}
          <span>{title}</span>
        </span>
        {variancePct != null && (
          <span
            className="mt-compact-kpi__badge"
            style={{
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.color}33`,
            }}
          >
            <VIcon size={12} /> {meta.label}
          </span>
        )}
      </div>

      <div className="mt-compact-kpi__body">
        <span className="mt-compact-kpi__value">{primaryValue ?? '—'}</span>
        {unit && <span className="mt-compact-kpi__unit">{unit}</span>}
      </div>

      <div className="mt-compact-kpi__footer">
        <span>
          GPS:{' '}
          <strong>{gpsNum != null ? `${gpsNum.toFixed(2)}${unit ? ' ' + unit : ''}` : '—'}</strong>
        </span>
        {extraNote ? (
          <span>{extraNote}</span>
        ) : (
          <span>
            Bill:{' '}
            <strong>
              {sysNum != null ? `${sysNum.toFixed(2)}${unit ? ' ' + unit : ''}` : '—'}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
};

/* ── 3. Reconciliation Audit Matrix Table ── */
export const ReconciliationMatrixTable = ({ interval }) => {
  if (!interval) return null;
  const fe = interval.fleetEdge || {};
  const feComputed = fe.status === 'COMPUTED';

  const distMeta = getVarianceMeta(fe.distanceVariancePct);
  const fuelMeta = getVarianceMeta(fe.fuelVariancePct);
  const mileageMeta = getVarianceMeta(fe.mileageVariancePct);

  return (
    <div className="mt-recon-card">
      <div className="mt-recon-card__header">
        <div>
          <div className="mt-recon-card__heading">Telemetry Reconciliation Matrix</div>
          <div className="mt-recon-card__sub">
            Audit comparison: Invoiced pump slips vs on-board FleetEdge IoT sensors
          </div>
        </div>
      </div>

      <div className="mt-recon-table-wrapper">
        <table className="mt-recon-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Audit Parameter</th>
              <th style={{ width: '26%' }}>System (Bill-Based)</th>
              <th style={{ width: '26%' }}>FleetEdge (IoT GPS)</th>
              <th style={{ width: '13%' }} className="text-center">
                Variance (Δ)
              </th>
              <th style={{ width: '13%' }} className="text-center">
                Audit Status
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Distance */}
            <tr>
              <td>
                <div className="mt-recon-param">
                  <span className="mt-recon-param__name">Tracked Distance</span>
                </div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(interval.distanceKm, 1, 'km')}</div>
                <div className="mt-recon-sub">
                  Odometer: {interval.startOdometer?.toLocaleString() || '—'} →{' '}
                  {interval.endOdometer?.toLocaleString() || '—'} km
                </div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(fe.distanceKm, 1, 'km')}</div>
                <div className="mt-recon-sub">
                  {feComputed ? 'Recorded by GPS odometry' : 'Telemetry sync pending'}
                </div>
              </td>
              <td className="text-center">
                {fe.distanceVariancePct != null ? (
                  <span
                    className="mt-variance-pill"
                    style={{
                      background: distMeta.bg,
                      color: distMeta.color,
                      border: `1px solid ${distMeta.color}33`,
                    }}
                  >
                    {fe.distanceVarianceKm != null
                      ? `${fe.distanceVarianceKm > 0 ? '+' : ''}${fe.distanceVarianceKm.toFixed(1)} km`
                      : distMeta.label}
                  </span>
                ) : (
                  <span className="mt-text-muted">—</span>
                )}
              </td>
              <td className="text-center">
                {fe.isFlaggedDistance ? (
                  <span className="mt-status-badge mt-status-badge--danger">
                    <AlertTriangle size={13} /> Odo Offset
                  </span>
                ) : feComputed ? (
                  <span className="mt-status-badge mt-status-badge--success">
                    <CheckCircle2 size={13} /> Validated
                  </span>
                ) : (
                  <span className="mt-status-badge mt-status-badge--neutral">Pending</span>
                )}
              </td>
            </tr>

            {/* Row 2: Fuel */}
            <tr>
              <td>
                <div className="mt-recon-param">
                  <span className="mt-recon-param__name">Fuel Consumed</span>
                </div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(interval.fuelConsumedLiters, 2, 'L')}</div>
                <div className="mt-recon-sub">
                  {interval.endFuelLogId?.totalAmount
                    ? `Invoice cost: ₹${interval.endFuelLogId.totalAmount.toLocaleString('en-IN')}`
                    : 'Billed refuel volume'}
                </div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(fe.fuelConsumedL, 2, 'L')}</div>
                <div className="mt-recon-sub">
                  {feComputed ? 'CAN bus fuel flow sensor' : 'Telemetry sync pending'}
                </div>
              </td>
              <td className="text-center">
                {fe.fuelVariancePct != null ? (
                  <span
                    className="mt-variance-pill"
                    style={{
                      background: fuelMeta.bg,
                      color: fuelMeta.color,
                      border: `1px solid ${fuelMeta.color}33`,
                    }}
                  >
                    {fe.fuelVarianceL != null
                      ? `${fe.fuelVarianceL > 0 ? '+' : ''}${fe.fuelVarianceL.toFixed(1)} L`
                      : fuelMeta.label}
                  </span>
                ) : (
                  <span className="mt-text-muted">—</span>
                )}
              </td>
              <td className="text-center">
                {fe.isFlaggedFuel ? (
                  <span className="mt-status-badge mt-status-badge--danger">
                    <AlertTriangle size={13} /> Overbilling
                  </span>
                ) : feComputed ? (
                  <span className="mt-status-badge mt-status-badge--success">
                    <CheckCircle2 size={13} /> Validated
                  </span>
                ) : (
                  <span className="mt-status-badge mt-status-badge--neutral">Pending</span>
                )}
              </td>
            </tr>

            {/* Row 3: Mileage */}
            <tr>
              <td>
                <div className="mt-recon-param">
                  <span className="mt-recon-param__name">Effective Mileage</span>
                </div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(interval.mileageKmPerL, 2, 'km/L')}</div>
                <div className="mt-recon-sub">Bill distance ÷ Invoiced litres</div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(fe.mileageKmPerL, 2, 'km/L')}</div>
                <div className="mt-recon-sub">IoT distance ÷ IoT fuel sensor</div>
              </td>
              <td className="text-center">
                {fe.mileageVariancePct != null ? (
                  <span
                    className="mt-variance-pill"
                    style={{
                      background: mileageMeta.bg,
                      color: mileageMeta.color,
                      border: `1px solid ${mileageMeta.color}33`,
                    }}
                  >
                    {mileageMeta.label}
                  </span>
                ) : (
                  <span className="mt-text-muted">—</span>
                )}
              </td>
              <td className="text-center">
                {fe.isFlaggedMileage ? (
                  <span className="mt-status-badge mt-status-badge--warning">
                    <AlertTriangle size={13} /> Divergent
                  </span>
                ) : feComputed ? (
                  <span className="mt-status-badge mt-status-badge--success">
                    <CheckCircle2 size={13} /> Validated
                  </span>
                ) : (
                  <span className="mt-status-badge mt-status-badge--neutral">Pending</span>
                )}
              </td>
            </tr>

            {/* Row 4: DEF / AdBlue */}
            <tr>
              <td>
                <div className="mt-recon-param">
                  <span className="mt-recon-param__name">DEF / AdBlue</span>
                </div>
              </td>
              <td>
                <div className="mt-recon-val">—</div>
                <div className="mt-recon-sub">Tracked separately in AdBlue log</div>
              </td>
              <td>
                <div className="mt-recon-val">{fmt(fe.defConsumed, 2, 'L')}</div>
                <div className="mt-recon-sub">
                  {fe.defConsumed != null ? 'Telemetry sensor measurement' : 'Sensor not available'}
                </div>
              </td>
              <td className="text-center">
                <span className="mt-text-muted">—</span>
              </td>
              <td className="text-center">
                <span className="mt-text-muted">—</span>
              </td>
            </tr>

            {/* Row 5: Reconciliation Time & Sync */}
            <tr>
              <td>
                <div className="mt-recon-param">
                  <span className="mt-recon-param__name">Period & Sensor Sync</span>
                </div>
              </td>
              <td>
                <div className="mt-recon-val">{fmtDate(interval.startDate)}</div>
                <div className="mt-recon-sub">to {fmtDate(interval.endDate)}</div>
              </td>
              <td>
                <div className="mt-recon-val">
                  {feComputed ? fmtDate(fe.computedAt) : 'Awaiting sync'}
                </div>
                <div className="mt-recon-sub">{fe.snapshotCount ?? 0} IoT sensor snapshots</div>
              </td>
              <td className="text-center">
                <span
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--mt-text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {fe.snapshotCount ? `${fe.snapshotCount} pings` : '—'}
                </span>
              </td>
              <td className="text-center">
                {feComputed ? (
                  <span className="mt-status-badge mt-status-badge--success">
                    <CheckCircle2 size={13} /> Synced
                  </span>
                ) : (
                  <span className="mt-status-badge mt-status-badge--neutral">
                    {fe.status || 'PENDING'}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── 4. Refuel Slips Table ── */
export const RefuelSlipsTable = ({ fuelEntries, isOngoing }) => {
  if (!fuelEntries || fuelEntries.length === 0) return null;

  return (
    <div className="mt-slips-card">
      <div className="mt-slips-card__header">
        <div className="mt-recon-card__title">
          <Fuel size={16} style={{ color: 'var(--mt-primary)' }} />
          <span>Refuel Slips Reconciled In This Interval</span>
          <span className="mt-badge-completed" style={{ fontSize: '12px', padding: '2px 8px' }}>
            {fuelEntries.length} receipts
          </span>
        </div>
        <span className="mt-recon-card__sub">
          Chronological sequence of physical fuel slips defining this odometer window
        </span>
      </div>

      <table className="mt-slips-table">
        <thead>
          <tr>
            <th style={{ width: '18%' }}>Event Type</th>
            <th style={{ width: '18%' }}>Refuel Timestamp</th>
            <th style={{ width: '28%' }}>Pump Station / Location</th>
            <th style={{ width: '14%' }} className="text-center">
              Odometer
            </th>
            <th style={{ width: '11%' }} className="text-right">
              Volume
            </th>
            <th style={{ width: '11%' }} className="text-right">
              Total (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {fuelEntries.map((entry, idx) => {
            const { log, label, type } = entry;
            if (!log) return null;
            const tagClass =
              type === 'start'
                ? 'mt-slip-tag--start'
                : type === 'partial'
                  ? 'mt-slip-tag--partial'
                  : 'mt-slip-tag--end';

            const pumpName =
              log.location ||
              (log.routeSource
                ? `${log.routeSource.name}${log.routeSource.city ? ', ' + log.routeSource.city : ''}`
                : 'Direct refuel station');

            return (
              <tr key={log._id || idx}>
                <td>
                  <span className={`mt-slip-tag ${tagClass}`}>{label}</span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--mt-text-secondary)' }}>
                  <Clock
                    size={13}
                    style={{ display: 'inline', marginRight: 5, verticalAlign: -1 }}
                  />
                  {fmtDate(log.refuelTime)}
                </td>
                <td>
                  <span
                    style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--mt-text-primary)' }}
                  >
                    <MapPin
                      size={13}
                      style={{
                        display: 'inline',
                        marginRight: 5,
                        verticalAlign: -1,
                        color: 'var(--mt-text-muted)',
                      }}
                    />
                    {pumpName}
                  </span>
                </td>
                <td className="text-center">
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                    {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}
                  </span>
                </td>
                <td className="text-right">
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--mt-primary)',
                    }}
                  >
                    {fmt(log.litres, 2, 'L')}
                  </span>
                </td>
                <td className="text-right">
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                    {log.totalAmount != null
                      ? `₹${log.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                      : '—'}
                  </span>
                  {log.rate != null && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: 'var(--mt-text-muted)',
                        marginTop: 2,
                      }}
                    >
                      ₹{log.rate}/L
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isOngoing && (
        <div className="mt-ongoing-strip">
          <Info size={13} />
          <span>
            This interval is currently <strong>ACTIVE</strong> — awaiting final full-tank refuel to
            compute final interval mileage.
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Backwards compatibility wrappers ── */
export const AnomalyAlertBanner = ({ flags }) => <SlimAnomalyAlert flags={flags} />;

export const HeroComparisonCard = (props) => <CompactKpiCard {...props} />;

export const BentoCard = (props) => {
  const { title, children } = props;
  return (
    <div className="mt-recon-card" style={{ padding: 12 }}>
      <h4>{title}</h4>
      {children}
    </div>
  );
};

export const BentoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
    <span>{label}</span>
    <span>{value ?? '—'}</span>
  </div>
);

export const TimelineNode = ({ log, label }) => (
  <div style={{ padding: 6, fontSize: 12 }}>
    <span>{label}: </span>
    <span>{log?.litres} L</span>
  </div>
);

export const SectionCard = ({ title, children }) => (
  <div className="mt-recon-card" style={{ padding: 12 }}>
    <h4>{title}</h4>
    {children}
  </div>
);

export const MetricRow = ({ label, value }) => <BentoRow label={label} value={value} />;

export const VarianceBlock = (props) => <CompactKpiCard {...props} />;

export const TimelineEntry = (props) => <TimelineNode {...props} />;
