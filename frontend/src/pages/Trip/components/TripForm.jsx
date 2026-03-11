import React, { useCallback, useRef, useEffect, useState } from 'react';
import { TripService } from '../services';
import './TripForm.css';

const TripForm = ({ slip, fixedDocs, onUpdate, selectedVehicle, journeyData, onValidationChange, showValidation }) => {
  // Track which fields have been manually edited by the user
  // Use a ref to persist across re-renders without causing re-renders itself
  const manuallyEditedFieldsRef = useRef(new Set());
  
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState(new Set());
  
  // Define required fields
  const requiredFields = [
    'allocatedFuel',
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
      if (!value || value === '' || value === '0' || parseFloat(value) <= 0) {
        errors.add(field);
      }
    });
    
    setValidationErrors(errors);
    
    // Notify parent component about validation status
    const isValid = errors.size === 0;
    if (onValidationChange) {
      onValidationChange(isValid, errors);
    }
    
    return isValid;
  }, [slip, onValidationChange, requiredFields]);

  // Run validation whenever slip data changes
  useEffect(() => {
    validateForm();
  }, [validateForm]);
  
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

  // Helper function to get input class names with validation
  const getInputClassName = (fieldName) => {
    const baseClass = 'form-input';
    const errorClass = showValidation && validationErrors.has(fieldName) ? 'form-input-error' : '';
    return `${baseClass} ${errorClass}`.trim();
  };

  return (
    <form className="trip-form">

      {/* Fuel Allocation */}
      <div className="form-group">
        <label htmlFor="allocatedFuel">
          Allocated Fuel (liters) <span className="required">*</span>
        </label>
        <input
          id="allocatedFuel"
          type="number"
          inputMode="decimal"
          pattern="^[0-9]*\.?[0-9]*$"
          placeholder={showValidation && validationErrors.has('allocatedFuel') ? 'Required field' : '0'}
          value={slip.allocatedFuel || ''}
          onChange={(e) => {
            // Only allow numbers
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val) || val === '') {
              handleChange('allocatedFuel', val);
            }
          }}
          className={getInputClassName('allocatedFuel')}
          min="0"
          step="0.01"
        />
      </div>

      {/* Weight Certificate Details */}
      <fieldset className="form-section">
        <legend>Weight Certificate Details</legend>
        <div className="form-group">
          <label htmlFor="materialType">
            Material Type <span className="required">*</span>
          </label>
          <input
            id="materialType"
            type="text"
            inputMode="text"
            pattern=".*"
            placeholder={showValidation && validationErrors.has('materialType') ? 'Required field' : 'e.g., Coal'}
            value={slip.materialType || ''}
            onChange={(e) => {
              // Only allow text (no numbers)
              if (/^[^0-9]*$/.test(e.target.value) || e.target.value === '') {
                handleChange('materialType', e.target.value);
              }
            }}
            className={getInputClassName('materialType')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="grossWeight">
            Gross Weight (kg) <span className="required">*</span>
          </label>
          <input
            id="grossWeight"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('grossWeight') ? 'Required field' : '0'}
            value={slip.grossWeight || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('grossWeight', val);
              }
            }}
            className={getInputClassName('grossWeight')}
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="tareWeight">
            Tare Weight (kg) <span className="required">*</span>
          </label>
          <input
            id="tareWeight"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('tareWeight') ? 'Required field' : '0'}
            value={slip.tareWeight || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('tareWeight', val);
              }
            }}
            className={getInputClassName('tareWeight')}
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="netWeight">
            Net Weight (kg) <span className="required">*</span>
          </label>
          <input
            id="netWeight"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('netWeight') ? 'Required field' : '0'}
            value={slip.netWeight || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('netWeight', val);
              }
            }}
            className={getInputClassName('netWeight')}
            min="0"
          />
        </div>
      </fieldset>
      {/* Revenue Fields */}
      <fieldset className="form-section">
        <legend>Revenue (per weight certificate)</legend>
        <div className="form-group">
          <label htmlFor="amountPerKg">
            Amount per Ton <span className="required">*</span>
          </label>
          <input
            id="amountPerKg"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('amountPerKg') ? 'Required field' : '0'}
            value={slip.amountPerKg || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('amountPerKg', val);
              }
            }}
            className={getInputClassName('amountPerKg')}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="totalAmountReceived">
            Total Amount Received <span className="required">*</span>
          </label>
          <input
            id="totalAmountReceived"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('totalAmountReceived') ? 'Required field' : '0'}
            value={slip.totalAmountReceived || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('totalAmountReceived', val);
              }
            }}
            className={getInputClassName('totalAmountReceived')}
            min="0"
            step="0.01"
          />
        </div>
      </fieldset>
      {/* Expenses Fields */}
      <fieldset className="form-section">
        <legend>Expenses (per weight certificate)</legend>
        <div className="form-group">
          <label htmlFor="materialCost">
            Material Cost <span className="required">*</span>
          </label>
          <input
            id="materialCost"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('materialCost') ? 'Required field' : '0'}
            value={slip.materialCost || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('materialCost', val);
              }
            }}
            className={getInputClassName('materialCost')}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="toll">
            Toll <span className="required">*</span>
          </label>
          <input
            id="toll"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('toll') ? 'Required field' : '0'}
            value={slip.toll || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('toll', val);
              }
            }}
            className={getInputClassName('toll')}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="driverCost">
            Driver Cost <span className="required">*</span>
          </label>
          <input
            id="driverCost"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('driverCost') ? 'Required field' : '0'}
            value={slip.driverCost || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('driverCost', val);
              }
            }}
            className={getInputClassName('driverCost')}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="driverTripExpense">
            Driver Trip Expense <span className="required">*</span>
          </label>
          <input
            id="driverTripExpense"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('driverTripExpense') ? 'Required field' : '0'}
            value={slip.driverTripExpense || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('driverTripExpense', val);
              }
            }}
            className={getInputClassName('driverTripExpense')}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="royalty">
            Royalty <span className="required">*</span>
          </label>
          <input
            id="royalty"
            type="number"
            inputMode="decimal"
            pattern="^[0-9]*\.?[0-9]*$"
            placeholder={showValidation && validationErrors.has('royalty') ? 'Required field' : '0'}
            value={slip.royalty || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val) || val === '') {
                handleChange('royalty', val);
              }
            }}
            className={getInputClassName('royalty')}
            min="0"
            step="0.01"
          />
        </div>
      </fieldset>
      {/* Weight field */}
      <div className="form-group">
        <label htmlFor="weight">
          Weight <span className="required">*</span>
        </label>
        <input
          id="weight"
          type="number"
          inputMode="decimal"
          pattern="^[0-9]*\.?[0-9]*$"
          placeholder={showValidation && validationErrors.has('weight') ? 'Required field' : '0'}
          value={slip.weight || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val) || val === '') {
              handleChange('weight', val);
            }
          }}
          className={getInputClassName('weight')}
          min="0"
        />
      </div>
    </form>
  );
};

export default TripForm;
