import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import { formatINR, formatLitres, formatKm, formatNum } from '../../../utils/formatters';
import { formatDateIST, formatDateTimeIST, toISTDateString } from '../../../utils/dateUtils';
import { fluidLevels, numeric } from './overview/referenceOverviewModel';
import { OverviewCardSkeleton } from './overview/OverviewSkeleton';
import './overview/referenceOverview.css';
import './vehicleFuel.css';

const litres = (value) => (numeric(value) == null ? 'No reading' : formatLitres(Number(value)));
const validDate = (value) => value && Number.isFinite(new Date(value).getTime());
const readingAge = (value) =>
  validDate(value)
    ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
    : null;

function TankLevel({ label, reading, capacity }) {
  const age = readingAge(reading.at);
  const stale = age != null && age >= 1;
  const pct =
    reading.percent ??
    (reading.litres != null && capacity > 0 ? (reading.litres / capacity) * 100 : null);
  return (
    <div className="vfuel-tank">
      <div className="vfuel-between">
        <span>{label}</span>
        <small>{capacity > 0 ? `${formatNum(capacity)} L tank` : 'Capacity not recorded'}</small>
      </div>
      <div className="vfuel-figure">
        <strong>{litres(reading.litres)}</strong>
        <span>{pct != null ? `${formatNum(pct)}%` : 'Percentage unavailable'}</span>
      </div>
      <div
        className="vfuel-level"
        aria-label={
          pct != null ? `${label} ${formatNum(pct)} percent` : `${label} level unavailable`
        }
      >
        <span
          className={stale ? 'vfuel-level--stale' : ''}
          style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
        />
      </div>
      <p className={stale ? 'vfuel-warning' : ''}>
        {validDate(reading.at)
          ? `Sensor reading · ${formatDateTimeIST(reading.at)}${stale ? ` · ${age} days old` : ''}`
          : 'Sensor timestamp unavailable'}
      </p>
      <p>
        {reading.litresBasis === 'SENSOR_LITRES'
          ? 'Tank sensor · litres'
          : reading.litresBasis === 'SENSOR_PERCENT_X_CAPACITY'
            ? 'Tank sensor · percentage converted using reported capacity'
            : 'Tank sensor · no litre reading available'}
      </p>
    </div>
  );
}

export default function FuelPanel({
  registrationNumber,
  recentFuelLogs,
  defBalance,
  health,
  kmPerLitre,
  fleetMaster,
  ialert,
  onGoTab,
}) {
  const overview = useApi(
    (signal) => FleetDataService.getVehicleOverview(registrationNumber, signal),
    [registrationNumber],
    { enabled: Boolean(registrationNumber), scopeKey: registrationNumber },
  );
  const [fuel, def] = fluidLevels(overview.data, health, fleetMaster, ialert);
  const fuelCapacity =
    numeric(overview.data?.fuel?.capacityL) ??
    numeric(health?.primaryFuelTankCapacityL) ??
    numeric(fleetMaster?.fuelTankCapacity) ??
    numeric(fleetMaster?.fuelCapacity) ??
    numeric(ialert?.primaryFuelTankCapacityL);
  const defCapacity =
    numeric(overview.data?.def?.capacityL) ??
    numeric(health?.defTankCapacityL) ??
    numeric(fleetMaster?.defCapacity) ??
    numeric(ialert?.defTankCapacityL);
  const economy = numeric(kmPerLitre?.kmPerL) ?? numeric(kmPerLitre?.ecuKmPerL);
  const range = fuel.litres != null && economy > 0 ? fuel.litres * economy : null;
  const fuelToday = numeric(health?.today?.fuelBurnedL);
  const todayAt = health?.today?.at ?? health?.canAt ?? health?.pulledAt;
  const todayKnown = validDate(todayAt) && toISTDateString(todayAt) === toISTDateString(new Date());
  const logs = Array.isArray(recentFuelLogs) ? recentFuelLogs : [];
  const claimed = numeric(defBalance?.claimedAdblueL);
  const measured = numeric(defBalance?.telemetryDefL);
  const balance = numeric(defBalance?.expectedBalanceL);
  const auditable = claimed != null && measured != null && balance != null;
  const flags = numeric(defBalance?.flagCount);
  const auditRows = [
    ['DEF bought', claimed, 'Claimed AdBlue from the balance ledger'],
    ['DEF used · telemetry', measured, 'Telemetry-measured DEF consumption'],
    ['Expected balance', balance, 'Expected balance reported by the ledger'],
  ];
  return (
    <PanelErrorBoundary name="vehicle-fuel">
      <div className="vdo-overview vfuel">
        {overview.loading && !overview.data ? (
          <OverviewCardSkeleton />
        ) : (
          <section className="vdo-card vfuel-summary">
            <div className="vfuel-between">
              <h3>Fuel &amp; DEF levels</h3>
              <span className="vfuel-badge">
                {fuel.litres != null || fuel.percent != null
                  ? readingAge(fuel.at) >= 1
                    ? 'Historical sensor reading'
                    : 'Latest available sensor reading'
                  : 'Sensor reading unavailable'}
              </span>
            </div>
            <div className="vfuel-tanks">
              <TankLevel label="Diesel" reading={fuel} capacity={fuelCapacity} />
              <TankLevel label="DEF (AdBlue)" reading={def} capacity={defCapacity} />
            </div>
            <div className="vfuel-stats">
              <div>
                <span>Range at fuel reading</span>
                <strong>{range != null ? formatKm(range) : 'No estimate'}</strong>
                <small>
                  {range != null
                    ? `${formatLitres(fuel.litres)} × ${formatNum(economy)} km/L reported economy`
                    : 'Requires fuel litres and measured economy'}
                </small>
              </div>
              <div>
                <span>Burned today</span>
                <strong>{todayKnown ? litres(fuelToday) : 'No current reading'}</strong>
                <small>
                  {todayKnown && fuelToday != null
                    ? 'Daily consumption reported by telemetry'
                    : 'A current daily consumption reading is unavailable'}
                </small>
              </div>
              <div>
                <span>Fuel economy</span>
                <strong>{economy > 0 ? `${formatNum(economy)} km/L` : 'Not measured'}</strong>
                <small>Reported vehicle economy; no assumed mileage</small>
              </div>
            </div>
          </section>
        )}
        <div className="vfuel-middle">
          <section className="vdo-card vfuel-insight">
            <span className="vfuel-eyebrow">✧ Fuel record coverage</span>
            <p className="vfuel-insight-lead">
              {logs.length
                ? `${logs.length} recent fuel ${logs.length === 1 ? 'entry is' : 'entries are'} available for this vehicle.`
                : 'No recent fuel entries were returned for this vehicle.'}
            </p>
            <p>
              {fuel.litres != null
                ? 'The tank level is a sensor snapshot. Check its timestamp before using it to plan a refuel.'
                : 'A tank reading is not available in litres. The remaining range cannot be estimated without a measured fuel level and economy.'}
            </p>
            <div className="vfuel-comparison">
              <div>
                <small>Fuel in tank</small>
                <strong>{litres(fuel.litres)}</strong>
                <small>Latest available reading</small>
              </div>
              <div>
                <small>Refuel records</small>
                <strong>{formatNum(logs.length)}</strong>
                <small>Recent entries returned</small>
              </div>
            </div>
            <p>
              Missing entries alone do not establish fuel loss or unlogged refuels. Reconciliation
              needs matching distance, consumption and purchase records for the same period.
            </p>
          </section>
          <section className="vdo-card vfuel-refuels">
            <div className="vfuel-between">
              <h3>Refuels</h3>
              <Link to="/fuel-ledger">All fuel entries →</Link>
            </div>
            {!logs.length ? (
              <div className="vfuel-empty">
                <span className="vfuel-empty-icon" aria-hidden="true">
                  ⛽
                </span>
                <h3>No recent refuels on record</h3>
                <p>Fuel receipts submitted by drivers or entered in the fuel ledger appear here.</p>
                <Link className="vfuel-button" to="/fuel-ledger">
                  Open fuel ledger →
                </Link>
              </div>
            ) : (
              <div className="vfuel-table-wrap">
                <table className="vfuel-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Fuel / location</th>
                      <th>Litres</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={log.id || index}>
                        <td>{validDate(log.refuelTime) ? formatDateIST(log.refuelTime) : '—'}</td>
                        <td>
                          {log.fuelType || 'Not specified'}
                          <small>{log.location || 'Location not recorded'}</small>
                        </td>
                        <td>
                          {numeric(log.litres) != null ? formatLitres(Number(log.litres)) : '—'}
                        </td>
                        <td>
                          {numeric(log.rate) != null
                            ? formatINR(Number(log.rate), { decimals: 2 })
                            : '—'}
                        </td>
                        <td>
                          {numeric(log.totalAmount) != null
                            ? formatINR(Number(log.totalAmount))
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        <section className="vdo-card vfuel-audit">
          <div className="vfuel-between">
            <div>
              <h3>DEF balance check</h3>
              <p>Compares recorded AdBlue purchases and telemetry consumption.</p>
            </div>
            <span className="vfuel-badge">
              {auditable
                ? flags != null && flags > 0
                  ? `${flags} audit flags`
                  : 'Ledger data available'
                : 'Can’t audit yet'}
            </span>
          </div>
          <div className="vfuel-audit-grid">
            {auditRows.map(([label, value, note]) => (
              <div key={label}>
                <span>
                  {label}
                  <small>{value == null ? 'Missing' : 'Reported'}</small>
                </span>
                <strong>{litres(value)}</strong>
                <p>{value == null ? 'No value returned by the DEF balance ledger.' : note}</p>
              </div>
            ))}
          </div>
          <div className="vfuel-audit-note">
            <span>
              {auditable
                ? `Ledger computed ${validDate(defBalance?.lastComputedAt) ? formatDateTimeIST(defBalance.lastComputedAt) : 'at an unavailable timestamp'}. ${flags == null ? 'Audit flag count unavailable.' : `${flags} flags reported; this alone does not confirm SCR health.`}`
                : 'A complete balance check requires purchases, measured consumption and an expected balance. Missing data does not mean the check passed.'}
            </span>
            {onGoTab ? (
              <button onClick={() => onGoTab('telemetry')}>Open telemetry →</button>
            ) : null}
          </div>
        </section>
        {numeric(health?.lifetimeFuelConsumedL) != null ||
        numeric(health?.lifetimeDefConsumedL) != null ? (
          <section className="vdo-card">
            <h3>Lifetime counters</h3>
            <div className="vfuel-stats">
              <div>
                <span>Diesel consumed</span>
                <strong>{litres(health?.lifetimeFuelConsumedL)}</strong>
              </div>
              <div>
                <span>DEF consumed</span>
                <strong>{litres(health?.lifetimeDefConsumedL)}</strong>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </PanelErrorBoundary>
  );
}
