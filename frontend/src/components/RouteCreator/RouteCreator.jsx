import React, { useState, useEffect, useRef } from 'react';
import { createLocation, deleteLocation } from '../../utils/locationApi';
import { fetchLocations } from '../../utils/fetchLocations';
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown';
import GoogleMapsModal from '../GoogleMapsModal/GoogleMapsModal';
import { useLoadScript } from '@react-google-maps/api';
import './RouteCreator.css';

const GOOGLE_MAPS_LIBRARIES = ['places'];

// --- Delete Location Modal Component ---
const DeleteLocationModal = ({ isOpen, onClose, onConfirm, location, isLoading: isDeleting }) => {
  if (!isOpen || !location) return null;

  return (
    <div className="location-delete-modal-overlay" onClick={onClose}>
      <div className="location-delete-modal-content" onClick={e => e.stopPropagation()}>
        <div className="location-delete-modal-header">
          <h4>Delete Location</h4>
          <button onClick={onClose} className="location-delete-modal-close-btn">&times;</button>
        </div>

        <div className="location-delete-content">
          <div className="location-delete-warning">
            <div className="location-delete-warning-icon">⚠️</div>
            <p>This action cannot be undone. The location will be permanently removed from the system.</p>
          </div>

          <div className="location-delete-location-info">
            <div className="location-delete-info">
              <div className="location-delete-details">
                <span className="location-delete-name">{location.name}</span>
                <span className="location-delete-address">{location.address}</span>
                <span className="location-delete-type">{location.type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="location-delete-modal-actions">
          <button
            type="button"
            className="location-delete-btn location-delete-btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="location-delete-btn location-delete-btn-danger"
            onClick={() => onConfirm(location._id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RouteCreator = ({
  routeData = {},
  tripType = 'PICKUP_DROP',
  onRouteUpdate,
  onTripTypeChange
}) => {
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [currentLocationType, setCurrentLocationType] = useState(null);

  // Load Google Maps Script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Location options as objects: { id, name, address, city, state, lat, lng, type }
  const [locationOptions, setLocationOptions] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Google Maps Predictions State
  const [predictions, setPredictions] = useState([]);
  const autocompleteServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);

  // Initialize Autocomplete Service
  useEffect(() => {
    if (isLoaded && window.google && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  // Fetch locations from API (can be called after delete as well)
  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      // Request a large limit to get all locations for the dropdown
      const data = await fetchLocations({ limit: 1000 });

      // Handle paginated response structure { results: [...], ... }
      if (data && data.results && Array.isArray(data.results)) {
        setLocationOptions(data.results);
      } else if (Array.isArray(data)) {
        // Fallback for array response
        setLocationOptions(data);
      } else {
        console.warn('Unexpected location data format:', data);
        setLocationOptions([]);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      setLocationOptions([]);
    } finally {
      setLoadingLocations(false);
    }
  };
  useEffect(() => {
    loadLocations();
  }, []);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState(null);

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

  // Handle search input change for Google Maps predictions
  const handleSearchChange = (value) => {
    if (!value || value.length < 3 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          sessionToken: sessionTokenRef.current,
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.map(p => ({
              ...p,
              name: p.description, // Map description to name for SearchableDropdown
              isPrediction: true,
            })));
          } else {
            setPredictions([]);
          }
        }
      );
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    }
  };

  const handleLocationDropdownSelect = async (locationType, selectedLocation) => {
    if (selectedLocation.isPrediction) {
      // Handle Google Maps Prediction Selection
      if (!window.google) return;

      try {
        const geocoder = new window.google.maps.Geocoder();
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode({ placeId: selectedLocation.place_id }, (results, status) => {
            if (status === 'OK' && results[0]) resolve(results[0]);
            else reject(status);
          });
        });

        // Extract details
        const lat = results.geometry.location.lat();
        const lng = results.geometry.location.lng();
        const address = results.formatted_address;

        let city = '';
        let state = '';
        let pincode = '';

        results.address_components?.forEach(component => {
          if (component.types.includes('locality')) city = component.long_name;
          if (component.types.includes('administrative_area_level_1')) state = component.long_name;
          if (component.types.includes('postal_code')) pincode = component.long_name;
        });

        if (!pincode) {
          const match = address.match(/\b\d{6}\b/);
          if (match) pincode = match[0];
        }

        // Create new location
        const newLocation = await createLocation({
          type: locationType === 'source' ? 'SOURCE' : 'DESTINATION',
          name: selectedLocation.description.split(',')[0], // Use first part of address as name
          address,
          city,
          state,
          pincode,
          lat,
          lng
        });

        // Add to options and select
        setLocationOptions(prev => [...prev, newLocation]);

        updateRouteData(locationType, newLocation);

        // Reset session token
        if (sessionTokenRef.current) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
        setPredictions([]);

      } catch (error) {
        console.error("Error processing location prediction:", error);
        alert("Failed to fetch details for the selected location.");
      }
    } else {
      // Handle Existing Location Selection
      let locObj = selectedLocation;
      if (typeof selectedLocation === 'string') {
        const locationParts = selectedLocation.split(', ');
        locObj = {
          name: selectedLocation,
          address: selectedLocation,
          city: locationParts[0] || '',
          state: locationParts[1] || '',
          lat: null,
          lng: null,
          type: locationType === 'source' ? 'SOURCE' : 'DESTINATION',
        };
      }
      updateRouteData(locationType, locObj);
    }
  };

  const updateRouteData = (locationType, locObj) => {
    const updates = {
      ...routeData,
      [`${locationType}Location`]: {
        address: locObj.address || locObj.name,
        lat: locObj.lat,
        lng: locObj.lng,
        city: locObj.city,
        state: locObj.state,
        id: locObj._id || locObj.id,
      }
    };
    if (onRouteUpdate && typeof onRouteUpdate === 'function') {
      onRouteUpdate(updates);
    }
  };

  // Called after map modal and API
  const handleAddNewLocation = (locationType, locationObj) => {
    setLocationOptions(prev => [...prev, locationObj]);
    updateRouteData(locationType, locationObj);
  };

  // Open map modal for add new (used by both dropdown and map button)
  const handleRequestAddNew = (locationType, clearSearch) => {
    setCurrentLocationType(locationType);
    setIsAddingLocation(true);
    setIsMapsModalOpen(true);
    if (clearSearch) clearSearch();
  };

  // Called when user selects location in map modal for add new
  const handleMapAddNewLocation = async (locationData) => {
    if (!currentLocationType) return;
    setIsMapsModalOpen(false);
    setIsAddingLocation(false);
    try {
      // Compose payload for API
      const payload = {
        type: currentLocationType === 'source' ? 'SOURCE' : 'DESTINATION',
        name: locationData.address || locationData.name || '',
        address: locationData.address || '',
        city: locationData.city || '',
        state: locationData.state || '',
        pincode: locationData.pincode || '', // Include pincode
        lat: locationData.lat,
        lng: locationData.lng,
      };
      const created = await createLocation(payload);
      setLocationOptions(prev => [...prev, created]);
      updateRouteData(currentLocationType, created);
    } catch (err) {
      alert('Failed to add location. Please try again.');
    }
  };

  // Delete location handler
  const handleDeleteLocation = async (option) => {
    setDeletingLocation(option);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDeleteLocation = async (locationId) => {
    setIsDeleteModalOpen(false);
    setDeletingLocation(null);
    try {
      await deleteLocation(locationId);
      await loadLocations(); // Refresh list from API

      // Clear selected location if it was deleted
      if (routeData.sourceLocation?.id === locationId) {
        onRouteUpdate({
          ...routeData,
          sourceLocation: null,
        });
      }
      if (routeData.destLocation?.id === locationId) {
        onRouteUpdate({
          ...routeData,
          destLocation: null,
        });
      }
    } catch (err) {
      alert('Failed to delete location.');
    }
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

  // Merge saved locations with predictions
  const getOptions = (type) => {
    const saved = locationOptions.filter(l => l.type === (type === 'source' ? 'SOURCE' : 'DESTINATION'));
    return [...predictions, ...saved];
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
              options={getOptions('source')}
              selectedOption={routeData.sourceLocation?.address || ''}
              onSelect={(location) => handleLocationDropdownSelect('source', location)}
              onSearchChange={handleSearchChange}
              onRequestAddNew={(searchTerm, clearSearch) => handleRequestAddNew('source', clearSearch)}
              onDeleteOption={handleDeleteLocation}
              placeholder={loadingLocations ? 'Loading...' : 'Select source location or search Google Maps'}
              addNewLabel="Add new location"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRequestAddNew('source')}
            className="map-select-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
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
              options={getOptions('dest')}
              selectedOption={routeData.destLocation?.address || ''}
              onSelect={(location) => handleLocationDropdownSelect('dest', location)}
              onSearchChange={handleSearchChange}
              onRequestAddNew={(searchTerm, clearSearch) => handleRequestAddNew('dest', clearSearch)}
              onDeleteOption={handleDeleteLocation}
              placeholder={loadingLocations ? 'Loading...' : 'Select destination location or search Google Maps'}
              addNewLabel="Add new location"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRequestAddNew('dest')}
            className="map-select-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
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
          onClose={() => {
            setIsMapsModalOpen(false);
            setIsAddingLocation(false);
          }}
          onApply={isAddingLocation
            ? handleMapAddNewLocation
            : (locationData) => handleLocationSelect(currentLocationType, locationData)
          }
          initialLocation={routeData[`${currentLocationType}Location`]}
        />
      )}

      {/* Delete Location Modal */}
      <DeleteLocationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingLocation(null);
        }}
        onConfirm={confirmDeleteLocation}
        location={deletingLocation}
        isLoading={false} // You can add a loading state if needed
      />
    </fieldset>
  );
};

export default RouteCreator;