import React from 'react';
import { bearingToRotation, markerTone } from '../../lib/vehicleMarker';

/**
 * VehicleMarker — the mandatory 2-D directional fallback for map trucks.
 * Renders heading (rotation), status tone (one of the four reserved signal
 * colours), and a registration label. Zero dependencies beyond React.
 *
 *   <VehicleMarker bearing={203} status="ACTIVE" registrationNumber="WB25W1040" />
 *
 * 3-D trucks (deck.gl ScenegraphLayer, ≤150 KB draco GLTF) replace this only
 * inside a lazy route-level chunk, never in the main bundle — this marker
 * stays as the fallback for unsupported devices and reduced motion.
 */
export default function VehicleMarker({ bearing = 0, status, isStale = false, alertSeverity, registrationNumber, selected = false, onClick }) {
  const tone = markerTone({ status, isStale, alertSeverity });
  const rotation = bearingToRotation(bearing);

  return (
    <button
      type="button"
      className={`vm vm--${tone} ${selected ? 'vm--selected' : ''}`}
      onClick={onClick}
      aria-label={registrationNumber ? `Vehicle ${registrationNumber}` : 'Vehicle'}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        {/* Cab + trailer silhouette pointing up (north) at rotation 0 */}
        <path
          d="M12 2 L17 12 L14.5 12 L14.5 21 L9.5 21 L9.5 12 L7 12 Z"
          className="vm-body"
        />
      </svg>
      {registrationNumber && (
        <span className="vm-label" style={{ transform: `rotate(${-rotation}deg)` }}>
          {registrationNumber}
        </span>
      )}
    </button>
  );
}
