import { Link } from 'react-router-dom';

const PREVIEW_VEHICLES = 8;

/** The registrations under one iALERT link; each opens the iALERT live status page. */
export default function FleetVehicleChips({ regs, onNavigate }) {
  if (!regs.length) return null;
  return (
    <div className="fleet-vehicles">
      <p className="fleet-vehicles-label">Vehicles ({regs.length})</p>
      <div className="fleet-vehicles-list">
        {regs.slice(0, PREVIEW_VEHICLES).map((reg) => (
          <Link key={reg} to="/ialert/vehicles" onClick={onNavigate} className="fleet-vehicle">
            {reg}
          </Link>
        ))}
        {regs.length > PREVIEW_VEHICLES ? (
          <Link to="/ialert/vehicles" onClick={onNavigate} className="fleet-vehicle fleet-vehicle--more">
            +{regs.length - PREVIEW_VEHICLES} more
          </Link>
        ) : null}
      </div>
    </div>
  );
}
