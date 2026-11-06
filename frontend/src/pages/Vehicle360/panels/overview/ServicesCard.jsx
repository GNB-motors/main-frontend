import { formatKm } from '../../../../utils/formatters';
import { formatDateIST } from '../../../../utils/dateUtils';
import { serviceState } from '../../vehicle360Logic';
import CardHead from './CardHead';

/**
 * ServicesCard — Executive Service Standing Card.
 *
 * Displays true mathematical progress, remaining distance until next service,
 * current CAN odometer vs next service due odometer, and schedule status.
 */
export default function ServicesCard({ prediction, health, onGoService }) {
  const svc = serviceState(prediction);

  const currentOdo = health?.canOdo ?? prediction?.currentOdometer;
  const lastOdo = prediction?.lastServiceOdometer ?? health?.lastServiceKm;
  const nextOdo = prediction?.projectedServiceDueOdometer ?? health?.nextServiceKm;

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

  const remainingKm =
    svc.km != null
      ? svc.km
      : nextOdo != null && currentOdo != null
        ? Math.max(0, nextOdo - currentOdo)
        : null;

  return (
    <section className={`v360-card ${svc.overdue ? 'v360-card--alert' : ''}`.trim()}>
      <CardHead
        title="Services"
        action={
          <button type="button" className="v360-link" onClick={onGoService}>
            Service details →
          </button>
        }
      />

      <p className="v360-figure">
        <span
          className={`v360-figure-value ${svc.overdue ? 'v360-figure-value--crit' : ''}`.trim()}
        >
          {remainingKm != null ? formatKm(remainingKm) : '—'}
        </span>
        <span className="v360-figure-note">
          {svc.overdue ? 'past due interval' : 'remaining until service'}
        </span>
      </p>

      {/* Interval Progress Bar */}
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            marginBottom: 4,
          }}
        >
          <span style={{ color: 'var(--ink3)' }}>Interval Progress:</span>
          <span style={{ fontWeight: 700, color: svc.overdue ? 'var(--red-ink)' : 'var(--erp)' }}>
            {progressPct}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            background: 'var(--sunk)',
            overflow: 'hidden',
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: svc.overdue
                ? 'var(--red)'
                : svc.level === 'warn'
                  ? 'var(--amber)'
                  : 'var(--erp)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <dl className="v360-kv">
        <dt>Current CAN odo</dt>
        <dd>{currentOdo != null ? formatKm(currentOdo) : '—'}</dd>
        <dt>Next service due</dt>
        <dd>{nextOdo != null ? formatKm(nextOdo) : '—'}</dd>
        <dt>Last check-in</dt>
        <dd>{lastOdo != null ? formatKm(lastOdo) : '—'}</dd>
        <dt>Projected date</dt>
        <dd>
          {prediction?.projectedServiceDueDate
            ? formatDateIST(prediction.projectedServiceDueDate)
            : 'On schedule'}
        </dd>
      </dl>
    </section>
  );
}
