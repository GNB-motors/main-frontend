import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatKm, formatNum } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { serviceState } from '../vehicle360Logic';
import Empty from './Empty';
import { ServiceCentreCard, MaintenanceSweepCard } from './ServiceInsights';

/**
 * ServicePanel — Standing, predictive forecast, true dynamic progress, and nearest service centres.
 *
 * Implements real mathematical service progress:
 *   Progress = (Current Odo - Last Service Odo) / (Next Service Odo - Last Service Odo)
 */
export default function ServicePanel({
  prediction,
  health,
  vehicleId,
  registrationNumber,
  livePosition,
}) {
  const svc = serviceState(prediction);

  const currentOdo = health?.canOdo ?? prediction?.currentOdometer;
  const lastOdo = prediction?.lastServiceOdometer ?? health?.lastServiceKm;
  const nextOdo = prediction?.projectedServiceDueOdometer ?? health?.nextServiceKm;

  // True dynamic mathematical progress
  let progressPct = 0;
  if (svc.overdue) {
    progressPct = 100;
  } else if (currentOdo != null && lastOdo != null && nextOdo != null && nextOdo > lastOdo) {
    const elapsed = Math.max(0, currentOdo - lastOdo);
    const interval = nextOdo - lastOdo;
    progressPct = Math.min(100, Math.round((elapsed / interval) * 100));
  } else if (svc.km != null && currentOdo != null && lastOdo != null) {
    const elapsed = Math.max(0, currentOdo - lastOdo);
    const interval = elapsed + svc.km;
    progressPct = interval > 0 ? Math.min(100, Math.round((elapsed / interval) * 100)) : 0;
  }

  const remainingKm = svc.km != null ? svc.km : (nextOdo != null && currentOdo != null ? Math.max(0, nextOdo - currentOdo) : null);

  return (
    <PanelErrorBoundary name="vehicle-service">
      <div className="v360-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Service Standing & Mathematical Progress Card */}
        <section className={`v360-card ${svc.overdue ? 'v360-card--alert' : ''}`.trim()}>
          <div className="v360-card-head">
            <p className="v360-card-title">Service Standing & Health</p>
            <span className={`v360-pill v360-pill--${svc.overdue ? 'crit' : svc.level === 'warn' ? 'warn' : 'ok'}`}>
              <span className="v360-pill-dot" aria-hidden="true" />
              {svc.label}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginTop: 10,
            }}
          >
            {/* Headline Figure */}
            <div>
              <p className="v360-figure">
                <span className={`v360-figure-value v360-figure-value--lg ${svc.overdue ? 'v360-figure-value--crit' : ''}`.trim()}>
                  {remainingKm != null ? formatKm(remainingKm) : `${formatNum(svc.days ?? 0)} days`}
                </span>
                <span className="v360-figure-note">
                  {svc.overdue ? 'past due interval' : 'remaining until service'}
                </span>
              </p>
              <p className="v360-card-lede" style={{ marginTop: 6 }}>
                {svc.projectedAt ? `Projected due date: ${formatDateIST(svc.projectedAt)}` : 'Due date not projected'}
                {svc.days != null ? ` (${formatNum(svc.days)} days ${svc.overdue ? 'ago' : 'away'}).` : '.'}
              </p>
            </div>

            {/* True Dynamic Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--ink3)' }}>Service Interval Progress:</span>
                <span style={{ fontWeight: 700, color: svc.overdue ? 'var(--red-ink)' : 'var(--erp)' }}>
                  {progressPct}%
                </span>
              </div>
              <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'var(--sunk)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: svc.overdue ? 'var(--red)' : svc.level === 'warn' ? 'var(--amber)' : 'var(--erp)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>
                Interval progress based on CAN odometer checkpoints
              </span>
            </div>
          </div>

          <dl className="v360-kv" style={{ marginTop: 16 }}>
            <dt>Current CAN odometer</dt>
            <dd className="is-code">{currentOdo != null ? formatKm(currentOdo) : '—'}</dd>
            <dt>Last service odometer</dt>
            <dd className="is-code">{lastOdo != null ? formatKm(lastOdo) : '—'}</dd>
            <dt>Next service due odometer</dt>
            <dd className="is-code">{nextOdo != null ? formatKm(nextOdo) : '—'}</dd>
            <dt>Distance difference (remaining)</dt>
            <dd className={svc.overdue ? 'is-crit' : 'is-ok'}>
              {remainingKm != null ? `${formatKm(remainingKm)} ${svc.overdue ? 'overdue' : 'to go'}` : '—'}
            </dd>
            {svc.basis ? (
              <>
                <dt>Calculation basis</dt>
                <dd className="is-dim">{String(svc.basis).replace(/_/g, ' ').toLowerCase()}</dd>
              </>
            ) : null}
          </dl>

          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <Link
              to="/vehicles/service-intelligence/add-service"
              className="v360-btn v360-btn--primary"
            >
              Book this service
            </Link>
            <Link to="/vehicles/service-intelligence" className="v360-btn">
              Service history
            </Link>
          </div>
        </section>

        {/* Two Halves: Nearest Service Centres & Predictive Sweep */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          <ServiceCentreCard vehicleId={vehicleId} livePosition={livePosition} />
          <MaintenanceSweepCard registrationNumber={registrationNumber} />
        </div>
      </div>
    </PanelErrorBoundary>
  );
}
