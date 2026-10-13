import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import UtilisationCard from './overview/UtilisationCard';
import WhatIsDueCard from './overview/WhatIsDueCard';
import FuelCard from './overview/FuelCard';
import DriverCard from './overview/DriverCard';
import ServicesCard from './overview/ServicesCard';
import ActivityCard from './overview/ActivityCard';
import InfoCard from './overview/InfoCard';

/**
 * Overview panel — "can this truck earn today, and what is stopping it".
 * Three cards: how much it has run, what it owes, and what it has burned.
 */
export default function OverviewPanel({
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
