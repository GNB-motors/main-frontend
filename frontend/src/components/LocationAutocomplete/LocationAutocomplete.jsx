import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Loader2, Save, CheckCircle } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import SavedLocationService from '../../services/SavedLocationService';
import { toast } from 'react-toastify';
import logger from '../../utils/logger';
import GooglePredictionsSection from './GooglePredictionsSection';

const libraries = ['places'];

const LocationAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Search location...',
  orgId,
  allowCustomText = true,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Data states
  const [savedLocations, setSavedLocations] = useState([]);
  const [googlePredictions, setGooglePredictions] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [savingLocationId, setSavingLocationId] = useState(null);

  // Refs
  const wrapperRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Google Maps Services
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      // We need a dummy element for PlacesService
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement('div'),
      );
    }
  }, [isLoaded]);

  // Fetch both saved locations and google maps predictions when search changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Always fetch saved locations to show some default list
    setLoadingSaved(true);
    debounceRef.current = setTimeout(async () => {
      // 1. Fetch from our backend
      try {
        setSavedLocations(await SavedLocationService.searchLocations({ search, orgId }));
      } catch (err) {
        logger.warn('LocationAutocomplete', 'Failed to fetch saved locations', err);
      } finally {
        setLoadingSaved(false);
      }

      // 2. Fetch from Google Maps if search has length > 2
      if (search.length > 2 && autocompleteServiceRef.current && isLoaded) {
        setLoadingGoogle(true);
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: search,
            sessionToken: sessionTokenRef.current,
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setGooglePredictions(predictions);
            } else {
              setGooglePredictions([]);
            }
            setLoadingGoogle(false);
          },
        );
      } else {
        setGooglePredictions([]);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search, isLoaded, orgId]);

  const handleSelect = (locationName, locationObj = null) => {
    if (onChange) onChange(locationName);
    if (onLocationSelect && locationObj) onLocationSelect(locationObj);
    setIsOpen(false);
    setSearch('');
  };

  const saveGoogleLocation = async (e, placeId, description) => {
    e.stopPropagation(); // Prevent handleSelect from firing
    setSavingLocationId(placeId);

    try {
      if (!placesServiceRef.current) throw new Error('Places API not ready');

      // 1. Get Place Details
      const details = await new Promise((resolve, reject) => {
        placesServiceRef.current.getDetails(
          {
            placeId,
            fields: ['name', 'formatted_address', 'geometry', 'address_components'],
            sessionToken: sessionTokenRef.current,
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) resolve(place);
            else reject(new Error('Failed to get place details'));
          },
        );
      });

      // 2. Extract city/state
      let city = '';
      let state = '';
      let pincode = '';
      if (details.address_components) {
        for (const comp of details.address_components) {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('postal_code')) pincode = comp.long_name;
        }
      }

      // 3. Post to our DB
      const payload = {
        name: details.name || description,
        address: details.formatted_address || '',
        city,
        state,
        pincode,
        lat: details.geometry?.location?.lat() || undefined,
        lng: details.geometry?.location?.lng() || undefined,
      };

      const newLoc = await SavedLocationService.createLocation(payload, { orgId });
      toast.success('Location saved successfully!');

      // Refresh session token
      if (window.google) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }

      // Automatically select it
      handleSelect(newLoc.name, newLoc);
    } catch (err) {
      logger.warn('LocationAutocomplete', 'Failed to save location', err);
      toast.error('Failed to save location');
    } finally {
      setSavingLocationId(null);
    }
  };

  return (
    <div className="dropdown-wrapper" ref={wrapperRef} style={{ zIndex: isOpen ? 200 : undefined }}>
      <button id={id} type="button" className="dropdown-button" onClick={() => setIsOpen(!isOpen)}>
        <span style={{ flex: 1, textAlign: 'left', color: value ? '#1e293b' : '#94a3b8' }}>
          {value || placeholder}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (onChange) onChange('');
                if (onLocationSelect) onLocationSelect(null);
              }
            }}
            style={{
              flex: 'none',
              lineHeight: 1,
              padding: '0 4px',
              color: '#94a3b8',
              fontSize: 16,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onChange) onChange('');
              if (onLocationSelect) onLocationSelect(null);
            }}
          >
            ×
          </span>
        )}
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} style={{ color: '#94a3b8' }} />
      </button>

      {isOpen && (
        <div className="dropdown-menu" style={{ width: '100%', minWidth: '300px' }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: 'white',
              padding: '8px',
              zIndex: 10,
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <input
              type="text"
              aria-label="Search locations"
              placeholder="Search locations..."
              className="dropdown-search"
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                padding: '10px 12px',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- search box of the dropdown the user just opened
              autoFocus
            />
          </div>

          <div className="dropdown-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {/* SAVED LOCATIONS SECTION */}
            <div
              className="dropdown-group-label"
              style={{
                padding: '8px 12px 4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Saved Locations
            </div>
            {loadingSaved ? (
              <div
                style={{
                  padding: '8px 12px',
                  color: '#94a3b8',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Loader2 size={14} className="spinning" /> Searching database...
              </div>
            ) : savedLocations.length === 0 ? (
              <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>
                No saved locations found
              </div>
            ) : (
              savedLocations.map((l) => (
                <button
                  key={l._id}
                  type="button"
                  className={`dropdown-item ${value === l.name ? 'selected' : ''}`}
                  onClick={() => handleSelect(l.name, l)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    width: '100%',
                    border: 'none',
                    background: value === l.name ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: value === l.name ? '#2563eb' : '#334155',
                      fontSize: '14px',
                    }}
                  >
                    {l.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                    {[l.city, l.address].filter(Boolean).join(', ')}
                  </div>
                </button>
              ))
            )}

            {/* GLOBAL MAPS SECTION */}
            {(search.length > 2 || googlePredictions.length > 0) && (
              <GooglePredictionsSection
                loadingGoogle={loadingGoogle}
                googlePredictions={googlePredictions}
                savingLocationId={savingLocationId}
                allowCustomText={allowCustomText}
                handleSelect={handleSelect}
                saveGoogleLocation={saveGoogleLocation}
              />
            )}

            {/* QUICK ADD CUSTOM TEXT */}
            {search.length > 0 &&
              !loadingSaved &&
              savedLocations.length === 0 &&
              allowCustomText && (
                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleSelect(search)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px dashed #bfdbfe',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Use &quot;{search}&quot; as location
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
