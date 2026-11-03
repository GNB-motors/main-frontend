import { useEffect } from 'react';
import renderIconSvg from './renderIconSvg.jsx';
import VehiclePanelHeader from './VehiclePanelHeader.jsx';
import VehicleReadingTiles from './VehicleReadingTiles.jsx';
import VehicleNowCard from './VehicleNowCard.jsx';
import WhereNextSection from './WhereNextSection.jsx';
import InsightChipsSection from './InsightChipsSection.jsx';
import VehicleIssuesSection from './VehicleIssuesSection.jsx';
import VehicleDriverSection from './VehicleDriverSection.jsx';
import HelpNearbySection from './HelpNearbySection.jsx';
import VehicleDetailsCard from './VehicleDetailsCard.jsx';
import VehicleAccountBanner from './VehicleAccountBanner.jsx';
import VehiclePanelActions from './VehiclePanelActions.jsx';
import WeatherSection from './WeatherSection.jsx';
import VehicleLayerToggles from './VehicleLayerToggles.jsx';
import useApi from '../../hooks/useApi.js';
import { fleetViewService } from '../../services/fleetViewService';
import { fallbackNow } from './vehiclePanelModel';

/**
 * VehicleDetailPanel — what the owner needs to know about one truck.
 *
 * The order is the order of the owner's questions: what truck is this and
 * is the data live; what is it doing now; where is it going; is it doing
 * well; who is driving; who can help.
 *
 * The data comes from `/now`. That endpoint is not on prod yet, so until it
 * is, the panel reads the release's position row through the same view
 * model — every section then shows its own honest empty state.
 */
export default function VehicleDetailPanel({
  selectedVehicle,
  setSelectedId,
  exitReplay,
  isTrailVisible,
  shareCreating,
  handleShareVehicle,
  selectedDriver,
  weather,
  weatherLoading,
  weatherContext,
  segmentByTrip = true,
  setSegmentByTrip,
  isHabitualHaltsVisible = false,
  habitualHaltsLoading = false,
  toggleHabitualHalts,
  habitualHalts = [],
}) {
  const reg = selectedVehicle?.plate ?? null;

  const { data, error, refetch } = useApi(
    (signal) => fleetViewService.getVehicleNow(reg, { signal }),
    [reg],
    { enabled: Boolean(reg), scopeKey: reg },
  );

  // The panel refreshes itself every minute while it is open, so a truck
  // that just moved does not look frozen.
  useEffect(() => {
    if (!reg) return undefined;
    const timer = setInterval(refetch, 60000);
    return () => clearInterval(timer);
  }, [reg, refetch]);

  // Until the new endpoint is deployed, the release's position row is the
  // fallback — mapped into the very same view model.
  const notDeployed = error?.status === 404;
  const now = data?.held === true ? null : (data ?? fallbackNow(selectedVehicle, selectedDriver));

  return (
    <div
      className={`railview railview--detail ${selectedVehicle ? 'open' : ''}`}
      aria-live="polite"
    >
      {selectedVehicle && (
        <>
          <div className="dtop">
            <button
              className="backbtn"
              onClick={() => {
                setSelectedId(null);
                exitReplay();
              }}
            >
              {renderIconSvg('chevLeft', 16)}
              Fleet
            </button>
          </div>

          <div className="dbody">
            <VehicleAccountBanner account={notDeployed ? null : (now?.account ?? null)} />

            <VehiclePanelHeader now={now} account={now?.account ?? null} />

            <VehicleReadingTiles now={now} />

            <VehiclePanelActions
              registrationNumber={reg}
              onShare={() => handleShareVehicle(selectedVehicle)}
              shareCreating={shareCreating}
            />

            <VehicleNowCard now={now} vehicle={selectedVehicle} />

            <WhereNextSection registrationNumber={reg} />

            <InsightChipsSection chips={now?.chips ?? []} registrationNumber={reg} />

            <VehicleIssuesSection issues={now?.issues ?? []} registrationNumber={reg} />

            <VehicleDriverSection driver={now?.driver ?? null} />

            <HelpNearbySection nearbyHelp={now?.nearbyHelp ?? []} />

            <VehicleDetailsCard now={now} />

            <div className="sections">
              <WeatherSection
                weather={weather}
                loading={weatherLoading}
                contextLabel={weatherContext}
              />
            </div>

            {setSegmentByTrip && toggleHabitualHalts ? (
              <VehicleLayerToggles
                selectedVehicle={selectedVehicle}
                isTrailVisible={isTrailVisible}
                segmentByTrip={segmentByTrip}
                setSegmentByTrip={setSegmentByTrip}
                isHabitualHaltsVisible={isHabitualHaltsVisible}
                habitualHaltsLoading={habitualHaltsLoading}
                toggleHabitualHalts={toggleHabitualHalts}
                habitualHalts={habitualHalts}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
