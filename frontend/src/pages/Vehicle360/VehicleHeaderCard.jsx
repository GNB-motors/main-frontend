import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { formatKm, formatLitres, formatNum, timeAgo } from '../../utils/formatters';
import { viewOf } from '../../utils/liveView';
import { trackLink } from '../../utils/redesign/links';
import { serviceState } from './vehicle360Logic';
import { vehicleAxles } from './vehicleAxles';
import { fluidLevels, numeric } from './panels/overview/referenceOverviewModel';
import { Skeleton } from '../../components/ui/skeleton';
import OpenChallanBadge from '../Compliance/OpenChallanBadge';
import './panels/overview/referenceOverview.css';
import './vehicleHeaderCard.css';

const VehicleMiniMap = lazy(() => import('./VehicleMiniMap'));
const AddFuelLogModal = lazy(() => import('../KhataLedger/components/AddFuelLogModal'));

function TruckIllustration({ reg, axles, fuelPercent }) {
  // One visible wheel per axle in side elevation. Unknown configuration stays illustrative.
  const count = axles || 2;
  const rear = Array.from({ length: count - 1 }, (_, index) =>
    count <= 3 ? 130 + index * 64 : 80 + index * (340 / Math.max(1, count - 2)),
  );
  return (
    <svg
      viewBox="0 0 680 230"
      role="img"
      aria-label={
        axles ? `${axles}-axle truck, ${reg}` : `Illustrative truck, axle count unavailable, ${reg}`
      }
    >
      <ellipse cx="330" cy="206" rx="300" ry="9" fill="#121214" fillOpacity=".06" />
      <line x1="0" y1="200" x2="680" y2="200" stroke="#dfdfe2" />
      <rect
        x="40"
        y="44"
        width="420"
        height="114"
        rx="6"
        fill="#fff"
        stroke="#c6c6c9"
        strokeWidth="1.5"
      />
      {Array.from({ length: 16 }, (_, index) => (
        <line
          key={index}
          x1={58 + index * 25}
          y1="50"
          x2={58 + index * 25}
          y2="152"
          stroke="#ececee"
          strokeWidth="1.5"
        />
      ))}
      <rect x="40" y="44" width="420" height="10" rx="5" fill="#ececee" />
      <path
        d="M470 62 H566 Q586 62 596 82 L626 132 Q632 142 632 152 V170 H470 Z"
        fill="#fff"
        stroke="#93939a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M520 74 H562 Q574 74 580 86 L604 128 H520 Z"
        fill="#4469f01f"
        stroke="#b9c6f5"
        strokeWidth="1.2"
      />
      <rect
        x="478"
        y="74"
        width="34"
        height="54"
        rx="4"
        fill="#4469f014"
        stroke="#b9c6f5"
        strokeWidth="1.2"
      />
      <rect x="618" y="148" width="18" height="10" rx="3" fill="#eecf7f" />
      <rect x="34" y="158" width="604" height="12" rx="3" fill="#5d5d5e" />
      <rect
        x="300"
        y="170"
        width="66"
        height="18"
        rx="5"
        fill="#fff"
        stroke="#c6c6c9"
        strokeWidth="1.2"
      />
      {fuelPercent != null ? (
        <rect
          x="300"
          y="170"
          width={(66 * Math.max(0, Math.min(100, fuelPercent))) / 100}
          height="18"
          rx="5"
          fill="#4469f0"
          fillOpacity=".22"
        />
      ) : null}
      {[...rear, 566].map((x, index) => (
        <g key={index}>
          <circle cx={x} cy="176" r={count > 6 ? 18 : 24} fill="#2e2e30" />
          <circle cx={x} cy="176" r="11" fill="#c6c6c9" />
          <circle cx={x} cy="176" r="3" fill="#5d5d5e" />
        </g>
      ))}
      <text
        x="250"
        y="108"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="15"
        letterSpacing="3"
        fill="#b9b9ba"
      >
        {reg}
      </text>
    </svg>
  );
}

export default function VehicleHeaderCard({ reg, profile, onGoTab }) {
  const [specsOpen, setSpecsOpen] = useState(false);
  const [fuelLogOpen, setFuelLogOpen] = useState(false);
  const { fleetMaster: vehicle, fleetEdge, ialert, livePosition, health, prediction } = profile;
  const overview = useApi((signal) => FleetDataService.getVehicleOverview(reg, signal), [reg], {
    enabled: Boolean(reg),
    scopeKey: reg,
  });
  const [fuel, def] = fluidLevels(overview.data, health, vehicle, ialert);
  const view = viewOf(livePosition);
  const axles = vehicleAxles(vehicle);
  const svc = serviceState(prediction);
  const model = [
    vehicle?.manufacturer || fleetEdge?.manufacturer,
    vehicle?.model || ialert?.vehicleModel || fleetEdge?.vehicleModel,
  ]
    .filter(Boolean)
    .join(' ');
  const descriptor = [
    model,
    vehicle?.vehicleCategory || fleetEdge?.vehicleType,
    fleetEdge?.fuelType,
    ialert?.emissionNorm || fleetEdge?.emissionNorm,
  ].filter(Boolean);
  const location =
    livePosition?.address ||
    livePosition?.area ||
    (livePosition?.latitude != null && livePosition?.longitude != null
      ? `${Number(livePosition.latitude).toFixed(4)}, ${Number(livePosition.longitude).toFixed(4)}`
      : 'Position unavailable');
  const motion =
    { moving: 'Moving', stopped: 'Parked', idling: 'Idling', offline: 'Offline' }[view.status] ||
    'Status unavailable';
  const docs = vehicle?.documents;
  const specs = [
    ['Chassis / VIN', vehicle?.chassisNumber || fleetEdge?.vin],
    ['Axles', axles],
    ['Axle class', vehicle?.axleClass],
    ['Body', vehicle?.bodyType],
    ['Gross vehicle mass', vehicle?.gvm != null ? `${formatNum(vehicle.gvm)} kg` : null],
    ['Manufacture year', vehicle?.manufactureYear],
    ['Registration state', vehicle?.registrationState],
    ['Device', overview.data?.deviceId || ialert?.obuId],
  ];
  const percentText = (reading) =>
    reading.litres != null
      ? formatLitres(reading.litres)
      : reading.percent != null
        ? `${formatNum(reading.percent)}%`
        : '—';
  const freshness = (reading) =>
    reading.at ? `Read ${timeAgo(reading.at)}` : 'Timestamp unavailable';
  const tiles = [
    {
      label: 'Odometer',
      value:
        numeric(overview.data?.odometer?.value) != null
          ? formatKm(overview.data.odometer.value)
          : health?.canOdo != null
            ? formatKm(health.canOdo)
            : '—',
      note: overview.data?.odometer?.at
        ? `Read ${timeAgo(overview.data.odometer.at)}`
        : 'Last available reading',
      tab: 'telemetry',
    },
    {
      label: 'Diesel · sensor',
      value: percentText(fuel),
      note: freshness(fuel),
      pct: fuel.percent,
      tab: 'fuel',
    },
    {
      label: 'DEF · sensor',
      value: percentText(def),
      note: freshness(def),
      pct: def.percent,
      tab: 'fuel',
    },
    {
      label: 'Next service',
      value: svc.km != null ? formatKm(svc.km) : '—',
      note: svc.label,
      tab: 'service',
    },
    {
      label: 'Documents',
      value: Array.isArray(docs) ? `${new Set(docs.map((doc) => doc.docType)).size} on file` : '—',
      note: 'Recorded document types',
      tab: 'documents',
    },
    {
      label: 'Assigned driver',
      value: profile.assignedDriver?.name || 'Not assigned',
      note: profile.assignedDriver?.mobileNumber || 'Phone unavailable',
      tab: 'drivers',
    },
  ];
  return (
    <section className="vhcard">
      <div className="vhcard-top">
        <div>
          <div className="vhcard-identity">
            <h1>{reg}</h1>
            {vehicle?.status ? (
              <span className="vhcard-pill">{String(vehicle.status).replace(/_/g, ' ')}</span>
            ) : null}
            <span className="vhcard-pill">
              {motion}
              {view.ignition != null ? ` · ignition ${view.ignition ? 'on' : 'off'}` : ''}
            </span>
          </div>
          <div className="vhcard-descriptor">
            {descriptor.map((text, index) => (
              <span key={index}>{text}</span>
            ))}
            <button onClick={() => setSpecsOpen(!specsOpen)} aria-expanded={specsOpen}>
              {specsOpen ? 'Hide specs' : 'View specs'}
            </button>
          </div>
        </div>
        <div className="vhcard-actions">
          <button type="button" onClick={() => setFuelLogOpen(true)}>
            Log fuel
          </button>
          <Link className="vhcard-primary" to={trackLink({ reg })}>
            Track live
          </Link>
        </div>
      </div>
      {specsOpen ? (
        <div className="vhcard-specs">
          {specs.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value ?? 'Not recorded'}</b>
            </div>
          ))}
        </div>
      ) : null}
      <div className="vhcard-notice">
        <span aria-hidden="true">✧</span>
        <p>
          {view.lastFixAt
            ? `Position last reported ${timeAgo(view.lastFixAt)}.`
            : 'Position timestamp unavailable.'}{' '}
          {fuel.at
            ? `Fuel sensor last reported ${timeAgo(fuel.at)}.`
            : 'Fuel sensor timestamp unavailable.'}{' '}
          {Array.isArray(docs) && !docs.length ? 'No documents on record.' : ''}
        </p>
        <button onClick={() => onGoTab('telemetry')}>Telemetry →</button>
      </div>
      <div className="vhcard-visuals">
        <div className="vhcard-truck">
          <TruckIllustration reg={reg} axles={axles} fuelPercent={fuel.percent} />
          <div className="vhcard-truck-caption">
            <span>
              {axles
                ? `${axles} axles · recorded configuration`
                : 'Illustration · axle count not recorded'}
            </span>
            {vehicle?.bodyType ? <span>Body · {vehicle.bodyType}</span> : null}
            {fuel.capacityL > 0 ? <span>Tank · {formatNum(fuel.capacityL)} L</span> : null}
          </div>
        </div>
        <div className="vhcard-map">
          <div className="vhcard-map-canvas">
            <Suspense fallback={<Skeleton style={{ height: '100%', width: '100%' }} />}>
              <VehicleMiniMap livePosition={livePosition} />
            </Suspense>
          </div>
          <div className="vhcard-map-caption">
            <div>
              <b>{location}</b>
              <span>
                {motion}
                {view.lastFixAt ? ` · ${timeAgo(view.lastFixAt)}` : ''}
              </span>
            </div>
            <Link to={trackLink({ reg })}>Open map →</Link>
          </div>
        </div>
      </div>
      <div className="vhcard-vitals">
        {tiles.map((tile) => (
          <button key={tile.label} onClick={() => onGoTab(tile.tab)}>
            <span>{tile.label}</span>
            {overview.loading && !overview.data && ['fuel', 'telemetry'].includes(tile.tab) ? (
              <Skeleton style={{ width: '65%', height: 25 }} />
            ) : (
              <strong>{tile.value}</strong>
            )}
            <i>
              {tile.pct != null ? (
                <b style={{ width: `${Math.max(0, Math.min(100, tile.pct))}%` }} />
              ) : null}
            </i>
            <small>{tile.note}</small>
          </button>
        ))}
      </div>
      <OpenChallanBadge vehicleNumber={reg} />
      {fuelLogOpen ? (
        <Suspense fallback={<span role="status">Opening fuel log…</span>}>
          <AddFuelLogModal
            key={reg}
            open
            photoFirst
            registrationNumber={reg}
            vehicleId={vehicle?._id || vehicle?.id || reg}
            onClose={() => setFuelLogOpen(false)}
            onAdded={() => overview.refetch()}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
