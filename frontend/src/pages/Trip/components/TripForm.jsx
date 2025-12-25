/**
 * TripForm Component
 * 
 * Form for entering trip details for a specific weight slip
 * Fields: Origin, Destination, Weight
 */

import React, { useCallback } from 'react';
import './TripForm.css';

const TripForm = ({ slip, onUpdate }) => {
  const handleChange = useCallback(
    (field, value) => {
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  return (
    <form className="trip-form">
      <div className="form-group">
        <label htmlFor="origin">Starting Point (Origin) *</label>
        <input
          id="origin"
          type="text"
          placeholder="e.g., Mumbai Central"
          value={slip.origin || ''}
          onChange={(e) => handleChange('origin', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="destination">Ending Point (Destination) *</label>
        <input
          id="destination"
          type="text"
          placeholder="e.g., Delhi North"
          value={slip.destination || ''}
          onChange={(e) => handleChange('destination', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="weight">Total Weight (kg) *</label>
        <input
          id="weight"
          type="number"
          placeholder="0"
          value={slip.weight || ''}
          onChange={(e) => handleChange('weight', e.target.value)}
          className="form-input"
          min="0"
          step="0.01"
        />
      </div>
    </form>
  );
};

export default TripForm;
