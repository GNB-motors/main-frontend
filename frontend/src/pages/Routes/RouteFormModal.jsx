/**
 * Route Form Modal - Reusable modal component for adding/editing routes
 * Can be used in different contexts throughout the application
 */

import React from 'react';
import { X } from 'lucide-react';
import './RouteFormModal.css';

const RouteFormModal = ({
  isOpen,
  title,
  formData,
  onClose,
  onSubmit,
  onInputChange,
  onLocationChange,
  submitButtonText = 'Save Route',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="route-modal-overlay" onClick={onClose}>
      <div className="route-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="route-modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="route-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="route-modal-body">
          {/* Route Name */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label htmlFor="route-name">Route Name *</label>
              <input
                id="route-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                placeholder="e.g., Mumbai to Delhi Express"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="distance">Distance (KM) *</label>
              <input
                id="distance"
                type="number"
                name="distanceKm"
                value={formData.distanceKm}
                onChange={onInputChange}
                placeholder="e.g., 1400"
                className="form-input"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* Source Location */}
          <div className="form-section">
            <h3>Source Location</h3>
            <div className="location-grid">
              <div className="form-group">
                <label htmlFor="source-address">Address *</label>
                <input
                  id="source-address"
                  type="text"
                  value={formData.sourceLocation.address}
                  onChange={(e) =>
                    onLocationChange('sourceLocation', 'address', e.target.value)
                  }
                  placeholder="Street address"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="source-city">City *</label>
                <input
                  id="source-city"
                  type="text"
                  value={formData.sourceLocation.city}
                  onChange={(e) =>
                    onLocationChange('sourceLocation', 'city', e.target.value)
                  }
                  placeholder="City"
                  className="form-input"
                  required
                  disabled
                />
              </div>
              <div className="form-group">
                <label htmlFor="source-state">State</label>
                <input
                  id="source-state"
                  type="text"
                  value={formData.sourceLocation.state}
                  onChange={(e) =>
                    onLocationChange('sourceLocation', 'state', e.target.value)
                  }
                  placeholder="State"
                  className="form-input"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Destination Location */}
          <div className="form-section">
            <h3>Destination Location</h3>
            <div className="location-grid">
              <div className="form-group">
                <label htmlFor="dest-address">Address *</label>
                <input
                  id="dest-address"
                  type="text"
                  value={formData.destLocation.address}
                  onChange={(e) =>
                    onLocationChange('destLocation', 'address', e.target.value)
                  }
                  placeholder="Street address"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="dest-city">City *</label>
                <input
                  id="dest-city"
                  type="text"
                  value={formData.destLocation.city}
                  onChange={(e) =>
                    onLocationChange('destLocation', 'city', e.target.value)
                  }
                  placeholder="City"
                  className="form-input"
                  required
                  disabled
                />
              </div>
              <div className="form-group">
                <label htmlFor="dest-state">State</label>
                <input
                  id="dest-state"
                  type="text"
                  value={formData.destLocation.state}
                  onChange={(e) =>
                    onLocationChange('destLocation', 'state', e.target.value)
                  }
                  placeholder="State"
                  className="form-input"
                  disabled
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="route-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleFormSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteFormModal;
