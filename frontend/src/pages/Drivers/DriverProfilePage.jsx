import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import DataTable from '@/components/ui/DataTable';
import DataTooltip from '@/components/ui/DataTooltip';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorCard from '@/components/redesign/ErrorCard';
import { formatIstDate, formatNumber, humanizeCode } from '@/utils/redesign/format';
import { getUserRole } from '@/utils/session';
import PerformanceApi from '@/api/performance';
import { PerformanceBriefing, PerformanceNoNumbers } from '../Performance/PerformanceParts';
import { DriverDna } from '../Performance/DriverDrawer';
import { cellNumber, formatCellNumber, isUnknownCell } from '../Performance/performanceCells';
import DriverProfileService from './DriverProfileService';
import { formatRole } from './Component/driverPresenters';
import { normalizeDriver } from './driverList';
import { profileWeeks, weeklyTotal, weeklyTripFacts } from './driverProfileModel';
import './driverProfile.css';

function statusPill(driver) {
  if (driver.branchStatus === 'DEACTIVATED') return { label: 'Deactivated', tone: 'warn' };
  if (!driver.status) return null;
  const active = driver.status.toUpperCase() === 'ACTIVE';
  return { label: humanizeCode(driver.status), tone: active ? 'ok' : 'warn' };
}
const documentName = (docType) =>
  docType === 'DRIVING_LICENSE' ? 'Driving licence' : humanizeCode(docType) || 'Document';
const plural = (count, one, many) => `${formatNumber(count)} ${count === 1 ? one : many}`;
const KpiSkeleton = () => <Skeleton className="inline-block h-7 w-20 align-middle" />;

function LoadingRows() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
function ProfileCard({ title, sub = null, className = '', children }) {
  return (
    <section className={`pf-card ${className}`.trim()} aria-label={title}>
      <header className="pf-card-head">
        <div>
          <h3>{title}</h3>
          {sub ? <p>{sub}</p> : null}
        </div>
      </header>
      <div className="dprof-card-body">{children}</div>
    </section>
  );
}
function ProfileTable({ title, sub = null, links = null, ...table }) {
  return (
    <section className="dprof-table" aria-label={title}>
      <DataTable
        className="intel-assessments-table pf-table"
        {...table}
        toolbarExtra={
          <div className="intel-tab-tools">
            <div className="dprof-table-head">
              <h3>{title}</h3>
              {sub ? <p>{sub}</p> : null}
            </div>
            {links ? <div className="dprof-table-links">{links}</div> : null}
          </div>
        }
      />
    </section>
  );
}
function WeekBars({ rows, metric, title, sub, unit, digits = 0 }) {
  const [active, setActive] = useState(null);
  const values = rows.map((row) => row[metric] ?? null);
  const max = Math.max(0, ...values.filter((value) => value != null));
  const format = (value) => `${formatNumber(value, { digits })} ${unit}`;
  return (
    <figure className="pf-card dprof-chart" aria-label={title}>
      <header className="pf-card-head">
        <div>
          <h3>{title}</h3>
          <p>{sub}</p>
        </div>
      </header>
      <div className="dprof-card-body">
        {values.some((value) => value != null) ? (
          <div className="pf-bars-wrap">
            <div
              className="pf-bars"
              role="group"
              aria-label={`${title}, one bar per seven-day period. A short grey stub is a week without a reading.`}
            >
              {rows.map((row, index) => {
                const value = values[index];
                const height = value ? `${Math.max(4, (value / max) * 100)}%` : '2px';
                return (
                  <button
                    type="button"
                    key={row.from}
                    className="pf-bar-hit"
                    aria-label={`${row.label} · ${value == null ? 'not measured' : format(value)}`}
                    onMouseEnter={() => setActive(index)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                  >
                    {value == null ? (
                      <span className="pf-bar pf-bar--empty" />
                    ) : (
                      <span className="pf-bar" style={{ height }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pf-dates" aria-hidden="true">
              {rows.map((row) => (
                <span key={row.from}>{formatIstDate(row.from)}</span>
              ))}
            </div>
            {active === null ? null : (
              <DataTooltip
                aria-hidden="true"
                className={`pf-bars-tooltip ${
                  active < rows.length / 2 ? 'pf-bars-tooltip--right' : 'pf-bars-tooltip--left'
                }`}
                label={title}
                value={values[active] == null ? '—' : format(values[active])}
                details={[rows[active].label, values[active] == null ? 'Not measured' : null]}
              />
            )}
          </div>
        ) : (
          <p className="pf-section-note">Not measured for these weeks.</p>
        )}
        <figcaption className="dprof-chart-note">
          Seven-day periods in IST. Missing measurements are gaps.
        </figcaption>
      </div>
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
  const status = driver ? statusPill(driver) : null;
  const title = driver?.name || 'Employee profile';
  const contact = driver ? [driver.mobileNumber, driver.email].filter(Boolean).join(' · ') : '';
  const period = `${formatIstDate(range.from)} – ${formatIstDate(range.to)}`;

  const tripsReady = Boolean(trips.data) && !trips.error;
  const eventsReady = Boolean(events.data) && !events.error;
  const tripCount = tripsReady ? trips.data.length : null;
  const km = tripsReady ? weeklyTotal(weekly, 'km') : null;
  const idle = eventsReady ? weeklyTotal(weekly, 'idleHours') : null;
  const overspeed = eventsReady ? weeklyTotal(weekly, 'overspeed') : null;
  const dna = score.data?.dna ?? null;
  const scoreCell = dna?.drivingScore && !isUnknownCell(dna.drivingScore) ? dna.drivingScore : null;

  const lead = (
    <>
      {trips.error ? (
        'Trips for these weeks could not be read.'
      ) : !tripsReady ? (
        'Reading the last four weeks of recorded trips…'
      ) : (
        <>
          <b>{plural(tripCount, 'trip', 'trips')}</b> recorded in the last four weeks
          {km != null && tripCount ? (
            <>
              , covering <b>{formatNumber(km)} km</b>
            </>
          ) : null}
          .
        </>
      )}
      {idle != null && overspeed != null ? (
        <>
          {' '}
          <b>{formatNumber(idle, { digits: 1 })} h</b> of idling and{' '}
          <b>{plural(overspeed, 'overspeed event', 'overspeed events')}</b> were attributed to this
          driver.
        </>
      ) : null}
    </>
  );
  const eventNote = (value) =>
    events.error
      ? 'Could not be read'
      : value == null
        ? 'Some weeks are unavailable'
        : 'Attributed to this driver';

  const assignmentColumns = [
    {
      key: 'truck',
      label: 'Truck',
      render: (row) =>
        row.vehicleId?.registrationNumber ? (
          <Link
            className="pf-open dprof-plate-link"
            to={`/vehicles/${encodeURIComponent(row.vehicleId.registrationNumber)}`}
          >
            {row.vehicleId.registrationNumber}
          </Link>
        ) : (
          <span className="pf-none">Truck name not recorded</span>
        ),
    },
    { key: 'from', label: 'From', render: (row) => formatIstDate(row.startDate) },
    {
      key: 'until',
      label: 'Until',
      render: (row) =>
        row.endDate ? (
          formatIstDate(row.endDate)
        ) : (
          <span className="pf-pill pf-pill--info">Current</span>
        ),
    },
  ];
  const weeklyColumns = [
    {
      key: 'period',
      label: 'Period',
      render: (row) => `${formatIstDate(row.from)} – ${formatIstDate(row.to)}`,
    },
    ...[
      ['trips', 'Trips', 0],
      ['km', 'Trip distance (km)', 0],
      ['idleHours', 'Idling (h)', 1],
      ['overspeed', 'Overspeed events', 0],
    ].map(([key, label, digits]) => ({
      key,
      label,
      align: 'right',
      render: (row) =>
        row[key] == null ? (
          <span className="pf-none">Not measured</span>
        ) : (
          <span className="dprof-num">{formatNumber(row[key], { digits })}</span>
        ),
    })),
  ];
  const tripColumns = [
    { key: 'recorded', label: 'Recorded on', render: (trip) => formatIstDate(trip.createdAt) },
    {
      key: 'truck',
      label: 'Truck',
      render: (trip) =>
        trip.vehicleId?.registrationNumber ? (
          <span className="pf-open">{trip.vehicleId.registrationNumber}</span>
        ) : (
          <span className="pf-none">Not recorded</span>
        ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (trip) =>
        `${trip.routeSource || 'Start not recorded'} → ${trip.routeDestination || 'Destination not recorded'}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (trip) => <span className="pf-pill">{humanizeCode(trip.status) || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (trip) => (
        <Link className="pf-link" to={`/trip-management/trip/${encodeURIComponent(trip._id)}`}>
          Open trip →
        </Link>
      ),
    },
  ];

  const documentsCard = (
    <ProfileCard
      title="Employee documents"
      sub={documents.data?.length ? plural(documents.data.length, 'document', 'documents') : null}
    >
      {documents.loading ? (
        <LoadingRows />
      ) : documents.error ? (
        <ErrorCard error={documents.error} onRetry={documents.refetch} />
      ) : !documents.data?.length ? (
        <p className="pf-section-note">No employee documents have been uploaded.</p>
      ) : (
        <ul className="pf-rows">
          {documents.data.map((doc) => (
            <li key={doc._id || doc.id}>
              <strong>{documentName(doc.docType)}</strong>
              <span className="dprof-doc-links">
                {doc.files?.map((file, index) =>
                  file.publicUrl ? (
                    <a
                      key={index}
                      className="pf-link"
                      href={file.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open {file.side?.toLowerCase() || 'file'} →
                    </a>
                  ) : null,
                )}
              </span>
              {doc.expiryDate ? <small>Expires {formatIstDate(doc.expiryDate)}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );

  return (
    <div className="pshell dprof">
      <div className="dprof-top">
        <nav className="dprof-crumbs" aria-label="Breadcrumb">
          <Link to="/drivers">Employees</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{employee.loading ? '…' : title}</span>
        </nav>
        <section className="pf-card dprof-hero" aria-labelledby="dprof-title">
          <div className="dprof-hero-text">
            <div className="dprof-hero-title-row">
              <h1 id="dprof-title" className="dprof-hero-title">
                {employee.loading ? <span className="dprof-muted">Loading employee…</span> : title}
              </h1>
              {driver ? <span className="pf-pill">{formatRole(driver.role)}</span> : null}
              {status ? (
                <span className={`pf-pill pf-pill--${status.tone}`}>{status.label}</span>
              ) : null}
            </div>
            <p className="dprof-hero-desc">
              {driver
                ? contact || 'No phone or email on record'
                : 'Employee details and recorded activity'}
            </p>
          </div>
          {canEdit && driver ? (
            <button
              type="button"
              className="dprof-btn"
              onClick={() => navigate('/drivers/add', { state: { editingDriver: driver } })}
            >
              Edit employee
            </button>
          ) : null}
        </section>
      </div>

      {employee.loading ? (
        <LoadingRows />
      ) : employee.error ? (
        <ErrorCard error={employee.error} onRetry={employee.refetch} />
      ) : !driver ? (
        <PerformanceNoNumbers
          title="No employee here"
          lead="Employee not found in this location."
        />
      ) : (
        <>
          {isDriver ? (
            <>
              <PerformanceBriefing
                label="Driver activity read"
                eyebrow={`Driver read · ${period}`}
                lead={lead}
                notes={[
                  'Distance covers recorded trips, grouped by the week each trip was created. Trips with missing distance stay unmeasured.',
                  'Idling and overspeed use events attributed to this driver.',
                ]}
                kpis={[
                  {
                    label: 'Driving score',
                    value: score.loading ? (
                      <KpiSkeleton />
                    ) : scoreCell ? (
                      formatCellNumber(cellNumber(scoreCell), 0)
                    ) : (
                      '—'
                    ),
                    note: score.error
                      ? 'Could not be read'
                      : scoreCell
                        ? `out of 100${dna?.grade ? ` · grade ${dna.grade}` : ''}`
                        : 'No DNA day in these weeks',
                  },
                  {
                    label: 'Trip distance',
                    value:
                      !tripsReady && !trips.error ? (
                        <KpiSkeleton />
                      ) : km == null ? (
                        '—'
                      ) : (
                        `${formatNumber(km)} km`
                      ),
                    note: trips.error
                      ? 'Could not be read'
                      : km == null
                        ? 'Some trips have no distance'
                        : `${plural(tripCount ?? 0, 'trip', 'trips')} recorded`,
                  },
                  {
                    label: 'Idling',
                    value:
                      !eventsReady && !events.error ? (
                        <KpiSkeleton />
                      ) : idle == null ? (
                        '—'
                      ) : (
                        `${formatNumber(idle, { digits: 1 })} h`
                      ),
                    note: eventNote(idle),
                  },
                  {
                    label: 'Overspeed events',
                    value:
                      !eventsReady && !events.error ? (
                        <KpiSkeleton />
                      ) : overspeed == null ? (
                        '—'
                      ) : (
                        formatNumber(overspeed)
                      ),
                    note: eventNote(overspeed),
                  },
                ]}
              >
                {trips.error ? <ErrorCard error={trips.error} onRetry={trips.refetch} /> : null}
                {events.error ? <ErrorCard error={events.error} onRetry={events.refetch} /> : null}
                {events.data?.some((row) => row.unavailable) ? (
                  <small role="status">
                    Some weekly event measurements are unavailable.{' '}
                    <button type="button" onClick={events.refetch}>
                      Retry activity
                    </button>
                  </small>
                ) : null}
              </PerformanceBriefing>

              <div className="dprof-charts">
                <WeekBars
                  rows={weekly}
                  metric="km"
                  title="Recorded trip distance"
                  sub="Kilometres per week"
                  unit="km"
                />
                <WeekBars
                  rows={weekly}
                  metric="idleHours"
                  title="Idling per week"
                  sub="Hours per week"
                  unit="h"
                  digits={1}
                />
                <WeekBars
                  rows={weekly}
                  metric="overspeed"
                  title="Overspeed per week"
                  sub="Events per week"
                  unit="events"
                />
              </div>

              <div className="dprof-pair">
                <ProfileCard
                  title="Driving DNA"
                  sub="The latest DNA day in these weeks, worked out from the truck’s own readings."
                >
                  {score.loading && !score.data ? (
                    <LoadingRows />
                  ) : score.error ? (
                    <ErrorCard error={score.error} onRetry={score.refetch} />
                  ) : (
                    <DriverDna dna={dna} reason={score.data?.dnaReason} />
                  )}
                </ProfileCard>
                {documentsCard}
              </div>
            </>
          ) : null}

          <ProfileTable
            title="Truck assignments"
            sub={
              assignments.data?.length
                ? plural(assignments.data.length, 'assignment', 'assignments')
                : null
            }
            columns={assignmentColumns}
            rows={assignments.data ?? []}
            rowKey={(row) => row._id}
            loading={assignments.loading}
            error={assignments.error}
            onRetry={assignments.refetch}
            emptyTitle="No truck assignment has been recorded."
          />

          {isDriver ? (
            <>
              <ProfileTable
                title="Weekly readings"
                sub={period}
                links={
                  <>
                    <Link
                      className="pf-link"
                      to={`/intelligence?tab=idling&driver=${encodeURIComponent(id)}&from=${range.from}&to=${range.to}`}
                    >
                      See this driver’s idling →
                    </Link>
                    <Link
                      className="pf-link"
                      to={`/intelligence?tab=overspeed&driver=${encodeURIComponent(id)}&from=${range.from}&to=${range.to}`}
                    >
                      See this driver’s overspeed →
                    </Link>
                  </>
                }
                columns={weeklyColumns}
                rows={weekly}
                rowKey={(row) => row.from}
              />
              <ProfileTable
                title="Recorded trips"
                sub={tripsReady ? `${plural(tripCount, 'trip', 'trips')} · ${period}` : period}
                columns={tripColumns}
                rows={trips.data ?? []}
                rowKey={(trip) => trip._id}
                loading={trips.loading}
                error={trips.error}
                onRetry={trips.refetch}
                emptyTitle="No trips were recorded for this driver in these weeks."
              />
            </>
          ) : (
            documentsCard
          )}
        </>
      )}
    </div>
  );
}
