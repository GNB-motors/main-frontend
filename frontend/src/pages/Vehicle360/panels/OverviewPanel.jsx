import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import UtilisationCard from './overview/UtilisationCard';
import WhatIsDueCard from './overview/WhatIsDueCard';
import FuelCard from './overview/FuelCard';
import DriverCard from './overview/DriverCard';
import ServicesCard from './overview/ServicesCard';
import TodayCard from './overview/TodayCard';

/**
 * Overview panel — "can this truck earn today, and what is stopping it".
 * Includes live shift vitals (TodayCard), distance utilisation, due obligations,
 * fuel economics with true mileage, driver duty details, and service progress.
 *
 * Rendered as an executive 2-row, 3-column balanced grid with equal-height cards.
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
  kmPerLitre,
  onGoTab,
}) {
  return (
    <PanelErrorBoundary name="vehicle-overview">
      <div className="v360-panel">
        {/* Row 1: Operations, Utilisation, Compliance */}
        <TodayCard health={health} livePosition={livePosition} />
        <UtilisationCard
          history={history}
          health={health}
          prediction={prediction}
          onGoTrips={() => onGoTab('trips')}
        />
        <WhatIsDueCard
          prediction={prediction}
          documents={documents}
          health={health}
          onGoTab={onGoTab}
        />

        {/* Row 2: Asset Health, Economics, Driver Duty */}
        <ServicesCard
          prediction={prediction}
          health={health}
          onGoService={() => onGoTab('service')}
        />
        <FuelCard
          recentFuelLogs={recentFuelLogs}
          kmPerLitre={kmPerLitre}
          onGoFuel={() => onGoTab('fuel')}
        />
        <DriverCard
          assignedDriver={assignedDriver}
          fleetMaster={fleetMaster}
          fleetEdge={fleetEdge}
        />
      </div>
    </PanelErrorBoundary>
  );
}
