import React, { useState, useEffect, forwardRef } from 'react';
import { Truck, Hash, Gauge, Building2, Radio, Layers } from 'lucide-react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import '../../Drivers/Component/BasicInformationForm.css';

const VehicleBasicInformationForm = forwardRef(
  (
    {
      initialData = {},
      onSubmit,
      isSubmitting = false,
      isEdit = false,
      activeBranchId = null,
      activeBranch = null,
      branches = [],
      selectedBranchId = '',
      onBranchChange = () => {},
      fleetEdgeAccounts = [],
      selectedAccountId = '',
      onAccountChange = () => {},
      onRegistrationChange = () => {},
    },
    ref,
  ) => {
    const { isEnabled } = useFeatureFlags();
    const showExpectedMileage = isEnabled('mileageIntegrity');

    const [formData, setFormData] = useState({
      registration_no: initialData.registration_no || '',
      chassis_number: initialData.chassis_number || '',
      model: initialData.model || '',
      expected_mileage: initialData.expected_mileage ?? '',
    });

    // Update form data when initialData changes (for edit mode)
    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        const reg = initialData.registration_no || '';
        setFormData({
          registration_no: reg,
          chassis_number: initialData.chassis_number || '',
          model: initialData.model || '',
          expected_mileage: initialData.expected_mileage ?? '',
        });
        if (onRegistrationChange) onRegistrationChange(reg);
      }
    }, [initialData, onRegistrationChange]);

    const handleInputChange = (field, value) => {
      let finalValue = value;
      if (field === 'registration_no') {
        finalValue = value.toUpperCase();
        if (onRegistrationChange) onRegistrationChange(finalValue);
      } else if (field === 'chassis_number') {
        finalValue = value.toUpperCase();
      }

      setFormData((prev) => ({
        ...prev,
        [field]: finalValue,
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      // The API rejects expectedMileage outright unless the org owns the feature,
      // so never let a stale value ride along when the flag is off.
      if (!showExpectedMileage) {
        const { expected_mileage: _omit, ...rest } = formData;
        onSubmit(rest);
        return;
      }
      onSubmit(formData);
    };

    return (
      <div className="basic-info-wrapper">
        <div className="basic-info-outer-container">
          {/* Header Section */}
          <div className="basic-info-header">
            <div className="basic-info-header-content">
              <div className="card-icon-pill blue">
                <Truck size={20} />
              </div>
              <div className="card-title-block">
                <span className="card-title-text">Basic Information & Telematics</span>
                <span className="card-subtitle-text">
                  Configure essential vehicle identity, chassis, operating location, and telemetry
                </span>
              </div>
            </div>
            <div className="card-step-badge">Step 1 of 2</div>
          </div>

          {/* Form Container */}
          <div className="basic-info-container">
            <form ref={ref} onSubmit={handleSubmit} className="basic-info-form">
              {/* Row 1: Registration Number, Chassis Number */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label htmlFor="vehicle-reg-input" className="basic-info-label">
                    Registration Number *
                  </label>
                  <div className="input-with-icon-wrapper">
                    <Truck size={17} className="input-lead-icon" />
                    <input
                      id="vehicle-reg-input"
                      type="text"
                      className="basic-info-input monospace-input"
                      value={formData.registration_no}
                      onChange={(e) => handleInputChange('registration_no', e.target.value)}
                      required
                      placeholder="e.g., WB11F7262"
                      disabled={isSubmitting}
                      autoComplete="off"
                      aria-label="Registration Number"
                    />
                  </div>
                  <p className="field-hint-text">
                    Official High Security Registration Plate (HSRP) number
                  </p>
                </div>

                <div className="basic-info-form-field">
                  <label htmlFor="vehicle-chassis-input" className="basic-info-label">
                    Chassis Number (VIN) *
                  </label>
                  <div className="input-with-icon-wrapper">
                    <Hash size={17} className="input-lead-icon" />
                    <input
                      id="vehicle-chassis-input"
                      type="text"
                      className="basic-info-input monospace-input"
                      value={formData.chassis_number}
                      onChange={(e) => handleInputChange('chassis_number', e.target.value)}
                      required
                      placeholder="e.g., MAT828113S2C05629"
                      disabled={isSubmitting}
                      autoComplete="off"
                      aria-label="Chassis Number (VIN)"
                    />
                  </div>
                  <p className="field-hint-text">
                    17-character vehicle identification number stamped on the chassis
                  </p>
                </div>
              </div>

              {/* Row 2: Model & Expected Mileage (if flag active) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label htmlFor="vehicle-model-input" className="basic-info-label">
                    Model *
                  </label>
                  <div className="input-with-icon-wrapper">
                    <Layers size={17} className="input-lead-icon" />
                    <input
                      id="vehicle-model-input"
                      type="text"
                      className="basic-info-input"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      required
                      placeholder="e.g., 4830TC, LPT 4830, Signa 2823.K"
                      disabled={isSubmitting}
                      aria-label="Vehicle Model"
                    />
                  </div>
                  <p className="field-hint-text">
                    Commercial vehicle chassis make and model designation
                  </p>
                </div>

                {showExpectedMileage ? (
                  <div className="basic-info-form-field">
                    <label htmlFor="vehicle-mileage-input" className="basic-info-label">
                      Expected Mileage (km/L)
                      <span className="field-badge-optional">Optional</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <Gauge size={17} className="input-lead-icon" />
                      <input
                        id="vehicle-mileage-input"
                        type="number"
                        className="basic-info-input"
                        value={formData.expected_mileage}
                        onChange={(e) => handleInputChange('expected_mileage', e.target.value)}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 4.2"
                        disabled={isSubmitting}
                        aria-label="Expected Mileage (km/L)"
                      />
                    </div>
                    <p className="field-hint-text">
                      Fuel cycles falling below this threshold are flagged for review. Leave blank
                      for model average.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Section 2: Operations & Telematics Assignment (Seamlessly Integrated) */}
              {!isEdit && (
                <div className="telematics-assignment-section">
                  <div className="telematics-section-header">
                    <div className="telematics-header-icon">
                      <Radio size={16} />
                    </div>
                    <div className="telematics-header-text">
                      <span className="telematics-header-title">
                        Operations & Telematics Assignment
                      </span>
                      <span className="telematics-header-desc">
                        Assign vehicle operating terminal and link live FleetEdge telematics engine
                      </span>
                    </div>
                  </div>

                  <div className="basic-info-form-row">
                    {/* Operating Location */}
                    <div className="basic-info-form-field">
                      <label htmlFor="vehicle-branch-select" className="basic-info-label">
                        Operating Location
                        {activeBranchId ? (
                          <span className="field-badge-locked">Current Branch</span>
                        ) : (
                          <span className="field-badge-optional">Terminal Scope</span>
                        )}
                      </label>

                      {activeBranchId ? (
                        <div className="location-locked-card">
                          <div className="location-locked-icon">
                            <Building2 size={18} />
                          </div>
                          <div className="location-locked-info">
                            <span className="location-locked-title">
                              {activeBranch?.name ||
                                branches.find((b) => String(b._id) === String(activeBranchId))
                                  ?.name ||
                                'Current Location'}
                            </span>
                            <span className="location-locked-sub">
                              Locked to active workspace branch terminal
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="custom-select-wrapper select-with-lead-icon">
                          <Building2 size={16} className="input-lead-icon" />
                          <select
                            id="vehicle-branch-select"
                            value={selectedBranchId}
                            onChange={(e) => onBranchChange(e.target.value)}
                            className="basic-info-input select-with-lead-icon"
                            disabled={isSubmitting}
                            aria-label="Operating Location"
                          >
                            <option value="">Enterprise (Fleet-wide / All Locations)</option>
                            {branches.map((b) => (
                              <option key={b._id} value={String(b._id)}>
                                {b.name}
                                {b.isDefault ? ' (Default Terminal)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <p className="field-hint-text">
                        {activeBranchId
                          ? 'This vehicle belongs to the active branch terminal.'
                          : 'Enterprise-level vehicles show in the all-locations overview.'}
                      </p>
                    </div>

                    {/* FleetEdge Account */}
                    <div className="basic-info-form-field">
                      <label htmlFor="vehicle-fleetedge-select" className="basic-info-label">
                        FleetEdge Telemetry Account
                        <span className="field-badge-optional">Optional</span>
                      </label>

                      <div className="custom-select-wrapper select-with-telemetry-badge">
                        <div className="telemetry-lead-badge">
                          <Radio size={15} />
                          <span className="telemetry-beacon-dot" />
                        </div>
                        <select
                          id="vehicle-fleetedge-select"
                          value={selectedAccountId}
                          onChange={(e) => onAccountChange(e.target.value)}
                          className="basic-info-input select-with-telemetry-badge"
                          disabled={isSubmitting}
                          aria-label="FleetEdge Telemetry Account"
                        >
                          <option value="">
                            — Unassigned (Auto-tag on first telemetry packet) —
                          </option>
                          {fleetEdgeAccounts.map((a) => (
                            <option key={a._id} value={String(a._id)}>
                              {a.friendlyName || a.externalAccountId}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="field-hint-text">
                        Assign to stream live GPS, odometer, fuel telemetry, and speed diagnostics.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  },
);

VehicleBasicInformationForm.displayName = 'VehicleBasicInformationForm';

export default VehicleBasicInformationForm;
