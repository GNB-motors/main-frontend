import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import EmptyState from '../../components/cluster/EmptyState';
import FreshnessBadge from '../../components/cluster/FreshnessBadge';
import PageShell from '../../components/ui/PageShell';
import { HealthPanel, IdentityPanel, PositionPanel, DefLedgerPanel } from './vehicle360PanelsA';
import {
  ServicePredictionPanel,
  DocumentsPanel,
  EngineTrendPanel,
  FuelLogsPanel,
} from './vehicle360PanelsB';

export default function Vehicle360Page() {
  const { registrationNumber } = useParams();
  const reg = decodeURIComponent(registrationNumber || '').toUpperCase();

  const { data, loading, error } = useApi(
    (signal) => FleetDataService.getVehicleProfile(reg, signal),
    [reg],
  );
  const { data: healthDetail } = useApi(
    (signal) => FleetDataService.getVehicleHealth(reg, { days: 30 }, signal),
    [reg],
    { enabled: Boolean(data?.health) },
  );

  if (error?.statusCode === 404 || error?.status === 404) {
    return (
      <div className="cluster-page">
        <PageShell
          title={reg}
          actions={
            <Link
              to="/vehicles"
              className="text-dim inline-flex items-center gap-1.5 text-xs hover:opacity-70"
            >
              <ArrowLeft size={13} /> All vehicles
            </Link>
          }
        >
          <EmptyState
            title={`Nothing on record for ${reg}`}
            hint="This vehicle isn't in the fleet master, the FleetEdge directory, or the live-status feed. Check the registration, or add the vehicle to the fleet first."
          />
        </PageShell>
      </div>
    );
  }

  const p = data || {};
  const health = p.health;
  const history = (healthDetail?.history || []).map((h) => ({
    t: h.pulledAt
      ? new Date(h.pulledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : '',
    engineHours: h.engineRunHour,
    odo: h.canOdo,
  }));

  return (
    <div className="cluster-page">
      <PageShell
        title={
          <>
            <span className="reg-plate text-base">{reg}</span>
            {p.fleetMaster?.status ? (
              <span
                className={`lamp ${p.fleetMaster.status === 'ON_TRIP' ? 'lamp--caution' : 'lamp--ok'}`}
                style={{ marginLeft: 10 }}
              >
                {String(p.fleetMaster.status).replace('_', ' ').toLowerCase()}
              </span>
            ) : null}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/vehicles"
              className="text-dim inline-flex items-center gap-1.5 text-xs hover:opacity-70"
            >
              <ArrowLeft size={13} /> Fleet
            </Link>
            {p.coverage && (
              <span className="text-dim text-[11px]">
                {[
                  p.coverage.inFleetMaster ? 'fleet master' : null,
                  p.coverage.inFleetEdge ? 'FleetEdge' : null,
                  p.coverage.hasLiveStatus ? 'live status' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'no sources'}
              </span>
            )}
            {health ? <FreshnessBadge at={health.pulledAt} always prefix="Telemetry" /> : null}
          </div>
        }
      >
        {loading && !data ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="cluster-panel h-52 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <HealthPanel health={health} />
            <IdentityPanel fleetMaster={p.fleetMaster} fleetEdge={p.fleetEdge} />
            <PositionPanel livePosition={p.livePosition} />
            <DefLedgerPanel defBalance={p.defBalance} />
            <ServicePredictionPanel prediction={p.prediction} />
            <DocumentsPanel documents={p.fleetMaster?.documents} />
            <EngineTrendPanel history={history} />
            <FuelLogsPanel recentFuelLogs={p.recentFuelLogs} />
          </div>
        )}
      </PageShell>
    </div>
  );
}
