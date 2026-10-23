import React from 'react';
import { X } from 'lucide-react';
import GOOGLE_MAPS_API_KEY from './googleMapsApiKey';

const GoogleMapsLoadError = ({ loadError, handleClose }) => (
  <div className="google-maps-modal-overlay">
    <div className="google-maps-modal-content">
      <div className="google-maps-modal-header">
        <h2>Error Loading Google Maps</h2>
        <button
          className="close-button"
          onClick={handleClose}
          type="button"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>
      <div className="google-maps-modal-body">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Failed to load Google Maps. Please check your API key configuration.</p>
          <p>
            <strong>Error:</strong> {loadError.message}
          </p>
          <p>
            <strong>API Key:</strong> {GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set'}
          </p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Make sure the Google Maps JavaScript API is enabled in your Google Cloud Console and the
            API key has no domain restrictions or the correct domains are allowed.
          </p>
        </div>
      </div>
      <div className="google-maps-modal-footer">
        <button className="btn btn-secondary" onClick={handleClose} type="button">
          Close
        </button>
      </div>
    </div>
  </div>
);

export default GoogleMapsLoadError;
