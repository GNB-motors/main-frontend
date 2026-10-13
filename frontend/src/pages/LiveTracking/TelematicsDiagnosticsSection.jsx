import renderIconSvg from './renderIconSvg.jsx';
import copyText from './copyText.js';

export default function TelematicsDiagnosticsSection({ selectedVehicle, showToast }) {
  return (
    <details className="sec" open>
      <summary>
        {renderIconSvg('zap', 16)}
        Live Telematics &amp; Diagnostics
        <span className="chev">{renderIconSvg('chevDown', 16)}</span>
      </summary>
      <div className="secbody">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            width: '100%',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Odometer
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#F1F5F9',
                marginTop: '2px',
              }}
            >
              {selectedVehicle.odo != null
                ? `${Number(selectedVehicle.odo).toLocaleString('en-IN')} km`
                : 'Odo N/A'}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Heading / Course
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#F1F5F9',
                marginTop: '2px',
              }}
            >
              {selectedVehicle.courseDegrees != null
                ? `${Math.round(selectedVehicle.courseDegrees)}°`
                : '0° N'}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Telematics State
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: selectedVehicle.live ? '#4ADE80' : '#94A3B8',
                marginTop: '2px',
              }}
            >
              {selectedVehicle.live ? '● Connected' : '○ Standby'}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              GPS Coordinates
            </div>
            <button
              type="button"
              style={{
                // reset the button chrome so it reads as the value line it replaced
                display: 'block',
                width: '100%',
                padding: 0,
                border: 0,
                background: 'none',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: '11px',
                fontWeight: 500,
                color: '#38BDF8',
                marginTop: '3px',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
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
