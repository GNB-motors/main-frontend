import { toRefuelLocal } from './fuelLogFormLogic';

export default function FuelFields({ uid, formData, handleFormChange }) {
  return (
    <>
      <div className="mileage-form-row">
        <div className="mileage-form-group">
          <label htmlFor={`${uid}-refuel-time`}>Refuelling date and time (IST) *</label>
          <input
            id={`${uid}-refuel-time`}
            aria-label="Refuelling date and time (IST)"
            name="refuelTime"
            type="datetime-local"
            value={formData.refuelTime}
            max={toRefuelLocal()}
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="mileage-form-group">
          <label htmlFor={`${uid}-filling-type`}>Tank full after filling? *</label>
          <select
            id={`${uid}-filling-type`}
            name="fillingType"
            value={formData.fillingType}
            onChange={handleFormChange}
            required
          >
            <option value="" disabled>
              Choose full or partial
            </option>
            <option value="FULL_TANK">Yes — full tank</option>
            <option value="PARTIAL">No — partial fill</option>
          </select>
        </div>
      </div>
      <div className="mileage-form-row">
        <div className="mileage-form-group">
          <label htmlFor={`${uid}-litres`}>Diesel litres *</label>
          <input
            id={`${uid}-litres`}
            aria-label="Litres"
            type="number"
            min="0.01"
            step="any"
            placeholder="e.g. 85"
            name="litres"
            value={formData.litres}
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="mileage-form-group">
          <label htmlFor={`${uid}-rate`}>Rate per litre (₹, optional)</label>
          <input
            id={`${uid}-rate`}
            aria-label="Rate per litre (₹, optional)"
            type="number"
            min="0.01"
            step="any"
            placeholder="e.g. 92.50"
            name="rate"
            value={formData.rate}
            onChange={handleFormChange}
          />
          {Number(formData.litres) > 0 && Number(formData.rate) > 0 && (
            <small>
              Total: ₹
              {(Number(formData.litres) * Number(formData.rate)).toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })}
            </small>
          )}
        </div>
      </div>
      {formData.fillingType === 'FULL_TANK' && (
        <div className="mileage-form-row">
          <div className="mileage-form-group">
            <label htmlFor={`${uid}-odometer`}>Odometer at refuelling (km) *</label>
            <input
              id={`${uid}-odometer`}
              aria-label="Odometer at refuelling (km)"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 10500"
              name="odometerReading"
              value={formData.odometerReading}
              onChange={handleFormChange}
              required
              aria-describedby={`${uid}-odo-help`}
            />
            <small id={`${uid}-odo-help`}>
              Use the reading at this fill, including for an older bill.
            </small>
          </div>
        </div>
      )}
    </>
  );
}
