import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import RouteService from './RouteService';
import GoogleMapsModal from '../../components/GoogleMapsModal/GoogleMapsModal';
import './RoutesPage.css';

const AddRoutePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sourceLocation: { address: '', city: '', state: '', lat: null, lng: null },
    destLocation: { address: '', city: '', state: '', lat: null, lng: null },
    distanceKm: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [routeId, setRouteId] = useState(null);
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [currentLocationType, setCurrentLocationType] = useState(null); // 'source' or 'destination'

  const location = useLocation();

  useEffect(() => {
    const editing = location?.state?.editingRoute;
    if (editing) {
      setIsEdit(true);
      setRouteId(editing._id);
      setFormData({
        name: editing.name || '',
        sourceLocation: editing.sourceLocation || { address: '', city: '', state: '', lat: null, lng: null },
        destLocation: editing.destLocation || { address: '', city: '', state: '', lat: null, lng: null },
        distanceKm: editing.distanceKm || ''
      });
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (locationType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: value
      }
    }));
  };

  const handleOpenMapsModal = (locationType) => {
    setCurrentLocationType(locationType);
    setIsMapsModalOpen(true);
  };

  const handleApplyLocation = (locationData) => {
    const locationType = currentLocationType === 'source' ? 'sourceLocation' : 'destLocation';
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        lat: locationData.lat,
        lng: locationData.lng
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.name.trim()) {
        toast.error('Route name is required');
        return;
      }
      if (!formData.sourceLocation.address || !formData.sourceLocation.city) {
        toast.error('Source location is incomplete');
        return;
      }
      if (!formData.destLocation.address || !formData.destLocation.city) {
        toast.error('Destination location is incomplete');
        return;
      }
      if (!formData.distanceKm) {
        toast.error('Distance is required');
        return;
      }
      const payload = {
        ...formData,
        distanceKm: parseFloat(formData.distanceKm) || 0,
      };
      if (isEdit) {
        await RouteService.updateRoute(routeId, payload);
        toast.success('Route updated successfully');
      } else {
        await RouteService.createRoute(payload);
        toast.success('Route created successfully');
      }
      navigate('/routes');
    } catch (err) {
      const msg = err?.message || err?.detail || 'Failed to save route';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="routes-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            padding: 0
          }}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h2>{isEdit ? 'Edit Route' : 'Add New Route'}</h2>
      </div>
      <form className="routes-add-page-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Route Name *</label>
            <input name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Distance (KM) *</label>
            <input name="distanceKm" type="number" value={formData.distanceKm} onChange={handleInputChange} min="0" step="0.1" required />
          </div>
        </div>
        <div className="form-section">
          <h3>Source Location</h3>
          <div className="location-grid">
            <div className="form-group">
              <label>Address *</label>
              <div className="address-input-wrapper">
                <input
                  value={formData.sourceLocation.address}
                  onChange={e => handleLocationChange('sourceLocation', 'address', e.target.value)}
                  required
                  placeholder="Click to select location on map"
                />
                <button
                  type="button"
                  className="map-button"
                  onClick={() => handleOpenMapsModal('source')}
                  title="Select location on map"
                >
                  <MapPin size={16} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>City *</label>
              <input value={formData.sourceLocation.city} onChange={e => handleLocationChange('sourceLocation', 'city', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>State</label>
              <input value={formData.sourceLocation.state} onChange={e => handleLocationChange('sourceLocation', 'state', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="form-section">
          <h3>Destination Location</h3>
          <div className="location-grid">
            <div className="form-group">
              <label>Address *</label>
              <div className="address-input-wrapper">
                <input
                  value={formData.destLocation.address}
                  onChange={e => handleLocationChange('destLocation', 'address', e.target.value)}
                  required
                  placeholder="Click to select location on map"
                />
                <button
                  type="button"
                  className="map-button"
                  onClick={() => handleOpenMapsModal('destination')}
                  title="Select location on map"
                >
                  <MapPin size={16} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>City *</label>
              <input value={formData.destLocation.city} onChange={e => handleLocationChange('destLocation', 'city', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>State</label>
              <input value={formData.destLocation.state} onChange={e => handleLocationChange('destLocation', 'state', e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ marginLeft: 8 }} disabled={isSubmitting}>{isSubmitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Create Route')}</button>
        </div>
      </form>

      <GoogleMapsModal
        isOpen={isMapsModalOpen}
        onClose={() => setIsMapsModalOpen(false)}
        onApply={handleApplyLocation}
        initialLocation={
          currentLocationType === 'source'
            ? formData.sourceLocation.lat && formData.sourceLocation.lng
              ? { lat: formData.sourceLocation.lat, lng: formData.sourceLocation.lng }
              : null
            : formData.destLocation.lat && formData.destLocation.lng
              ? { lat: formData.destLocation.lat, lng: formData.destLocation.lng }
              : null
        }
      />
    </div>
  );
};

export default AddRoutePage;
