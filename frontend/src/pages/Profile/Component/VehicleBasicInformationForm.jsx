import { useState, useEffect, forwardRef } from 'react';
import { Truck, Building2 } from 'lucide-react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { PRIMARY_MANUFACTURERS, canonicalManufacturer } from '../vehicleManufacturerOptions.js';
import '../../Drivers/Component/BasicInformationForm.css';

const EMPTY_INITIAL_DATA = {};

const VehicleBasicInformationForm = forwardRef(
  (
    {
      initialData = EMPTY_INITIAL_DATA,
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
      onRegistrationChange,
      onManufacturerChange,
      manufacturers = PRIMARY_MANUFACTURERS,
      metadataError = false,
      onRetryMetadata,
      accountsLoading = false,
      accountsError = false,
      onRetryAccounts,
      canAssignAccount = false,
      manufacturer = '',
      accountNotice = '',
    },
    ref,
  ) => {
    const { isEnabled } = useFeatureFlags();
    const showExpectedMileage = isEnabled('mileageIntegrity');
    const [formData, setFormData] = useState({
      registration_no: '',
      chassis_number: '',
      model: '',
      manufacturer: '',
      expected_mileage: '',
    });
    useEffect(() => {
      const next = {
        registration_no: initialData.registration_no || '',
        chassis_number: initialData.chassis_number || '',
        model: initialData.model || '',
        manufacturer:
          initialData.manufacturer === 'UNKNOWN'
            ? ''
            : canonicalManufacturer(initialData.manufacturer),
        expected_mileage: initialData.expected_mileage ?? '',
      };
      setFormData(next);
      onRegistrationChange?.(next.registration_no);
      onManufacturerChange?.(next.manufacturer);
    }, [initialData, onRegistrationChange, onManufacturerChange]);

    const change = (field, value) => {
      const next = ['registration_no', 'chassis_number'].includes(field)
        ? value.toUpperCase()
        : value;
      setFormData((current) => ({ ...current, [field]: next }));
      if (field === 'registration_no') onRegistrationChange?.(next);
      if (field === 'manufacturer') onManufacturerChange?.(next);
    };
    const submit = (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      const { expected_mileage, ...rest } = formData;
      onSubmit(showExpectedMileage ? { ...rest, expected_mileage } : rest);
    };
    const otherManufacturers = manufacturers.filter(
      (item) => !PRIMARY_MANUFACTURERS.some((primary) => primary.value === item.value),
    );
    const primarySelected = PRIMARY_MANUFACTURERS.some(
      (item) => item.value === formData.manufacturer,
    );
    const legacyMake =
      formData.manufacturer && !manufacturers.some((item) => item.value === formData.manufacturer);

    return (
      <div className="basic-info-wrapper">
        <div className="basic-info-outer-container">
          <div className="basic-info-header">
            <div className="basic-info-header-content">
              <div className="card-icon-pill blue">
                <Truck size={20} />
              </div>
              <div className="card-title-block">
                <h2 className="card-title-text">Vehicle details</h2>
                <span className="card-subtitle-text">Manufacturer, registration and model</span>
              </div>
            </div>
          </div>
          <div className="basic-info-container">
            <form ref={ref} onSubmit={submit} className="basic-info-form">
              <fieldset className="vehicle-manufacturer-field" disabled={isSubmitting}>
                <legend className="basic-info-label">
                  Manufacturer <span aria-hidden="true">*</span>
                </legend>
                <div className="vehicle-manufacturer-options">
                  {PRIMARY_MANUFACTURERS.map((item) => (
                    <label
                      key={item.value}
                      className={`vehicle-make-choice ${formData.manufacturer === item.value ? 'is-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="vehicle-manufacturer"
                        aria-label={item.label}
                        value={item.value}
                        checked={formData.manufacturer === item.value}
                        onChange={() => change('manufacturer', item.value)}
                      />
                      {item.label}
                    </label>
                  ))}
                  <div className="vehicle-more-makes">
                    <label className="sr-only" htmlFor="vehicle-more-makes">
                      More manufacturers
                    </label>
                    <select
                      id="vehicle-more-makes"
                      aria-label="More manufacturers"
                      className="basic-info-input"
                      value={primarySelected ? '' : formData.manufacturer}
                      required={!primarySelected}
                      onChange={(event) => change('manufacturer', event.target.value)}
                    >
                      <option value="">More manufacturers…</option>
                      {otherManufacturers.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                      {legacyMake && (
                        <option value={formData.manufacturer}>
                          {formData.manufacturer === 'UNKNOWN'
                            ? 'Unclassified — choose manufacturer'
                            : formData.manufacturer}
                        </option>
                      )}
                    </select>
                  </div>
                </div>
                {metadataError && (
                  <p className="vehicle-inline-message">
                    More manufacturers could not be loaded.{' '}
                    <button type="button" onClick={onRetryMetadata}>
                      Retry
                    </button>
                  </p>
                )}
              </fieldset>
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label htmlFor="vehicle-reg-input" className="basic-info-label">
                    Registration number *
                  </label>
                  <input
                    id="vehicle-reg-input"
                    aria-label="Registration number"
                    className="basic-info-input monospace-input"
                    value={formData.registration_no}
                    onChange={(event) => change('registration_no', event.target.value)}
                    required
                    pattern=".*\S.*"
                    placeholder="e.g. WB11F7262"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>
                <div className="basic-info-form-field">
                  <label htmlFor="vehicle-chassis-input" className="basic-info-label">
                    Chassis / VIN *
                  </label>
                  <input
                    id="vehicle-chassis-input"
                    aria-label="Chassis / VIN"
                    className="basic-info-input monospace-input"
                    value={formData.chassis_number}
                    onChange={(event) => change('chassis_number', event.target.value)}
                    required
                    pattern=".*\S.*"
                    placeholder="Enter chassis number"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label htmlFor="vehicle-model-input" className="basic-info-label">
                    Model *
                  </label>
                  <input
                    id="vehicle-model-input"
                    aria-label="Model"
                    className="basic-info-input"
                    value={formData.model}
                    onChange={(event) => change('model', event.target.value)}
                    required
                    pattern=".*\S.*"
                    placeholder={
                      formData.manufacturer === 'ASHOK LEYLAND'
                        ? 'e.g. AVTR, Ecomet'
                        : 'e.g. Signa 2823.K, LPT 4830'
                    }
                    disabled={isSubmitting}
                  />
                  <p className="field-hint-text">Enter the model shown on the vehicle documents.</p>
                </div>
                {showExpectedMileage && (
                  <div className="basic-info-form-field">
                    <label htmlFor="vehicle-mileage-input" className="basic-info-label">
                      Expected mileage (km/L) <span className="field-badge-optional">Optional</span>
                    </label>
                    <input
                      id="vehicle-mileage-input"
                      aria-label="Expected mileage (km/L)"
                      type="number"
                      className="basic-info-input"
                      value={formData.expected_mileage}
                      onChange={(event) => change('expected_mileage', event.target.value)}
                      min="0.1"
                      max="100"
                      step="0.1"
                      disabled={isSubmitting}
                      placeholder="e.g. 4.2"
                    />
                    <p className="field-hint-text">Leave blank to use the model average.</p>
                  </div>
                )}
              </div>
              <section
                className="telematics-assignment-section"
                aria-labelledby="vehicle-assignment-title"
              >
                <div className="telematics-section-header">
                  <Building2 size={18} />
                  <div>
                    <h2 id="vehicle-assignment-title" className="telematics-header-title">
                      Assignment
                    </h2>
                    <p className="field-hint-text">Choose the operating location and account.</p>
                  </div>
                </div>
                <div className="basic-info-form-row">
                  <div className="basic-info-form-field">
                    <label htmlFor="vehicle-branch-select" className="basic-info-label">
                      Operating location
                    </label>
                    {isEdit || activeBranchId ? (
                      <div className="location-locked-card">
                        {isEdit
                          ? 'Existing location (unchanged)'
                          : activeBranch?.name ||
                            branches.find((branch) => String(branch._id) === String(activeBranchId))
                              ?.name ||
                            'Current location'}
                      </div>
                    ) : (
                      <select
                        id="vehicle-branch-select"
                        className="basic-info-input"
                        value={selectedBranchId}
                        onChange={(event) => onBranchChange(event.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Enterprise (all locations)</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={String(branch._id)}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="basic-info-form-field">
                    <label htmlFor="vehicle-account-select" className="basic-info-label">
                      Account <span className="field-badge-optional">Optional</span>
                    </label>
                    <select
                      id="vehicle-account-select"
                      className="basic-info-input"
                      value={selectedAccountId}
                      onChange={(event) => onAccountChange(event.target.value)}
                      disabled={
                        isSubmitting ||
                        !canAssignAccount ||
                        accountsLoading ||
                        accountsError ||
                        !manufacturer
                      }
                    >
                      <option value="">
                        {accountsLoading
                          ? 'Loading accounts…'
                          : !manufacturer
                            ? 'Choose manufacturer first'
                            : 'No account — assign later'}
                      </option>
                      {selectedAccountId &&
                        !fleetEdgeAccounts.some(
                          (account) => String(account._id) === selectedAccountId,
                        ) && <option value={selectedAccountId}>Current account (unchanged)</option>}
                      {fleetEdgeAccounts.map((account) => (
                        <option key={account._id} value={String(account._id)}>
                          {account.friendlyName || account.externalAccountId}
                        </option>
                      ))}
                    </select>
                    {!canAssignAccount ? (
                      <p className="field-hint-text">
                        An owner manages account assignments. Existing assignments are preserved.
                      </p>
                    ) : accountsError ? (
                      <p className="vehicle-inline-message">
                        Accounts could not be loaded.{' '}
                        <button type="button" onClick={onRetryAccounts}>
                          Retry
                        </button>
                      </p>
                    ) : (
                      <p className="field-hint-text">
                        {manufacturer && !accountsLoading && fleetEdgeAccounts.length === 0
                          ? 'No compatible accounts connected. You can save and assign one later.'
                          : 'Optional. Select a connected account or assign one later.'}
                      </p>
                    )}
                    {accountNotice && (
                      <p className="vehicle-inline-message" role="status">
                        {accountNotice}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </form>
          </div>
        </div>
      </div>
    );
  },
);
VehicleBasicInformationForm.displayName = 'VehicleBasicInformationForm';
export default VehicleBasicInformationForm;
