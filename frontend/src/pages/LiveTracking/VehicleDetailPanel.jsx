import renderIconSvg from './renderIconSvg.jsx';
import { NOVA_STATUS } from './statusPalettes.js';
import { formatAgoText, formatFullStamp } from './minutesAgoFormat.js';
import DestinationIntentSection from './DestinationIntentSection.jsx';
import VehicleInfoSection from './VehicleInfoSection.jsx';
import DriverAssignmentSection from './DriverAssignmentSection.jsx';
import TelematicsDiagnosticsSection from './TelematicsDiagnosticsSection.jsx';
import WeatherSection from './WeatherSection.jsx';
import VehicleLocation from './VehicleLocation.jsx';
import VehicleMetricTiles from './VehicleMetricTiles.jsx';
import VehicleLayerToggles from './VehicleLayerToggles.jsx';
import useApi from '../../hooks/useApi.js';
import { getUserRole } from '../../utils/session.js';
import TrackTelemetryService from './TrackTelemetryService.js';
import vehicleMetricReadings from './vehicleMetricReadings.js';

export default function VehicleDetailPanel({
  selectedVehicle,
  setSelectedId,
  exitReplay,
  showToast,
  isTrailVisible,
  replayState,
  trailLoading,
  toggleTrail,
  enterReplay,
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
  const reg = selectedVehicle?.plate;
  const canReadHealth = ['OWNER', 'MANAGER'].includes(getUserRole());
  const { data: health } = useApi((signal) => TrackTelemetryService.getLatest(reg, signal), [reg], {
    enabled: Boolean(reg) && canReadHealth,
    scopeKey: reg,
  });
  const readings = vehicleMetricReadings(selectedVehicle || {}, health);

  return (
    <div
      className={`railview railview--detail ${selectedVehicle ? 'open' : ''}`}
      aria-live="polite"
    >
      {selectedVehicle && (
        <>
          <div className="dtop">
            <button className="backbtn" onClick={() => setSelectedId(null)}>
              {renderIconSvg('chevLeft', 16)}
              Fleet
            </button>
            <div className="dtop-statuses">
              <span className={`gps-status ${selectedVehicle.gps === 'Active' ? 'is-active' : ''}`}>
                {renderIconSvg('nav', 13)}
                {selectedVehicle.gps === 'Active' ? 'GPS active' : 'No GPS fix'}
              </span>
              <span
                className={`ignition-status ${selectedVehicle.ignition === 'ON' ? 'is-active' : ''}`}
              >
                {renderIconSvg('zap', 13)}
                Ignition {selectedVehicle.ignition || '—'}
              </span>
            </div>
            <button
              className="dclose"
              aria-label="Close"
              onClick={() => {
                setSelectedId(null);
                exitReplay();
              }}
            >
              {renderIconSvg('x', 16)}
            </button>
          </div>

          <div className="dbody">
            {/* Vehicle Hero Header */}
            <div className="dhead">
              <div className="dtile">{renderIconSvg('truck', 22)}</div>
              <div className="dtitle">
                <div className="plate">{selectedVehicle.plate}</div>
                <div className="model">
                  <span>Model:</span> {selectedVehicle.model || '—'}
                </div>
                <div className="model">
                  <span>VIN:</span> <code>{selectedVehicle.vin || '—'}</code>
                </div>
              </div>
            </div>

            <div className="statusrow">
              {(() => {
                const s = NOVA_STATUS[selectedVehicle.status] || NOVA_STATUS.offline;
                return (
                  <span className="status" style={{ '--tint': s.tint, '--c': s.c }}>
                    <i />
                    {s.label} · {s.trip}
                  </span>
                );
              })()}
            </div>

            {/* Metric Tiles */}
            <VehicleMetricTiles vehicle={selectedVehicle} readings={readings} />

            {/* Location and Last Update Lines */}
            <div className="dlist">
              <div className="dline">
                <div>
                  <VehicleLocation vehicle={selectedVehicle} showMap />
                </div>
              </div>

              <div className="dline">
                {renderIconSvg('clock', 18)}
                <div>
                  <b>
                    {selectedVehicle.ago != null
                      ? formatFullStamp(selectedVehicle.ago)
                      : 'No recent report'}
                  </b>
                  Last update ·{' '}
                  {selectedVehicle.ago != null ? formatAgoText(selectedVehicle.ago) : '—'}
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="dactions">
              <button
                className="act"
                aria-pressed={isTrailVisible && !replayState.on}
                disabled={trailLoading}
                onClick={() => toggleTrail(selectedVehicle)}
              >
                {renderIconSvg('route', 18)}
                Trail
              </button>

              <button
                className="act"
                aria-pressed={replayState.on}
                disabled={trailLoading}
                onClick={() => enterReplay(selectedVehicle)}
              >
                {renderIconSvg('play', 18)}
                Replay
              </button>

              <button
                className="act"
                disabled={shareCreating}
                onClick={() => handleShareVehicle(selectedVehicle)}
              >
                {renderIconSvg('share', 18)}
                Share
              </button>
            </div>

            {setSegmentByTrip && toggleHabitualHalts && (
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
            )}

            {/* Deep Details Accordion Sections */}
            <div className="sections">
              <WeatherSection
                weather={weather}
                loading={weatherLoading}
                contextLabel={weatherContext}
              />
              <DestinationIntentSection registrationNumber={selectedVehicle.plate} />
              <VehicleInfoSection selectedVehicle={selectedVehicle} odometer={readings.odometer} />
              <DriverAssignmentSection selectedDriver={selectedDriver} />
              <TelematicsDiagnosticsSection
                selectedVehicle={selectedVehicle}
                showToast={showToast}
                odometer={readings.odometer}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
