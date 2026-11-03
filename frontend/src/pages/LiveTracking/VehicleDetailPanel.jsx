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
import TrackIdlingChip from './TrackIdlingChip.jsx';
import DestinationIntentSection from './DestinationIntentSection.jsx';
import AddHere from '../PlaceHub/drawer/AddHere.jsx';
import { Link } from 'react-router-dom';
import { fallbackNow } from './vehiclePanelModel';

/**
 * VehicleDetailPanel — what the owner needs to know about one truck.
 *
 * The order is the order of the owner's questions: what truck is this and
 * is the data live; what is it doing now; where is it going; is it doing
 * well; who is driving; who can help.
 *
 * The data comes from the live stream row for the truck, mapped into the
 * panel's view model — every section then shows its own honest empty state.
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
  idlingMinutes = null,
  vehicleAlerts = [],
  showIntent = false,
  canEditPlaces = false,
  onAddAtSpot = null,
}) {
  const reg = selectedVehicle?.plate ?? null;

  // The live stream already carries the position row, so the panel reads it
  // straight from there — no second endpoint to keep alive.
  const now = fallbackNow(selectedVehicle, selectedDriver);

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
            <VehicleAccountBanner account={now?.account ?? null} />

            <VehiclePanelHeader now={now} account={now?.account ?? null} />

            {idlingMinutes ? (
              <div className="mb-2">
                <TrackIdlingChip minutes={idlingMinutes} />
              </div>
            ) : null}

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

            {vehicleAlerts.length ? (
              <section className="flex flex-col gap-1.5">
                <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">
                  Alerts · {vehicleAlerts.length}
                </h3>
                {vehicleAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id || alert._id}
                    className="rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-2.5"
                  >
                    <span className="block text-[12px] font-semibold text-[var(--rd-ink)]">
                      {alert.severity ? String(alert.severity).toUpperCase() : 'Alert'}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[var(--rd-ink-2)]">
                      {alert.type || alert.message || alert.title || 'Alert'}
                    </span>
                  </div>
                ))}
                <Link
                  to="/alert-inbox"
                  className="text-[12px] font-medium text-[var(--rd-brand-2)] no-underline hover:underline"
                >
                  Open the alert inbox →
                </Link>
              </section>
            ) : null}

            {canEditPlaces && onAddAtSpot && Number.isFinite(selectedVehicle?.lat) ? (
              <AddHere
                canEdit={canEditPlaces}
                onAdd={onAddAtSpot}
                center={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                name={reg}
              />
            ) : null}

            <VehicleDriverSection driver={now?.driver ?? null} />

            <HelpNearbySection nearbyHelp={now?.nearbyHelp ?? []} />

            <VehicleDetailsCard now={now} />

            <div className="sections">
              {showIntent ? <DestinationIntentSection registrationNumber={reg} /> : null}
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
