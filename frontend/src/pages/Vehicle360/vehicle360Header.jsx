import { Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { formatKm, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import FleetLinkVehicleNotice from '../../components/FleetLinkVehicleNotice.jsx';
import EmissionNorm from './EmissionNorm.jsx';
import { isBs6Vehicle, providerLabel, providerPill } from './vehicle360Provider.js';
import {
  statusChips,
  serviceState,
  coverageSources,
  daysSince,
  distanceInWindow,
} from './vehicle360Logic';

const VehicleModel3D = lazy(() => import('./VehicleModel3D'));
const VehicleMiniMap = lazy(() => import('./VehicleMiniMap'));

/** Donut geometry from the source design: r=26, stroke 6, rotated -90°. */
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

export function Breadcrumbs({ reg }) {
  return (
    <nav className="v360-crumbs" aria-label="Breadcrumb">
      <Link to="/live-tracking">Fleet</Link>
      <span className="v360-crumbs-sep" aria-hidden="true">
        /
      </span>
      <Link to="/vehicles">Vehicles</Link>
      <span className="v360-crumbs-sep" aria-hidden="true">
        /
      </span>
      <span className="v360-crumbs-current" aria-current="page">
        {reg}
      </span>
    </nav>
  );
}

function Pill({ tone, label }) {
  return (
    <span className={`v360-pill v360-pill--${tone}`}>
      <span className="v360-pill-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function descriptorOf(fleetMaster, fleetEdge) {
  return [
    [
      fleetEdge?.manufacturer || fleetMaster?.manufacturer,
      fleetEdge?.vehicleModel || fleetMaster?.model,
    ]
      .filter(Boolean)
      .join(' '),
    fleetMaster?.vehicleCategory || fleetEdge?.vehicleType,
    fleetEdge?.fuelType,
    fleetEdge?.emissionNorm,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Identity strip: who this is, what state it's in, what you can do about it. */
export function IdentityStrip({
  reg,
  fleetMaster,
  fleetEdge,
  livePosition,
  prediction,
  telematicsProvider,
  coverage,
  ialert,
}) {
  const chips = [
    providerPill(telematicsProvider),
    ...statusChips({ fleetMaster, livePosition, prediction }),
  ].filter(Boolean);
  const descriptor = descriptorOf(
    {
      ...fleetMaster,
      model: fleetMaster?.model || ialert?.vehicleModel || fleetEdge?.vehicleModel,
      manufacturer: fleetMaster?.manufacturer || (ialert ? 'Ashok Leyland' : fleetEdge?.manufacturer),
    },
    fleetEdge,
  );
  const svc = serviceState(prediction);

  return (
    <div className="v360-idstrip">
      <span className="v360-idmark" aria-hidden="true">
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5h10v9h-10z" />
          <path d="M12.5 9.5h4.6l2.9 3v3h-7.5z" />
          <circle cx="6" cy="17" r="1.7" />
          <circle cx="16" cy="17" r="1.7" />
        </svg>
      </span>

      <div style={{ minWidth: 0 }}>
        <h1 className="v360-idtitle">{reg}</h1>
        {descriptor ? <p className="v360-idsub">{descriptor}</p> : null}
      </div>

      {chips.length ? (
        <div className="v360-idpills">
          {chips.map((c) => (
            <Pill
              key={c.id}
              tone={
                c.tone === 'crit'
                  ? 'crit'
                  : c.tone === 'warn'
                    ? 'warn'
                    : c.tone === 'ok'
                      ? 'ok'
                      : 'grey'
              }
              label={c.label}
            />
          ))}
        </div>
      ) : null}

      <div className="v360-idactions">
        <FleetLinkVehicleNotice
          reg={reg}
          telematicsProvider={telematicsProvider}
          manufacturer={fleetMaster?.manufacturer || (ialert ? 'Ashok Leyland' : fleetEdge?.manufacturer)}
          ialert={ialert}
          coverage={coverage}
        />
        {svc.level === 'critical' || svc.level === 'warn' ? (
          <Link
            to="/vehicles/service-intelligence/add-service"
            className="v360-btn v360-btn--primary"
          >
            Book this service
          </Link>
        ) : null}
        <Link to="/mileage-tracking/new" className="v360-btn">
          Log fuel
        </Link>
        <Link to="/live-tracking" className="v360-btn">
          Track
        </Link>
      </div>
    </div>
  );
}

function Readout({ label, value, sub, crit }) {
  return (
    <span className={`v360-readout ${crit ? 'v360-readout--crit' : ''}`.trim()}>
      <span className="v360-readout-label">
        <span className="v360-readout-dot" aria-hidden="true" />
        {label}
      </span>
      <span className="v360-readout-value">{value}</span>
      <span className="v360-readout-sub">{sub}</span>
    </span>
  );
}

/** Exported so panel cards (e.g. the Services donut) can reuse the same gauge. */
export function Ring({ pct, stroke, ink, big, label, sub, dashed }) {
  const on = Math.max(0, Math.min(1, pct || 0)) * RING_C;
  const dash = dashed ? '3 7' : `${on.toFixed(1)} ${(RING_C - on).toFixed(1)}`;
  const bigStr = String(big ?? '');
  const fontSize = bigStr.length > 5 ? '10px' : bigStr.length > 3 ? '11.5px' : undefined;

  return (
    <div className="v360-ring">
      <span className="v360-ring-svg">
        <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
          <circle className="v360-ring-track" cx="30" cy="30" r={RING_R} />
          <circle
            className="v360-ring-stroke"
            cx="30"
            cy="30"
            r={RING_R}
            stroke={stroke}
            strokeDasharray={dash}
          />
        </svg>
        <span className="v360-ring-big" style={{ color: ink, ...(fontSize ? { fontSize } : {}) }}>
          {big}
        </span>
      </span>
      <span style={{ minWidth: 0, flex: '1 1 auto' }}>
        <span className="v360-ring-label">{label}</span>
        <span className="v360-ring-sub">{sub}</span>
      </span>
    </div>
  );
}

/**
 * Hero: the orbitable model with its readings underneath, the three rings, and
 * the registry column. Readings sit in a row below the truck rather than as
 * pins on it — they are telemetry, not parts of the vehicle.
 */
export function HeroRow({
  reg,
  fleetMaster,
  fleetEdge,
  health,
  livePosition,
  prediction,
  coverage,
  history,
  ialert,
  telematicsProvider,
}) {
  const svc = serviceState(prediction);
  const bs6 =
    isBs6Vehicle(ialert, fleetEdge) ||
    (fleetMaster?.emissionNorm || '').toUpperCase().includes('BS6') ||
    (fleetMaster?.emissionNorm || '').toUpperCase().includes('BS-VI') ||
    (fleetMaster?.emissionNorm || '').toUpperCase().includes('BS 6');

  const gvm = Number(fleetMaster?.gvm) || 0;
  const isTipper = (fleetMaster?.vehicleCategory || fleetEdge?.vehicleType || '').toLowerCase().includes('tipper');
  const targetMonthlyKm = isTipper ? 4000 : 8000;

  // Multi-tier dynamic odometer resolution: CAN signal -> prediction odometer -> live tracking odometer -> master
  const currentOdo =
    health?.canOdo ??
    prediction?.currentOdometer ??
    livePosition?.odometer ??
    (Number.isFinite(Number(fleetMaster?.currentOdometer)) ? Number(fleetMaster.currentOdometer) : 0);

  // Dynamic engine hours resolution
  const engineHours =
    health?.engineRunHour ??
    (currentOdo > 0 ? Math.round(currentOdo / 28) : 0);
  const hoursToday = health?.today?.engineHours ?? 0;

  // Speed and motion
  const speed = livePosition?.speed ?? 0;
  const isMoving = speed > 0 || livePosition?.view?.status === 'moving';

  // Service distance
  const remainingKm =
    svc.km != null
      ? svc.km
      : prediction?.projectedServiceDueOdometer && currentOdo
        ? Math.max(0, prediction.projectedServiceDueOdometer - currentOdo)
        : null;

  // Fluid and distance readings
  const tankCapacity =
    health?.primaryFuelTankCapacityL ||
    fleetMaster?.fuelCapacity ||
    fleetMaster?.fuelTankCapacity ||
    ialert?.primaryFuelTankCapacityL ||
    (gvm >= 28000 ? 365 : gvm >= 16000 ? 250 : 160);
  const fuelPct = health?.primaryFuelLevel ?? (livePosition?.primaryFuelLevel ?? null);
  const fuelLitres =
    health?.primaryFuelLevelL != null
      ? health.primaryFuelLevelL
      : fuelPct != null
        ? Math.round((fuelPct / 100) * tankCapacity)
        : null;

  const defCapacity =
    health?.defTankCapacityL ||
    fleetMaster?.defCapacity ||
    ialert?.defTankCapacityL ||
    45;
  const defPct = health?.defLevel;
  const defLitres =
    health?.defLitres != null
      ? health.defLitres
      : defPct != null
        ? Math.round((defPct / 100) * defCapacity)
        : null;

  const travelled =
    distanceInWindow(history) ??
    (prediction?.currentOdometer && prediction?.lastServiceOdometer
      ? Math.max(0, prediction.currentOdometer - prediction.lastServiceOdometer)
      : 0);

  const distPct = targetMonthlyKm > 0 ? Math.min(1, travelled / targetMonthlyKm) : 0;

  const rcExpiry = (fleetMaster?.documents || []).find((d) => d.docType === 'RC')?.expiryDate;

  const specRows = [
    ['Body type', fleetMaster?.bodyType, false],
    ['Color', fleetMaster?.color, false],
    ['GVM', fleetMaster?.gvm, false],
    ['Registration', reg, true],
    [
      'Status',
      fleetMaster?.status ? fleetMaster.status.replace(/_/g, ' ').toLowerCase() : null,
      false,
    ],
    ['Year', fleetMaster?.manufactureYear, false],
    ['State', fleetMaster?.registrationState, false],
    ['Reg. expiry', rcExpiry ? formatDateIST(rcExpiry) : null, false],
  ].filter(([, v]) => v);

  const telemetryAge = daysSince(health?.pulledAt);
  const registry = [
    ['Manufacturer', fleetEdge?.manufacturer || (ialert ? 'Ashok Leyland' : fleetMaster?.manufacturer), false],
    ['Model', fleetEdge?.vehicleModel || ialert?.vehicleModel || fleetMaster?.model, false],
    ['Category', fleetMaster?.vehicleCategory || fleetEdge?.vehicleType || ialert?.vehicleType, false],
    ['Line of business', fleetEdge?.lobName, false],
    [
      'Emission norm',
      (fleetEdge?.emissionNorm || bs6) && <EmissionNorm norm={fleetEdge?.emissionNorm || (bs6 ? 'BS6' : null)} bs6={bs6} />,
      false,
    ],
    ['VIN / chassis', fleetEdge?.vin || ialert?.vin || fleetMaster?.chassisNumber, true],
    ['Device ID / OBU', ialert?.obuId || fleetEdge?.engineNumber || fleetMaster?.chassisNumber, true],
    ['Provider', providerLabel(telematicsProvider) || (ialert ? 'iALERT' : fleetEdge ? 'FleetEdge' : null), false],
    ['Known to', coverageSources(coverage).join(' · '), false],
  ].filter(([, v]) => v);

  return (
    <div className="v360-hero">
      <div className="v360-modelcard">
        <div className="v360-modelwrap">
          <Suspense fallback={<div className="v360-model" />}>
            <VehicleModel3D label={`3-D model of ${reg}`} />
          </Suspense>

          <div className="v360-readouts">
            <Readout
              label="Odometer"
              value={currentOdo > 0 ? formatKm(currentOdo) : '—'}
              sub={
                health?.pulledAt != null
                  ? `CAN reading · ${timeAgo(health.pulledAt)}`
                  : prediction?.currentOdometer != null
                    ? 'ECU calibrated reading'
                    : 'ECU CAN odometer'
              }
            />
            <Readout
              label="Engine hours"
              value={engineHours > 0 ? `${formatNum(engineHours, { decimals: 1 })} h` : '—'}
              sub={
                health?.batteryVoltage != null
                  ? `${health.batteryVoltage} V battery`
                  : hoursToday > 0
                    ? `+${formatNum(hoursToday, { decimals: 1 })} h today`
                    : 'cumulative runtime'
              }
            />
            <Readout
              label="Service"
              crit={svc.overdue}
              value={remainingKm != null ? formatKm(remainingKm) : svc.level === 'none' ? 'On Schedule' : svc.label}
              sub={
                svc.days != null
                  ? `${svc.days} days ${svc.overdue ? 'overdue' : 'to go'}`
                  : 'Next interval'
              }
            />
            <Readout
              label="Speed"
              value={`${formatNum(speed)} km/h`}
              sub={
                isMoving
                  ? `Moving · ${livePosition?.eventDateTime ? timeAgo(livePosition.eventDateTime) : 'live'}`
                  : 'Parked · Ignition off'
              }
            />
          </div>
        </div>

        <div className="v360-rings">
          <Ring
            pct={fuelPct != null ? fuelPct / 100 : 0}
            dashed={fuelPct == null}
            stroke={fuelPct != null ? 'var(--erp)' : 'var(--grey)'}
            ink="var(--ink3)"
            big={fuelPct != null ? `${Math.round(fuelPct)}%` : '—'}
            label="Fuel level"
            sub={fuelLitres != null ? `${fuelLitres} L in tank` : 'Awaiting sensor'}
          />
          <Ring
            pct={distPct}
            dashed={travelled === 0}
            stroke={travelled > 0 ? 'var(--erp)' : 'var(--grey)'}
            ink="var(--ink3)"
            big={travelled > 0 ? `${Math.round(distPct * 100)}%` : '0%'}
            label="Distance (30 d)"
            sub={
              travelled > 0
                ? `${formatKm(travelled)} (${Math.round(distPct * 100)}% of target)`
                : 'No odometer movement'
            }
          />
          {bs6 ? (
            <Ring
              pct={defPct != null ? defPct / 100 : 0}
              dashed={defPct == null}
              stroke={defPct != null ? 'var(--erp)' : 'var(--grey)'}
              ink="var(--ink3)"
              big={defPct != null ? `${Math.round(defPct)}%` : '—'}
              label="DEF (AdBlue)"
              sub={defLitres != null ? `${defLitres} L in reservoir` : 'Awaiting sensor'}
            />
          ) : (
            <Ring
              pct={0}
              dashed={true}
              stroke="var(--grey)"
              ink="var(--ink3)"
              big="N/A"
              label="DEF (AdBlue)"
              sub="BS4 Non-SCR engine"
            />
          )}
        </div>
      </div>

      <aside className="v360-registry">
        <Suspense fallback={<div className="v360-minimap v360-minimap--loading" />}>
          <VehicleMiniMap livePosition={livePosition} />
        </Suspense>

        {specRows.length ? (
          <dl className="v360-spec-grid">
            {specRows.map(([k, v, code]) => (
              <RegistryRow key={k} k={k} v={v} code={code} />
            ))}
          </dl>
        ) : null}

        <div className="v360-card-head">
          <p className="v360-card-title">Registry</p>
          {telemetryAge != null ? (
            <span className="v360-readout-sub">telemetry {timeAgo(health.pulledAt)}</span>
          ) : null}
        </div>
        {registry.length ? (
          <dl>
            {registry.map(([k, v, code]) => (
              <RegistryRow key={k} k={k} v={v} code={code} />
            ))}
          </dl>
        ) : (
          <div className="v360-empty">
            <span className="v360-empty-title">No registry data</span>
            <span className="v360-empty-hint">
              Neither the fleet master nor FleetEdge knows this registration.
            </span>
          </div>
        )}
      </aside>
    </div>
  );
}

/** dt/dd pair — a component so the grid stays a single <dl>. */
function RegistryRow({ k, v, code }) {
  return (
    <>
      <dt>{k}</dt>
      <dd className={code ? 'is-code' : undefined}>{v}</dd>
    </>
  );
}
