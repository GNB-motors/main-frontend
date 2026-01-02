import React, { useState, useEffect, forwardRef } from 'react';
import { MapPin } from 'lucide-react';
import './BasicInformationForm.css';

const BasicInformationForm = forwardRef(({
  initialData = {},
  locationData = {},
  onSubmit,
  onLocationChange,
  onOpenMapsModal,
  isSubmitting = false,
  isEdit = false
}, ref) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    distanceKm: initialData.distanceKm || '',
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        distanceKm: initialData.distanceKm || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="basic-info-wrapper">
      <div className="basic-info-outer-container">
        {/* Header Section */}
        <div className="basic-info-header">
          <div className="basic-info-header-content">
            <div className="basic-info-icon-wrapper">
              <MapPin size={20} color="#454547" />
            </div>
            <div className="basic-info-title">Routes Information</div>
          </div>
        </div>

        {/* Form Container */}
        <div className="basic-info-container">
          <form ref={ref} onSubmit={handleSubmit} className="basic-info-form">
            {/* Row 1: Route Name, Distance */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">Route Name *</label>
                <input
                  type="text"
                  className="basic-info-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Enter route name"
                />
              </div>

              <div className="basic-info-form-field">
                <label className="basic-info-label">Distance (KM) *</label>
                <input
                  type="number"
                  className="basic-info-input"
                  value={formData.distanceKm}
                  onChange={(e) => handleInputChange('distanceKm', e.target.value)}
                  required
                  placeholder="Enter distance"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Source Location Section */}
            <div className="location-section-header">
              <h4>Source Location</h4>
            </div>

            {/* Row 2: Source Address */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field full-width">
                <label className="basic-info-label">Address *</label>
                <div className="address-input-wrapper">
                  <input
                    type="text"
                    className="basic-info-input"
                    value={locationData.sourceLocation?.address || ''}
                    onClick={() => onOpenMapsModal('source')}
                    readOnly
                    required
                    placeholder="Click to select location on map"
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    className="map-button"
                    onClick={() => onOpenMapsModal('source')}
                    title="Select location on map"
                  >
                    <MapPin size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Source City, State */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">City *</label>
                <input
                  type="text"
                  className="basic-info-input"
                  value={locationData.sourceLocation?.city || ''}
                  onClick={() => onOpenMapsModal('source')}
                  readOnly
                  required
                  placeholder="Click to select location on map"
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="basic-info-form-field">
                <label className="basic-info-label">State</label>
                <input
                  type="text"
                  className="basic-info-input"
                  value={locationData.sourceLocation?.state || ''}
                  onClick={() => onOpenMapsModal('source')}
                  readOnly
                  placeholder="Click to select location on map"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Destination Location Section */}
            <div className="location-section-header">
              <h4>Destination Location</h4>
            </div>

            {/* Row 4: Destination Address */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field full-width">
                <label className="basic-info-label">Address *</label>
                <div className="address-input-wrapper">
                  <input
                    type="text"
                    className="basic-info-input"
                    value={locationData.destLocation?.address || ''}
                    onClick={() => onOpenMapsModal('destination')}
                    readOnly
                    required
                    placeholder="Click to select location on map"
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    className="map-button"
                    onClick={() => onOpenMapsModal('destination')}
                    title="Select location on map"
                  >
                    <MapPin size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 5: Destination City, State */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">City *</label>
                <input
                  type="text"
                  className="basic-info-input"
                  value={locationData.destLocation?.city || ''}
                  onClick={() => onOpenMapsModal('destination')}
                  readOnly
                  required
                  placeholder="Click to select location on map"
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="basic-info-form-field">
                <label className="basic-info-label">State</label>
                <input
                  type="text"
                  className="basic-info-input"
                  value={locationData.destLocation?.state || ''}
                  onClick={() => onOpenMapsModal('destination')}
                  readOnly
                  placeholder="Click to select location on map"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

BasicInformationForm.displayName = 'BasicInformationForm';

export default BasicInformationForm;