import renderIconSvg from './renderIconSvg.jsx';
import { NOVA_STATUS } from './statusPalettes.js';
import { formatAgoText, formatFullStamp } from './minutesAgoFormat.js';
import DestinationIntentSection from './DestinationIntentSection.jsx';
import RecordedPathSection from './RecordedPathSection.jsx';
import VehicleInfoSection from './VehicleInfoSection.jsx';
import DriverAssignmentSection from './DriverAssignmentSection.jsx';
import TelematicsDiagnosticsSection from './TelematicsDiagnosticsSection.jsx';

export default function VehicleDetailPanel({
  selectedVehicle,
  setSelectedId,
  exitReplay,
  showToast,
  mapRef,
  isTrailVisible,
  replayState,
  trailLoading,
  toggleTrail,
  enterReplay,
  shareCreating,
  handleShareVehicle,
  trailPoints,
  trailKm,
  selectedDriver,
}) {
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
            <span style={{ flex: 1 }} />
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
                  {selectedVehicle.model || 'Model n/a'}
                  {selectedVehicle.vin ? (
                    <>
                      {' · '}
                      <code>#{selectedVehicle.vin}</code>
                    </>
                  ) : null}
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
            <div className="metrics">
              <div className="metric">
                {renderIconSvg('fuel', 18)}
                <div>
                  <div className="k">Fuel</div>
                  <div className="v">
                    {selectedVehicle.fuel != null ? `${selectedVehicle.fuel} L` : '—'}
                  </div>
                </div>
              </div>

              <div className="metric">
                {renderIconSvg('zap', 18)}
                <div>
                  <div className="k">Ignition</div>
                  <div className={`v ${selectedVehicle.ignition === 'ON' ? 'ok' : 'off'}`}>
                    {selectedVehicle.ignition}
                  </div>
                </div>
              </div>

              <div className="metric">
                {renderIconSvg('nav', 18)}
                <div>
                  <div className="k">GPS</div>
                  <div className={`v ${selectedVehicle.gps === 'Active' ? 'ok' : 'off'}`}>
                    {selectedVehicle.gps}
                  </div>
                </div>
              </div>

              <div className="metric">
                {renderIconSvg('gauge', 18)}
                <div>
                  <div className="k">Speed</div>
                  <div className="v">
                    {selectedVehicle.speed != null ? `${selectedVehicle.speed} km/h` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Location and Last Update Lines */}
            <div className="dlist">
              <div className="dline">
                {renderIconSvg('pin', 18)}
                <div>
                  <b>{selectedVehicle.area || 'No location fix'}</b>
                  {selectedVehicle.hasFix
                    ? `${selectedVehicle.lat.toFixed(4)}, ${selectedVehicle.lng.toFixed(4)}`
                    : 'GPS position unavailable'}
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
                disabled={!selectedVehicle.hasFix}
                onClick={() => {
                  if (!selectedVehicle.hasFix) {
                    showToast(`No GPS fix for ${selectedVehicle.plate}`);
                    return;
                  }
                  mapRef.current?.panTo({
                    lat: selectedVehicle.lat,
                    lng: selectedVehicle.lng,
                  });
                  mapRef.current?.setZoom(14);
                  showToast(`Focused on ${selectedVehicle.plate}`);
                }}
              >
                {renderIconSvg('pin', 18)}
                Focus
              </button>

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

            {/* Deep Details Accordion Sections */}
            <div className="sections">
              <DestinationIntentSection registrationNumber={selectedVehicle.registrationNumber} />
              <RecordedPathSection
                isTrailVisible={isTrailVisible}
                trailPoints={trailPoints}
                trailKm={trailKm}
              />
              <VehicleInfoSection selectedVehicle={selectedVehicle} />
              <DriverAssignmentSection selectedDriver={selectedDriver} />
              <TelematicsDiagnosticsSection
                selectedVehicle={selectedVehicle}
                showToast={showToast}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
