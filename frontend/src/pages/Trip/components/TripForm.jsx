
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { TripService } from '../services';
import './TripForm.css';

const TripForm = ({ slip, fixedDocs, onUpdate, selectedVehicle, journeyData }) => {
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

  // Track the current slip ID to detect when we switch to a different slip
  const prevSlipIdRef = useRef(slip?.tempId || slip?.id);

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

  // Prevent scroll wheel from changing number input values
  useEffect(() => {
    const preventWheelChange = (e) => {
      if (e.target.type === 'number' && document.activeElement === e.target) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', preventWheelChange, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', preventWheelChange);
    };
  }, []);

  return (
    <form className="trip-form">

      {/* Fuel Allocation */}
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
          <label htmlFor="amountPerKg">Amount per Ton</label>
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
