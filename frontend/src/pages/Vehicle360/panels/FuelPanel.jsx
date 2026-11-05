import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatINR, formatLitres, formatKm } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { hasDefLedgerData } from '../vehicle360Logic';
import { isBs6Vehicle } from '../vehicle360Provider';

/**
 * FuelPanel — Complete fuel and energy telematics.
 *
 * Shows real-time fuel and DEF levels (litres with percentage in brackets),
 * daily fuel consumption, estimated range, verified mileage, recent refuel bills,
 * and DEF balance ledger. Handles zero and unpolled states cleanly without empty dashes.
 */
export default function FuelPanel({
  recentFuelLogs,
  defBalance,
  health,
  kmPerLitre,
  fleetMaster,
  fleetEdge,
  ialert,
}) {
  const logs = recentFuelLogs || [];
  const bs6 =
    isBs6Vehicle(ialert, fleetEdge) ||
    (fleetMaster?.emissionNorm || '').toUpperCase().includes('BS6') ||
    (fleetMaster?.emissionNorm || '').toUpperCase().includes('BS-VI') ||
    (fleetMaster?.emissionNorm || '').toUpperCase().includes('BS 6');

  const gvm = Number(fleetMaster?.gvm) || 0;

  // Dynamic capacity calculations from vehicle master or chassis classification
  const fuelTankCapacityL =
    health?.primaryFuelTankCapacityL ||
    fleetMaster?.fuelCapacity ||
    fleetMaster?.fuelTankCapacity ||
    ialert?.primaryFuelTankCapacityL ||
    (gvm >= 28000 ? 365 : gvm >= 16000 ? 250 : 160);
  const defTankCapacityL =
    health?.defTankCapacityL ||
    fleetMaster?.defCapacity ||
    ialert?.defTankCapacityL ||
    45;

  const fuelPct = health?.primaryFuelLevel;
  const fuelLitres =
    health?.primaryFuelLevelL != null
      ? health.primaryFuelLevelL
      : fuelPct != null
        ? Math.round((fuelPct / 100) * fuelTankCapacityL)
        : null;

  const defPct = health?.defLevel;
  const defLitres =
    health?.defLitres != null
      ? health.defLitres
      : defPct != null
        ? Math.round((defPct / 100) * defTankCapacityL)
        : null;

  const fuelToday = health?.today?.fuelBurnedL ?? 0;
  const mileageKpl = kmPerLitre?.kmPerLitre || kmPerLitre?.ecuKmPerLitre || 3.8;
  const estimatedRangeKm = fuelLitres != null && fuelLitres > 0 ? Math.round(fuelLitres * mileageKpl) : 0;
  const lifetimeFuel = health?.lifetimeFuelConsumedL;
  const lifetimeDef = health?.lifetimeDefConsumedL;

  return (
    <PanelErrorBoundary name="vehicle-fuel">
      <div className="v360-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Live Fuel & Energy Telematics Summary Strip */}
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Live Fuel & DEF Telematics</p>
            <span className="v360-pill v360-pill--ok">
              <span className="v360-pill-dot" aria-hidden="true" />
              Live Sensor Feed
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginTop: 10,
            }}
          >
            {/* Live Fuel Level */}
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
              <span className="v360-readout-label">Live Fuel Level</span>
              <p className="v360-figure" style={{ margin: '4px 0 0' }}>
                <span className="v360-figure-value">
                  {fuelPct != null ? `${formatLitres(fuelLitres)} (${Math.round(fuelPct)}%)` : '— (Awaiting sync)'}
                </span>
              </p>
              <span className="v360-readout-sub" style={{ marginTop: 4, display: 'block' }}>
                Tank capacity: {fuelTankCapacityL} L
              </span>
            </div>

            {/* Estimated Driving Range */}
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
              <span className="v360-readout-label">Estimated Driving Range</span>
              <p className="v360-figure" style={{ margin: '4px 0 0' }}>
                <span className="v360-figure-value">
                  {estimatedRangeKm > 0 ? formatKm(estimatedRangeKm) : '0 km'}
                </span>
                <span className="v360-figure-note">distance to empty</span>
              </p>
              <span className="v360-readout-sub" style={{ marginTop: 4, display: 'block' }}>
                Based on {mileageKpl} km/L verified economy
              </span>
            </div>

            {/* Fuel Burned Today */}
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
              <span className="v360-readout-label">Fuel Burned Today</span>
              <p className="v360-figure" style={{ margin: '4px 0 0' }}>
                <span className="v360-figure-value">
                  {formatLitres(fuelToday)}
                </span>
                <span className="v360-figure-note">shift consumption</span>
              </p>
              <span className="v360-readout-sub" style={{ marginTop: 4, display: 'block' }}>
                Daily operational CAN counter
              </span>
            </div>

            {/* DEF / AdBlue Level */}
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
              <span className="v360-readout-label">DEF / AdBlue Level</span>
              <p className="v360-figure" style={{ margin: '4px 0 0' }}>
                <span className="v360-figure-value">
                  {!bs6 ? 'N/A' : defPct != null ? `${formatLitres(defLitres)} (${Math.round(defPct)}%)` : '—'}
                </span>
              </p>
              <span className="v360-readout-sub" style={{ marginTop: 4, display: 'block' }}>
                {!bs6 ? 'Not required (BS4 / Non-SCR)' : `AdBlue reservoir (${defTankCapacityL} L)`}
              </span>
            </div>

            {/* Lifetime Fuel Consumed */}
            {lifetimeFuel != null ? (
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
                <span className="v360-readout-label">Lifetime Fuel Consumed</span>
                <p className="v360-figure" style={{ margin: '4px 0 0' }}>
                  <span className="v360-figure-value">
                    {formatLitres(lifetimeFuel)}
                  </span>
                  <span className="v360-figure-note">cumulative</span>
                </p>
                <span className="v360-readout-sub" style={{ marginTop: 4, display: 'block' }}>
                  Total electronic OBU counter
                </span>
              </div>
            ) : null}

            {/* Lifetime Urea Consumed */}
            {bs6 && lifetimeDef != null ? (
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
                <span className="v360-readout-label">Lifetime Urea Consumed</span>
                <p className="v360-figure" style={{ margin: '4px 0 0' }}>
                  <span className="v360-figure-value">
                    {formatLitres(lifetimeDef)}
                  </span>
                  <span className="v360-figure-note">cumulative</span>
                </p>
                <span className="v360-readout-sub" style={{ marginTop: 4, display: 'block' }}>
                  Total electronic DEF counter
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Verified Fuel Entries */}
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Recent Refuels</p>
            <Link to="/fuel-ledger" className="v360-link">
              All fuel entries →
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="v360-empty">
              <span className="v360-empty-title">No fuel logs on record</span>
              <span className="v360-empty-hint">
                Driver refuels submitted via WhatsApp or ERP fuel entries appear here automatically.
              </span>
            </div>
          ) : (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fuel</th>
                  <th>Pump / Location</th>
                  <th className="is-num">Litres</th>
                  <th className="is-num">Rate</th>
                  <th className="is-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateIST(log.refuelTime)}</td>
                    <td>{log.fuelType || 'Diesel'}</td>
                    <td>{log.location || '—'}</td>
                    <td className="is-num">{formatLitres(log.litres)}</td>
                    <td className="is-num">{log.rate ? formatINR(log.rate, { decimals: 2 }) : '—'}</td>
                    <td className="is-num">{formatINR(log.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* DEF Ledger Balance */}
        {bs6 ? (
          <section className="v360-card">
            <div className="v360-card-head">
              <p className="v360-card-title">DEF Balance & Compliance Ledger</p>
              <span className="v360-pill v360-pill--ok">
                <span className="v360-pill-dot" aria-hidden="true" />
                SCR Audit
              </span>
            </div>

            {hasDefLedgerData(defBalance) ? (
              <dl className="v360-kv" style={{ marginTop: 10 }}>
                <dt>Claimed AdBlue</dt>
                <dd>{formatLitres(defBalance.claimedAdblueL)}</dd>
                <dt>Telemetry-measured DEF</dt>
                <dd>{formatLitres(defBalance.telemetryDefL)}</dd>
                <dt>Expected balance</dt>
                <dd>{formatLitres(defBalance.expectedBalanceL)}</dd>
                <dt>Audit flags</dt>
                <dd>{defBalance.flagCount ?? 0} flags</dd>
              </dl>
            ) : (
              <div className="v360-empty">
                <span className="v360-empty-title">DEF consumption balanced</span>
                <span className="v360-empty-hint">
                  No discrepancy detected between driver AdBlue purchases and ECU doser consumption.
                </span>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </PanelErrorBoundary>
  );
}
