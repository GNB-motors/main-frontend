import renderIconSvg from './renderIconSvg.jsx';
import copyText from './copyText.js';
import vehicleMetricReadings from './vehicleMetricReadings.js';

export default function TelematicsDiagnosticsSection({ selectedVehicle, showToast, odometer }) {
  return (
    <details className="sec lt-diagnostics" open>
      <summary>
        {renderIconSvg('zap', 16)}
        Live Telematics &amp; Diagnostics
        <span className="chev">{renderIconSvg('chevDown', 16)}</span>
      </summary>
      <div className="secbody">
        <div className="lt-diagnostics-grid">
          <div className="lt-diagnostic">
            <div className="lt-diagnostic-label">Odometer</div>
            <div className="lt-diagnostic-value">
              {odometer ?? vehicleMetricReadings(selectedVehicle).odometer}
            </div>
          </div>
          <div className="lt-diagnostic">
            <div className="lt-diagnostic-label">Heading / Course</div>
            <div className="lt-diagnostic-value">
              {selectedVehicle.courseDegrees != null
                ? `${Math.round(selectedVehicle.courseDegrees)}°`
                : '—'}
            </div>
          </div>
          <div className="lt-diagnostic">
            <div className="lt-diagnostic-label">Telematics State</div>
            <div className="lt-diagnostic-value lt-diagnostic-state">
              <i className={selectedVehicle.live ? 'is-live' : ''} aria-hidden="true" />
              {selectedVehicle.live ? 'Connected' : 'Standby'}
            </div>
          </div>
          <div className="lt-diagnostic">
            <div className="lt-diagnostic-label">GPS Coordinates</div>
            <button
              type="button"
              className="lt-diagnostic-value lt-diagnostic-coords"
              disabled={!selectedVehicle.hasFix}
              title="Click to copy coordinates"
              onClick={() => {
                if (selectedVehicle.hasFix) {
                  copyText(`${selectedVehicle.lat}, ${selectedVehicle.lng}`).then(
                    () => showToast('Coordinates copied to clipboard'),
                    () => showToast('Could not copy the coordinates'),
                  );
                }
              }}
            >
              {selectedVehicle.hasFix
                ? `${selectedVehicle.lat.toFixed(4)}, ${selectedVehicle.lng.toFixed(4)}`
                : 'No fix'}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
