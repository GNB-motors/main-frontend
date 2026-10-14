/** Fuel type, filling type, litres, rate, odometer and location fields of the field-agent fuel form. */
const FuelLogFields = ({ formData, handleFormChange }) => (
  <>
    {/* Fuel & Filling Type */}
    <div className="mileage-form-row">
      <div className="mileage-form-group">
        <label htmlFor="fa-fuel-type">Fuel Type</label>
        <select
          id="fa-fuel-type"
          name="fuelType"
          value={formData.fuelType}
          onChange={handleFormChange}
        >
          <option value="DIESEL">Diesel</option>
          <option value="ADBLUE">AdBlue</option>
        </select>
      </div>
      <div className="mileage-form-group">
        <label htmlFor="fa-fuel-filling-type">Filling Type</label>
        <select
          id="fa-fuel-filling-type"
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
        <label htmlFor="fa-fuel-litres">Litres *</label>
        <input
          id="fa-fuel-litres"
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
        <label htmlFor="fa-fuel-rate">Rate Per Litre *</label>
        <input
          id="fa-fuel-rate"
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
          <label htmlFor="fa-fuel-odometer">Odometer Reading (KM) (Optional)</label>
          <input
            id="fa-fuel-odometer"
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
        <label htmlFor="fa-fuel-location">Location</label>
        <input
          id="fa-fuel-location"
          aria-label="Location"
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

export default FuelLogFields;
