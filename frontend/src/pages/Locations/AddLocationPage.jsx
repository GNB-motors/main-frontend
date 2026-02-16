/**
 * Add/Edit Location Page
 * Form to create or update a location with side-by-side map
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, Save, X } from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import LocationService from './LocationService';
import GoogleMapsSearch from '../../components/GoogleMapsModal/GoogleMapsSearch';
import './LocationPage.css';

const GOOGLE_MAPS_LIBRARIES = ['places'];

const AddLocationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [locationId, setLocationId] = useState(null);
    const [searchValue, setSearchValue] = useState('');

    const mapRef = useRef(null);
    const [mapCenter, setMapCenter] = useState({ lat: 22.5726, lng: 88.3639 }); // Default Kolkata

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'SOURCE', // Default to SOURCE
        address: '',
        city: '',
        state: '',
        pincode: '',
        lat: 22.5726, // Initialize with defaults or null, but map needs valid lat/lng to render marker
        lng: 88.3639
    });

    // Load existing data if editing
    useEffect(() => {
        const editing = location?.state?.editingLocation;
        if (editing) {
            setIsEdit(true);
            setLocationId(editing._id || editing.id);
            setFormData({
                name: editing.name || '',
                type: editing.type || 'SOURCE',
                address: editing.address || '',
                city: editing.city || '',
                state: editing.state || '',
                pincode: editing.pincode || '',
                lat: editing.lat || 22.5726,
                lng: editing.lng || 88.3639
            });
            setSearchValue(editing.address || ''); // Initialize search with address
            if (editing.lat && editing.lng) {
                setMapCenter({ lat: editing.lat, lng: editing.lng });
            }
        }
    }, [location?.state?.editingLocation]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

        return { lat, lng, address, city, state, pincode };
    };

    const updateFormWithLocation = (details) => {
        setFormData(prev => ({
            ...prev,
            address: details.address,
            city: details.city,
            state: details.state,
            pincode: details.pincode,
            lat: details.lat,
            lng: details.lng
        }));
        setSearchValue(details.address);
        setMapCenter({ lat: details.lat, lng: details.lng });
    };

    const handleSuggestionSelect = (suggestion) => {
        if (!window.google) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const details = extractLocationDetails(results[0]);
                updateFormWithLocation(details);
                setSearchValue(suggestion.description);

                if (!details.pincode) {
                    toast.info("Pincode not found for this location. Please enter it manually.");
                }
            } else {
                console.error('Geocoding failed for place_id:', suggestion.place_id, status);
                toast.error('Failed to get location details');
            }
        });
    };

    // Handle Enter key in search box
    const handleSearchEnter = (typedAddress) => {
        if (!window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: typedAddress }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const details = extractLocationDetails(results[0]);
                updateFormWithLocation(details);
                if (!details.pincode) {
                    toast.info("Pincode not found. Please enter manually.");
                }
            }
        });
    };

    // Handle Map Click
    const handleMapClick = useCallback((event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const details = extractLocationDetails(results[0]);
                // Use clicked lat/lng for precision, but address details from geocoder
                updateFormWithLocation({ ...details, lat, lng });
            }
        });
    }, []);

    // Handle Marker Drag End
    const handleMarkerDragEnd = useCallback((event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const details = extractLocationDetails(results[0]);
                updateFormWithLocation({ ...details, lat, lng });
            }
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validation
            if (!formData.name.trim()) {
                toast.error('Location name is required');
                setIsSubmitting(false);
                return;
            }
            if (!formData.address.trim()) {
                toast.error('Address is required');
                setIsSubmitting(false);
                return;
            }
            if (!formData.pincode.trim()) {
                toast.error('Pincode is required');
                setIsSubmitting(false);
                return;
            }

            const payload = { ...formData };

            if (isEdit) {
                await LocationService.updateLocation(locationId, payload);
                toast.success('Location updated successfully');
            } else {
                await LocationService.createLocation(payload);
                toast.success('Location created successfully');
            }
            navigate('/locations');
        } catch (error) {
            const msg = error?.message || error?.detail || 'Failed to save location';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const mapContainerStyle = {
        width: '100%',
        height: '100%',
        borderRadius: '8px',
    };

    // Custom Marker Icon (reused from GoogleMapsModal)
    const markerIcon = window.google ? {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="50" height="49" viewBox="0 0 50 49" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.0561 48.4531C38.1543 48.4531 48.7724 37.835 48.7724 24.7368C48.7724 11.6387 38.1543 1.02051 25.0561 1.02051C11.958 1.02051 1.33984 11.6387 1.33984 24.7368C1.33984 37.835 11.958 48.4531 25.0561 48.4531Z" fill="white" fill-opacity="0.8" stroke="#FF8A00"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.9121 22.8976C19.9121 19.6725 22.536 17.0486 25.7612 17.0486C28.9864 17.0486 31.6102 19.6725 31.6103 22.8976C31.6103 26.9002 26.3759 32.7762 26.1531 33.0244C25.9441 33.2571 25.5787 33.2575 25.3693 33.0244C25.1465 32.7762 19.9121 26.9002 19.9121 22.8976ZM22.8183 22.8976C22.8183 24.5203 24.1384 25.8404 25.7611 25.8404C27.3837 25.8404 28.7039 24.5203 28.7039 22.8976C28.7039 21.275 27.3837 19.9548 25.7611 19.9548C24.1384 19.9548 22.8183 21.2749 22.8183 22.8976Z" fill="#FF6600"/>
            </svg>
        `),
        anchor: new window.google.maps.Point(25, 49),
    } : null;

    return (
        <div className="location-page">
            <div className="location-header">
                <h1>{isEdit ? 'Edit Location' : 'Add New Location'}</h1>
                <button className="btn btn-secondary" onClick={() => navigate('/locations')}>
                    <X size={18} />
                    Cancel
                </button>
            </div>

            <div className="location-container location-split-view" style={{ padding: '24px', maxWidth: '100%', margin: '24px' }}>
                {/* Left Side: Form */}
                <div className="location-form-panel">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Location Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="search-input"
                                style={{ maxWidth: '100%' }}
                                placeholder="e.g. Warehouse 1, Main Office"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Location Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="search-input"
                                style={{ maxWidth: '100%' }}
                            >
                                <option value="SOURCE">Source (Pickup)</option>
                                <option value="DESTINATION">Destination (Drop-off)</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Address</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <GoogleMapsSearch
                                        isLoaded={isLoaded}
                                        searchValue={searchValue}
                                        setSearchValue={setSearchValue}
                                        onSuggestionSelect={handleSuggestionSelect}
                                        onEnter={handleSearchEnter}
                                        className="search-input-wrapper-form"
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="search-input"
                                    style={{ maxWidth: '100%' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="search-input"
                                    style={{ maxWidth: '100%' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleInputChange}
                                className="search-input"
                                style={{ maxWidth: '100%' }}
                                placeholder="e.g. 700001"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Latitude</label>
                                <input
                                    type="number"
                                    name="lat"
                                    value={formData.lat || ''}
                                    readOnly
                                    className="search-input"
                                    style={{ maxWidth: '100%', backgroundColor: '#f1f5f9' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Longitude</label>
                                <input
                                    type="number"
                                    name="lng"
                                    value={formData.lng || ''}
                                    readOnly
                                    className="search-input"
                                    style={{ maxWidth: '100%', backgroundColor: '#f1f5f9' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/locations')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Location' : 'Save Location')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Side: Map */}
                <div className="location-map-panel">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={15}
                            onClick={handleMapClick}
                            onLoad={(map) => {
                                mapRef.current = map;
                            }}
                            options={{
                                draggableCursor: 'pointer',
                                draggingCursor: 'pointer',
                                streetViewControl: false,
                                mapTypeControl: false,
                            }}
                        >
                            {formData.lat && formData.lng && (
                                <Marker
                                    position={{ lat: formData.lat, lng: formData.lng }}
                                    draggable={true}
                                    onDragEnd={handleMarkerDragEnd}
                                    icon={markerIcon}
                                />
                            )}
                        </GoogleMap>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            Loading Map...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddLocationPage;
