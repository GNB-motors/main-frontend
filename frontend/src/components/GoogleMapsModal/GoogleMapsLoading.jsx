import React from 'react';
import { X } from 'lucide-react';

const GoogleMapsLoading = ({ handleClose }) => (
  <div className="google-maps-modal-overlay">
    <div className="google-maps-modal-content">
      <div className="google-maps-modal-header">
        <h2>Select Location</h2>
        <button
          className="close-button"
          onClick={handleClose}
          type="button"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>
      <div
        className="google-maps-modal-body"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#475569', marginBottom: '8px', fontWeight: 500 }}>
            Loading Google Maps...
          </p>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Please wait while the map initializes.
          </p>
        </div>
      </div>
      <div className="google-maps-modal-footer">
        <button className="btn btn-secondary" onClick={handleClose} type="button">
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default GoogleMapsLoading;
