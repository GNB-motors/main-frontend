import { useEffect, useState } from 'react';
import { formatAgoText } from './minutesAgoFormat.js';

/**
 * Live telemetry strip: the selected vehicle, or a rotation through the live
 * ones every 3.2 s. Owns the rotation so the tick re-renders only this strip.
 */
export default function TelemetryTicker({
  selectedVehicle,
  vehicles,
  rotating,
  highlighted,
  icon,
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!rotating) return undefined;
    const timer = setInterval(() => setIndex((prev) => prev + 1), 3200);
    return () => clearInterval(timer);
  }, [rotating]);

  const live = selectedVehicle ? null : vehicles.filter((v) => v.live);
  const vehicle = selectedVehicle || (live.length ? live[index % live.length] : null);
  if (!vehicle) return null;

  return (
    <div className={`telemetry ${highlighted ? 'on' : ''}`}>
      <span style={{ color: 'var(--nova-fern-500)', display: 'flex' }}>{icon}</span>
      <span className="tplate">{vehicle.plate}</span>
      <span className="tsep" />
      <span className="tval">
        <b>{vehicle.speed != null ? vehicle.speed : '—'}</b> km/h
      </span>
      <span className="tsep" />
      <span className="tval">
        Fuel <b>{vehicle.fuel != null ? `${vehicle.fuel} L` : '—'}</b>
      </span>
      <span className="tsep" />
      <span className="tval">
        Ign <b>{vehicle.ignition}</b>
      </span>
      <span className="tsep opt1" />
      <span className="tval opt1">
        GPS <b>{vehicle.gps}</b>
      </span>
      <span className="tsep opt2" />
      <span className="tval opt2">{vehicle.ago != null ? formatAgoText(vehicle.ago) : '—'}</span>
    </div>
  );
}
