import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { formatKm, formatNum, timeAgo } from '../../../utils/formatters';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { buildSignals } from '../vehicle360Logic';
import Empty from './Empty';
import Trend from './Trend';

/**
 * Telemetry tab — which signals are actually arriving.
 *
 * The list only names signals this payload covers. Tyre pressure and brake
 * fluid are absent on purpose: the API has no such fields, and showing a dial
 * for a sensor that may not exist is how a fleet page starts lying.
 */
export default function TelemetryPanel({ health, livePosition, history }) {
  const signals = buildSignals(health, livePosition);
  const enough = (history || []).length > 1;

  return (
    <PanelErrorBoundary name="vehicle-telemetry">
      <div className="v360-panel v360-panel--halves">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Signals</p>
            <Link to="/fleet-coverage" className="v360-link">
              Coverage →
            </Link>
          </div>
          <div className="v360-signals">
            {signals.map((s) => (
              <div key={s.name} className={`v360-signal v360-signal--${s.tone}`}>
                <span className="v360-signal-dot" aria-hidden="true" />
                <span className="v360-signal-name">{s.name}</span>
                <span className="v360-signal-state">{s.state}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Location</p>
            <Link to="/live-tracking" className="v360-link">
              Live tracking →
            </Link>
          </div>
          {livePosition ? (
            <>
              {livePosition.latitude != null ? (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <PlaceLabel lat={livePosition.latitude} lng={livePosition.longitude} />
                </div>
              ) : null}
              <dl className="v360-kv">
                <dt>Region</dt>
                <dd>{livePosition.state || '—'}</dd>
                <dt>Speed</dt>
                <dd>
                  {livePosition.speed != null ? `${formatNum(livePosition.speed)} km/h` : '—'}
                </dd>
                <dt>Last event</dt>
                <dd className="is-dim">
                  {livePosition.eventDateTime
                    ? `${formatDateTimeIST(livePosition.eventDateTime)} · ${timeAgo(livePosition.eventDateTime)}`
                    : '—'}
                </dd>
              </dl>
            </>
          ) : (
            <Empty
              title="No live position"
              hint="Positions appear once live tracking polls this vehicle."
            />
          )}
        </section>

        <section className="v360-card" style={{ gridColumn: '1 / -1' }}>
          <p className="v360-card-title">Odometer & engine hours</p>
          {enough ? (
            <div className="v360-panel" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
              <div>
                <p className="v360-card-lede" style={{ marginTop: 0 }}>
                  Odometer
                </p>
                <Trend data={history} dataKey="odo" format={(v) => formatKm(v)} />
              </div>
              <div>
                <p className="v360-card-lede" style={{ marginTop: 0 }}>
                  Engine hours
                </p>
                <Trend
                  data={history}
                  dataKey="engineHours"
                  format={(v) => `${formatNum(v, { decimals: 1 })} h`}
                />
              </div>
            </div>
          ) : (
            <Empty
              title="Not enough history yet"
              hint={`A trend needs at least two live-status readings in the window — ${(history || []).length === 1 ? 'only one is' : 'none are'} available.`}
            />
          )}
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
