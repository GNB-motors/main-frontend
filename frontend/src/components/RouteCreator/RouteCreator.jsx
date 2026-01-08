import React, { useState } from 'react';
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown';
import GoogleMapsModal from '../GoogleMapsModal/GoogleMapsModal';
import './RouteCreator.css';

const RouteCreator = ({ 
  routeData = {}, 
  tripType = 'PICKUP_DROP',
  onRouteUpdate, 
  onTripTypeChange 
}) => {
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [currentLocationType, setCurrentLocationType] = useState(null);

  // Common location options for dropdown
  const [locationOptions, setLocationOptions] = useState([
    'Kolkata, West Bengal',
    'Delhi, Delhi',
    'Mumbai, Maharashtra',
    'Chennai, Tamil Nadu',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Pune, Maharashtra',
    'Ahmedabad, Gujarat',
    'Jaipur, Rajasthan',
    'Surat, Gujarat',
    'Kanpur, Uttar Pradesh',
    'Nagpur, Maharashtra',
    'Indore, Madhya Pradesh',
    'Thane, Maharashtra',
    'Bhopal, Madhya Pradesh',
    'Visakhapatnam, Andhra Pradesh',
    'Pimpri-Chinchwad, Maharashtra',
    'Patna, Bihar',
    'Vadodara, Gujarat',
    'Ghaziabad, Uttar Pradesh'
  ]);

  const handleLocationSelect = (locationType, locationData) => {
    const updates = {
      ...routeData,
      [`${locationType}Location`]: {
        address: locationData.address,
        lat: locationData.lat,
        lng: locationData.lng,
        city: locationData.city || '',
        state: locationData.state || '',
      }
    };
    
    if (onRouteUpdate && typeof onRouteUpdate === 'function') {
      onRouteUpdate(updates);
    }
    
    setIsMapsModalOpen(false);
  };

  const handleLocationDropdownSelect = (locationType, selectedLocation) => {
    // Parse location string to extract city and state if possible
    const locationParts = selectedLocation.split(', ');
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';
    
    const updates = {
      ...routeData,
      [`${locationType}Location`]: {
        address: selectedLocation,
        lat: null,
        lng: null,
        city: city,
        state: state,
      }
    };
    
    if (onRouteUpdate && typeof onRouteUpdate === 'function') {
      onRouteUpdate(updates);
    }
  };

  const handleAddNewLocation = (locationType, newLocation) => {
    // Add new location to options
    setLocationOptions(prev => [...prev, newLocation]);
    
    // Select the new location
    handleLocationDropdownSelect(locationType, newLocation);
  };

  const openMapsModal = (locationType) => {
    setCurrentLocationType(locationType);
    setIsMapsModalOpen(true);
  };

  const handleDistanceChange = (baseDistance) => {
    const multiplier = tripType === 'ROUND_TRIP' ? 2 : 1;
    const actualDistance = baseDistance * multiplier;
    
    const updates = {
      ...routeData,
      baseDistanceKm: parseFloat(baseDistance) || 0,
      actualDistanceKm: actualDistance,
    };
    
    if (onRouteUpdate && typeof onRouteUpdate === 'function') {
      onRouteUpdate(updates);
    }
  };

  const handleTripTypeChange = (newTripType) => {
    if (onTripTypeChange && typeof onTripTypeChange === 'function') {
      onTripTypeChange(newTripType);
    }
    
    // Recalculate distance when trip type changes
    if (routeData.baseDistanceKm && onRouteUpdate && typeof onRouteUpdate === 'function') {
      const multiplier = newTripType === 'ROUND_TRIP' ? 2 : 1;
      const actualDistance = routeData.baseDistanceKm * multiplier;
      
      onRouteUpdate({
        ...routeData,
        actualDistanceKm: actualDistance,
      });
    }
  };

  return (
    <fieldset className="form-section">
      <legend>Route Information</legend>
      
      {/* Trip Type Toggle */}
      <div className="form-group">
        <label className="form-label">Trip Type:</label>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn ${tripType === 'PICKUP_DROP' ? 'active' : ''}`}
            onClick={() => handleTripTypeChange('PICKUP_DROP')}
          >
            Pickup & Drop
          </button>
          <button
            type="button"
            className={`toggle-btn ${tripType === 'ROUND_TRIP' ? 'active' : ''}`}
            onClick={() => handleTripTypeChange('ROUND_TRIP')}
          >
            Round Trip
          </button>
        </div>
      </div>

      {/* Source Location */}
      <div className="form-group">
        <label>Source Location</label>
        <div className="location-input-group">
          <div className="dropdown-container">
            <SearchableDropdown
              options={locationOptions}
              selectedOption={routeData.sourceLocation?.address || ''}
              onSelect={(location) => handleLocationDropdownSelect('source', location)}
              onAddNew={(location) => handleAddNewLocation('source', location)}
              placeholder="Select source location"
              addNewLabel="Add new location"
            />
          </div>
          <button
            type="button"
            onClick={() => openMapsModal('source')}
            className="map-select-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        {routeData.sourceLocation?.city && (
          <small className="location-details">
            {routeData.sourceLocation.city}
          </small>
        )}
      </div>

      {/* Destination Location */}
      <div className="form-group">
        <label>Destination Location</label>
        <div className="location-input-group">
          <div className="dropdown-container">
            <SearchableDropdown
              options={locationOptions}
              selectedOption={routeData.destLocation?.address || ''}
              onSelect={(location) => handleLocationDropdownSelect('dest', location)}
              onAddNew={(location) => handleAddNewLocation('dest', location)}
              placeholder="Select destination location"
              addNewLabel="Add new location"
            />
          </div>
          <button
            type="button"
            onClick={() => openMapsModal('dest')}
            className="map-select-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        {routeData.destLocation?.city && (
          <small className="location-details">
            {routeData.destLocation.city}
          </small>
        )}
      </div>

      {/* Distance Input */}
      <div className="form-group">
        <label htmlFor="baseDistance">Base Distance (km)</label>
        <input
          id="baseDistance"
          type="number"
          value={routeData.baseDistanceKm || ''}
          onChange={(e) => handleDistanceChange(e.target.value)}
          placeholder="Enter one-way distance"
          min="0"
          step="0.1"
          className="form-input"
        />
        <small className="distance-calculation">
          {tripType === 'ROUND_TRIP' 
            ? `Total Distance: ${(routeData.actualDistanceKm || 0).toFixed(1)} km (2x base distance)`
            : `Total Distance: ${(routeData.actualDistanceKm || 0).toFixed(1)} km`
          }
        </small>
      </div>

      {/* Google Maps Modal */}
      {isMapsModalOpen && (
        <GoogleMapsModal
          isOpen={isMapsModalOpen}
          onClose={() => setIsMapsModalOpen(false)}
          onApply={(locationData) => handleLocationSelect(currentLocationType, locationData)}
          initialLocation={routeData[`${currentLocationType}Location`]}
        />
      )}
    </fieldset>
  );
};

export default RouteCreator;