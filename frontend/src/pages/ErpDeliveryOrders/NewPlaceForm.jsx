import React, { useState } from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import GoogleMapsModal from '../../components/GoogleMapsModal/GoogleMapsModal';
import { useMutation } from '../../hooks/useMutation';
import ErpSiteService from '../../services/erpSiteService';
import {
  DEFAULT_RADIUS_M,
  MIN_RADIUS_M,
  MAX_RADIUS_M,
  canSaveNewPlace,
  declarePayload,
  suggestedName,
} from './doPlaces';

/**
 * Add a place the org hasn't saved yet: pin it on the map, name it, set its fence.
 * The server answers with an already-saved place when one covers the pin, so the
 * same plant is never stored twice; `onSaved(site, existing)` gets either.
 */
const NewPlaceForm = ({ roleLabel, onSaved, onCancel }) => {
  const [name, setName] = useState('');
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [location, setLocation] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const { mutate, loading, error } = useMutation(ErpSiteService.declare);

  const applyPin = (picked) => {
    setMapOpen(false);
    if (!picked) return;
    setLocation(picked);
    if (!name.trim()) setName(suggestedName(picked));
  };

  const save = async () => {
    if (!canSaveNewPlace({ name, location })) return;
    try {
      const { site, existing } = await mutate(declarePayload({ name, location, radiusM }));
      onSaved(site, existing);
    } catch {
      // useMutation already holds the error; it is rendered below.
    }
  };

  const message = error?.response?.data?.message || error?.message;

  return (
    <div className="erp-detail-block" style={{ marginTop: 8 }}>
      <div className="erp-form-grid">
        <div className="erp-field full">
          <label htmlFor={`new-place-pin-${roleLabel}`}>
            Location on the map <span className="required">*</span>
          </label>
          <button
            id={`new-place-pin-${roleLabel}`}
            type="button"
            className="btn btn-secondary"
            onClick={() => setMapOpen(true)}
          >
            <MapPin size={14} />
            {location ? 'Move the pin' : 'Pick on map'}
          </button>
          {location && (
            <span className="erp-field-hint">
              {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
            </span>
          )}
        </div>
        <div className="erp-field">
          <label htmlFor={`new-place-name-${roleLabel}`}>
            Name <span className="required">*</span>
          </label>
          <input
            id={`new-place-name-${roleLabel}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Balaji Plant"
            maxLength={120}
          />
        </div>
        <div className="erp-field">
          <label htmlFor={`new-place-radius-${roleLabel}`}>Fence radius (m)</label>
          <input
            id={`new-place-radius-${roleLabel}`}
            type="number"
            min={MIN_RADIUS_M}
            max={MAX_RADIUS_M}
            step="50"
            value={radiusM}
            onChange={(e) => setRadiusM(e.target.value)}
          />
          <span className="erp-field-hint">Cover the whole site, gate to unloading bay.</span>
        </div>
      </div>

      {message && (
        <div className="erp-callout danger" style={{ marginTop: 8 }}>
          <AlertTriangle size={16} />
          <span>{message}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={loading || !canSaveNewPlace({ name, location })}
        >
          {loading ? 'Saving…' : `Save ${roleLabel}`}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <GoogleMapsModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onApply={applyPin}
        initialLocation={location}
      />
    </div>
  );
};

export default NewPlaceForm;
