import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { Wrench } from 'lucide-react';
import SearchableDropdown from '../../../components/SearchableDropdown/SearchableDropdown.jsx';
import '../../Drivers/Component/BasicInformationForm.css';

export const DEFAULT_SERVICE_TYPES = [
  'Periodic / Scheduled Service',
  'Engine Oil Change',
  'Brake Service',
  'Clutch Service',
  'Suspension / Steering',
  'Cooling System (Coolant / Radiator)',
  'Air Filter / Fuel Filter',
  'Tyre Rotation / Alignment',
  'Full Body / Detailing',
];

export const DEFAULT_REPAIR_TYPES = [
  'Engine Repair',
  'Transmission / Gearbox',
  'Brake System',
  'Clutch Replacement',
  'Suspension',
  'Electrical / Wiring',
  'Cooling / Radiator',
  'Body / Dent / Paint',
  'Tyre / Puncture',
  'Air Conditioning',
];

const mergeUnique = (defaults, fromServer) => {
  const set = new Set(defaults);
  (fromServer || []).forEach((v) => v && set.add(v));
  return Array.from(set);
};

const MaintenanceBasicInformationForm = forwardRef(
  (
    {
      recordType,
      vehicles = [],
      options = { workshops: [], serviceTypes: [], repairTypes: [] },
      initialData = {},
      isSubmitting = false,
      onSubmit,
      onRequestAddWorkshop,    // (searchTerm: string) => void
      onRequestAddType,        // (searchTerm: string) => void
    },
    ref,
  ) => {
    const isService = recordType === 'SERVICE';

    const [formData, setFormData] = useState({
      vehicleId: initialData.vehicleId || '',
      date: initialData.date || '',
      currentKm: initialData.currentKm || '',
      workshop: initialData.workshop || '',
      type: initialData.type || '',
      amount: initialData.amount || '',
      notes: initialData.notes || '',
    });

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        setFormData((prev) => ({ ...prev, ...initialData }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit?.(formData);
    };

    // SearchableDropdown accepts options that are either strings or { name }.
    // Vehicle list: map to {_id, name} so we can recover the id on select.
    const vehicleOptions = useMemo(
      () =>
        vehicles.map((v) => ({
          _id: v._id,
          name: `${v.registrationNumber}${v.model ? ' · ' + v.model : ''}`,
        })),
      [vehicles],
    );

    const selectedVehicleLabel =
      vehicleOptions.find((v) => v._id === formData.vehicleId)?.name || '';

    const workshopList = options.workshops || [];
    const typeList = mergeUnique(
      isService ? DEFAULT_SERVICE_TYPES : DEFAULT_REPAIR_TYPES,
      isService ? options.serviceTypes : options.repairTypes,
    );

    return (
      <div className="basic-info-wrapper">
        <div className="basic-info-outer-container">
          {/* Header */}
          <div className="basic-info-header">
            <div className="basic-info-header-content">
              <div className="basic-info-icon-wrapper">
                <Wrench size={20} color="#454547" />
              </div>
              <div className="basic-info-title">
                {isService ? 'Service Details' : 'Repair Details'}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="basic-info-container">
            <form ref={ref} onSubmit={handleSubmit} className="basic-info-form">
              {/* Vehicle (full width) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="basic-info-label">Vehicle *</label>
                  <SearchableDropdown
                    options={vehicleOptions}
                    selectedOption={selectedVehicleLabel}
                    placeholder="Select vehicle"
                    onSelect={(opt) => set('vehicleId', opt._id)}
                  />
                </div>
              </div>

              {/* Date + (Current KM | Amount) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label className="basic-info-label">
                    {isService ? 'Service Date *' : 'Repair Date *'}
                  </label>
                  <input
                    type="date"
                    className="basic-info-input"
                    value={formData.date}
                    onChange={(e) => set('date', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {isService ? (
                  <div className="basic-info-form-field">
                    <label className="basic-info-label">Current KM</label>
                    <input
                      type="number"
                      min="0"
                      className="basic-info-input"
                      value={formData.currentKm}
                      onChange={(e) => set('currentKm', e.target.value)}
                      placeholder="e.g., 45230"
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="basic-info-form-field">
                    <label className="basic-info-label">Amount (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="basic-info-input"
                      value={formData.amount}
                      onChange={(e) => set('amount', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              {/* Workshop (full width) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="basic-info-label">
                    {isService ? 'Workshop / Service Center *' : 'Workshop Name *'}
                  </label>
                  <SearchableDropdown
                    options={workshopList}
                    selectedOption={formData.workshop}
                    placeholder={
                      workshopList.length === 0
                        ? 'No workshops saved yet — type to add one'
                        : 'Select workshop'
                    }
                    onSelect={(value) => set('workshop', value)}
                    onRequestAddNew={(searchTerm, clearSearch) =>
                      onRequestAddWorkshop?.(searchTerm, clearSearch)
                    }
                    addNewLabel="Add workshop"
                  />
                </div>
              </div>

              {/* Service / Repair Type (full width) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="basic-info-label">
                    {isService ? 'Service Type *' : 'Repair Type *'}
                  </label>
                  <SearchableDropdown
                    options={typeList}
                    selectedOption={formData.type}
                    placeholder="Select type"
                    onSelect={(value) => set('type', value)}
                    onRequestAddNew={(searchTerm, clearSearch) =>
                      onRequestAddType?.(searchTerm, clearSearch)
                    }
                    addNewLabel={isService ? 'Add service type' : 'Add repair type'}
                  />
                </div>
              </div>

              {/* Amount (service only — repair already used row 2) */}
              {isService && (
                <div className="basic-info-form-row">
                  <div className="basic-info-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="basic-info-label">Amount (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="basic-info-input"
                      value={formData.amount}
                      onChange={(e) => set('amount', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* Notes (full width) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="basic-info-label">
                    {isService ? 'Notes' : 'Issue Description'}
                  </label>
                  <textarea
                    className="basic-info-input"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder={
                      isService
                        ? 'Anything noteworthy about this service'
                        : 'Describe the issue and what was fixed'
                    }
                    disabled={isSubmitting}
                    style={{ resize: 'vertical', minHeight: 84 }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  },
);

MaintenanceBasicInformationForm.displayName = 'MaintenanceBasicInformationForm';

export default MaintenanceBasicInformationForm;
