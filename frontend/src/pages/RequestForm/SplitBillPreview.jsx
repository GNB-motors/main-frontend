import React from "react";
import "./SplitBillPreview.css";

const SplitBillPreview = ({ previewData, onConfirm, onCancel, isLoading }) => {
  if (!previewData) return null;

  const { 
    requires_split, 
    message, 
    extracted_date, 
    last_bill_date, 
    closest_trip, 
    extracted_data,
    split_explanation 
  } = previewData;

  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="split-bill-preview-container">
      <div className="split-bill-preview-card">
        <div className="preview-header">
          <h2>Bill Split Preview</h2>
          <div className={`status-badge ${requires_split ? 'requires-split' : 'no-split'}`}>
            {requires_split ? "⚠️ Split Required" : "✓ No Split Needed"}
          </div>
        </div>

        <div className="preview-content">
          {/* Alert Message */}
          <div className={`alert-box ${requires_split ? 'alert-warning' : 'alert-info'}`}>
            <p>{message}</p>
          </div>

          {/* Date Comparison Section */}
          <div className="date-comparison-section">
            <h3>Date Analysis</h3>
            <div className="date-comparison-grid">
              <div className="date-item">
                <span className="date-label">Receipt Date</span>
                <span className="date-value">{formatDateTime(extracted_date)}</span>
              </div>
              <div className="date-divider">→</div>
              <div className="date-item">
                <span className="date-label">Last Bill Date</span>
                <span className="date-value">{formatDate(last_bill_date)}</span>
              </div>
            </div>
          </div>

          {/* Extracted Receipt Data */}
          {extracted_data && (
            <div className="extracted-data-section">
              <h3>Extracted Receipt Information</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Date</span>
                  <span className="data-value">{extracted_data.date || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Time</span>
                  <span className="data-value">{extracted_data.time || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Vehicle No</span>
                  <span className="data-value">{extracted_data.vehicle_no || 'N/A'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Fuel Volume</span>
                  <span className="data-value">{extracted_data.volume ? `${extracted_data.volume} L` : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Closest Trip Details */}
          {requires_split && closest_trip && (
            <div className="trip-details-section">
              <h3>Affected Trip</h3>
              <div className="trip-card">
                <div className="trip-header">
                  <span className="trip-dates">
                    {formatDate(closest_trip.start_date)} - {formatDate(closest_trip.end_date)}
                  </span>
                  {closest_trip.driver_name && (
                    <span className="trip-driver">Driver: {closest_trip.driver_name}</span>
                  )}
                </div>
                
                <div className="trip-stats">
                  <div className="stat-item">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">
                      {closest_trip.kms_driven ? `${closest_trip.kms_driven.toFixed(2)} km` : 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">FleetEdge Mileage</span>
                    <span className="stat-value">
                      {closest_trip.fleetedge_mileage_kml ? `${closest_trip.fleetedge_mileage_kml.toFixed(2)} km/l` : 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Bill Mileage</span>
                    <span className="stat-value">
                      {closest_trip.bill_mileage_kml ? `${closest_trip.bill_mileage_kml.toFixed(2)} km/l` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Split Explanation */}
          {requires_split && split_explanation && (
            <div className="explanation-section">
              <h3>What Will Happen</h3>
              <div className="explanation-box">
                <p>{split_explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="preview-actions">
          <button 
            className="btn-cancel" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn-confirm" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              requires_split ? "Confirm & Proceed" : "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitBillPreview;
