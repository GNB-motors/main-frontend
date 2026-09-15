import { useParams, useSearchParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { Breadcrumbs, IdentityStrip, HeroRow, Tabs } from './vehicle360Header';
import { OverviewPanel } from './vehicle360PanelsA';
import {
  ServicePanel,
  FuelPanel,
  DocumentsPanel,
  TelemetryPanel,
  TripsPanel,
  DriversPanel,
} from './vehicle360PanelsB';
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

  const { data, loading, error } = useApi(
    (signal) => FleetDataService.getVehicleProfile(reg, signal),
    [reg],
  );
  const { data: healthDetail } = useApi(
    (signal) => FleetDataService.getVehicleHealth(reg, { days: 30 }, signal),
    [reg],
    { enabled: Boolean(data?.health) },
  );

  const p = data || {};
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

  if (error?.statusCode === 404 || error?.status === 404) {
    return (
      <div className="v360">
        <Breadcrumbs reg={reg} />
        <section className="v360-card">
          <p className="v360-card-title">Nothing on record for {reg}</p>
          <p className="v360-card-lede">
            This registration is not in the fleet master, the FleetEdge directory, or the
            live-status feed. Check the plate, or add the vehicle to the fleet first.
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
      </div>
    );
  }

  return (
    <div className="v360">
      <Breadcrumbs reg={reg} />

      <IdentityStrip
        reg={reg}
        fleetMaster={p.fleetMaster}
        fleetEdge={p.fleetEdge}
        livePosition={p.livePosition}
        prediction={p.prediction}
      />

      <HeroRow
        reg={reg}
        fleetMaster={p.fleetMaster}
        fleetEdge={p.fleetEdge}
        health={p.health}
        livePosition={p.livePosition}
        prediction={p.prediction}
        coverage={p.coverage}
        history={history}
      />

      <Tabs tabs={TABS} active={active} onChange={setActive} />

      {active === 'overview' ? (
        <OverviewPanel
          history={history}
          health={p.health}
          livePosition={p.livePosition}
          prediction={p.prediction}
          documents={p.fleetMaster?.documents}
          recentFuelLogs={p.recentFuelLogs}
          assignedDriver={p.assignedDriver}
          fleetMaster={p.fleetMaster}
          fleetEdge={p.fleetEdge}
          onGoTab={setActive}
        />
      ) : null}
      {active === 'service' ? (
        <ServicePanel prediction={p.prediction} health={p.health} history={history} />
      ) : null}
      {active === 'fuel' ? (
        <FuelPanel recentFuelLogs={p.recentFuelLogs} defBalance={p.defBalance} />
      ) : null}
      {active === 'documents' ? <DocumentsPanel documents={p.fleetMaster?.documents} /> : null}
      {active === 'trips' ? <TripsPanel /> : null}
      {active === 'drivers' ? (
        <DriversPanel vehicleId={p.fleetMaster?.id} assignedDriver={p.assignedDriver} />
      ) : null}
      {active === 'telemetry' ? (
        <TelemetryPanel health={p.health} livePosition={p.livePosition} history={history} />
      ) : null}
    </div>
  );
}
