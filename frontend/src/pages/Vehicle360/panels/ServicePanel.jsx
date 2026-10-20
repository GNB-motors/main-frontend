import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatKm, formatNum, timeAgo } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { serviceState, daysSince } from '../vehicle360Logic';
import Empty from './Empty';

/**
 * Service tab — the standing, stated plainly, with the reasoning spelled out.
 * A frozen odometer means the overdue distance cannot grow, which is worth
 * saying: it changes when the workshop visit should be booked.
 */
export default function ServicePanel({ prediction, health, history }) {
  const svc = serviceState(prediction);
  const stalled = (history || []).length > 1 && daysSince(health?.pulledAt) >= 1;

  if (svc.level === 'none') {
    return (
      <PanelErrorBoundary name="vehicle-service">
        <div className="v360-panel--single v360-panel">
          <section className="v360-card">
            <p className="v360-card-title">Service</p>
            <Empty
              title="No service forecast yet"
              hint="A projection appears once the predictive sweep has enough odometer history for this vehicle."
            />
          </section>
        </div>
      </PanelErrorBoundary>
    );
  }

  return (
    <PanelErrorBoundary name="vehicle-service">
      <div className="v360-panel v360-panel--halves">
        <section className={`v360-card ${svc.overdue ? 'v360-card--alert' : ''}`.trim()}>
          <span className={`v360-pill v360-pill--${svc.overdue ? 'crit' : 'warn'}`}>
            <span className="v360-pill-dot" aria-hidden="true" />
            {svc.label}
          </span>

          <p className="v360-figure">
            <span
              className={`v360-figure-value v360-figure-value--lg ${svc.overdue ? 'v360-figure-value--crit' : ''}`.trim()}
            >
              {svc.km != null ? formatKm(svc.km) : `${formatNum(svc.days ?? 0)} days`}
            </span>
            <span className="v360-figure-note">
              {svc.overdue ? 'past the service interval' : 'until the service is due'}
            </span>
          </p>

          <p className="v360-card-lede">
            {svc.projectedAt ? `Due ${formatDateIST(svc.projectedAt)}` : 'Due date not projected'}
            {svc.days != null
              ? ` — ${formatNum(svc.days)} days ${svc.overdue ? 'ago' : 'away'}.`
              : '.'}
            {stalled && svc.overdue
              ? ' The odometer has not moved since the last reading, so the overdue distance is frozen — it will not grow until the truck runs again.'
              : ''}
          </p>

          <dl className="v360-kv">
            {svc.days != null ? (
              <>
                <dt>{svc.overdue ? 'Days overdue' : 'Days until due'}</dt>
                <dd className={svc.overdue ? 'is-crit' : undefined}>{formatNum(svc.days)} days</dd>
              </>
            ) : null}
            <dt>Projected due</dt>
            <dd>{svc.projectedAt ? formatDateIST(svc.projectedAt) : '—'}</dd>
            {health?.nextServiceKm != null ? (
              <>
                <dt>Next service at</dt>
                <dd>{formatKm(health.nextServiceKm)}</dd>
              </>
            ) : null}
            {health?.canOdo != null ? (
              <>
                <dt>Odometer at last reading</dt>
                <dd>{formatKm(health.canOdo)}</dd>
              </>
            ) : null}
            {svc.basis ? (
              <>
                <dt>Basis</dt>
                <dd className="is-dim">{String(svc.basis).replace(/_/g, ' ').toLowerCase()}</dd>
              </>
            ) : null}
          </dl>

          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <Link
              to="/vehicles/service-intelligence/add-service"
              className="v360-btn v360-btn--primary"
            >
              Create service record
            </Link>
            <Link to="/vehicles/service-intelligence" className="v360-btn">
              Service history
            </Link>
          </div>
        </section>

        <section className="v360-card">
          <p className="v360-card-title">How this was worked out</p>
          <p className="v360-card-lede">
            The forecast comes from the predictive sweep, which projects the next service from the
            odometer trend rather than from a fixed calendar date.
          </p>
          <dl className="v360-kv">
            <dt>Source</dt>
            <dd className="is-dim">predictive maintenance sweep</dd>
            <dt>Readings used</dt>
            <dd>{formatNum((history || []).length)}</dd>
            <dt>Last telemetry</dt>
            <dd className="is-dim">{health?.pulledAt ? timeAgo(health.pulledAt) : 'never'}</dd>
          </dl>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
