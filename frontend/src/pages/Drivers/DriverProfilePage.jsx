import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useApi from '@/hooks/useApi';
import PageShell from '@/components/ui/PageShell';
import ErrorCard from '@/components/redesign/ErrorCard';
import { formatIstDate, formatNumber } from '@/utils/redesign/format';
import { getUserRole } from '@/utils/session';
import PerformanceApi from '@/api/performance';
import SourceCell from '../Performance/SourceCell';
import DriverProfileService from './DriverProfileService';
import { formatRole } from './Component/driverPresenters';
import { normalizeDriver } from './driverList';
import { profileWeeks, weeklyTripFacts } from './driverProfileModel';
import './driverProfile.css';

function ReadSection({ title, read, children, empty = 'No records yet.' }) {
  return (
    <section className="driver-profile-card" aria-label={title}>
      <h2>{title}</h2>
      {read.loading ? (
        <p role="status">Loading {title.toLowerCase()}…</p>
      ) : read.error ? (
        <ErrorCard error={read.error} onRetry={read.refetch} />
      ) : read.data?.length === 0 ? (
        <p>{empty}</p>
      ) : (
        children
      )}
    </section>
  );
}
function WeekChart({ rows, metric, title, unit }) {
  const known = rows.some((row) => row[metric] != null);
  return (
    <figure className="driver-profile-card" aria-label={title}>
      <h3>{title}</h3>
      {known ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={rows} accessibilityLayer margin={{ right: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis unit={` ${unit}`} width={65} domain={[0, 'auto']} />
            <Tooltip formatter={(value) => [`${formatNumber(value)} ${unit}`, title]} />
            <Bar dataKey={metric} name={title} fill="#4469f0" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>Not measured for these weeks.</p>
      )}
      <figcaption>Seven-day periods in IST. Missing measurements are gaps.</figcaption>
    </figure>
  );
}
export default function DriverProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const weeks = useMemo(() => profileWeeks(), []);
  const range = { from: weeks[0].from, to: weeks.at(-1).to };
  const employee = useApi((signal) => DriverProfileService.employee(id, signal), [id], {
    scopeKey: id,
  });
  const found = Boolean(employee.data);
  const isDriver = employee.data?.role === 'DRIVER';
  const assignments = useApi(
    (signal) => DriverProfileService.assignments(id, signal),
    [id, found],
    { enabled: found, scopeKey: id },
  );
  const documents = useApi((signal) => DriverProfileService.documents(id, signal), [id, found], {
    enabled: found,
    scopeKey: id,
  });
  const trips = useApi(
    (signal) => DriverProfileService.trips(id, range, signal),
    [id, isDriver, range.from, range.to],
    { enabled: isDriver, scopeKey: id },
  );
  const events = useApi(
    (signal) => DriverProfileService.weeklyEvents(id, weeks, signal),
    [id, isDriver],
    { enabled: isDriver, scopeKey: id },
  );
  const score = useApi(
    (signal) => PerformanceApi.driver(id, range, signal),
    [id, isDriver, range.from, range.to],
    { enabled: isDriver, scopeKey: id },
  );
  const tripWeeks = trips.data ? weeklyTripFacts(trips.data, weeks) : weeks;
  const weekly = tripWeeks.map((week, index) => ({ ...week, ...events.data?.[index] }));
  const driver = employee.data ? normalizeDriver(employee.data) : null;
  const canEdit = ['OWNER', 'MANAGER'].includes(getUserRole());
  return (
    <PageShell
      title={driver?.name || 'Employee profile'}
      subtitle="Employee details and recorded activity"
      onBack={() => navigate('/drivers')}
      actions={
        canEdit && driver ? (
          <button
            type="button"
            onClick={() => navigate('/drivers/add', { state: { editingDriver: driver } })}
          >
            Edit employee
          </button>
        ) : null
      }
    >
      <div className="driver-profile">
        {employee.loading ? (
          <p role="status">Loading employee…</p>
        ) : employee.error ? (
          <ErrorCard error={employee.error} onRetry={employee.refetch} />
        ) : !driver ? (
          <p>Employee not found in this location.</p>
        ) : (
          <>
            <section className="driver-profile-card" aria-label="Employee details">
              <h2>Employee details</h2>
              <dl>
                <div>
                  <dt>Role</dt>
                  <dd>{formatRole(driver.role)}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{driver.mobileNumber || 'Not recorded'}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{driver.email || 'Not recorded'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{driver.status || 'Not recorded'}</dd>
                </div>
              </dl>
            </section>
            <ReadSection
              title="Truck assignments"
              read={assignments}
              empty="No truck assignment has been recorded."
            >
              <table>
                <thead>
                  <tr>
                    <th>Truck</th>
                    <th>From</th>
                    <th>Until</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.data?.map((row) => (
                    <tr key={row._id}>
                      <td>
                        {row.vehicleId?.registrationNumber ? (
                          <Link
                            to={`/vehicles/${encodeURIComponent(row.vehicleId.registrationNumber)}`}
                          >
                            {row.vehicleId.registrationNumber}
                          </Link>
                        ) : (
                          'Truck name not recorded'
                        )}
                      </td>
                      <td>{formatIstDate(row.startDate)}</td>
                      <td>{row.endDate ? formatIstDate(row.endDate) : 'Current'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReadSection>
            {isDriver ? (
              <>
                <section className="driver-profile-card" aria-label="Recorded driving activity">
                  <h2>Recorded driving activity</h2>
                  <p>
                    Latest recorded driving score:{' '}
                    {score.loading ? (
                      'Loading...'
                    ) : score.error ? (
                      <button type="button" onClick={score.refetch}>
                        Retry score
                      </button>
                    ) : score.data?.dna?.drivingScore ? (
                      <SourceCell cell={score.data.dna.drivingScore} decimals={0} />
                    ) : (
                      'Not recorded for this period.'
                    )}
                  </p>
                  {score.data?.dna?.windowFrom && score.data?.dna?.windowTo ? (
                    <p>
                      Score readings: {formatIstDate(score.data.dna.windowFrom)} -{' '}
                      {formatIstDate(score.data.dna.windowTo)}
                    </p>
                  ) : null}

                  <p>
                    {formatIstDate(range.from)} – {formatIstDate(range.to)}
                  </p>
                  <p>
                    Distance covers recorded trips, grouped by the week each trip was created. Trips
                    with missing distance stay unmeasured. Idling and overspeed use events
                    attributed to this driver.
                  </p>
                  {trips.error ? <ErrorCard error={trips.error} onRetry={trips.refetch} /> : null}
                  {events.error ? (
                    <ErrorCard error={events.error} onRetry={events.refetch} />
                  ) : null}
                  {events.data?.some((row) => row.unavailable) ? (
                    <p role="status">
                      Some weekly event measurements are unavailable.{' '}
                      <button type="button" onClick={events.refetch}>
                        Retry activity
                      </button>
                    </p>
                  ) : null}
                  {trips.loading || events.loading ? (
                    <p role="status">Loading weekly activity…</p>
                  ) : null}
                </section>
                <div className="driver-profile-charts">
                  <WeekChart rows={weekly} metric="km" title="Recorded trip distance" unit="km" />
                  <WeekChart rows={weekly} metric="idleHours" title="Idling per week" unit="h" />
                  <WeekChart
                    rows={weekly}
                    metric="overspeed"
                    title="Overspeed per week"
                    unit="events"
                  />
                </div>
                <section className="driver-profile-card" aria-label="Weekly readings">
                  <h2>Weekly readings</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Trips</th>
                        <th>Trip distance (km)</th>
                        <th>Idling (h)</th>
                        <th>Overspeed events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekly.map((row) => (
                        <tr key={row.from}>
                          <td>
                            {formatIstDate(row.from)} – {formatIstDate(row.to)}
                          </td>
                          {['trips', 'km', 'idleHours', 'overspeed'].map((key) => (
                            <td key={key}>
                              {row[key] == null ? 'Not measured' : formatNumber(row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link
                    to={`/intelligence?tab=idling&driver=${encodeURIComponent(id)}&from=${range.from}&to=${range.to}`}
                  >
                    See this driver’s idling
                  </Link>
                  {' · '}
                  <Link
                    to={`/intelligence?tab=overspeed&driver=${encodeURIComponent(id)}&from=${range.from}&to=${range.to}`}
                  >
                    See this driver’s overspeed
                  </Link>
                </section>
                <ReadSection
                  title="Recorded trips"
                  read={trips}
                  empty="No trips were recorded for this driver in these weeks."
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Recorded on</th>
                        <th>Truck</th>
                        <th>Route</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.data?.map((trip) => (
                        <tr key={trip._id}>
                          <td>{formatIstDate(trip.createdAt)}</td>
                          <td>{trip.vehicleId?.registrationNumber || 'Not recorded'}</td>
                          <td>
                            {trip.routeSource || 'Start not recorded'} →{' '}
                            {trip.routeDestination || 'Destination not recorded'}
                          </td>
                          <td>
                            {trip.status}{' '}
                            <Link to={`/trip-management/trip/${encodeURIComponent(trip._id)}`}>
                              Open trip
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ReadSection>
              </>
            ) : null}
            <ReadSection
              title="Employee documents"
              read={documents}
              empty="No employee documents have been uploaded."
            >
              <ul>
                {documents.data?.map((doc) => (
                  <li key={doc._id || doc.id}>
                    {doc.docType === 'DRIVING_LICENSE'
                      ? 'Driving licence'
                      : doc.docType?.replace(/_/g, ' ').toLowerCase() || 'Document'}
                    {doc.expiryDate ? ` · expires ${formatIstDate(doc.expiryDate)}` : ''}
                    {doc.files?.map((file, index) =>
                      file.publicUrl ? (
                        <a key={index} href={file.publicUrl} target="_blank" rel="noreferrer">
                          {' '}
                          Open {file.side?.toLowerCase() || 'file'}
                        </a>
                      ) : null,
                    )}
                  </li>
                ))}
              </ul>
            </ReadSection>
          </>
        )}
      </div>
    </PageShell>
  );
}
