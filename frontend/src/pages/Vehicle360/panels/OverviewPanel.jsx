import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import UtilisationCard from './overview/UtilisationCard';
import WhatIsDueCard from './overview/WhatIsDueCard';
import FuelCard from './overview/FuelCard';
import DriverCard from './overview/DriverCard';
import ServicesCard from './overview/ServicesCard';
import ActivityCard from './overview/ActivityCard';
import InfoCard from './overview/InfoCard';
import AttributionPanel from './AttributionPanel';
import DriverAttributionPanel from './DriverAttributionPanel';

/**
 * Overview panel — "can this truck earn today, and what is stopping it".
 * Three cards: how much it has run, what it owes, and what it has burned.
 * Plus the attribution card, which says whether a fuel gap is the truck or the
 * driver and shows the evidence either way.
 */
export default function OverviewPanel({
  vehicleId,
  history,
  health,
  livePosition,
  prediction,
  documents,
  recentFuelLogs,
  assignedDriver,
  fleetMaster,
  fleetEdge,
  onGoTab,
}) {
  return (
    <PanelErrorBoundary name="vehicle-overview">
      <div className="v360-panel">
        <AttributionPanel vehicleId={vehicleId} />
        {/* The driver's own card, so the truck card's "driver" verdict can be
            read against the driver's own view of the same history. */}
        <DriverAttributionPanel
          driverId={assignedDriver?.id || assignedDriver?._id || assignedDriver?.driverId}
        />
        <UtilisationCard history={history} health={health} onGoTrips={() => onGoTab('trips')} />
        <WhatIsDueCard
          prediction={prediction}
          documents={documents}
          health={health}
          onGoTab={onGoTab}
        />
        <FuelCard recentFuelLogs={recentFuelLogs} onGoFuel={() => onGoTab('fuel')} />
        <DriverCard
          assignedDriver={assignedDriver}
          fleetMaster={fleetMaster}
          fleetEdge={fleetEdge}
          health={health}
          livePosition={livePosition}
        />
        <ServicesCard prediction={prediction} />
        <ActivityCard history={history} />
        <InfoCard documents={documents} onGoDocuments={() => onGoTab('documents')} />
      </div>
    </PanelErrorBoundary>
  );
}
