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
import { formatDuration } from '../../utils/redesign/format';
import { toISTDateString } from '../../utils/dateUtils';
import { Skeleton } from '../../components/ui/skeleton';
import VehiclePositionLabel from './VehiclePositionLabel';
import OpenChallanBadge from '../Compliance/OpenChallanBadge';
import './panels/overview/referenceOverview.css';
import './vehicleHeaderCard.css';

const VehicleMiniMap = lazy(() => import('./VehicleMiniMap'));
const AddBillPhotoDialog = lazy(() => import('../Mileage/AddBillPhotoDialog'));

export default function VehicleHeaderCard({
  reg,
  profile,
  onGoTab,
  overview: sharedOverview,
  refreshOverview,
}) {
  const [specsOpen, setSpecsOpen] = useState(false);
  const [fuelLogOpen, setFuelLogOpen] = useState(false);
  const { fleetMaster: vehicle, fleetEdge, ialert, livePosition, health, prediction } = profile;
  const overview = useApi((signal) => FleetDataService.getVehicleOverview(reg, signal), [reg], {
    enabled: Boolean(reg) && !sharedOverview,
    scopeKey: reg,
    dedupeKey: `vehicle-overview:${reg}`,
  });
  const overviewData = sharedOverview ?? overview.data;
  // With a shared overview the local read is off, so the page's own refetch is
  // what refreshes the header's fuel, DEF and odometer tiles.
  const refreshHeader = () => {
    if (sharedOverview) {
      refreshOverview?.();
      return;
    }
    overview.refetch();
  };
  const [fuel, def] = fluidLevels(overviewData, health, vehicle, ialert);
  const view = viewOf(livePosition);
  const axles = vehicleAxles(vehicle);
  const svc = serviceState(prediction, health);
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
  const day = toISTDateString(new Date());
  const dailyDistance = overviewData?.days?.find((entry) => entry.day === day);
  const today = overviewData?.today?.day === day ? overviewData.today : null;
  const distance = numeric(dailyDistance?.engineKm) ?? numeric(dailyDistance?.gpsKm);
  const facts = [
    ['Distance today', distance == null ? 'Not measured' : formatKm(distance)],
    [
      'Idling today',
      numeric(today?.idleMin) == null ? 'Not measured' : formatDuration(today.idleMin),
    ],
    [
      'Diesel used today',
      numeric(today?.dieselUsedL) == null ? 'Not measured' : formatLitres(today.dieselUsedL),
    ],
    ['Assigned driver', profile.assignedDriver?.name || 'Not assigned'],
  ];
  const motion =
    { moving: 'Moving', stopped: 'Parked', idling: 'Idling', offline: 'Offline' }[view.status] ||
    'Status unavailable';
  const docs = vehicle?.documents;
  const specs = [
    ['Fleet availability', vehicle?.status ? String(vehicle.status).replace(/_/g, ' ') : null],
    ['Chassis / VIN', vehicle?.chassisNumber || fleetEdge?.vin],
    ['Axles', axles],
    ['Axle class', vehicle?.axleClass],
    ['Body', vehicle?.bodyType],
    ['Gross vehicle mass', vehicle?.gvm != null ? `${formatNum(vehicle.gvm)} kg` : null],
    ['Manufacture year', vehicle?.manufactureYear],
    ['Registration state', vehicle?.registrationState],
    ['Device', overviewData?.deviceId || ialert?.obuId],
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
        numeric(overviewData?.odometer?.value) != null
          ? formatKm(overviewData.odometer.value)
          : health?.canOdo != null
            ? formatKm(health.canOdo)
            : '—',
      note: overviewData?.odometer?.at
        ? `Read ${timeAgo(overviewData.odometer.at)}`
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
        <section className="vhcard-day" aria-label="Today’s truck activity">
          <h2>Today</h2>
          <dl>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="vhcard-map">
          <div className="vhcard-map-canvas">
            <Suspense fallback={<Skeleton style={{ height: '100%', width: '100%' }} />}>
              <VehicleMiniMap livePosition={livePosition} />
            </Suspense>
          </div>
          <div className="vhcard-map-caption">
            <div>
              <b>
                <VehiclePositionLabel position={livePosition} />
              </b>
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
            {overview.loading && !overviewData && ['fuel', 'telemetry'].includes(tile.tab) ? (
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
          <AddBillPhotoDialog
            key={reg}
            open
            registrationNumber={reg}
            vehicleId={vehicle?._id || vehicle?.id || ''}
            onOpenChange={setFuelLogOpen}
            onConfirmed={() => refreshHeader()}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
