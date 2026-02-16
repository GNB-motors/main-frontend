/**
 * Add/Edit Location Page
 * Form to create or update a location
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, Save, X } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import LocationService from './LocationService';
import GoogleMapsModal from '../../components/GoogleMapsModal/GoogleMapsModal';
import GoogleMapsSearch from '../../components/GoogleMapsModal/GoogleMapsSearch';
import './LocationPage.css';

const GOOGLE_MAPS_LIBRARIES = ['places'];

const AddLocationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [locationId, setLocationId] = useState(null);
    const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

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
        lat: null,
        lng: null
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
                lat: editing.lat || null,
                lng: editing.lng || null
            });
            setSearchValue(editing.address || ''); // Initialize search with address
        }
    }, [location?.state?.editingLocation]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyLocation = (locationDataFromMap) => {
        // When coming from the map modal, we might not have the pincode unless we reverse geocode specifically for it.
        // For now, we trust the map's address/city/state/lat/lng.
        // Attempt to extract pincode from address string if possible or leave as is.

        let extractedPincode = formData.pincode;
        // Simple regex to find 6 digit pincode in address if not already present
        const pinMatch = locationDataFromMap.address.match(/\b\d{6}\b/);
        if (pinMatch) {
            extractedPincode = pinMatch[0];
        }

        setFormData(prev => ({
            ...prev,
            address: locationDataFromMap.address,
            city: locationDataFromMap.city,
            state: locationDataFromMap.state,
            pincode: extractedPincode,
            lat: locationDataFromMap.lat,
            lng: locationDataFromMap.lng
        }));
        setSearchValue(locationDataFromMap.address);
    };

    const handleSuggestionSelect = (suggestion) => {
        if (!window.google) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();
                const address = results[0].formatted_address;

                const addressComponents = results[0].address_components || [];
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
                if (!pincode) {
                    const pinMatch = address.match(/\b\d{6}\b/);
                    if (pinMatch) {
                        pincode = pinMatch[0];
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    address,
                    city,
                    state,
                    pincode,
                    lat,
                    lng
                }));
                setSearchValue(address);
                setSearchValue(suggestion.description);

                if (!pincode) {
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
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();
                const address = results[0].formatted_address;

                const addressComponents = results[0].address_components || [];
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

                // Fallback: Try regex on formatted address
                if (!pincode) {
                    const pinMatch = address.match(/\b\d{6}\b/);
                    if (pinMatch) {
                        pincode = pinMatch[0];
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    address,
                    city,
                    state,
                    pincode,
                    lat,
                    lng
                }));
                setSearchValue(address);

                if (!pincode) {
                    toast.info("Pincode not found. Please enter manually.");
                }
            }
        });
    };


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
                toast.error('Pincode is required'); // Enforce pincode if desired
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

    return (
        <div className="location-page">
            {/* Header */}
            <div className="location-header">
                <h1>{isEdit ? 'Edit Location' : 'Add New Location'}</h1>
                <button className="btn btn-secondary" onClick={() => navigate('/locations')}>
                    <X size={18} />
                    Cancel
                </button>
            </div>

            <div className="location-container" style={{ padding: '24px', maxWidth: '800px', margin: '24px auto' }}>
                <form onSubmit={handleSubmit}>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>Location Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="search-input" /* reusing input style */
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
                                    className="search-input-wrapper-form" // You might need to add specific styling
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsMapsModalOpen(true)}
                                title="Select on Map"
                                style={{ height: '46px' }} // Match input height
                            >
                                <MapPin size={18} />
                            </button>
                        </div>
                        {/* Hidden input to ensure state binding if needed for some logic, but search drives it */}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                        <div className="form-group">
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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

            <GoogleMapsModal
                isOpen={isMapsModalOpen}
                onClose={() => setIsMapsModalOpen(false)}
                onApply={handleApplyLocation}
                initialLocation={
                    formData.lat && formData.lng
                        ? { lat: formData.lat, lng: formData.lng }
                        : null
                }
            />
        </div>
    );
};

export default AddLocationPage;
