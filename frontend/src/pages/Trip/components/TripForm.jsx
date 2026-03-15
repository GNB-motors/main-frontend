import React, { useCallback, useRef, useEffect, useState } from 'react';
import { TripService } from '../services';
import './TripForm.css';

const TripForm = ({ slip, fixedDocs, onUpdate, selectedVehicle, journeyData, onValidationChange, showValidation }) => {
  // Track which fields have been manually edited by the user
  const manuallyEditedFieldsRef = useRef(new Set());
  
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState(new Set());
  
  // Define required fields (allocatedFuel is now optional)
  const requiredFields = [
    'materialType',
    'grossWeight',
    'tareWeight',
    'netWeight',
    'amountPerKg',
    'totalAmountReceived',
    'materialCost',
    'toll',
    'driverCost',
    'driverTripExpense',
    'royalty',
    'weight'
  ];

  // Validate form and update validation state
  const validateForm = useCallback(() => {
    const errors = new Set();
    
    requiredFields.forEach(field => {
      const value = slip[field];
      if (value === undefined || value === null || value === '' || value === '0' || parseFloat(value) < 0) {
        if (field === 'materialType') {
          if (!value || value === '') errors.add(field);
        } else {
           if (value === '' || parseFloat(value) <= 0) errors.add(field);
        }
      }
    });
    
    setValidationErrors(errors);
    
    // Notify parent component about validation status
    const isValid = errors.size === 0;
    if (onValidationChange) {
      onValidationChange(isValid, errors);
    }
    
    return isValid;
  }, [slip, onValidationChange]);

  // Run validation whenever slip data changes
  useEffect(() => {
    validateForm();
  }, [validateForm]);
  
  const handleChange = useCallback(
    (field, value) => {
      manuallyEditedFieldsRef.current.add(field);
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  // Autofill weight fields from OCR data
  useEffect(() => {
    if (slip.ocrData) {
      const updates = {};
      
      if (slip.ocrData.grossWeight && !slip.grossWeight && !manuallyEditedFieldsRef.current.has('grossWeight')) {
        updates.grossWeight = slip.ocrData.grossWeight;
      }
      if (slip.ocrData.tareWeight && !slip.tareWeight && !manuallyEditedFieldsRef.current.has('tareWeight')) {
        updates.tareWeight = slip.ocrData.tareWeight;
      }
      const ocrNetWeight = slip.ocrData.netWeight || slip.ocrData.finalWeight;
      if (ocrNetWeight && !slip.netWeight && !manuallyEditedFieldsRef.current.has('netWeight')) {
        updates.netWeight = ocrNetWeight;
      }
      
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    }
  }, [slip?.tempId, slip?.id]);

  // Prevent scroll wheel changes
  useEffect(() => {
    const preventWheelChange = (e) => {
      if (e.target.type === 'number' && document.activeElement === e.target) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', preventWheelChange, { passive: false });
    return () => document.removeEventListener('wheel', preventWheelChange);
  }, []);

  const getInputClassName = (fieldName) => {
    const baseClass = 'tf-input';
    const errorClass = showValidation && validationErrors.has(fieldName) ? 'tf-input-error' : '';
    return `${baseClass} ${errorClass}`.trim();
  };

  const InputGroup = ({ id, label, type = "number", placeholder, value, field, required = false, step = "1", fullWidth = false }) => (
    <div className={`tf-group ${fullWidth ? 'full-width' : ''}`}>
      <label htmlFor={id} className="tf-label">
        {label} {required && <span className="tf-required">*</span>}
      </label>
      <input
        id={id}
        type={type}
        className={getInputClassName(field)}
        placeholder={showValidation && validationErrors.has(field) ? 'Required' : placeholder}
        value={value || ''}
        step={step}
        onChange={(e) => {
            const val = e.target.value;
            if (type === "number") {
                if (/^\d*\.?\d*$/.test(val) || val === '') {
                    handleChange(field, val);
                }
            } else {
                handleChange(field, val);
            }
        }}
      />
    </div>
  );

  return (
    <div className="tf-container">
      {/* Fuel Allocation Section */}
      <fieldset className="tf-section">
        <legend>Fuel Allocation</legend>
        <div className="tf-grid">
          <InputGroup 
            id="allocatedFuel" 
            label="Allocated Fuel (L)" 
            placeholder="Optional" 
            value={slip.allocatedFuel} 
            field="allocatedFuel" 
            step="0.01"
            fullWidth
          />
        </div>
      </fieldset>

      {/* Weight Certificate Details Section */}
      <fieldset className="tf-section">
        <legend>Weight Certificate Details</legend>
        <div className="tf-grid">
          <InputGroup 
            id="materialType" 
            label="Material Type" 
            type="text" 
            placeholder="e.g. Coal" 
            value={slip.materialType} 
            field="materialType" 
            required 
            fullWidth
          />
          <InputGroup 
            id="grossWeight" 
            label="Gross Weight (kg)" 
            value={slip.grossWeight} 
            field="grossWeight" 
            required 
          />
          <InputGroup 
            id="tareWeight" 
            label="Tare Weight (kg)" 
            value={slip.tareWeight} 
            field="tareWeight" 
            required 
          />
          <InputGroup 
            id="netWeight" 
            label="Net Weight (kg)" 
            value={slip.netWeight} 
            field="netWeight" 
            required 
          />
          <InputGroup 
            id="weight" 
            label="Final Weight (kg)" 
            value={slip.weight} 
            field="weight" 
            required 
          />
        </div>
      </fieldset>

      {/* Revenue Details Section */}
      <fieldset className="tf-section">
        <legend>Revenue (per weight certificate)</legend>
        <div className="tf-grid">
          <InputGroup 
            id="amountPerKg" 
            label="Amount per Ton" 
            value={slip.amountPerKg} 
            field="amountPerKg" 
            required 
            step="0.01"
          />
          <InputGroup 
            id="totalAmountReceived" 
            label="Total Amount Received" 
            value={slip.totalAmountReceived} 
            field="totalAmountReceived" 
            required 
            step="0.01"
          />
        </div>
      </fieldset>

      {/* Expenses Details Section */}
      <fieldset className="tf-section">
        <legend>Expenses (per weight certificate)</legend>
        <div className="tf-grid">
          <InputGroup id="materialCost" label="Material Cost" value={slip.materialCost} field="materialCost" required step="0.01" />
          <InputGroup id="toll" label="Toll" value={slip.toll} field="toll" required step="0.01" />
          <InputGroup id="driverCost" label="Driver Cost" value={slip.driverCost} field="driverCost" required step="0.01" />
          <InputGroup id="driverTripExpense" label="Trip Expense" value={slip.driverTripExpense} field="driverTripExpense" required step="0.01" />
          <InputGroup id="royalty" label="Royalty" value={slip.royalty} field="royalty" required step="0.01" className="full-width" />
        </div>
      </fieldset>
    </div>
  );
};

export default TripForm;
