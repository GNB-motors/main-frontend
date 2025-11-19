import React from 'react';
import './SplitTripConfirmationDialog.css';

const SplitTripConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  overlapData,
  newReceiptDate,
  newReceiptVolume,
  isProcessing,
  progress = []
}) => {
  if (!open || !overlapData || !overlapData.overlap_detected) {
    return null;
  }

  const { original_trip } = overlapData;

  return (
    <div className="split-dialog-overlay" onClick={onClose}>
      <div className="split-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="split-dialog-header">
          <div className="warning-icon">⚠️</div>
          <h2>Trip Split Required</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="split-dialog-content">
          <div className="alert-warning">
            <p>
              The receipt you're uploading falls within an existing trip. 
              This trip will be automatically split into two separate trips.
            </p>
          </div>

          {/* Current Trip Info */}
          <div className="trip-section">
            <h3 className="section-title error">Current Trip (Will be Deleted)</h3>
            <div className="trip-card current-trip">
              <div className="trip-info-row">
                <span className="label">📅 Date Range:</span>
                <span className="value">{original_trip.start_date} → {original_trip.end_date}</span>
              </div>
              <div className="trip-info-row">
                <span className="label">🛣️ Distance:</span>
                <span className="value">{original_trip.distance} KMs</span>
              </div>
              <div className="trip-info-row">
                <span className="label">⛽ Fuel:</span>
                <span className="value">{original_trip.fuel_consumed} Liters</span>
              </div>
              {original_trip.driver_name && (
                <div className="trip-info-row">
                  <span className="label">👤 Driver:</span>
                  <span className="value">{original_trip.driver_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="divider">
            <span className="divider-text">Will be split at receipt date</span>
          </div>

          {/* New Trips Preview */}
          <div className="trip-section">
            <h3 className="section-title success">New Trips (Will be Created)</h3>

            {/* Trip A */}
            <div className="trip-card new-trip">
              <div className="trip-header">
                <h4>📍 Trip A (New Data from FleetEdge)</h4>
              </div>
              <div className="trip-info-row">
                <span className="label">Date Range:</span>
                <span className="value">{original_trip.start_date} → {newReceiptDate}</span>
              </div>
              <div className="trip-info-row">
                <span className="label">Receipt Before:</span>
                <span className="value">{original_trip.receipt_before_date} ({original_trip.receipt_before_volume}L)</span>
              </div>
              <div className="trip-info-row">
                <span className="label">Receipt After:</span>
                <span className="value">
                  {newReceiptDate} ({newReceiptVolume}L) 
                  <span className="badge badge-new">NEW</span>
                </span>
              </div>
              <p className="trip-note">* Distance and fuel will be fetched from FleetEdge</p>
            </div>

            {/* Trip B */}
            <div className="trip-card new-trip">
              <div className="trip-header">
                <h4>📍 Trip B (Calculated)</h4>
              </div>
              <div className="trip-info-row">
                <span className="label">Date Range:</span>
                <span className="value">{newReceiptDate} → {original_trip.end_date}</span>
              </div>
              <div className="trip-info-row">
                <span className="label">Receipt Before:</span>
                <span className="value">
                  {newReceiptDate} ({newReceiptVolume}L)
                  <span className="badge badge-new">NEW</span>
                </span>
              </div>
              <div className="trip-info-row">
                <span className="label">Receipt After:</span>
                <span className="value">{original_trip.receipt_after_date} ({original_trip.receipt_after_volume}L)</span>
              </div>
              <p className="trip-note">* Distance and fuel will be calculated by subtracting Trip A from original</p>
            </div>
          </div>

          <div className="info-box">
            <strong>What happens next:</strong>
            <ol>
              <li>Original trip will be deleted</li>
              <li>Trip A will fetch fresh data from FleetEdge</li>
              <li>Trip B will be calculated automatically</li>
              <li>All summaries will be recalculated</li>
            </ol>
          </div>

          {/* Progress Messages */}
          {progress.length > 0 && (
            <div className="progress-box">
              <h4>Progress:</h4>
              {progress.map((msg, idx) => (
                <div key={idx} className="progress-message">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="split-dialog-actions">
          <button 
            className="btn btn-cancel" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="btn btn-confirm" 
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Split'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitTripConfirmationDialog;
