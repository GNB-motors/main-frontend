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
import { toast } from 'react-toastify';
import '../PageStyles.css';
import './TripManagementPage.css';
import TripService from './TripService';

const TripManagementPage = () => {
  const navigate = useNavigate();
  
  // UI state management
  const [activeFilter, setActiveFilter] = useState('ONGOING');
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Remove global page-content padding only for this page
  useEffect(() => {
    const pageContentEl = document.querySelector('.page-content');
    if (pageContentEl) {
      pageContentEl.classList.add('no-padding');
    }
    return () => {
      if (pageContentEl) {
        pageContentEl.classList.remove('no-padding');
      }
    };
  }, []);

  /**
   * Fetch trips from API
   */
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      // Add status filter
      if (activeFilter !== 'ALL') {
        params.status = activeFilter;
      }

      const response = await TripService.getAllTrips(params);
      
      setTrips(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.meta?.total || 0,
        totalPages: response.meta?.totalPages || 0
      }));
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      toast.error(error?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trips when filter or pagination changes
  useEffect(() => {
    fetchTrips();
  }, [activeFilter, pagination.page]);

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
    const activeCount = trips.filter(trip => trip.status === 'ONGOING').length;
    window.dispatchEvent(new CustomEvent('activeTripsUpdate', { detail: { count: activeCount } }));
  }, [trips]);

  /**
   * Handle trip card click - navigate to trip detail/edit page
   * @param {Object} trip - The trip object that was clicked
   */
  const handleTripClick = (trip) => {
    navigate(`/trip/${trip._id}`);
  };

  /**
   * Get color for status badge based on trip status
   * @param {string} status - The status of the trip
   * @returns {string} Hex color code
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#4caf50';
      case 'ONGOING':
        return '#ff9800';
      case 'PLANNED':
        return '#2196f3';
      case 'CANCELLED':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  /**
   * Get display label for status
   * @param {string} status - The status of the trip
   * @returns {string} Display label
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'ONGOING':
        return 'In Progress';
      case 'PLANNED':
        return 'Planned';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  /**
   * Filter trips based on search query
   * Searches across: vehicle number, driver name, start location, and destination
   */
  const filteredTrips = trips.filter(trip => {
    if (searchQuery === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      trip.vehicleId?.registrationNumber?.toLowerCase().includes(query) ||
      trip.driverId?.name?.toLowerCase().includes(query) ||
      trip.routeSource?.toLowerCase().includes(query) ||
      trip.routeDestination?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-container">
      {/* Fixed Header */}
      <div className="trip-management-header">
        <div className="header-content">
          <div className="trip-filters">
            <button
              className={`filter-btn ${activeFilter === 'ONGOING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ONGOING')}
            >
              Active
            </button>
            <button
              className={`filter-btn ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('COMPLETED')}
            >
              Completed
            </button>
            <button
              className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
            Loading trips...
          </div>
        ) : (
          <div className="trips-list">
            {filteredTrips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No trips found
              </div>
            ) : (
              filteredTrips.map(trip => (
                <div key={trip._id} className="trip-card-horizontal" onClick={() => handleTripClick(trip)}>
                  <div className="trip-card-section vehicle-section">
                    <div className="section-label">Vehicle Number</div>
                    <div className="section-value vehicle-number">
                      {trip.vehicleId?.registrationNumber || 'N/A'}
                    </div>
                  </div>

                  <div className="trip-card-section date-section">
                    <div className="section-label">Start Date</div>
                    <div className="section-value">
                      {trip.startTime ? new Date(trip.startTime).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <div className="trip-card-section route-section">
                    <div className="section-label">Source</div>
                    <div className="section-value">{trip.routeSource || 'Not specified'}</div>
                  </div>

                  <div className="trip-card-section destination-section">
                    <div className="section-label">Destination</div>
                    <div className="section-value">{trip.routeDestination || 'Not specified'}</div>
                  </div>

                  <div className="trip-card-section status-section">
                    <span 
                      className="trip-status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(trip.status) + '20',
                        color: getStatusColor(trip.status)
                      }}
                    >
                      {getStatusLabel(trip.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManagementPage;
