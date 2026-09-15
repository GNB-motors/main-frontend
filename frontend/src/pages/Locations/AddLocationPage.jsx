/**
 * Add/Edit Location Page
 * Form to create or update a location with side-by-side map
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLoadScript } from '@react-google-maps/api';
import LocationService from './LocationService';
import PageHeader from '../Drivers/Component/PageHeader.jsx';
import { extractLocationDetails } from './addLocationLogic';
import { AddLocationFormFields } from './AddLocationFormFields';
import { AddLocationMap } from './AddLocationMap';
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

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: null,
    lng: null,
  });

  // Load existing data if editing
  useEffect(() => {
    const editing = location?.state?.editingLocation;
    if (editing) {
      setIsEdit(true);
      setLocationId(editing._id || editing.id);
      setFormData({
        name: editing.name || '',
        address: editing.address || '',
        city: editing.city || '',
        state: editing.state || '',
        pincode: editing.pincode || '',
        lat: editing.lat || null,
        lng: editing.lng || null,
      });
      setSearchValue(editing.address || ''); // Initialize search with address
      if (editing.lat && editing.lng) {
        setMapCenter({ lat: editing.lat, lng: editing.lng });
      }
    }
  }, [location?.state?.editingLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateFormWithLocation = (details) => {
    setFormData((prev) => ({
      ...prev,
      address: details.address,
      city: details.city,
      state: details.state,
      pincode: details.pincode,
      lat: details.lat,
      lng: details.lng,
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
          toast.info('Pincode not found for this location. Please enter it manually.');
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
          toast.info('Pincode not found. Please enter manually.');
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
      if (!formData.name.trim()) {
        toast.error('Pump Location Name is required');
        setIsSubmitting(false);
        return;
      }

      const payload = { ...formData };
      if (!payload.lat) delete payload.lat;
      if (!payload.lng) delete payload.lng;

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
      <PageHeader
        backLabel="Locations"
        backPath="/locations"
        title={isEdit ? 'Edit Pump Location' : 'Add New Pump Location'}
        description={
          isEdit
            ? "Update this pump location's details or drag the pin to correct its position."
            : 'Search an address, drop a pin on the map, or type the details in directly.'
        }
        onBack={() => navigate('/locations')}
      />

      <div
        className="location-container location-split-view"
        style={{ padding: '24px', maxWidth: '100%', margin: '24px' }}
      >
        <AddLocationFormFields
          isEdit={isEdit}
          isSubmitting={isSubmitting}
          formData={formData}
          onInputChange={handleInputChange}
          isLoaded={isLoaded}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          onSuggestionSelect={handleSuggestionSelect}
          onSearchEnter={handleSearchEnter}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/locations')}
        />

        <AddLocationMap
          isLoaded={isLoaded}
          mapCenter={mapCenter}
          formData={formData}
          mapRef={mapRef}
          onMapClick={handleMapClick}
          onMarkerDragEnd={handleMarkerDragEnd}
        />
      </div>
    </div>
  );
};

export default AddLocationPage;
