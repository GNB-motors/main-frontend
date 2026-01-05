
import React, { useCallback, useEffect, useState, useRef } from 'react';
import RouteService from '../../Routes/RouteService';
import './TripForm.css';

const TripForm = ({ slip, fixedDocs, onUpdate }) => {
  // Track which fields have been manually edited by the user
  // Use a ref to persist across re-renders without causing re-renders itself
  const manuallyEditedFieldsRef = useRef(new Set());
  
  const handleChange = useCallback(
    (field, value) => {
      // Mark field as manually edited when user changes it
      manuallyEditedFieldsRef.current.add(field);
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  // State for available routes
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routesError, setRoutesError] = useState(null);

  // Track the current slip ID to detect when we switch to a different slip
  const prevSlipIdRef = useRef(slip?.tempId || slip?.id);
  
  // Reset manually edited fields when switching to a new slip
  useEffect(() => {
    const newSlipId = slip?.tempId || slip?.id;
    // Only reset if the slip ID actually changed (not just a re-render with same slip)
    if (newSlipId && newSlipId !== prevSlipIdRef.current) {
      prevSlipIdRef.current = newSlipId;
      manuallyEditedFieldsRef.current = new Set(); // Clear the manually edited fields
    }
  }, [slip?.tempId, slip?.id]);

  useEffect(() => {
    setLoadingRoutes(true);
    setRoutesError(null);
    RouteService.getRoutes({ status: 'ACTIVE', limit: 1000 })
      .then((data) => setRoutes(data.data || []))
      .catch((err) => setRoutesError(err.message || 'Failed to fetch routes'))
      .finally(() => setLoadingRoutes(false));
  }, []);

  // Autofill distanceKm when routeId changes, but only if not manually edited
  useEffect(() => {
    if (slip.routeId && routes.length > 0 && !manuallyEditedFieldsRef.current.has('distanceKm')) {
      const selectedRoute = routes.find(r => r._id === slip.routeId);
      if (selectedRoute && (!slip.distanceKm || slip._autofilledDistance !== slip.routeId)) {
        // Only autofill if distanceKm is empty or last autofilled route is different
        onUpdate({ distanceKm: selectedRoute.distanceKm, _autofilledDistance: slip.routeId });
      }
    }
  }, [slip.routeId, routes]);

  // Autofill endOdometer from fixedDocs odometer reading if available
  // Only run once when slip changes and field hasn't been manually edited
  useEffect(() => {
    const odometerReading = fixedDocs?.odometer?.ocrData?.reading;
    // Only autofill if: 1) field is empty, 2) not manually edited, 3) OCR data exists
    if (odometerReading && !slip.endOdometer && !manuallyEditedFieldsRef.current.has('endOdometer')) {
      // Extract numeric value from reading (e.g., "9195.7 km" -> 9195.7)
      const numericValue = parseFloat(odometerReading.toString().replace(/[^\d.]/g, ''));
      if (!isNaN(numericValue)) {
        onUpdate({ endOdometer: numericValue });
      }
    }
  }, [slip?.tempId, slip?.id]); // Only depend on slip change, not field value

  // Autofill weight fields from OCR data if available and not already set
  // Only run once when slip changes
  useEffect(() => {
    if (slip.ocrData) {
      const updates = {};
      
      // Auto-fill grossWeight if available and not manually edited
      if (slip.ocrData.grossWeight && !slip.grossWeight && !manuallyEditedFieldsRef.current.has('grossWeight')) {
        updates.grossWeight = slip.ocrData.grossWeight;
      }
      // Auto-fill tareWeight if available and not manually edited
      if (slip.ocrData.tareWeight && !slip.tareWeight && !manuallyEditedFieldsRef.current.has('tareWeight')) {
        updates.tareWeight = slip.ocrData.tareWeight;
      }
      // Auto-fill netWeight if available and not manually edited
      const ocrNetWeight = slip.ocrData.netWeight || slip.ocrData.finalWeight;
      if (ocrNetWeight && !slip.netWeight && !manuallyEditedFieldsRef.current.has('netWeight')) {
        updates.netWeight = ocrNetWeight;
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    }
  }, [slip?.tempId, slip?.id]); // Only depend on slip change

  return (
    <form className="trip-form">
      {/* Odometer Readings */}
      <div className="form-group">
        <label htmlFor="endOdometer">End Odometer (km)</label>
        <input
          id="endOdometer"
          type="number"
          placeholder="0"
          value={slip.endOdometer || ''}
          onChange={(e) => handleChange('endOdometer', e.target.value)}
          className="form-input"
          min="0"
        />
        {fixedDocs?.odometer?.ocrData?.reading && (
          <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Start Odometer: {fixedDocs.odometer.ocrData.reading}
          </small>
        )}
      </div>
      {/* Route Assignment Fields */}
      <fieldset className="form-section">
        <legend>Route Assignment (per slip)</legend>
        <div className="form-group">
          <label htmlFor="routeId">Route</label>
          {loadingRoutes ? (
            <div>Loading routes...</div>
          ) : routesError ? (
            <div style={{ color: 'red' }}>Error: {routesError}</div>
          ) : (
            <select
              id="routeId"
              value={slip.routeId || ''}
              onChange={(e) => handleChange('routeId', e.target.value)}
              className="form-input"
            >
              <option value="">Select a route</option>
              {routes.map((route) => (
                <option key={route._id} value={route._id}>
                  {route.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="distanceKm">Distance (km)</label>
          <input
            id="distanceKm"
            type="number"
            placeholder="0"
            value={slip.distanceKm || ''}
            onChange={(e) => handleChange('distanceKm', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="allocatedFuel">Allocated Fuel (liters)</label>
          <input
            id="allocatedFuel"
            type="number"
            placeholder="0"
            value={slip.allocatedFuel || ''}
            onChange={(e) => handleChange('allocatedFuel', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
      </fieldset>
      {/* Weight Certificate Details */}
      <fieldset className="form-section">
        <legend>Weight Certificate Details</legend>
        <div className="form-group">
          <label htmlFor="materialType">Material Type</label>
          <input
            id="materialType"
            type="text"
            placeholder="e.g., Coal"
            value={slip.materialType || ''}
            onChange={(e) => handleChange('materialType', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="grossWeight">Gross Weight (kg)</label>
          <input
            id="grossWeight"
            type="number"
            placeholder="0"
            value={slip.grossWeight || ''}
            onChange={(e) => handleChange('grossWeight', e.target.value)}
            className="form-input"
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="tareWeight">Tare Weight (kg)</label>
          <input
            id="tareWeight"
            type="number"
            placeholder="0"
            value={slip.tareWeight || ''}
            onChange={(e) => handleChange('tareWeight', e.target.value)}
            className="form-input"
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="netWeight">Net Weight (kg)</label>
          <input
            id="netWeight"
            type="number"
            placeholder="0"
            value={slip.netWeight || ''}
            onChange={(e) => handleChange('netWeight', e.target.value)}
            className="form-input"
            min="0"
          />
        </div>
      </fieldset>
      {/* Revenue Fields */}
      <fieldset className="form-section">
        <legend>Revenue (per weight certificate)</legend>
        <div className="form-group">
          <label htmlFor="amountPerKg">Amount per Kg</label>
          <input
            id="amountPerKg"
            type="number"
            placeholder="0"
            value={slip.amountPerKg || ''}
            onChange={(e) => handleChange('amountPerKg', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="totalAmountReceived">Total Amount Received</label>
          <input
            id="totalAmountReceived"
            type="number"
            placeholder="0"
            value={slip.totalAmountReceived || ''}
            onChange={(e) => handleChange('totalAmountReceived', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
      </fieldset>
      {/* Expenses Fields */}
      <fieldset className="form-section">
        <legend>Expenses (per weight certificate)</legend>
        <div className="form-group">
          <label htmlFor="materialCost">Material Cost</label>
          <input
            id="materialCost"
            type="number"
            placeholder="0"
            value={slip.materialCost || ''}
            onChange={(e) => handleChange('materialCost', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="toll">Toll</label>
          <input
            id="toll"
            type="number"
            placeholder="0"
            value={slip.toll || ''}
            onChange={(e) => handleChange('toll', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="driverCost">Driver Cost</label>
          <input
            id="driverCost"
            type="number"
            placeholder="0"
            value={slip.driverCost || ''}
            onChange={(e) => handleChange('driverCost', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="driverTripExpense">Driver Trip Expense</label>
          <input
            id="driverTripExpense"
            type="number"
            placeholder="0"
            value={slip.driverTripExpense || ''}
            onChange={(e) => handleChange('driverTripExpense', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="royalty">Royalty</label>
          <input
            id="royalty"
            type="number"
            placeholder="0"
            value={slip.royalty || ''}
            onChange={(e) => handleChange('royalty', e.target.value)}
            className="form-input"
            min="0"
            step="0.01"
          />
        </div>
      </fieldset>
    </form>
  );
};

export default TripForm;
