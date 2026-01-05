import React, { useState } from 'react';
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

  const openMapsModal = (locationType) => {
    setCurrentLocationType(locationType);
    setIsMapsModalOpen(true);
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
          <input
            type="text"
            value={routeData.sourceLocation?.address || ''}
            placeholder="Click to select source location"
            onClick={() => openMapsModal('source')}
            readOnly
            className="form-input location-input"
          />
          <button
            type="button"
            onClick={() => openMapsModal('source')}
            className="map-select-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          </button>
        </div>
        {routeData.sourceLocation?.city && (
          <small className="location-details">
            {routeData.sourceLocation.city}, {routeData.sourceLocation.state}
          </small>
        )}
      </div>

      {/* Destination Location */}
      <div className="form-group">
        <label>Destination Location</label>
        <div className="location-input-group">
          <input
            type="text"
            value={routeData.destLocation?.address || ''}
            placeholder="Click to select destination location"
            onClick={() => openMapsModal('dest')}
            readOnly
            className="form-input location-input"
          />
          <button
            type="button"
            onClick={() => openMapsModal('dest')}
            className="map-select-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          </button>
        </div>
        {routeData.destLocation?.city && (
          <small className="location-details">
            {routeData.destLocation.city}, {routeData.destLocation.state}
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