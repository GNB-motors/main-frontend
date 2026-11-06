import { formatKm, formatLitres, formatNum } from '../../../../utils/formatters';
import CardHead from './CardHead';

/**
 * TodayCard — Live daily operational vitals.
 *
 * Shows real-time distance run today, fuel consumed today, engine running vs idling,
 * and hardware health (battery voltage and GPS satellite lock).
 */
export default function TodayCard({ health, livePosition }) {
  const today = health?.today || {};
  const batteryV = health?.batteryVoltage;
  const isBatteryLow =
    batteryV != null ? (batteryV < 16 ? batteryV < 11.8 : batteryV < 23.5) : false;
  const batteryTone = isBatteryLow ? 'warn' : 'ok';

  const kmToday = today.distanceKm ?? 0;
  const fuelToday = today.fuelBurnedL ?? 0;
  const runH = today.engineHours ?? 0;
  const idleMin = today.idlingDurationMin ?? 0;

  const todayMileage = kmToday > 0 && fuelToday > 0 ? (kmToday / fuelToday).toFixed(2) : null;

  const isMoving =
    livePosition?.view?.status === 'moving' ||
    (livePosition?.speed != null && livePosition.speed > 0);

  return (
    <section className="v360-card">
      <CardHead
        title="Today's Shift"
        action={
          batteryV != null ? (
            <span className={`v360-pill v360-pill--${batteryTone}`}>
              <span className="v360-pill-dot" aria-hidden="true" />
              {batteryV}V Battery
            </span>
          ) : (
            <span className="v360-pill v360-pill--grey">
              <span className="v360-pill-dot" aria-hidden="true" />
              Battery —
            </span>
          )
        }
      />

      <p className="v360-figure">
        <span className="v360-figure-value">{formatKm(kmToday)}</span>
        <span className="v360-figure-note">
          {todayMileage
            ? `${todayMileage} km/L shift economy`
            : isMoving
              ? 'in transit'
              : 'parked at depot'}
        </span>
      </p>

      <dl className="v360-kv" style={{ marginTop: 10 }}>
        <dt>Fuel burned</dt>
        <dd>{fuelToday > 0 ? formatLitres(fuelToday) : '0 L'}</dd>
        <dt>Engine running</dt>
        <dd>{runH > 0 ? `${formatNum(runH, { decimals: 1 })} h` : '0.0 h'}</dd>
        <dt>Idling time</dt>
        <dd>{idleMin > 0 ? `${formatNum(idleMin)} min` : '0 min'}</dd>
        <dt>Cellular Network</dt>
        <dd>
          {livePosition?.view?.hasGpsFix || livePosition?.latitude != null
            ? 'Connected (Cell Tower / 4G)'
            : 'Standby'}
        </dd>
      </dl>
    </section>
  );
}
