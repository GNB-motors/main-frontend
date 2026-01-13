/**
 * TripManagementPage Component
 * 
 * Main page for managing trips with 2 tabs:
 * - Tab 1: Trips (weight slip trips from /weight-slip-trips endpoint)
 * - Tab 2: Refuel (refuel journeys from /trips endpoint)
 * Features:
 * - Tab navigation
 * - Search and filter functionality
 * - Card layout with trip information
 * - Click-through to detailed view page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import '../PageStyles.css';
import './TripManagementPage.css';
import { TripService, WeightSlipTripService } from './services';
import { getVehicleRegistration, getDriverName, getDriverPhone } from '../../utils/dataFormatters';

const TripManagementPage = () => {
  const navigate = useNavigate();

  // Tab and UI state
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' or 'refuel'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trips tab state (weight slip trips)
  const [weightSlipTrips, setWeightSlipTrips] = useState([]);
  const [loadingWeightSlipTrips, setLoadingWeightSlipTrips] = useState(false);
  const [weightSlipPagination, setWeightSlipPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Refuel tab state (trips)
  const [refuelTrips, setRefuelTrips] = useState([]);
  const [loadingRefuelTrips, setLoadingRefuelTrips] = useState(false);
  const [refuelPagination, setRefuelPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
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
   * Fetch weight slip trips from API
   */
  const fetchWeightSlipTrips = async () => {
    setLoadingWeightSlipTrips(true);
    try {
      const response = await WeightSlipTripService.getAll({
        page: weightSlipPagination.page,
        limit: weightSlipPagination.limit
      });
      
      setWeightSlipTrips(response.data || []);
      setWeightSlipPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch weight slip trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoadingWeightSlipTrips(false);
    }
  };

  /**
   * Fetch refuel trips (journeys) from API
   */
  const fetchRefuelTrips = async () => {
    setLoadingRefuelTrips(true);
    try {
      const response = await TripService.getAllTrips({
        page: refuelPagination.page,
        limit: refuelPagination.limit
      });
      
      setRefuelTrips(response.data || []);
      setRefuelPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch refuel trips:', error);
      toast.error('Failed to load refuel journeys');
    } finally {
      setLoadingRefuelTrips(false);
    }
  };

  // Fetch trips when active tab changes
  useEffect(() => {
    if (activeTab === 'trips') {
      fetchWeightSlipTrips();
    } else {
      fetchRefuelTrips();
    }
  }, [activeTab, weightSlipPagination.page, refuelPagination.page]);

  /**
   * Event listener for navbar "Start New Trip" button
   */
  useEffect(() => {
    const handleStartNewTrip = () => navigate('/trip/new');
    window.addEventListener('startNewTrip', handleStartNewTrip);
    return () => window.removeEventListener('startNewTrip', handleStartNewTrip);
  }, [navigate]);

  /**
   * Filter trips based on search query
   */
  const filterTrips = (trips) => {
    if (searchQuery === '') return trips;
    
    const query = searchQuery.toLowerCase();
    return trips.filter(trip => {
      if (activeTab === 'trips') {
        // Weight slip trip search
        const vehicleReg = (trip.journeyId?.vehicleId?.registrationNumber || trip.vehicleId?.registrationNumber || trip.vehicleId || '').toString().toLowerCase();
        const driverName = trip.journeyId?.driverId 
          ? `${trip.journeyId.driverId.firstName} ${trip.journeyId.driverId.lastName}`.toLowerCase()
          : (trip.driverId ? `${trip.driverId.firstName || ''} ${trip.driverId.lastName || ''}`.toLowerCase() : '');
        
        return (
          vehicleReg.includes(query) ||
          driverName.includes(query) ||
          trip.routeData?.name?.toLowerCase().includes(query) ||
          trip.routeData?.sourceLocation?.city?.toLowerCase().includes(query) ||
          trip.routeData?.destLocation?.city?.toLowerCase().includes(query) ||
          trip.materialType?.toLowerCase().includes(query) ||
          trip._id.includes(query)
        );
      } else {
        // Refuel trip search
        const driverName = trip.driverId 
          ? `${trip.driverId.firstName} ${trip.driverId.lastName}`.toLowerCase()
          : '';
        
        return (
          trip.vehicleId?.registrationNumber?.toLowerCase().includes(query) ||
          driverName.includes(query) ||
          trip._id.includes(query)
        );
      }
    });
  };

  const filteredTrips = filterTrips(activeTab === 'trips' ? weightSlipTrips : refuelTrips);

  /**
   * Navigate to trip detail page
   */
  const handleTripClick = (tripId, tripType) => {
    if (tripType === 'weight-slip') {
      navigate(`/trip-management/weight-slip/${tripId}`);
    } else {
      navigate(`/trip-management/trip/${tripId}`);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    const colors = {
      'SUBMITTED': '#4caf50',
      'COMPLETED': '#4caf50',
      'DRIVER_SELECTED': '#2196f3',
      'DOCUMENTS_UPLOADED': '#2196f3',
      'OCR_VERIFIED': '#2196f3',
      'ROUTES_ASSIGNED': '#2196f3',
      'REVENUE_ENTERED': '#ff9800',
      'EXPENSES_ENTERED': '#ff9800',
      'ONGOING': '#ff9800',
      'PLANNED': '#2196f3',
      'CANCELLED': '#f44336'
    };
    return colors[status] || '#757575';
  };

  /**
   * Format date to readable format
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="page-container trip-management-container">
      {/* Header with Tabs */}
      <div className="trip-management-header">
        <div className="header-content">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('trips');
                setSearchQuery('');
              }}
            >
              <span className="tab-icon">📦</span>
              Trips
            </button>
            <button
              className={`tab-btn ${activeTab === 'refuel' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('refuel');
                setSearchQuery('');
              }}
            >
              <span className="tab-icon">⛽</span>
              Refuel Journeys
            </button>
          </div>

          <div className="search-bar">
            <Search width={18} height={18} color="#9ca3af" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'trips' ? 'trips' : 'refuel journeys'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="trip-content-area">
        {activeTab === 'trips' ? (
          // Trips Tab (Weight Slip Trips)
          <div className="trips-tab">
            {loadingWeightSlipTrips ? (
              <div className="loading-state">
                <p>Loading trips...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="empty-state">
                <p>No trips found</p>
                {searchQuery && <p className="empty-subtext">Try adjusting your search</p>}
              </div>
            ) : (
              <div className="trips-grid">
                {filteredTrips.map((trip, index) => (
                  <div
                    key={trip._id}
                    className="trip-card"
                    onClick={() => handleTripClick(trip._id, 'weight-slip')}
                  >
                    <div className="card-header">
                      <div className="header-left">
                        <span className="trip-identifier">{`Trip ${index + 1}`}</span>
                        <span className="status-badge" style={{ 
                          backgroundColor: getStatusColor(trip.status) + '25',
                          color: getStatusColor(trip.status)
                        }}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="header-right">
                        <span className="vehicle-number">{getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId)}</span>
                        <span className="header-date">{formatDate(trip.createdAt)}</span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">Driver:</span>
                        <span className="value">{getDriverName(trip.journeyId?.driverId || trip.driverId)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Route:</span>
                        <span className="value">
                          {trip.routeData?.name || 
                           (trip.routeData?.sourceLocation?.city && trip.routeData?.destLocation?.city 
                            ? `${trip.routeData.sourceLocation.city} to ${trip.routeData.destLocation.city}`
                            : '-'
                           )
                          }
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Material:</span>
                        <span className="value">{trip.materialType || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Net Weight:</span>
                        <span className="value">{trip.weights?.netWeight ? `${trip.weights.netWeight} kg` : '-'}</span>
                      </div>
                    </div>

                    <div className="card-footer" style={{ borderTop: 'none', paddingTop: 0, justifyContent: 'flex-end' }}>
                      <span className="arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Refuel Tab (Trips/Journeys)
          <div className="refuel-tab">
            {loadingRefuelTrips ? (
              <div className="loading-state">
                <p>Loading refuel journeys...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="empty-state">
                <p>No refuel journeys found</p>
                {searchQuery && <p className="empty-subtext">Try adjusting your search</p>}
              </div>
            ) : (
              <div className="trips-grid">
                {filteredTrips.map(trip => (
                  <div
                    key={trip._id}
                    className="trip-card"
                    onClick={() => handleTripClick(trip._id, 'trip')}
                  >
                    <div className="card-header">
                      <div className="vehicle-info">
                        <span className="vehicle-number">{getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId) || 'N/A'}</span>
                        <span className="status-badge" style={{ 
                          backgroundColor: getStatusColor(trip.status) + '25',
                          color: getStatusColor(trip.status)
                        }}>
                          {trip.status}
                        </span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">Driver:</span>
                        <span className="value">
                          {trip.driverId?.firstName && trip.driverId?.lastName 
                            ? `${trip.driverId.firstName} ${trip.driverId.lastName}` 
                            : '-'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Trips Count:</span>
                        <span className="value">{trip.journeyFinancials?.totalTrips || trip.weightSlipTrips?.length || 0}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Total Fuel:</span>
                        <span className="value">
                          {trip.fuelManagement?.totalLiters 
                            ? `${trip.fuelManagement.totalLiters.toFixed(2)}L` 
                            : '-'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Revenue:</span>
                        <span className="value">
                          {trip.journeyFinancials?.totalRevenue 
                            ? `₹${trip.journeyFinancials.totalRevenue.toFixed(2)}` 
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="date">{formatDate(trip.createdAt)}</span>
                      <span className="arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManagementPage;
