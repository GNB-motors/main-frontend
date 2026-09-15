import { Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { formatKm, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import {
  statusChips,
  serviceState,
  fuelReading,
  defReading,
  coverageSources,
  daysSince,
  distanceInWindow,
  READING,
} from './vehicle360Logic';

const VehicleModel3D = lazy(() => import('./VehicleModel3D'));
const VehicleMiniMap = lazy(() => import('./VehicleMiniMap'));

/** Donut geometry from the source design: r=26, stroke 6, rotated -90°. */
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

export function Breadcrumbs({ reg }) {
  return (
    <nav className="v360-crumbs" aria-label="Breadcrumb">
      <Link to="/command-center">Fleet</Link>
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
export function IdentityStrip({ reg, fleetMaster, fleetEdge, livePosition, prediction }) {
  const chips = statusChips({ fleetMaster, livePosition, prediction });
  const descriptor = descriptorOf(fleetMaster, fleetEdge);
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
  const on = Math.max(0, Math.min(1, pct)) * RING_C;
  const dash = dashed ? '3 7' : `${on.toFixed(1)} ${(RING_C - on).toFixed(1)}`;
  return (
    <div className="v360-ring">
      <span className="v360-ring-svg">
        <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true">
          <circle cx="31" cy="31" r={RING_R} fill="none" stroke="var(--line)" strokeWidth="6" />
          <circle
            cx="31"
            cy="31"
            r={RING_R}
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={dash}
          />
        </svg>
        <span className="v360-ring-big" style={{ color: ink }}>
          {big}
        </span>
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="v360-ring-label">{label}</span>
        <span className="v360-ring-sub">{sub}</span>
      </span>
    </div>
  );
}

/**
 * A `Ring` for a percentage-style telemetry reading (fuel, DEF) — shared so
 * the two gauges can't drift out of sync on what "no data" vs "no unit"
 * looks like.
 */
function LevelRing({ reading, label }) {
  return (
    <Ring
      pct={reading.state === READING.OK && reading.unit === '%' ? reading.value / 100 : 0}
      dashed={reading.state !== READING.OK}
      stroke={reading.state === READING.OK ? 'var(--erp)' : 'var(--grey)'}
      ink="var(--ink3)"
      big={
        reading.state === READING.OK
          ? reading.unit === '%'
            ? `${formatNum(reading.value)}%`
            : formatNum(reading.value)
          : '—'
      }
      label={label}
      sub={
        reading.state === READING.NO_UNIT
          ? 'no unit reported by the sensor'
          : reading.state === READING.NO_DATA
            ? 'no reading yet'
            : 'last live reading'
      }
    />
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
}) {
  const svc = serviceState(prediction);
  const fuel = fuelReading(health);
  const def = defReading(health);
  const telemetryAge = daysSince(health?.pulledAt);
  const travelled = distanceInWindow(history);

  const odoSub =
    health?.pulledAt != null ? `CAN reading · ${timeAgo(health.pulledAt)}` : 'no reading yet';

  const rcExpiry = (fleetMaster?.documents || []).find((d) => d.docType === 'RC')?.expiryDate;

  // Manual spec sheet first (matches the reference design's static-info
  // block), then the FleetEdge/fleet-master identity facts underneath.
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

  const registry = [
    ['Manufacturer', fleetEdge?.manufacturer || fleetMaster?.manufacturer, false],
    ['Model', fleetEdge?.vehicleModel || fleetMaster?.model, false],
    ['Category', fleetMaster?.vehicleCategory || fleetEdge?.vehicleType, false],
    ['Line of business', fleetEdge?.lobName, false],
    ['Emission norm', fleetEdge?.emissionNorm, false],
    ['VIN / chassis', fleetEdge?.vin || fleetMaster?.chassisNumber, true],
    ['Engine number', fleetEdge?.engineNumber, true],
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
              value={health?.canOdo != null ? formatKm(health.canOdo) : '—'}
              sub={odoSub}
            />
            <Readout
              label="Engine hours"
              value={
                health?.engineRunHour != null
                  ? `${formatNum(health.engineRunHour, { decimals: 1 })} h`
                  : '—'
              }
              sub="since telemetry start"
            />
            <Readout
              label="Service"
              crit={svc.overdue}
              value={svc.km != null ? formatKm(svc.km) : svc.level === 'none' ? '—' : svc.label}
              sub={
                svc.level === 'none'
                  ? 'no forecast yet'
                  : svc.overdue
                    ? `past due${svc.days != null ? ` · ${svc.days} days` : ''}`
                    : `to go${svc.days != null ? ` · ${svc.days} days` : ''}`
              }
            />
            <Readout
              label="Speed"
              value={livePosition?.speed != null ? `${formatNum(livePosition.speed)} km/h` : '—'}
              sub={
                livePosition?.eventDateTime ? timeAgo(livePosition.eventDateTime) : 'no live fix'
              }
            />
          </div>
        </div>

        <div className="v360-rings">
          <LevelRing reading={fuel} label="Fuel level" />
          <Ring
            pct={travelled ? Math.min(1, travelled / 5000) : 0}
            dashed={travelled == null}
            stroke={travelled ? 'var(--erp)' : 'var(--grey)'}
            ink="var(--ink3)"
            big={travelled != null ? formatKm(travelled) : '—'}
            label="Distance, 30 d"
            sub={
              travelled == null
                ? 'needs two odometer readings'
                : travelled === 0
                  ? 'no movement recorded'
                  : 'from the odometer history'
            }
          />
          <LevelRing reading={def} label="DEF level" />
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

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="v360-tabs" role="tablist" aria-label="Vehicle sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`v360-tab ${active === t.id ? 'v360-tab--on' : ''}`.trim()}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null ? <span className="v360-tab-count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
