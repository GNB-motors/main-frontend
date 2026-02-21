import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, useLoadScript } from '@react-google-maps/api';
import { X, Check } from 'lucide-react';
import GoogleMapsSearch from './GoogleMapsSearch';
import './GoogleMapsModal.css';

// Static libraries array to prevent performance warnings
const GOOGLE_MAPS_LIBRARIES = ['places'];

const GoogleMapsModal = ({ isOpen, onClose, onApply, initialLocation = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || {
    lat: 22.5726,
    lng: 88.3639,
    address: 'Kolkata, West Bengal, India'
  });
  const [searchValue, setSearchValue] = useState(initialLocation?.address || 'Kolkata, West Bengal, India');
  const [mapCenter, setMapCenter] = useState({
    lat: initialLocation?.lat || 22.5726, // Kolkata latitude
    lng: initialLocation?.lng || 88.3639  // Kolkata longitude
  });
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Debug logging
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps Load Error:', loadError);
      console.log('API Key being used:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
    }
  }, [loadError]);

  useEffect(() => {
    // Only apply incoming initialLocation to internal state when it is provided.
    // Avoid force-resetting to the default (Kolkata) whenever initialLocation becomes falsy,
    // because that can unexpectedly override the parent's selected location.
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setMapCenter({ lat: initialLocation.lat, lng: initialLocation.lng });
      setSearchValue(initialLocation.address || '');
    }
  }, [initialLocation]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Manage Marker
  useEffect(() => {
    if (mapRef.current && selectedLocation && window.google?.maps?.Marker) {
      if (markerRef.current) {
        // Update position
        markerRef.current.setPosition({
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        });
      } else {
        // Create SVG string for the icon
        const svgString = `
          <svg width="50" height="49" viewBox="0 0 50 49" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.0561 48.4531C38.1543 48.4531 48.7724 37.835 48.7724 24.7368C48.7724 11.6387 38.1543 1.02051 25.0561 1.02051C11.958 1.02051 1.33984 11.6387 1.33984 24.7368C1.33984 37.835 11.958 48.4531 25.0561 48.4531Z" fill="white" fill-opacity="0.8" stroke="#FF8A00"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.9121 22.8976C19.9121 19.6725 22.536 17.0486 25.7612 17.0486C28.9864 17.0486 31.6102 19.6725 31.6103 22.8976C31.6103 26.9002 26.3759 32.7762 26.1531 33.0244C25.9441 33.2571 25.5787 33.2575 25.3693 33.0244C25.1465 32.7762 19.9121 26.9002 19.9121 22.8976ZM22.8183 22.8976C22.8183 24.5203 24.1384 25.8404 25.7611 25.8404C27.3837 25.8404 28.7039 24.5203 28.7039 22.8976C28.7039 21.275 27.3837 19.9548 25.7611 19.9548C24.1384 19.9548 22.8183 21.2749 22.8183 22.8976Z" fill="#FF6600"/>
          </svg>
        `;

        // Create marker with custom icon
        markerRef.current = new window.google.maps.Marker({
          map: mapRef.current,
          position: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng
          },
          draggable: true,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString),
            anchor: new window.google.maps.Point(25, 49), // Anchor at bottom center (half width, full height)
          },
        });

        // Add dragend listener
        markerRef.current.addListener('dragend', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          handleMapClick({ latLng: { lat: () => lat, lng: () => lng } });
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [selectedLocation]);

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };


  // Helper to extract location details including pincode
  const extractLocationDetails = (result) => {
    const lat = result.geometry.location.lat();
    const lng = result.geometry.location.lng();
    const address = result.formatted_address;

    const addressComponents = result.address_components || [];
    let city = '';
    let state = '';
    let pincode = '';

    addressComponents.forEach(component => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        pincode = component.long_name;
      }
    });

    // Fallback: Try regex on formatted address if pincode is still empty
    if (!pincode && address) {
      const pinMatch = address.match(/\b\d{6}\b/);
      if (pinMatch) {
        pincode = pinMatch[0];
      }
    }

    return { lat, lng, address, city, state, pincode, place_id: result.place_id };
  };

  const handleSuggestionSelect = async (suggestion) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const details = extractLocationDetails(results[0]);
          setSelectedLocation(details);
          setMapCenter({ lat: details.lat, lng: details.lng });
          setSearchValue(suggestion.description);
        } else {
          console.error('Geocoding failed for place_id:', suggestion.place_id, status);
        }
      });
    } catch (error) {
      console.error('Error selecting suggestion:', error);
    }
  };

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const details = extractLocationDetails(results[0]);
        // Override lat/lng with clicked position to be precise (geocoding might snap to nearest address)
        // Actually, for address creation, snapping to address is usually better, but let's keep clicked lat/lng if preferred.
        // But extractLocationDetails uses result.geometry.location, which is the address location.
        // Let's stick to the result's location for consistency with address, or use clicked if we want exact pin.
        // The previous code used clicked lat/lng but fetched address components.
        // Let's use the details but override lat/lng with the click if we want to support "middle of nowhere" pins?
        // Usually for "Location" entities, address-bound is better. Let's use the result from geocoder for consistency.

        // However, existing code used event lat/lng. Let's respect that intent but mix in the address details.
        setSelectedLocation({
          ...details,
          lat, // use clicked lat
          lng  // use clicked lng
        });
        setSearchValue(details.address);
      }
    });
  }, []); // extractLocationDetails is defined inside component but depends on nothing, but better to move it out or useRef? 
  // actually extractLocationDetails doesn't depend on state, so it can be defined outside or inside without deps.
  // BUT handleMapClick uses it, so it needs to be available. 
  // I will duplicate the helper or put it outside component in the same file to avoid dependency issues in useCallback.

  const handleApply = async () => {
    if (!selectedLocation) return;

    const needsGeocode = !selectedLocation.place_id || !selectedLocation.city || !selectedLocation.state;

    if (needsGeocode && searchValue && window.google) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const geocodePromise = new Promise((resolve, reject) => {
          geocoder.geocode({ address: searchValue }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('Geocode failed: ' + status));
            }
          });
        });

        const result = await geocodePromise;
        const details = extractLocationDetails(result);

        setSelectedLocation(details);
        if (onApply && typeof onApply === 'function') {
          onApply(details);
        }
        onClose();
        return;
      } catch (err) {
        console.warn('Geocoding failed during Apply:', err);
      }
    }

    // Default behavior: apply what's in selectedLocation
    if (onApply && typeof onApply === 'function') {
      onApply(selectedLocation);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Handle Enter key from the search input
  const handleEnter = async (typedAddress) => {
    try {
      if (!typedAddress || !window.google) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: typedAddress }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const details = extractLocationDetails(results[0]);
          setSelectedLocation(details);
          setMapCenter({ lat: details.lat, lng: details.lng });
          setSearchValue(details.address);
        } else {
          console.error('Geocoding failed for address:', typedAddress, status);
        }
      });
    } catch (error) {
      console.error('Error geocoding typed address:', error);
    }
  };

  if (!isOpen) return null;

  if (loadError) {
    return (
      <div className="google-maps-modal-overlay">
        <div className="google-maps-modal-content">
          <div className="google-maps-modal-header">
            <h2>Error Loading Google Maps</h2>
            <button className="close-button" onClick={handleClose}>
              <X size={24} />
            </button>
          </div>
          <div className="google-maps-modal-body">
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Failed to load Google Maps. Please check your API key configuration.</p>
              <p><strong>Error:</strong> {loadError.message}</p>
              <p><strong>API Key:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set'}</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Make sure the Google Maps JavaScript API is enabled in your Google Cloud Console
                and the API key has no domain restrictions or the correct domains are allowed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="google-maps-modal-overlay">
        <div className="google-maps-modal-content">
          <div className="google-maps-modal-body">
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Loading Google Maps...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="google-maps-modal-overlay">
      <div className="google-maps-modal-content">
        <div className="google-maps-modal-body">
          <div className="map-container">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={selectedLocation ? 15 : 5}
              onClick={handleMapClick}
              onLoad={(map) => {
                mapRef.current = map;
                map.setOptions({
                  draggableCursor: 'pointer',
                  draggingCursor: 'pointer',
                });
              }}
            >
              <GoogleMapsSearch
                isLoaded={isLoaded}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSuggestionSelect={handleSuggestionSelect}
                onEnter={handleEnter}
              />
            </GoogleMap>
          </div>
        </div>

        <div className="google-maps-modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!selectedLocation?.lat || !selectedLocation?.lng}
          >
            <Check size={18} />
            Apply Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsModal;