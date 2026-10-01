import {
  Fuel,
  IndianRupee,
  Gauge,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Route,
  Droplets,
  Satellite,
  Info,
} from 'lucide-react';
import { fmt, fmtDate, getVarianceMeta } from './mileageIntervalDetailFormat';

/**
 * Presentational components for Mileage Interval Detail page (Layer 3).
 * Redesigned for high information density, zero waste, and concise data representation.
 */

/* ── 1. Slim Anomaly Alert Bar ── */
export const SlimAnomalyAlert = ({ flags }) => {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="mt-slim-alert">
      <div className="mt-slim-alert__title">
        <AlertTriangle size={14} />
        <span>
          {flags.length} Telematics Flag{flags.length > 1 ? 's' : ''}:
        </span>
      </div>
      <div className="mt-slim-alert__chips">
        {flags.map((reason, idx) => (
          <div key={idx} className="mt-slim-alert__chip" title={reason}>
            <span className="mt-slim-alert__dot" />
            <span>{reason}</span>
          </div>
        ))}
      </div>
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
          {CardIcon && <CardIcon size={12} />}
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
            <VIcon size={10} /> {meta.label}
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
          <strong style={{ fontFamily: 'var(--mt-font-mono)' }}>
            {gpsNum != null ? `${gpsNum.toFixed(2)}${unit ? ' ' + unit : ''}` : '—'}
          </strong>
        </span>
        {extraNote ? (
          <span>{extraNote}</span>
        ) : (
          <span>
            Bill:{' '}
            <strong style={{ fontFamily: 'var(--mt-font-mono)' }}>
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
        <div className="mt-recon-card__title">
          <Satellite size={15} style={{ color: 'var(--mt-primary)' }} />
          <span>Telemetry Reconciliation Matrix</span>
        </div>
        <span className="mt-recon-card__sub">
          Side-by-side comparison: Invoiced refuel records vs on-board IoT telematics
        </span>
      </div>

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
                <Route size={14} style={{ color: 'var(--mt-purple)' }} />
                <span>Tracked Distance</span>
              </div>
            </td>
            <td>
              <span className="mt-recon-val">{fmt(interval.distanceKm, 1, 'km')}</span>
              <span className="mt-recon-sub">
                Odometer: {interval.startOdometer?.toLocaleString() || '—'} →{' '}
                {interval.endOdometer?.toLocaleString() || '—'} km
              </span>
            </td>
            <td>
              <span className="mt-recon-val">{fmt(fe.distanceKm, 1, 'km')}</span>
              <span className="mt-recon-sub">
                {feComputed ? 'Recorded by GPS odometry' : 'Telemetry sync pending'}
              </span>
            </td>
            <td className="text-center">
              {fe.distanceVariancePct != null ? (
                <span
                  className="mt-compact-kpi__badge"
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
                '—'
              )}
            </td>
            <td className="text-center">
              {fe.isFlaggedDistance ? (
                <span className="mt-badge-flagged" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  <AlertTriangle size={11} /> Odo Offset
                </span>
              ) : feComputed ? (
                <span
                  className="mt-badge-validated"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  <CheckCircle2 size={11} /> Validated
                </span>
              ) : (
                <span className="mt-badge-pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  Pending
                </span>
              )}
            </td>
          </tr>

          {/* Row 2: Fuel */}
          <tr>
            <td>
              <div className="mt-recon-param">
                <Droplets size={14} style={{ color: 'var(--mt-info)' }} />
                <span>Fuel Consumed</span>
              </div>
            </td>
            <td>
              <span className="mt-recon-val">{fmt(interval.fuelConsumedLiters, 2, 'L')}</span>
              <span className="mt-recon-sub">
                {interval.endFuelLogId?.totalAmount
                  ? `Invoice cost: ₹${interval.endFuelLogId.totalAmount.toLocaleString('en-IN')}`
                  : 'Billed refuel volume'}
              </span>
            </td>
            <td>
              <span className="mt-recon-val">{fmt(fe.fuelConsumedL, 2, 'L')}</span>
              <span className="mt-recon-sub">
                {feComputed ? 'CAN bus fuel flow sensor' : 'Telemetry sync pending'}
              </span>
            </td>
            <td className="text-center">
              {fe.fuelVariancePct != null ? (
                <span
                  className="mt-compact-kpi__badge"
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
                '—'
              )}
            </td>
            <td className="text-center">
              {fe.isFlaggedFuel ? (
                <span className="mt-badge-flagged" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  <AlertTriangle size={11} /> Overbilling
                </span>
              ) : feComputed ? (
                <span
                  className="mt-badge-validated"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  <CheckCircle2 size={11} /> Validated
                </span>
              ) : (
                <span className="mt-badge-pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  Pending
                </span>
              )}
            </td>
          </tr>

          {/* Row 3: Mileage */}
          <tr>
            <td>
              <div className="mt-recon-param">
                <Gauge size={14} style={{ color: 'var(--mt-primary)' }} />
                <span>Effective Mileage</span>
              </div>
            </td>
            <td>
              <span
                className="mt-recon-val"
                style={{ color: 'var(--mt-primary)', fontWeight: 700 }}
              >
                {fmt(interval.mileageKmPerL, 2, 'km/L')}
              </span>
              <span className="mt-recon-sub">Bill distance ÷ Invoiced litres</span>
            </td>
            <td>
              <span className="mt-recon-val" style={{ fontWeight: 700 }}>
                {fmt(fe.mileageKmPerL, 2, 'km/L')}
              </span>
              <span className="mt-recon-sub">IoT distance ÷ IoT fuel sensor</span>
            </td>
            <td className="text-center">
              {fe.mileageVariancePct != null ? (
                <span
                  className="mt-compact-kpi__badge"
                  style={{
                    background: mileageMeta.bg,
                    color: mileageMeta.color,
                    border: `1px solid ${mileageMeta.color}33`,
                  }}
                >
                  {mileageMeta.label}
                </span>
              ) : (
                '—'
              )}
            </td>
            <td className="text-center">
              {fe.isFlaggedMileage ? (
                <span className="mt-badge-flagged" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  <AlertTriangle size={11} /> Divergent
                </span>
              ) : feComputed ? (
                <span
                  className="mt-badge-validated"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  <CheckCircle2 size={11} /> Validated
                </span>
              ) : (
                <span className="mt-badge-pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  Pending
                </span>
              )}
            </td>
          </tr>

          {/* Row 4: DEF / AdBlue */}
          <tr>
            <td>
              <div className="mt-recon-param">
                <Fuel size={14} style={{ color: 'var(--mt-warning)' }} />
                <span>DEF / AdBlue</span>
              </div>
            </td>
            <td>
              <span className="mt-recon-val">—</span>
              <span className="mt-recon-sub">Tracked separately in AdBlue log</span>
            </td>
            <td>
              <span className="mt-recon-val">{fmt(fe.defConsumed, 2, 'L')}</span>
              <span className="mt-recon-sub">
                {fe.defConsumed != null ? 'Telemetry sensor measurement' : 'Sensor not available'}
              </span>
            </td>
            <td className="text-center">—</td>
            <td className="text-center">
              <span style={{ fontSize: '11px', color: 'var(--mt-text-muted)' }}>—</span>
            </td>
          </tr>

          {/* Row 5: Reconciliation Time & Sync */}
          <tr>
            <td>
              <div className="mt-recon-param">
                <Clock size={14} style={{ color: 'var(--mt-text-secondary)' }} />
                <span>Period & Sync</span>
              </div>
            </td>
            <td>
              <span className="mt-recon-val" style={{ fontSize: '11.5px' }}>
                {fmtDate(interval.startDate)}
              </span>
              <span className="mt-recon-sub">to {fmtDate(interval.endDate)}</span>
            </td>
            <td>
              <span className="mt-recon-val" style={{ fontSize: '11.5px' }}>
                {feComputed ? fmtDate(fe.computedAt) : 'Awaiting sync'}
              </span>
              <span className="mt-recon-sub">{fe.snapshotCount ?? 0} IoT sensor snapshots</span>
            </td>
            <td className="text-center">
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--mt-text-secondary)',
                  fontFamily: 'var(--mt-font-mono)',
                }}
              >
                {fe.snapshotCount ? `${fe.snapshotCount} pings` : '—'}
              </span>
            </td>
            <td className="text-center">
              {feComputed ? (
                <span
                  className="mt-badge-completed"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  {fe.status}
                </span>
              ) : (
                <span className="mt-badge-pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {fe.status || 'PENDING'}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
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
          <Fuel size={15} style={{ color: 'var(--mt-primary)' }} />
          <span>Refuel Slips Reconciled In This Interval</span>
          <span className="mt-badge-completed" style={{ fontSize: '10.5px', padding: '1px 7px' }}>
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
                <td style={{ fontSize: '11.5px', color: 'var(--mt-text-secondary)' }}>
                  <Clock
                    size={11}
                    style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }}
                  />
                  {fmtDate(log.refuelTime)}
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--mt-text-primary)' }}>
                    <MapPin
                      size={11}
                      style={{
                        display: 'inline',
                        marginRight: 4,
                        verticalAlign: -1,
                        color: 'var(--mt-text-muted)',
                      }}
                    />
                    {pumpName}
                  </span>
                </td>
                <td className="text-center">
                  <span style={{ fontFamily: 'var(--mt-font-mono)', fontWeight: 600 }}>
                    {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}
                  </span>
                </td>
                <td className="text-right">
                  <span
                    style={{
                      fontFamily: 'var(--mt-font-mono)',
                      fontWeight: 700,
                      color: 'var(--mt-primary)',
                    }}
                  >
                    {fmt(log.litres, 2, 'L')}
                  </span>
                </td>
                <td className="text-right">
                  <span style={{ fontFamily: 'var(--mt-font-mono)', fontWeight: 600 }}>
                    {log.totalAmount != null
                      ? `₹${log.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                      : '—'}
                  </span>
                  {log.rate != null && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10.5px',
                        color: 'var(--mt-text-muted)',
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
