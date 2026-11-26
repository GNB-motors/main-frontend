import { OverviewCardSkeleton } from './OverviewSkeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../../../components/ui/dialog';
import { formatKm, formatNum } from '../../../../utils/formatters';
import { formatDateIST } from '../../../../utils/dateUtils';
import { coverageSources, daysSince } from '../../vehicle360Logic';
import { providerLabel } from '../../vehicle360Provider';
import { initials } from './initials';
import {
  documentRows,
  fluidLevels,
  numeric,
  serviceProgress,
  shortDate,
} from './referenceOverviewModel';

function CardHead({ title, children }) {
  return (
    <div className="vdo-card-head">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function DistanceCard({ series, prediction, overview, loading }) {
  const [dailyDistancesOpen, setDailyDistancesOpen] = useState(false);
  const measured = series.filter((day) => day.km != null);
  const total = measured.length ? measured.reduce((sum, day) => sum + day.km, 0) : null;
  const pace = numeric(prediction?.avgKmPerDay);
  const target = numeric(overview?.monthlyTargetKm);
  const lastEngineIndex = series.findLastIndex((day) => day.engineKm != null);
  const hasGpsAfter =
    lastEngineIndex >= 0 && series.slice(lastEngineIndex + 1).some((day) => day.gpsOnly);
  if (loading && !measured.length) return <OverviewCardSkeleton className="vdo-distance" chart />;
  return (
    <section className="vdo-card vdo-distance">
      <div className="vdo-distance-head">
        <div className="vdo-distance-heading">
          <h3>Last 30 days</h3>
          <p>
            {[
              total != null
                ? formatKm(total)
                : loading
                  ? 'Loading distance…'
                  : 'No measured distance',
              pace != null ? `${formatNum(pace)} km/day pace` : null,
              target > 0 && total != null
                ? `${Math.round((total / target) * 100)}% of the ${formatNum(target)} km target`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="vdo-distance-legend">
          <span>
            <i className="vdo-bar-key" />
            Engine-confirmed km
          </span>
          <span>
            <i className="vdo-bar-key vdo-bar-key--gps" />
            GPS-only km
          </span>
        </div>
      </div>
      <figure aria-label="Daily distance in km for the last 30 days" className="vdo-distance-chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={series}
            margin={{ top: 12, right: 16, bottom: 18, left: 8 }}
            accessibilityLayer
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(day) => shortDate(`${day}T12:00:00+05:30`)}
              minTickGap={24}
            />
            <YAxis unit=" km" width={70} domain={[0, 'auto']} />
            <Tooltip
              labelFormatter={(day) => shortDate(`${day}T12:00:00+05:30`)}
              formatter={(value) => [`${value} km`, 'Recorded distance']}
            />
            <Bar dataKey="km" name="Distance" isAnimationActive={false}>
              {series.map((day) => (
                <Cell key={day.day} fill={day.gpsOnly ? '#94a3b8' : '#4469f0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <figcaption>
          Daily distance in km. Missing readings are gaps; grey bars use GPS estimates.
        </figcaption>
        {hasGpsAfter ? (
          <p>Engine data stopped · {shortDate(`${series[lastEngineIndex].day}T12:00:00+05:30`)}</p>
        ) : null}
      </figure>
      <Dialog open={dailyDistancesOpen} onOpenChange={setDailyDistancesOpen}>
        <div className="vdo-distance-details">
          <DialogTrigger className="vdo-distance-toggle">
            <span>View daily distances</span>
            <span className="vdo-distance-toggle__hint">
              {series.length} days <span aria-hidden="true">→</span>
            </span>
          </DialogTrigger>
        </div>
        <DialogContent className="vdo-distance-modal">
          <div className="vdo-distance-modal__header">
            <div>
              <DialogTitle className="vdo-distance-modal__title">Daily distances</DialogTitle>
              <DialogDescription className="vdo-distance-modal__description">
                Last 30 days · {measured.length} of {series.length} days measured
              </DialogDescription>
            </div>
            <DialogClose className="vdo-distance-modal__close" aria-label="Close daily distances">
              <X size={18} aria-hidden="true" />
            </DialogClose>
          </div>
          <div className="vdo-distance-table-wrap">
            <table className="vdo-distance-table">
              <caption className="sr-only">Recorded daily distance</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col" className="vdo-distance-table__number">
                    Distance (km)
                  </th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {series.map((day) => (
                  <tr key={day.day}>
                    <td>{shortDate(`${day.day}T12:00:00+05:30`)}</td>
                    <td className="vdo-distance-table__number">
                      {day.km == null ? 'Not measured' : formatNum(day.km)}
                    </td>
                    <td>
                      <span
                        className={`vdo-distance-source${day.gpsOnly && day.km != null ? ' vdo-distance-source--estimate' : ''}`}
                      >
                        {day.km == null
                          ? 'Not available'
                          : day.gpsOnly
                            ? 'GPS estimate'
                            : 'Engine reading'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function ServiceCard({ prediction, health, onGoTab }) {
  const service = serviceProgress(prediction, health);
  const overdue = service.remaining != null && service.remaining < 0;
  return (
    <section className="vdo-card">
      <CardHead title="Next service">
        <button type="button" className="vdo-link" onClick={() => onGoTab('service')}>
          Details →
        </button>
      </CardHead>
      <div className="vdo-service-figure">
        <strong className={overdue ? 'vdo-danger' : undefined}>
          {service.remaining == null ? '—' : formatKm(Math.abs(service.remaining))}
        </strong>
        <span>{overdue ? 'overdue' : 'to go'}</span>
      </div>
      <div className="vdo-service-progress">
        <div className="vdo-level-track">
          <span
            style={{
              width: `${service.percent ?? 0}%`,
              ...(overdue ? { background: '#DD3030' } : {}),
            }}
          />
        </div>
        <div className="vdo-service-scale">
          <span>{formatNum(service.last)}</span>
          <span>{formatNum(service.current)} at forecast</span>
          <span>{formatNum(service.next)}</span>
        </div>
      </div>
      <div className="vdo-service-note">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <circle
            cx="7"
            cy="7"
            r="5.2"
            fill="#FFFFFF"
            stroke="#6A43D8"
            strokeWidth="1.6"
            strokeDasharray="0.1 2.7"
            strokeLinecap="round"
          />
        </svg>
        <span>
          {prediction?.projectedServiceDueDate ? (
            <>
              Predicted due <b>{formatDateIST(prediction.projectedServiceDueDate)}</b>
              {prediction.avgKmPerDay != null
                ? ` at the ${formatNum(prediction.avgKmPerDay)} km/day pace`
                : ''}
              .
              {service.age >= 1
                ? ` The odometer is ${service.age} day${service.age === 1 ? '' : 's'} old, so the real figure may be closer.`
                : ''}
            </>
          ) : (
            'A service date will appear when a forecast is available.'
          )}
        </span>
      </div>
    </section>
  );
}

export function DriverCard({ driver }) {
  const dutyDays = daysSince(driver?.assignmentStartDate);
  return (
    <section className="vdo-card">
      <CardHead title="Assigned driver">
        <Link className="vdo-link" to="/khata-ledger?tab=assignments">
          Change →
        </Link>
      </CardHead>
      <div className="vdo-driver">
        <span className="vdo-driver-avatar" aria-hidden="true">
          {initials(driver?.name) || '—'}
        </span>
        <div className="vdo-driver-info">
          <strong>{driver?.name || 'No driver assigned'}</strong>
          <span>
            {[
              dutyDays != null
                ? dutyDays === 0
                  ? 'On duty today'
                  : `On duty for ${dutyDays} day${dutyDays === 1 ? '' : 's'}`
                : null,
              driver?.mobileNumber,
            ]
              .filter(Boolean)
              .join(' · ') || 'Assign a driver to this vehicle'}
          </span>
        </div>
      </div>
      <div className="vdo-info-rows">
        <div>
          <span>Driving licence</span>
          <span>{driver?.licenseNumber ? 'On file' : 'Not on record'}</span>
        </div>
        <div>
          <span>Shift</span>
          <span>{driver ? 'Active' : 'Not assigned'}</span>
        </div>
      </div>
      {driver?.mobileNumber ? (
        <a className="vdo-button" href={`tel:${driver.mobileNumber}`}>
          Call driver
        </a>
      ) : (
        <Link className="vdo-button" to="/khata-ledger?tab=assignments">
          {driver ? 'Driver details' : 'Assign driver'}
        </Link>
      )}
    </section>
  );
}

export function DocumentsCard({ documents, onGoTab }) {
  const rows = documentRows(documents);
  const recorded = rows.filter((row) => row.present).length;
  const problem = recorded < rows.length || rows.some((row) => row.expired);
  return (
    <section className="vdo-card">
      <CardHead title="Documents">
        <span className={`vdo-doc-count${problem ? ' vdo-danger' : ''}`}>
          {recorded} of {rows.length} on record
        </span>
      </CardHead>
      <div className="vdo-info-rows vdo-documents">
        {rows.map((row) => (
          <div key={row.type}>
            <span>
              <i
                className={`vdo-doc-box${row.present ? ' vdo-doc-box--present' : ''}`}
                aria-hidden="true"
              >
                {row.present ? '✓' : ''}
              </i>
              {row.label}
            </span>
            <span className={row.expired ? 'vdo-danger' : row.present ? '' : 'vdo-muted'}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <p className="vdo-note">
        {recorded < rows.length
          ? 'Expiry can’t be checked until these are uploaded.'
          : 'Keep these documents current for uninterrupted operations.'}
      </p>
      <button
        className="vdo-button vdo-button--primary"
        type="button"
        onClick={() => onGoTab('documents')}
      >
        Upload documents
      </button>
    </section>
  );
}

export function FuelCard({ overview, health, fleetMaster, ialert, onGoTab }) {
  const fluids = fluidLevels(overview, health, fleetMaster, ialert);
  const dates = fluids.map((fluid) => fluid.at).filter(Boolean);
  const sameDate = dates.length === 2 && shortDate(dates[0]) === shortDate(dates[1]);
  const stale = fluids.some((fluid) => daysSince(fluid.at) >= 1);
  const bills = overview?.fuelBills30 ?? null;
  return (
    <section className="vdo-card">
      <CardHead title="Fuel">
        <button type="button" className="vdo-link" onClick={() => onGoTab('fuel')}>
          History →
        </button>
      </CardHead>
      <div className="vdo-fluids">
        {fluids.map((fluid) => (
          <div className="vdo-fluid" key={fluid.label}>
            <div className="vdo-fluid-label">
              <span>{fluid.label}</span>
              <strong>
                {fluid.percent != null ? `${formatNum(fluid.percent)}%` : '—'} ·{' '}
                {fluid.litres != null ? `${formatNum(fluid.litres)} L` : '— L'}
              </strong>
            </div>
            <div className="vdo-level-track vdo-fluid-track">
              <span
                style={{
                  width: `${Math.max(0, Math.min(100, fluid.percent ?? 0))}%`,
                  background: stale ? '#C56200' : '#4469F0',
                  opacity: stale ? 0.55 : 1,
                }}
              />
            </div>
          </div>
        ))}
        <span className={`vdo-reading-date${stale ? ' vdo-reading-date--stale' : ''}`}>
          {sameDate
            ? `Both readings from ${shortDate(dates[0])}`
            : fluids
                .map(
                  (fluid) =>
                    `${fluid.label.split(' · ')[0]} ${fluid.at ? `from ${shortDate(fluid.at)}` : 'not reported'}`,
                )
                .join(' · ')}
        </span>
      </div>
      <div className="vdo-fuel-bills">
        <span>Fuel bills logged · 30 days</span>
        <strong>{formatNum(bills)}</strong>
      </div>
      <p className="vdo-note">
        {bills === 0
          ? 'Without bills, refuels can’t be matched to sensor readings for loss detection.'
          : bills == null
            ? 'Fuel bills appear once the vehicle’s receipt history is available.'
            : 'Open fuel history to match receipts with the sensor readings.'}
      </p>
    </section>
  );
}

export function RegistryCard({
  fleetMaster,
  fleetEdge,
  ialert,
  coverage,
  telematicsProvider,
  overview,
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const fields = [
    [
      'Manufacturer',
      fleetMaster?.manufacturer || fleetEdge?.manufacturer || (ialert ? 'Ashok Leyland' : null),
    ],
    ['Model', fleetEdge?.vehicleModel || ialert?.vehicleModel || fleetMaster?.model],
    ['Category', fleetMaster?.vehicleCategory || fleetEdge?.vehicleType || ialert?.vehicleType],
    ['Line of business', fleetEdge?.lobName],
    [
      'Emission norm',
      fleetEdge?.emissionNorm || ialert?.emissionNorm || (ialert?.isBs6 ? 'BS VI' : null),
    ],
    ['VIN / chassis', fleetEdge?.vin || ialert?.vin || fleetMaster?.chassisNumber, true],
    ['Device ID / OBU', overview?.deviceId || ialert?.obuId, true],
    ['Provider', providerLabel(telematicsProvider)],
    ['Known to', coverageSources(coverage).join(' · ')],
    ['Cellular', ialert?.cellular || fleetEdge?.cellular],
  ];
  return (
    <section className="vdo-card vdo-registry">
      <button
        className="vdo-registry-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        Registry &amp; device <span>{open ? 'Hide' : 'Show 10 fields'}</span>
      </button>
      {open ? (
        <div className="vdo-registry-fields" id={id}>
          {fields.map(([label, value, code]) => (
            <div key={label}>
              <span>{label}</span>
              <span className={code ? 'vdo-code' : undefined}>{value || '—'}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
