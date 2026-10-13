import React from 'react';

/** Fuel/filling type, litres/rate and odometer/pump-location rows. */
const FuelFields = ({ uid, formData, handleFormChange }) => (
  <>
    {/* Fuel & Filling Type — diesel only; AdBlue has its own page */}
    <div className="mileage-form-row">
      <div className="mileage-form-group">
        <label htmlFor={`${uid}-fuel-type`}>Fuel Type</label>
        <input
          id={`${uid}-fuel-type`}
          aria-label="Fuel Type"
          type="text"
          value="Diesel"
          readOnly
          disabled
          className="mileage-readonly-input"
        />
      </div>
      <div className="mileage-form-group">
        <label htmlFor={`${uid}-filling-type`}>Filling Type</label>
        <select
          id={`${uid}-filling-type`}
          name="fillingType"
          value={formData.fillingType}
          onChange={handleFormChange}
        >
          <option value="PARTIAL">Partial Fill</option>
          <option value="FULL_TANK">Full Tank (Closes Mileage Interval)</option>
        </select>
      </div>
    </div>

    {/* Litres & Rate */}
    <div className="mileage-form-row">
      <div className="mileage-form-group">
        <label htmlFor={`${uid}-litres`}>Litres *</label>
        <input
          id={`${uid}-litres`}
          aria-label="Litres"
          type="number"
          step="any"
          placeholder="0.00"
          name="litres"
          value={formData.litres}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mileage-form-group">
        <label htmlFor={`${uid}-rate`}>Rate Per Litre *</label>
        <input
          id={`${uid}-rate`}
          aria-label="Rate Per Litre"
          type="number"
          step="any"
          placeholder="0.00"
          name="rate"
          value={formData.rate}
          onChange={handleFormChange}
          required
        />
      </div>
    </div>

    {/* Odometer & Location */}
    <div className="mileage-form-row">
      {formData.fillingType === 'FULL_TANK' && (
        <div className="mileage-form-group">
          <label htmlFor={`${uid}-odometer`}>Odometer Reading (KM) (Optional)</label>
          <input
            id={`${uid}-odometer`}
            aria-label="Odometer Reading (KM)"
            type="number"
            placeholder="105450"
            name="odometerReading"
            value={formData.odometerReading}
            onChange={handleFormChange}
          />
        </div>
      )}
      <div className="mileage-form-group">
        <label htmlFor={`${uid}-location`}>Pump Location</label>
        <input
          id={`${uid}-location`}
          aria-label="Pump Location"
          type="text"
          placeholder="E.g. Reliance Pump"
          name="location"
          value={formData.location}
          onChange={handleFormChange}
        />
      </div>
    </div>
  </>
);

export default FuelFields;
