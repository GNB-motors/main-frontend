import { Link } from 'react-router-dom';
import { initials } from './initials';
import CardHead from './CardHead';
import { timeAgo } from '../../../../utils/formatters';

/**
 * DriverCard — who is assigned to this vehicle today.
 *
 * Shows real driver details (initials avatar, full name, phone with click-to-call,
 * DL number, and assigned branch/duty duration) rather than repeating vehicle
 * telemetry like odometer or speed. Where no driver is assigned, shows a clean
 * prompt linking directly to Driver ↔ Vehicle Assignments.
 */
export default function DriverCard({
  assignedDriver,
  fleetMaster,
  fleetEdge,
}) {
  return (
    <section className="v360-card" >
      <CardHead
        title="Assigned Driver"
        action={
          <Link to="/vehicle-assignments" className="v360-link">
            {assignedDriver ? 'Change assignment →' : 'Assign driver →'}
          </Link>
        }
      />
      {!assignedDriver ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No driver currently assigned</span>
          <span className="v360-empty-hint">
            Assign a driver from Driver ↔ Vehicle Assignments to track shift performance and driver accountability.
          </span>
          <div style={{ marginTop: 12 }}>
            <Link to="/vehicle-assignments" className="v360-btn v360-btn--primary">
              Assign driver
            </Link>
          </div>
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
                assignedDriver.group ? `Branch: ${assignedDriver.group}` : null,
                assignedDriver.location ? `Base: ${assignedDriver.location}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Active duty'}
            </p>
            {assignedDriver.mobileNumber ? (
              <div style={{ marginTop: 8 }}>
                <a
                  href={`tel:${assignedDriver.mobileNumber}`}
                  className="v360-btn"
                  style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                >
                  📞 {assignedDriver.mobileNumber}
                </a>
              </div>
            ) : null}
          </div>
          <dl className="v360-kv" style={{ flex: '0 0 auto', minWidth: 200 }}>
            <dt>Driving license</dt>
            <dd className="is-code">{assignedDriver.licenseNumber || 'On file'}</dd>
            <dt>Duty started</dt>
            <dd>
              {assignedDriver.assignmentStartDate
                ? timeAgo(assignedDriver.assignmentStartDate)
                : 'Current'}
            </dd>
            <dt>Vehicle model</dt>
            <dd>{fleetEdge?.vehicleModel || fleetMaster?.model || fleetMaster?.registrationNumber || '—'}</dd>
            <dt>Shift status</dt>
            <dd>Active shift</dd>
          </dl>
        </div>
      )}
    </section>
  );
}
