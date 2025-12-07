/**
 * TripManagementPage Component
 * 
 * Main page for viewing and managing all trips (active and completed).
 * Features:
 * - Fixed header with filter tabs and search functionality
 * - Horizontal card layout displaying trip information
 * - Click-through to detailed trip view/edit page
 * - Real-time search across vehicle numbers, drivers, and locations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../PageStyles.css';
import './TripManagementPage.css';

const TripManagementPage = () => {
  const navigate = useNavigate();
  
  // UI state management
  const [activeFilter, setActiveFilter] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Mock trips data
   * TODO: Replace with API call to backend
   * Structure includes both active and completed trips with full details
   */
  const mockTrips = [
    {
      id: 1,
      status: 'In Progress',
      tripStatus: 'active',
      vehicleNo: 'WB-01-1234',
      driverName: 'Driver A (Devayan)',
      startDate: '2025-12-05',
      startLocation: 'Kolkata - 700001',
      destination: 'Mumbai - 400001',
      odometerStart: 12450,
      odometerEnd: null,
      payloadWeight: 8500,
      lastRefillDate: '2025-12-04',
      lastRefillQuantity: 120,
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
      startLocation: 'Delhi - 110001',
      destination: 'Bangalore - 560001',
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
    },
    {
      id: 5,
      status: 'In Progress',
      tripStatus: 'active',
      vehicleNo: 'WB-04-2345',
      driverName: 'Driver E',
      startDate: '2025-12-07',
      startLocation: 'Pune - 411001',
      destination: 'Hyderabad - 500001',
      odometerStart: 56780,
      odometerEnd: null,
      payloadWeight: 9200,
      lastRefillDate: '2025-12-07',
      lastRefillQuantity: 110,
      distance: null
    },
    {
      id: 6,
      status: 'Completed',
      tripStatus: 'completed',
      vehicleNo: 'WB-05-6789',
      driverName: 'Driver F',
      startDate: '2025-12-02',
      endDate: '2025-12-02',
      startLocation: 'Jaipur - 302001',
      destination: 'Lucknow - 226001',
      odometerStart: 23450,
      odometerEnd: 23680,
      payloadWeight: 11500,
      lastRefillDate: '2025-12-01',
      lastRefillQuantity: 135,
      distance: 230,
      fuelConsumed: 19.2,
      mileage: 12.0
    },
    {
      id: 7,
      status: 'In Progress',
      tripStatus: 'active',
      vehicleNo: 'WB-07-3456',
      driverName: 'Driver G',
      startDate: '2025-12-06',
      startLocation: 'Surat - 395001',
      destination: 'Nagpur - 440001',
      odometerStart: 67890,
      odometerEnd: null,
      payloadWeight: 13200,
      lastRefillDate: '2025-12-06',
      lastRefillQuantity: 145,
      distance: null
    },
    {
      id: 8,
      status: 'Completed',
      tripStatus: 'completed',
      vehicleNo: 'WB-08-8901',
      driverName: 'Driver H',
      startDate: '2025-12-01',
      endDate: '2025-12-01',
      startLocation: 'Indore - 452001',
      destination: 'Bhopal - 462001',
      odometerStart: 89012,
      odometerEnd: 89200,
      payloadWeight: 8800,
      lastRefillDate: '2025-11-30',
      lastRefillQuantity: 95,
      distance: 188,
      fuelConsumed: 17.1,
      mileage: 11.0
    }
  ];

  /**
   * Event listener for navbar "Start New Trip" button
   * Listens for custom event and navigates to trip creation page
   */
  useEffect(() => {
    const handleStartNewTrip = () => navigate('/trip/new');
    window.addEventListener('startNewTrip', handleStartNewTrip);
    return () => window.removeEventListener('startNewTrip', handleStartNewTrip);
  }, [navigate]);

  /**
   * Dispatch active trips count to navbar
   * Updates the active trips badge in the navigation bar
   */
  useEffect(() => {
    const activeCount = mockTrips.filter(trip => trip.tripStatus === 'active').length;
    window.dispatchEvent(new CustomEvent('activeTripsUpdate', { detail: { count: activeCount } }));
  }, [mockTrips]);

  /**
   * Handle trip card click - navigate to trip detail/edit page
   * @param {Object} trip - The trip object that was clicked
   */
  const handleTripClick = (trip) => {
    navigate(`/trip/${trip.id}`);
  };

  /**
   * Get color for status badge based on trip status
   * @param {string} status - The status of the trip
   * @returns {string} Hex color code
   */
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

  /**
   * Filter trips based on active filter and search query
   * Searches across: vehicle number, driver name, start location, and destination
   */
  const filteredTrips = mockTrips.filter(trip => {
    const matchesFilter = activeFilter === 'All' || trip.tripStatus === activeFilter.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      trip.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.startLocation && trip.startLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trip.destination && trip.destination.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Fixed Header */}
      <div className="trip-management-header">
        <div className="header-content">
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

          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by vehicle, driver, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="trips-list">
          {filteredTrips.map(trip => (
            <div key={trip.id} className="trip-card-horizontal" onClick={() => handleTripClick(trip)}>
              <div className="trip-card-section vehicle-section">
                <div className="section-label">Vehicle Number</div>
                <div className="section-value vehicle-number">{trip.vehicleNo}</div>
              </div>

              <div className="trip-card-section date-section">
                <div className="section-label">Date</div>
                <div className="section-value">{trip.startDate}</div>
              </div>

              <div className="trip-card-section route-section">
                <div className="section-label">Source</div>
                <div className="section-value">{trip.startLocation || 'Not specified'}</div>
              </div>

              <div className="trip-card-section destination-section">
                <div className="section-label">Destination</div>
                <div className="section-value">{trip.destination || 'Not specified'}</div>
              </div>

              <div className="trip-card-section status-section">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripManagementPage;
