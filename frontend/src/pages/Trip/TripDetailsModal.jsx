import React from 'react';
import { X } from 'lucide-react';
import './TripDetailsModal.css';

const TripDetailsModal = ({ isOpen, onClose, trip, onRefuel, onEndTrip }) => {
  if (!isOpen || !trip) return null;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4caf50';
      case 'to be updated':
        return '#5e8ba8';
      case 'in transit':
      case 'in progress':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content trip-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Trip Details</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-section">
              <h4 className="section-title">Vehicle Information</h4>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="detail-label">Vehicle Number</span>
                  <span className="detail-value">{trip.vehicleNo}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Driver</span>
                  <span className="detail-value">{trip.driverName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payload Weight</span>
                  <span className="detail-value">{trip.payloadWeight.toLocaleString()} kg</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Trip Information</h4>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="trip-status-badge" style={{
                    backgroundColor: getStatusColor(trip.status) + '20',
                    color: getStatusColor(trip.status)
                  }}>
                    {trip.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Date</span>
                  <span className="detail-value">{trip.startDate}</span>
                </div>
                {trip.endDate && (
                  <div className="detail-item">
                    <span className="detail-label">End Date</span>
                    <span className="detail-value">{trip.endDate}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Last Refill Status</h4>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{trip.lastRefillDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-value highlight">{trip.lastRefillQuantity} Liters</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Odometer Reading</h4>
              <div className="detail-items">
                <div className="detail-item">
                  <span className="detail-label">Start Reading</span>
                  <span className="detail-value">{trip.odometerStart.toLocaleString()} km</span>
                </div>
                {trip.odometerEnd && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">End Reading</span>
                      <span className="detail-value">{trip.odometerEnd.toLocaleString()} km</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Distance Traveled</span>
                      <span className="detail-value highlight">
                        {(trip.odometerEnd - trip.odometerStart).toLocaleString()} km
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {trip.startLocation && trip.destination && (
              <div className="detail-section">
                <h4 className="section-title">Route</h4>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="detail-label">From</span>
                    <span className="detail-value">{trip.startLocation}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To</span>
                    <span className="detail-value">{trip.destination}</span>
                  </div>
                  {trip.distance && (
                    <div className="detail-item">
                      <span className="detail-label">Distance</span>
                      <span className="detail-value">{trip.distance} km</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {trip.tripStatus === 'completed' && (
              <div className="detail-section">
                <h4 className="section-title">Fuel & Mileage</h4>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="detail-label">Fuel Consumed</span>
                    <span className="detail-value">{trip.fuelConsumed} L</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mileage</span>
                    <span className="detail-value highlight">{trip.mileage} km/l</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {trip.tripStatus === 'active' && (
            <div className="modal-actions">
              <button className="action-btn refuel-btn" onClick={() => onRefuel(trip)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                  <path d="M3 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
                  <line x1="7" y1="10" x2="7" y2="16"/>
                  <line x1="12" y1="10" x2="12" y2="16"/>
                  <line x1="17" y1="10" x2="17" y2="16"/>
                </svg>
                Add Refueling
              </button>
              <button className="action-btn end-trip-btn" onClick={() => onEndTrip(trip)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                End Trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetailsModal;
