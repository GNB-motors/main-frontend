import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fmt, fmtDate, getVarianceMeta } from '../mileageIntervalDetailFormat';

/* ── 3. Reconciliation Audit Matrix Table ── */
const ReconciliationMatrixTable = ({ interval }) => {
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
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the text inside */}
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
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the text inside */}
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
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the text inside */}
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
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the text inside */}
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
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a table cell, not a control; the rule reads <td> as a gridcell and stops before the text inside */}
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

export default ReconciliationMatrixTable;
