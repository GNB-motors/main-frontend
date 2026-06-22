import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Loader2, Save, CheckCircle } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import apiClient from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const libraries = ['places'];

const LocationAutocomplete = ({ value, onChange, onLocationSelect, placeholder = "Search location...", orgId, allowCustomText = true }) => {
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
      placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
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
        const headers = orgId ? { 'X-Org-Id': orgId } : undefined;
        const res = await apiClient.get('/api/locations', { params: { search, limit: 10 }, headers });
        setSavedLocations(res.data?.results || []);
      } catch (err) {
        console.error("Failed to fetch saved locations", err);
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
          }
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
      if (!placesServiceRef.current) throw new Error("Places API not ready");

      // 1. Get Place Details
      const details = await new Promise((resolve, reject) => {
        placesServiceRef.current.getDetails(
          {
            placeId,
            fields: ['name', 'formatted_address', 'geometry', 'address_components'],
            sessionToken: sessionTokenRef.current
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) resolve(place);
            else reject(new Error("Failed to get place details"));
          }
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
      const headers = orgId ? { 'X-Org-Id': orgId } : undefined;
      const payload = {
        name: details.name || description,
        address: details.formatted_address || '',
        city,
        state,
        pincode,
        lat: details.geometry?.location?.lat() || undefined,
        lng: details.geometry?.location?.lng() || undefined,
      };

      const res = await apiClient.post('/api/locations', payload, { headers });
      const newLoc = res.data?.data || res.data;
      toast.success('Location saved successfully!');
      
      // Refresh session token
      if (window.google) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }

      // Automatically select it
      handleSelect(newLoc.name, newLoc);
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to save location');
    } finally {
      setSavingLocationId(null);
    }
  };

  return (
    <div className="dropdown-wrapper" ref={wrapperRef} style={{ zIndex: isOpen ? 200 : undefined }}>
      <button 
        type="button" 
        className="dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ flex: 1, textAlign: 'left', color: value ? '#1e293b' : '#94a3b8' }}>
          {value || placeholder}
        </span>
        {value && (
          <span 
            role="button" 
            style={{ flex: 'none', lineHeight: 1, padding: '0 4px', color: '#94a3b8', fontSize: 16 }} 
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
          <div style={{ position: 'sticky', top: 0, background: 'white', padding: '8px', zIndex: 10, borderBottom: '1px solid #e2e8f0' }}>
            <input 
              type="text" 
              placeholder="Search locations..." 
              className="dropdown-search" 
              style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '10px 12px' }}
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              onClick={(e) => e.stopPropagation()} 
              autoFocus
            />
          </div>
          
          <div className="dropdown-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            
            {/* SAVED LOCATIONS SECTION */}
            <div className="dropdown-group-label" style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Saved Locations
            </div>
            {loadingSaved ? (
              <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="spinning" /> Searching database...
              </div>
            ) : savedLocations.length === 0 ? (
              <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>No saved locations found</div>
            ) : (
              savedLocations.map(l => (
                <button 
                  key={l._id} 
                  type="button"
                  className={`dropdown-item ${value === l.name ? 'selected' : ''}`}
                  onClick={() => handleSelect(l.name, l)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', width: '100%', border: 'none', background: value === l.name ? '#eff6ff' : 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}
                >
                  <div style={{ fontWeight: 600, color: value === l.name ? '#2563eb' : '#334155', fontSize: '14px' }}>{l.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>{[l.city, l.address].filter(Boolean).join(', ')}</div>
                </button>
              ))
            )}

            {/* GLOBAL MAPS SECTION */}
            {(search.length > 2 || googlePredictions.length > 0) && (
              <>
                <div className="dropdown-group-label" style={{ padding: '12px 12px 4px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: 8, borderTop: '1px solid #e2e8f0' }}>
                  Global Search Results
                </div>
                {loadingGoogle ? (
                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Loader2 size={14} className="spinning" /> Searching globally...
                  </div>
                ) : googlePredictions.length === 0 ? (
                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>No matches found globally</div>
                ) : (
                  googlePredictions.map((pred) => {
                    const isSavingThis = savingLocationId === pred.place_id;
                    return (
                      <div 
                        key={pred.place_id} 
                        className="dropdown-item"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', width: '100%', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        // If they click the item without saving, we can only emit the string name because we don't have an ID
                        // But if allowCustomText is false (e.g. for Source/Dest), we MUST require them to save it first to get an ID!
                        onClick={() => {
                          if (allowCustomText) {
                            handleSelect(pred.structured_formatting?.main_text || pred.description);
                          } else {
                            toast.warning("Please click 'Save' to use this new location.");
                          }
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{pred.structured_formatting?.main_text || pred.description}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>{pred.structured_formatting?.secondary_text}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => saveGoogleLocation(e, pred.place_id, pred.description)}
                          disabled={isSavingThis}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', 
                            borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', 
                            color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: isSavingThis ? 'not-allowed' : 'pointer',
                            opacity: isSavingThis ? 0.7 : 1
                          }}
                        >
                          {isSavingThis ? <Loader2 size={12} className="spinning" /> : <Save size={12} />}
                          Save
                        </button>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* QUICK ADD CUSTOM TEXT */}
            {search.length > 0 && !loadingSaved && savedLocations.length === 0 && allowCustomText && (
               <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
                 <button 
                  type="button" 
                  onClick={() => handleSelect(search)}
                  style={{ width: '100%', padding: '8px', background: '#eff6ff', color: '#2563eb', border: '1px dashed #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                 >
                   Use "{search}" as location
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
