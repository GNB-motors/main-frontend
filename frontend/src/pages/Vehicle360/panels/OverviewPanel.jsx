import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import { fleetViewService } from '../../../services/fleetViewService';
import { timeAgo } from '../../../utils/formatters';
import { viewOf } from '../../../utils/liveView';
import { trackLink } from '../../../utils/redesign/links';
import ReferenceOverviewMap from './overview/ReferenceOverviewMap';
import {
  DistanceCard,
  ServiceCard,
  DriverCard,
  DocumentsCard,
  FuelCard,
  RegistryCard,
} from './overview/ReferenceOverviewCards';
import { distanceSeries, monthWindow } from './overview/referenceOverviewModel';
import './overview/referenceOverview.css';

/** Card structure and measurements follow Vehicle Detail Sections.html. */
export default function OverviewPanel({
  reg,
  health,
  livePosition,
  prediction,
  documents,
  assignedDriver,
  fleetMaster,
  fleetEdge,
  ialert,
  coverage,
  telematicsProvider,
  onGoTab,
}) {
  const [range] = useState(() => monthWindow());
  const overview = useApi((signal) => FleetDataService.getVehicleOverview(reg, signal), [reg], {
    enabled: Boolean(reg),
    scopeKey: reg,
  });
  const track = useApi(
    (signal) => fleetViewService.getVehicleTrack(reg, { ...range, signal }),
    [reg, range.from, range.to],
    { enabled: Boolean(reg), scopeKey: reg },
  );
  const series = useMemo(
    () => distanceSeries(overview.data, track.data),
    [overview.data, track.data],
  );
  const view = viewOf(livePosition);
  const location =
    livePosition?.address ||
    livePosition?.area ||
    (livePosition?.latitude != null && livePosition?.longitude != null
      ? `${Number(livePosition.latitude).toFixed(4)}, ${Number(livePosition.longitude).toFixed(4)}`
      : 'Location not reported');
  const motion = {
    stopped: 'Parked',
    moving: 'Moving',
    idling: 'Idling',
    offline: 'Last known position',
  }[view.status];

  return (
    <PanelErrorBoundary name="vehicle-overview">
      <div className="vdo-overview">
        <div className="vdo-content">
          <div className="vdo-top-row">
            <DistanceCard
              series={series}
              prediction={prediction}
              overview={overview.data}
              loading={overview.loading || track.loading}
            />
            <section className="vdo-card vdo-location">
              <div className="vdo-location-head">
                <div>
                  <h3>{location}</h3>
                  <p>
                    {[
                      motion,
                      view.ignition != null ? `ignition ${view.ignition ? 'on' : 'off'}` : null,
                      view.lastFixAt ? timeAgo(view.lastFixAt) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Link className="vdo-link" to={trackLink({ reg, ...range })}>
                  Open in tracking →
                </Link>
              </div>
              <ReferenceOverviewMap
                track={track.data}
                livePosition={livePosition}
                series={series}
                loading={track.loading}
              />
            </section>
          </div>
          <div className="vdo-card-grid">
            <ServiceCard
              prediction={prediction}
              health={health}
              overview={overview.data}
              onGoTab={onGoTab}
            />
            <DriverCard driver={assignedDriver} />
            <DocumentsCard documents={documents} onGoTab={onGoTab} />
            <FuelCard
              overview={overview.data}
              health={health}
              fleetMaster={fleetMaster}
              ialert={ialert}
              onGoTab={onGoTab}
            />
          </div>
          <RegistryCard
            fleetMaster={fleetMaster}
            fleetEdge={fleetEdge}
            ialert={ialert}
            coverage={coverage}
            telematicsProvider={telematicsProvider}
            overview={overview.data}
          />
        </div>
      </div>
    </PanelErrorBoundary>
  );
}
