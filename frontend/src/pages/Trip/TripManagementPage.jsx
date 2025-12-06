import React, { useState } from 'react';
import '../PageStyles.css';
import './TripManagementPage.css';
import StartTripModal from './StartTripModal';
import EndTripModal from './EndTripModal';
import RefuelModal from './RefuelModal';
import TripDetailsModal from './TripDetailsModal';

const TripManagementPage = () => {
  const [activeFilter, setActiveFilter] = useState('Active');
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripDetailsModal, setShowTripDetailsModal] = useState(false);
  const [showRefuelModal, setShowRefuelModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [refuelTrip, setRefuelTrip] = useState(null);
  const [endTrip, setEndTrip] = useState(null);

  // Mock data - will be replaced with backend data in future
  const mockTrips = [
    {
      id: 1,
      status: 'In Progress',
      tripStatus: 'active',
      vehicleNo: 'WB-01-1234',
      driverName: 'Driver A (Devayan)',
      startDate: '2025-12-05',
      startLocation: null,
      destination: null,
      odometerStart: 12450,
      odometerEnd: null,
      payloadWeight: 8500, // kg
      lastRefillDate: '2025-12-04',
      lastRefillQuantity: 120, // liters
      distance: null
    },
    {
      id: 2,
      status: 'Completed',
      tripStatus: 'completed',
      vehicleNo: 'WB-02-5678',
      driverName: 'Driver B (Amitansu)',
      startDate: '2025-12-03',
      endDate: '2025-12-03',
      startLocation: 'Ashta - 466114',
      destination: 'Greater Thane - 421302',
      odometerStart: 45200,
      odometerEnd: 45380,
      payloadWeight: 12000,
      lastRefillDate: '2025-12-02',
      lastRefillQuantity: 150,
      distance: 180,
      fuelConsumed: 16.4,
      mileage: 11.0
    },
    {
      id: 3,
      status: 'In Progress',
      tripStatus: 'active',
      vehicleNo: 'WB-06-9001',
      driverName: 'Driver C',
      startDate: '2025-12-06',
      startLocation: null,
      destination: null,
      odometerStart: 78900,
      odometerEnd: null,
      payloadWeight: 15000,
      lastRefillDate: '2025-12-05',
      lastRefillQuantity: 180,
      distance: null
    },
    {
      id: 4,
      status: 'Completed',
      tripStatus: 'completed',
      vehicleNo: 'WB-03-7890',
      driverName: 'Driver D',
      startDate: '2025-12-04',
      endDate: '2025-12-04',
      startLocation: 'Ahmedabad - 380001',
      destination: 'Chennai - 600001',
      odometerStart: 32100,
      odometerEnd: 32310,
      payloadWeight: 10500,
      lastRefillDate: '2025-12-03',
      lastRefillQuantity: 140,
      distance: 210,
      fuelConsumed: 21.9,
      mileage: 9.6
    }
  ];

  // Listen for the start new trip event from navbar
  React.useEffect(() => {
    const handleStartNewTrip = () => setShowNewTripModal(true);
    window.addEventListener('startNewTrip', handleStartNewTrip);
    return () => window.removeEventListener('startNewTrip', handleStartNewTrip);
  }, []);

  // Update active trips count in navbar
  React.useEffect(() => {
    const activeCount = mockTrips.filter(trip => trip.tripStatus === 'active').length;
    window.dispatchEvent(new CustomEvent('activeTripsUpdate', { detail: { count: activeCount } }));
  }, []);

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setShowTripDetailsModal(true);
  };

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

  const filteredTrips = mockTrips.filter(trip => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Active') return trip.tripStatus === 'active';
    if (activeFilter === 'Completed') return trip.tripStatus === 'completed';
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="trip-filters">
          <button
            className={`filter-btn ${activeFilter === 'Active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${activeFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Completed')}
          >
            Completed
          </button>
          <button
            className={`filter-btn ${activeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setActiveFilter('All')}
          >
            All
          </button>
        </div>

        <div className="trips-container">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="trip-card" onClick={() => handleTripClick(trip)}>
              <div className="trip-card-header">
                <div className="trip-status-section">
                  <div className="truck-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </div>
                  <div className="vehicle-driver-info">
                    <div className="vehicle-number">{trip.vehicleNo}</div>
                    <div className="driver-section">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span className="driver-name">{trip.driverName}</span>
                    </div>
                  </div>
                </div>
                <span 
                  className="trip-status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(trip.status) + '20',
                    color: getStatusColor(trip.status)
                  }}
                >
                  {trip.status}
                </span>
              </div>

              <div className="trip-details">
                {trip.startLocation && trip.destination ? (
                  <div className="trip-route">
                    <div className="route-point">
                      <div className="route-indicator start-indicator"></div>
                      <span className="route-location">{trip.startLocation}</span>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-point">
                      <div className="route-indicator end-indicator"></div>
                      <span className="route-location">{trip.destination}</span>
                    </div>
                  </div>
                ) : (
                  <div className="trip-info-grid-full">
                    <div className="info-item-full">
                      <span className="info-label">Payload</span>
                      <span className="info-value">{trip.payloadWeight.toLocaleString()} kg</span>
                    </div>
                    <div className="info-item-full">
                      <span className="info-label">Odometer</span>
                      <span className="info-value">{trip.odometerStart.toLocaleString()} km</span>
                    </div>
                  </div>
                )}
                <div className="trip-meta-section">
                  <div className="meta-card">
                    <div className="meta-card-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="meta-label">Trip Date</span>
                    </div>
                    <span className="meta-value">{trip.startDate}</span>
                  </div>
                  {trip.tripStatus === 'completed' ? (
                    <>
                      <div className="meta-card">
                        <div className="meta-card-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                            <path d="M3 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
                            <line x1="7" y1="10" x2="7" y2="16"/>
                            <line x1="12" y1="10" x2="12" y2="16"/>
                            <line x1="17" y1="10" x2="17" y2="16"/>
                          </svg>
                          <span className="meta-label">Fuel Consumed</span>
                        </div>
                        <span className="meta-value">{trip.fuelConsumed}L</span>
                      </div>
                      <div className="meta-card">
                        <div className="meta-card-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                          </svg>
                          <span className="meta-label">Distance</span>
                        </div>
                        <span className="meta-value">{trip.distance} km</span>
                      </div>
                      <div className="meta-card full-width">
                        <div className="meta-card-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span className="meta-label">Mileage</span>
                        </div>
                        <span className="meta-value">{trip.mileage} km/l</span>
                      </div>
                    </>
                  ) : (
                    <div className="meta-card">
                      <div className="meta-card-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                          <path d="M3 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
                          <line x1="7" y1="10" x2="7" y2="16"/>
                          <line x1="12" y1="10" x2="12" y2="16"/>
                          <line x1="17" y1="10" x2="17" y2="16"/>
                        </svg>
                        <span className="meta-label">Last Refuel</span>
                      </div>
                      <span className="meta-value">{trip.lastRefillQuantity}L • {trip.lastRefillDate}</span>
                    </div>
                  )}
                  {trip.distance && trip.tripStatus === 'active' && (
                    <div className="meta-card full-width">
                      <div className="meta-card-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span className="meta-label">Distance</span>
                      </div>
                      <span className="meta-value">{trip.distance} km</span>
                    </div>
                  )}
                </div>
              </div>

              {trip.tripStatus !== 'completed' && (
                <div className="trip-actions">
                  <button 
                    className="action-btn refuel-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRefuelTrip(trip);
                      setShowRefuelModal(true);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                      <path d="M3 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
                      <line x1="7" y1="10" x2="7" y2="16"/>
                      <line x1="12" y1="10" x2="12" y2="16"/>
                      <line x1="17" y1="10" x2="17" y2="16"/>
                    </svg>
                    Add Refueling
                  </button>
                  <button 
                    className="action-btn end-trip-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndTrip(trip);
                      setShowEndTripModal(true);
                    }}
                  >
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
          ))}
        </div>

        {/* Modals */}
        <StartTripModal 
          isOpen={showNewTripModal}
          onClose={() => setShowNewTripModal(false)}
        />

        <TripDetailsModal
          isOpen={showTripDetailsModal}
          onClose={() => {
            setShowTripDetailsModal(false);
            setSelectedTrip(null);
          }}
          trip={selectedTrip}
          onRefuel={(trip) => {
            setShowTripDetailsModal(false);
            setRefuelTrip(trip);
            setShowRefuelModal(true);
          }}
          onEndTrip={(trip) => {
            setShowTripDetailsModal(false);
            setEndTrip(trip);
            setShowEndTripModal(true);
          }}
        />

        <RefuelModal
          isOpen={showRefuelModal}
          onClose={() => {
            setShowRefuelModal(false);
            setRefuelTrip(null);
          }}
          tripId={refuelTrip?.id}
          vehicleNo={refuelTrip?.vehicleNo}
        />

        <EndTripModal
          isOpen={showEndTripModal}
          onClose={() => {
            setShowEndTripModal(false);
            setEndTrip(null);
          }}
          tripId={endTrip?.id}
          vehicleNo={endTrip?.vehicleNo}
        />
      </div>
    </div>
  );
};

export default TripManagementPage;
