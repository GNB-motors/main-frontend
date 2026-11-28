import { fmtKm } from './autoTripFormat';
import './TripMeasurement.css';

export default function TripMeasurement({ measurement: m }) {
  if (!m) return <p className="atx-measurement-unavailable">Trip measurement is unavailable.</p>;
  const source = (s) =>
    ({ odometer: 'Odometer', road: 'Road matched', path: 'GPS path', estimated: 'Estimated' })[s] ||
    'Source not recorded';
  return (
    <section className="atx-card atx-measurement" aria-label="Trip distance and fuel">
      <h3 className="atx-card-title">Trip distance and fuel{m.soFar ? ' so far' : ''}</h3>
      <dl className="atx-measurement-grid">
        <div>
          <dt>Total known km</dt>
          <dd>{fmtKm(m.totalKm)}</dd>
          <small>
            {m.totalKm == null
              ? 'Measurement unavailable'
              : m.partial
                ? 'Partly measured'
                : 'Measured distance'}
          </small>
        </div>
        <div>
          <dt>Loaded</dt>
          <dd>{fmtKm(m.loadedKm)}</dd>
          <small>{source(m.sources?.loaded)}</small>
        </div>
        <div>
          <dt>Empty</dt>
          <dd>{fmtKm(m.emptyKm)}</dd>
          <small>{source(m.sources?.return)}</small>
        </div>
        <div>
          <dt>Diesel burned</dt>
          <dd>{m.burnedL == null ? '—' : `${m.burnedL} L`}</dd>
          <small>
            {m.burnedL == null
              ? 'Measurement unavailable'
              : m.fuelPartial
                ? 'Partial coverage'
                : 'Measured fuel'}
          </small>
        </div>
        <div>
          <dt>{m.efficiencyBasis === 'LOADED_LEG' ? 'Loaded-leg average' : 'Trip average'}</dt>
          <dd>{m.kmPerL == null ? '—' : `${m.kmPerL} km/L`}</dd>
          {m.kmPerL == null ? <small>Matching measurement unavailable</small> : null}
        </div>
      </dl>
      <p className="atx-measurement-note">{m.note}</p>
      {m.contextualApproachKm != null ? (
        <p className="atx-measurement-note">
          Approach to pickup: {fmtKm(m.contextualApproachKm)} (shown separately).
        </p>
      ) : null}
    </section>
  );
}
