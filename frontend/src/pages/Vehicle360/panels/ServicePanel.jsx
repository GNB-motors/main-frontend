import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatKm, formatNum } from '../../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../../utils/dateUtils';
import { serviceDistance } from '../serviceDistance';
import { serviceState } from '../vehicle360Logic';
import { ServiceCentreCard } from './ServiceInsights';
import { numeric } from './overview/referenceOverviewModel';
import './overview/referenceOverview.css';
import './vehicleService.css';

const HISTORY = '/vehicles/service-intelligence';
const km = (value) => (value == null ? '—' : formatKm(value));
const date = (value) => (value ? formatDateIST(value) : 'Not recorded');

export default function ServicePanel({ prediction, health, vehicleId, livePosition }) {
  const svc = serviceState(prediction, health);
  const { current, last, next, remaining, percent: used } = serviceDistance(prediction, health);
  const interval = last != null && next != null ? next - last : null;
  const pace = numeric(prediction?.avgKmPerDay);
  const basis = prediction?.basis
    ? String(prediction.basis).replace(/_/g, ' ').toLowerCase()
    : null;
  const rows = [
    ['', 'Last service odometer', date(prediction?.lastServiceAt), 'Recorded', km(last)],
    [
      '+',
      'Distance driven since',
      'Current reading minus service baseline',
      'Calculated',
      km(current != null && last != null ? current - last : null),
    ],
    ['=', 'Current odometer', 'Reading used by the service forecast', 'Reported', km(current)],
    [
      '',
      'Next service due at',
      interval > 0 ? `${km(last)} + ${km(interval)} interval` : 'Service interval unavailable',
      'Scheduled',
      km(next),
    ],
    [
      '−',
      'Remaining',
      next != null && current != null
        ? `${km(next)} − ${km(current)}`
        : 'Waiting for odometer data',
      'Calculated',
      km(remaining),
    ],
    [
      '÷',
      'Running pace',
      'Average reported by the forecast',
      'Measured',
      pace != null ? `${formatNum(pace)} km/day` : '—',
    ],
    [
      '=',
      'Due in',
      'Forecast based on the available running history',
      'Predicted',
      svc.days != null
        ? `${formatNum(svc.days)} days ${svc.overdue ? 'overdue' : 'away'} · ${date(svc.projectedAt)}`
        : '—',
    ],
  ];
  return (
    <PanelErrorBoundary name="vehicle-service">
      <div className="vdo-overview vsvc">
        <section className="vdo-card vsvc-summary">
          <div className="vsvc-heading">
            <div className="vsvc-headline">
              <div className="vsvc-title">
                <h3>Next service</h3>
                <span
                  className={`vsvc-status${svc.overdue ? ' vsvc-status--danger' : svc.level === 'warn' ? ' vsvc-status--warn' : svc.level === 'none' ? ' vsvc-status--unknown' : ''}`}
                >
                  ● {svc.label}
                </span>
              </div>
              <div className="vsvc-figure">
                <strong>{remaining != null ? km(Math.abs(remaining)) : '—'}</strong>
                <span>
                  {remaining != null
                    ? remaining < 0
                      ? 'overdue'
                      : 'to go'
                    : 'Distance unavailable'}
                </span>
              </div>
              <p className="vsvc-prediction">
                ◌{' '}
                {svc.projectedAt ? (
                  <>
                    Predicted due <b>{date(svc.projectedAt)}</b>
                    {svc.days != null
                      ? ` · ${formatNum(svc.days)} days ${svc.overdue ? 'ago' : 'away'}`
                      : ''}
                    {pace != null ? ` at ${formatNum(pace)} km/day` : ''}
                  </>
                ) : (
                  'A due date has not been projected yet.'
                )}
              </p>
            </div>
            <div className="vsvc-actions">
              <Link className="vsvc-button" to={HISTORY}>
                Service history
              </Link>
              <Link className="vsvc-button vsvc-button--primary" to={`${HISTORY}/add-service`}>
                Book this service
              </Link>
            </div>
          </div>
          <div className="vsvc-progress-caption">
            <span>Service interval · {km(interval)}</span>
            <b>{used != null ? `${Math.round(used)}% used` : 'Progress unavailable'}</b>
          </div>
          <div className="vsvc-progress">
            <span
              style={{ width: `${used ?? 0}%`, background: svc.overdue ? '#dd3030' : undefined }}
            />
            {used != null ? (
              <i style={{ left: `${Math.max(2, Math.min(98, used))}%` }}>
                <span>Today</span>
              </i>
            ) : null}
          </div>
          <div className="vsvc-scale">
            <span>
              <b>{km(last)}</b>
              <small>Last service · {date(prediction?.lastServiceAt)}</small>
            </span>
            <span>
              <b>{km(current)}</b>
              <small>Current reading</small>
            </span>
            <span>
              <b>{km(next)}</b>
              <small>Due · {date(svc.projectedAt)}</small>
            </span>
          </div>
        </section>
        <div className="vsvc-middle">
          <section className="vdo-card vsvc-calculation">
            <h3>
              How{' '}
              {remaining != null
                ? `${km(Math.abs(remaining))} ${remaining < 0 ? 'overdue' : 'remaining'}`
                : 'the forecast'}{' '}
              was worked out
            </h3>
            <p className="vsvc-subtitle">
              {prediction?.computedAt
                ? `Computed ${formatDateTimeIST(prediction.computedAt)}`
                : 'Forecast timestamp unavailable'}
              {basis ? ` · ${basis}` : ''}
            </p>
            <div>
              {rows.map(([op, label, source, certainty, value]) => (
                <div
                  className={`vsvc-calc-row${op === '=' ? ' vsvc-calc-row--total' : ''}`}
                  key={label}
                >
                  <span>{op}</span>
                  <span>
                    {label}
                    <small>{source}</small>
                  </span>
                  <em className={certainty === 'Predicted' ? 'vsvc-purple' : ''}>○ {certainty}</em>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </section>
          <section className="vdo-card vsvc-explanation">
            <span className="vsvc-eyebrow">✧ About this estimate</span>
            <p className="vsvc-explanation-lead">
              {current != null
                ? `The forecast uses an odometer reading of ${km(current)}${basis ? ` with a ${basis} baseline` : ''}.`
                : 'A current odometer reading is needed to calculate distance remaining.'}
            </p>
            <p>
              The remaining distance is the next service odometer minus the current reading. The due
              date uses the running pace and any available engine-hours limit.
            </p>
            <p>
              GPS replacement distance and the last engine-reading timestamp are not supplied by
              this forecast. An additional GPS estimate is not assumed.
            </p>
            <div className="vsvc-comparison">
              <div>
                <small>Current reading</small>
                <strong>{km(current)}</strong>
                <small>Reported by forecast</small>
              </div>
              <div>
                <small>Remaining distance</small>
                <strong>{km(remaining)}</strong>
                <small>Calculated from service interval</small>
              </div>
            </div>
          </section>
        </div>
        <div className="vsvc-bottom">
          <ServiceCentreCard vehicleId={vehicleId} livePosition={livePosition} />
          <section className="vdo-card">
            <div className="vsvc-title">
              <h3>Service timeline</h3>
              <Link to={HISTORY}>Full history →</Link>
            </div>
            <div className="vsvc-event">
              <i className="vsvc-event--predicted" />
              <span>
                Next service
                <small>{next != null ? `Due at ${km(next)}` : 'Due odometer unavailable'}</small>
              </span>
              <time>{svc.projectedAt ? `~${date(svc.projectedAt)}` : 'Not projected'}</time>
            </div>
            {prediction?.computedAt ? (
              <div className="vsvc-event">
                <i />
                <span>
                  Forecast updated<small>{basis || 'Based on available running history'}</small>
                </span>
                <time>{date(prediction.computedAt)}</time>
              </div>
            ) : null}
            <div className="vsvc-event">
              <i />
              <span>
                Last service baseline
                <small>
                  {last != null
                    ? `${km(last)} · ${basis || 'source not specified'}`
                    : 'No service odometer recorded'}
                </small>
              </span>
              <time>{date(prediction?.lastServiceAt)}</time>
            </div>
          </section>
        </div>
      </div>
    </PanelErrorBoundary>
  );
}
