import { formatKm, formatNum } from '../../../../utils/formatters';
import { initials } from './initials';
import CardHead from './CardHead';

/**
 * Who is driving this vehicle today. No photo field exists on `User`, so this
 * shows initials rather than a fabricated headshot — same rule as the rest of
 * this page: draw what the API actually reports.
 */
export default function DriverCard({
  assignedDriver,
  fleetMaster,
  fleetEdge,
  health,
  livePosition,
}) {
  const tags = [fleetMaster?.vehicleType, fleetEdge?.fuelType].filter(Boolean);

  return (
    <section className="v360-card" style={{ gridColumn: '1 / span 2' }}>
      <CardHead title="Driver" />
      {!assignedDriver ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No driver currently assigned</span>
          <span className="v360-empty-hint">
            Assign a driver from Driver ↔ Vehicle Assignments to see them here.
          </span>
        </div>
      ) : (
        <div className="v360-driver">
          <span className="v360-driver-avatar" aria-hidden="true">
            {initials(assignedDriver.name) || '?'}
          </span>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <p className="v360-driver-name">{assignedDriver.name || 'Unnamed driver'}</p>
            <p className="v360-card-lede" style={{ margin: '2px 0 0' }}>
              {[
                assignedDriver.mobileNumber,
                assignedDriver.group ? `Group: ${assignedDriver.group}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'No contact details on record'}
            </p>
            {tags.length ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <span key={t} className="v360-pill v360-pill--grey">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <dl className="v360-kv" style={{ flex: '0 0 auto' }}>
            <dt>Model</dt>
            <dd>{fleetEdge?.vehicleModel || fleetMaster?.model || '—'}</dd>
            <dt>ODD</dt>
            <dd>{health?.canOdo != null ? formatKm(health.canOdo) : '—'}</dd>
            <dt>Runtime</dt>
            <dd>
              {health?.engineRunHour != null
                ? `${formatNum(health.engineRunHour, { decimals: 1 })} h`
                : '—'}
            </dd>
            <dt>Speed</dt>
            <dd>{livePosition?.speed != null ? `${formatNum(livePosition.speed)} km/h` : '—'}</dd>
          </dl>
        </div>
      )}
    </section>
  );
}
