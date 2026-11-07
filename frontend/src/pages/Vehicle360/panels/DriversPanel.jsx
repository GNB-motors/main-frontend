import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatDateIST, formatDateTimeIST, toISTDateString } from '../../../utils/dateUtils';
import { timeAgo } from '../../../utils/formatters';
import useApi from '../../../hooks/useApi';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';
import DataTooltip from '../../../components/ui/DataTooltip';
import { initials } from './overview/initials';
import { OverviewCardSkeleton } from './overview/OverviewSkeleton';
import './overview/referenceOverview.css';
import './vehicleDrivers.css';

const ASSIGNMENTS = '/vehicle-assignments';
const stamp = (value) =>
  value && Number.isFinite(new Date(value).getTime()) ? new Date(value).getTime() : null;
const date = (value) => (stamp(value) != null ? formatDateIST(value) : 'Not recorded');
const nameOf = (row) =>
  [row.driverId?.firstName, row.driverId?.lastName].filter(Boolean).join(' ') ||
  'Driver not recorded';

export default function DriversPanel({ vehicleId, assignedDriver, recentAlerts = [] }) {
  const { data, loading, error } = useApi(
    (signal) =>
      DriverVehicleAssignmentService.getAssignments(
        { vehicleId, includePast: true, limit: 200 },
        { signal },
      ),
    [vehicleId],
    { enabled: Boolean(vehicleId), scopeKey: vehicleId },
  );
  const rows = Array.isArray(data) ? data : data?.results || data?.items || [];
  const now = Date.now();
  const start = new Date(`${toISTDateString(new Date())}T00:00:00+05:30`).getTime();
  const windowStart = start - 29 * 86400000;
  const period = now - windowStart;
  const activeRows = rows.filter(
    (row) =>
      stamp(row.startDate) != null &&
      stamp(row.startDate) <= now &&
      (stamp(row.endDate) == null || stamp(row.endDate) > now),
  );
  const safety = (Array.isArray(recentAlerts) ? recentAlerts : []).filter(
    (alert) =>
      stamp(alert.eventDateTime) >= start &&
      stamp(alert.eventDateTime) <= now &&
      /harsh|brak|accel|rash|turn|coast|wheel|overspeed/i.test(alert.type || ''),
  );
  const counts = [
    ['Harsh braking', /harsh.*brak|brak.*harsh/i],
    ['Harsh acceleration', /harsh.*accel|accel.*harsh/i],
    ['Rash turning', /rash.*turn|harsh.*turn/i],
    ['Neutral coasting', /coast|free.?wheel/i],
  ];
  return (
    <PanelErrorBoundary name="vehicle-drivers">
      <div className="vdo-overview vdrivers">
        <div className="vdrivers-top">
          <section className="vdo-card vdrivers-profile">
            <div className="vdrivers-head">
              <h3>Assigned driver</h3>
              <span className="vdrivers-badge">
                {assignedDriver ? 'Assigned' : 'No assignment'}
              </span>
            </div>
            {assignedDriver ? (
              <>
                <div className="vdrivers-identity">
                  <span className="vdrivers-avatar">{initials(assignedDriver.name) || '—'}</span>
                  <div>
                    <strong>{assignedDriver.name || 'Name not recorded'}</strong>
                    <p>
                      {assignedDriver.assignmentStartDate
                        ? `Assigned ${date(assignedDriver.assignmentStartDate)} · ${timeAgo(assignedDriver.assignmentStartDate)}`
                        : 'Assignment start not recorded'}
                    </p>
                    <p>{assignedDriver.mobileNumber || 'Phone not recorded'}</p>
                  </div>
                </div>
                <div className="vdrivers-profile-facts">
                  <div>
                    <span>
                      Driving licence<small>Number on the driver record</small>
                    </span>
                    <b>{assignedDriver.licenseNumber || 'Not on record'}</b>
                  </div>
                  <div>
                    <span>
                      Licence validity<small>Expiry and verification are not supplied</small>
                    </span>
                    <b>Not verified here</b>
                  </div>
                  <div>
                    <span>
                      Attribution<small>Based on recorded assignment periods</small>
                    </span>
                    <b>
                      {loading
                        ? 'Loading'
                        : error
                          ? 'Unavailable'
                          : activeRows.length > 1
                            ? 'Overlapping assignments'
                            : 'Current assignment'}
                    </b>
                  </div>
                  <div>
                    <span>
                      Driving score<small>No measured score supplied for this driver</small>
                    </span>
                    <b>Not available</b>
                  </div>
                  {assignedDriver.group ? (
                    <div>
                      <span>Branch</span>
                      <b>{assignedDriver.group}</b>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="vdrivers-empty">
                <h3>No driver currently assigned</h3>
                <p>Assign a driver to keep a record of who operates this vehicle.</p>
              </div>
            )}
            <div className="vdrivers-actions">
              {assignedDriver?.mobileNumber ? (
                <a
                  className="vdrivers-button vdrivers-button--primary"
                  href={`tel:${assignedDriver.mobileNumber}`}
                >
                  Call driver
                </a>
              ) : null}
              <Link className="vdrivers-button" to={ASSIGNMENTS}>
                {assignedDriver ? 'Change driver' : 'Assign driver'}
              </Link>
            </div>
          </section>
          <section className="vdo-card vdrivers-safety">
            <div className="vdrivers-head">
              <div>
                <h3>Safety today</h3>
                <p>Safety alerts in the vehicle’s recent returned records</p>
              </div>
              <span className="vdrivers-badge vdrivers-badge--warn">
                {safety.length ? `${safety.length} returned alerts` : 'Coverage unconfirmed'}
              </span>
            </div>
            <div>
              <div className="vdrivers-safety-timeline">
                <span className="vdrivers-night vdrivers-night--early" />
                <span className="vdrivers-night vdrivers-night--late" />
                <span className="vdrivers-safety-track" />
                {safety.map((alert, index) => {
                  const left = ((stamp(alert.eventDateTime) - start) / 86400000) * 100;
                  return (
                    <button
                      key={alert.id || index}
                      style={{ left: `${left}%` }}
                      aria-label={`${alert.type} · ${formatDateTimeIST(alert.eventDateTime)}`}
                    >
                      <DataTooltip
                        className={`vdrivers-tooltip${left > 50 ? ' vdrivers-tooltip--end' : ''}`}
                        aria-hidden="true"
                        label={alert.type}
                        details={[
                          formatDateTimeIST(alert.eventDateTime),
                          'Returned vehicle alert; driver attribution not verified',
                        ]}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="vdrivers-ticks">
                <span>12 am</span>
                <span>6 am</span>
                <span>12 pm</span>
                <span>6 pm</span>
                <span>12 am</span>
              </div>
              <p className="vdrivers-timeline-note">
                Night window · 11 pm–5 am · dots show returned alerts
              </p>
            </div>
            <div className="vdrivers-safety-rows">
              {counts.map(([label, pattern]) => {
                const count = safety.filter((alert) => pattern.test(alert.type)).length;
                return (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{count || '—'}</strong>
                    <small>{count ? 'Returned alerts' : 'No matching alert returned'}</small>
                  </div>
                );
              })}
              <div>
                <span>Night driving</span>
                <strong>—</strong>
                <small>Driving duration unavailable</small>
              </div>
            </div>
            <div className="vdrivers-insight">
              ✧ These are recent vehicle alerts, not a complete daily safety report. No returned
              event does not prove zero incidents. Driver ratings and fault attribution need
              verified coverage and assignment history.
            </div>
          </section>
        </div>
        {loading && !data ? (
          <OverviewCardSkeleton />
        ) : (
          <section className="vdo-card vdrivers-history">
            <div className="vdrivers-head">
              <h3>Driver assignment history</h3>
              <Link to={ASSIGNMENTS}>Manage assignments →</Link>
            </div>
            {!vehicleId ? (
              <p>No fleet-master vehicle record to resolve assignments.</p>
            ) : error ? (
              <p>Couldn’t load assignment history.</p>
            ) : !rows.length ? (
              <div className="vdrivers-empty">
                <h3>No assignment history returned</h3>
                <p>Recorded driver assignments will appear here.</p>
              </div>
            ) : (
              <>
                <div
                  className="vdrivers-assignment-timeline"
                  aria-label="Recorded assignments over the last 30 days"
                >
                  {rows.map((row, index) => {
                    const from = stamp(row.startDate);
                    const to = stamp(row.endDate) ?? now;
                    if (from == null || from >= now || to <= windowStart) return null;
                    const left = Math.max(0, ((from - windowStart) / period) * 100);
                    const width =
                      ((Math.min(now, to) - Math.max(windowStart, from)) / period) * 100;
                    return (
                      <span
                        key={row._id || index}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${nameOf(row)} · ${date(row.startDate)} → ${row.endDate ? date(row.endDate) : 'ongoing'}`}
                      >
                        {initials(nameOf(row))}
                      </span>
                    );
                  })}
                </div>
                <div className="vdrivers-ticks">
                  <span>{date(new Date(windowStart))}</span>
                  <span>Last 30 days · shaded periods have recorded assignments</span>
                  <span>Today</span>
                </div>
                <div className="vdrivers-table-wrap">
                  <table className="vdrivers-table">
                    <thead>
                      <tr>
                        <th>Driver</th>
                        <th>Phone</th>
                        <th>Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row._id || index}>
                          <td>
                            <span className="vdrivers-table-name">
                              <i>{initials(nameOf(row))}</i>
                              {nameOf(row)}
                            </span>
                          </td>
                          <td>{row.driverId?.mobileNumber || '—'}</td>
                          <td>
                            {date(row.startDate)} →{' '}
                            {row.endDate ? date(row.endDate) : 'No end recorded'}
                          </td>
                          <td>
                            <span className="vdrivers-badge">{row.status || 'Not recorded'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </PanelErrorBoundary>
  );
}
