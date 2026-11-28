import { Skeleton } from '@/components/ui/skeleton';
import InfoTip from '../../components/redesign/InfoTip';
import { FUEL_LOSS_TIP, fmtIstMinute, fmtLitres, fuelBurntView, fuelLossView } from './tripFuel';

/**
 * The fuel this trip burnt, and the fuel that left the tank without the engine
 * burning it.
 *
 * A litre the server did not measure stays unknown — a dash, never a zero — and
 * the wording never names a crime: it says what a person should check.
 */
export default function TripFuelCard({
  summary = null,
  measurement = null,
  loading = false,
  error = null,
}) {
  if (loading && !summary) {
    return (
      <div className="atx-card atx-dev-card">
        <h2 className="atx-card-title">Fuel</h2>
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  const legacyBurnt = fuelBurntView(summary);
  const burnt = measurement
    ? {
        burnt: measurement.burnedL,
        partial: measurement.fuelPartial,
        legs: legacyBurnt.legs.filter((leg) => leg.label !== 'Approach'),
      }
    : legacyBurnt;
  const loss = fuelLossView(summary?.loss);

  return (
    <div className="atx-card atx-dev-card">
      <h2 className="atx-card-title">Fuel</h2>
      {error ? (
        <p className="atx-state">Could not load fuel for this trip</p>
      ) : (
        <div className="atx-fields">
          <div className="atx-field">
            <span className="atx-field-label">Fuel burnt</span>
            <span className="atx-field-value">
              {fmtLitres(burnt.burnt)}
              {burnt.partial ? <span className="atx-chip atx-chip--watch">partial</span> : null}
            </span>
            {burnt.legs.length ? (
              <small className="atx-cost-note">
                {burnt.legs.map((leg) => `${leg.label} ${fmtLitres(leg.litres)}`).join(' · ')}
              </small>
            ) : null}
          </div>
          <div className="atx-field">
            <span className="atx-field-label">
              Unexplained fuel loss
              <InfoTip text={FUEL_LOSS_TIP} label="What unexplained fuel loss means" />
            </span>
            <span className="atx-field-value">
              {loss.text}
              {loss.partial ? <span className="atx-chip atx-chip--watch">partial</span> : null}
            </span>
            {loss.events.length ? (
              <ul className="atx-cost-note">
                {loss.events.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    {fmtIstMinute(event.at)} · {fmtLitres(event.litres)}
                    {event.tank ? ` · tank ${event.tank}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
