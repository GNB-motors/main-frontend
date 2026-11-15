import OverviewSkeleton from './panels/overview/OverviewSkeleton';
import './panels/overview/referenceOverview.css';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { Breadcrumbs } from './vehicle360Header';
import VehicleHeaderCard from './VehicleHeaderCard';
import { Tabs } from './vehicle360Tabs';
import OverviewPanel from './panels/OverviewPanel';
import ServicePanel from './panels/ServicePanel';
import FuelPanel from './panels/FuelPanel';
import DocumentsPanel from './panels/DocumentsPanel';
import TelemetryPanel from './panels/TelemetryPanel';
import TyresPanel from './panels/TyresPanel';
import TripsPanel from './panels/TripsPanel';
import DriversPanel from './panels/DriversPanel';
import './vehicle360.css';

/**
 * Vehicle 360 — the canonical page for one vehicle, built to the
 * "GNB Vehicle Detail v2" design.
 *
 * Shape: breadcrumb → identity strip → hero (orbitable 3-D truck, its live
 * readings, three rings, registry) → tabs. Every figure is traceable to a
 * reading; where a reading is missing the card says so rather than filling the
 * space with a plausible-looking dial.
 */

export default function Vehicle360Page() {
  const { registrationNumber } = useParams();
  const reg = decodeURIComponent(registrationNumber || '').toUpperCase();

  const [searchParams, setSearchParams] = useSearchParams();

  const { data, loading, error, refetch } = useApi(
    (signal) => FleetDataService.getVehicleProfile(reg, signal),
    [reg],
    { scopeKey: reg },
  );
  const { data: healthDetail } = useApi(
    (signal) => FleetDataService.getVehicleHealth(reg, { days: 30 }, signal),
    [reg],
    { enabled: Boolean(data?.health) && !error, scopeKey: reg },
  );

  const p = error ? {} : data || {};
  const history = (healthDetail?.history || []).map((h) => ({
    t: h.pulledAt
      ? new Date(h.pulledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : '',
    engineHours: h.engineRunHour,
    odo: h.canOdo,
  }));

  const TABS = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'service', label: 'Service' },
    { id: 'fuel', label: 'Fuel', count: p.recentFuelLogs?.length ?? null },
    { id: 'documents', label: 'Documents', count: p.fleetMaster?.documents?.length ?? null },
    { id: 'trips', label: 'Trips' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'tyres', label: 'Tyres & Axles' },
  ];

  // Tab lives in the URL so a vehicle view is shareable and the back button works.
  const requested = searchParams.get('tab');
  const active = TABS.some((t) => t.id === requested) ? requested : 'overview';
  const setActive = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'overview') next.delete('tab');
    else next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  if (error?.status === 404) {
    return (
      <div className="v360">
        <Breadcrumbs
          reg={reg}
          lastSyncAt={
            p.livePosition?.view?.lastFixAt || p.livePosition?.eventDateTime || p.health?.pulledAt
          }
        />
        <section className="v360-card">
          <p className="v360-card-title">Vehicle unavailable — {reg}</p>
          <p className="v360-card-lede">
            This vehicle is not available in your registered fleet or selected location. Check the
            plate and location, or onboard the vehicle first.
          </p>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <Link to="/vehicles" className="v360-btn v360-btn--primary">
              All vehicles
            </Link>
            <Link to="/vehicles/add" className="v360-btn">
              Add a vehicle
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="v360">
        <Breadcrumbs reg={reg} />
        <div className="v360-idstrip" style={{ height: 88 }} />
        <div className="v360-hero">
          <div className="v360-modelcard" style={{ height: 424 }} />
          <div className="v360-registry" style={{ height: 424 }} />
        </div>
        <OverviewSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="v360">
        <Breadcrumbs reg={reg} />
        <section className="v360-card" role="alert">
          <p className="v360-card-title">Could not load vehicle</p>
          <p className="v360-card-lede">
            {error.displayMessage || error.message || 'Try refreshing this vehicle.'}
          </p>
          <button className="v360-btn" onClick={refetch}>
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="v360">
      <Breadcrumbs reg={reg} />

      <VehicleHeaderCard reg={reg} profile={p} onGoTab={setActive} />

      <Tabs tabs={TABS} active={active} onChange={setActive} />

      {active === 'overview' ? (
        <OverviewPanel
          reg={reg}
          ialert={p.ialert}
          coverage={p.coverage}
          telematicsProvider={p.telematicsProvider}
          vehicleId={p.fleetMaster?.id}
          history={history}
          health={p.health}
          livePosition={p.livePosition}
          prediction={p.prediction}
          documents={p.fleetMaster?.documents}
          recentFuelLogs={p.recentFuelLogs}
          assignedDriver={p.assignedDriver}
          fleetMaster={p.fleetMaster}
          fleetEdge={p.fleetEdge}
          kmPerLitre={p.kmPerLitre}
          onGoTab={setActive}
        />
      ) : null}
      {active === 'service' ? (
        <ServicePanel
          prediction={p.prediction}
          health={p.health}
          history={history}
          vehicleId={p.fleetMaster?.id}
          registrationNumber={reg}
          livePosition={p.livePosition}
        />
      ) : null}
      {active === 'fuel' ? (
        <FuelPanel
          registrationNumber={reg}
          onGoTab={setActive}
          recentFuelLogs={p.recentFuelLogs}
          defBalance={p.defBalance}
          health={p.health}
          prediction={p.prediction}
          kmPerLitre={p.kmPerLitre}
          fleetMaster={p.fleetMaster}
          fleetEdge={p.fleetEdge}
          ialert={p.ialert}
        />
      ) : null}
      {active === 'documents' ? (
        <DocumentsPanel
          vehicleId={p.fleetMaster?.id}
          documents={p.fleetMaster?.documents}
          onChanged={refetch}
        />
      ) : null}
      {active === 'trips' ? (
        <TripsPanel vehicleId={p.fleetMaster?.id} registrationNumber={reg} />
      ) : null}
      {active === 'drivers' ? (
        <DriversPanel
          recentAlerts={p.recentAlerts}
          safetyToday={p.safetyToday}
          vehicleId={p.fleetMaster?.id}
          assignedDriver={p.assignedDriver}
          health={p.health}
          livePosition={p.livePosition}
        />
      ) : null}
      {active === 'telemetry' ? (
        <TelemetryPanel
          registrationNumber={reg}
          assignedDriver={p.assignedDriver}
          health={p.health}
          prediction={p.prediction}
          livePosition={p.livePosition}
          history={history}
          fleetMaster={p.fleetMaster}
          fleetEdge={p.fleetEdge}
        />
      ) : null}
      {active === 'tyres' ? (
        <TyresPanel
          fleetMaster={p.fleetMaster}
          fleetEdge={p.fleetEdge}
          health={p.health}
          ialert={p.ialert}
          tyres={p.tyres}
        />
      ) : null}
    </div>
  );
}
