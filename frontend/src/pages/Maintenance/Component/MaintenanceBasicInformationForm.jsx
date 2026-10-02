/* eslint-disable react-refresh/only-export-components -- companion exports alongside the component */
import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { Wrench, Smartphone, Lock } from 'lucide-react';
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
  'Others / Miscellaneous',
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
  'Others / Miscellaneous',
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
      drivers = [],
      options = { workshops: [], serviceTypes: [], repairTypes: [] },
      initialData = {},
      isSubmitting = false,
      onSubmit,
      onRequestAddWorkshop, // (searchTerm: string) => void
      onRequestAddType, // (searchTerm: string) => void
    },
    ref,
  ) => {
    const isService = recordType === 'SERVICE';

    const [formData, setFormData] = useState({
      vehicleId: initialData.vehicleId || '',
      driverId: initialData.driverId || '',
      date: initialData.date || '',
      currentKm: initialData.currentKm || '',
      workshop: initialData.workshop || '',
      type: initialData.type || '',
      amount: initialData.amount || '',
      notes: initialData.notes || '',
    });

    const [customType, setCustomType] = useState('');

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        const isCustom =
          initialData.type &&
          !DEFAULT_SERVICE_TYPES.includes(initialData.type) &&
          !DEFAULT_REPAIR_TYPES.includes(initialData.type) &&
          !options.serviceTypes?.includes(initialData.type) &&
          !options.repairTypes?.includes(initialData.type);

        if (isCustom && initialData.type !== 'Others / Miscellaneous') {
          setCustomType(initialData.type);
          setFormData((prev) => ({
            ...prev,
            ...initialData,
            type: 'Others / Miscellaneous',
          }));
        } else {
          setFormData((prev) => ({ ...prev, ...initialData }));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
      e.preventDefault();
      const isOther = formData.type === 'Others / Miscellaneous';
      const resolvedType = isOther ? customType.trim() || 'Others / Miscellaneous' : formData.type;

      onSubmit?.({
        ...formData,
        type: resolvedType,
      });
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

    // Driver options with robust name and phone number resolution from employee records
    const driverOptions = useMemo(
      () =>
        drivers.map((d) => {
          const id = d._id || d.id;
          const firstName = (d.firstName || d.first_name || '').trim();
          const lastName = (d.lastName || d.last_name || '').trim();
          const combined = [firstName, lastName].filter(Boolean).join(' ');

          const displayName =
            (d.name && d.name.trim() !== '' && d.name.trim().toLowerCase() !== 'driver'
              ? d.name.trim()
              : '') ||
            combined ||
            (d.fullName && d.fullName.trim() !== '' ? d.fullName.trim() : '') ||
            (d.employeeId ? `Employee ${d.employeeId}` : '') ||
            (d.name ? d.name.trim() : '') ||
            'Driver';

          const phone = d.mobileNumber || d.mobile_number || d.mobile || d.phone || '';
          const roleTag = d.role && d.role !== 'DRIVER' ? ` · ${d.role}` : '';
          const label = `${displayName}${phone ? ` (${phone})` : ''}${roleTag}`;

          return {
            _id: id,
            name: label,
            rawName: displayName,
          };
        }),
      [drivers],
    );

    const selectedDriverOption = driverOptions.find((d) => d._id === formData.driverId);
    const selectedDriverLabel =
      selectedDriverOption?.name ||
      initialData.driverName ||
      (initialData.driver ? `${initialData.driver.name || ''}` : '') ||
      '';

    const isDriverAppSource = !!(
      initialData.isDriverApp ||
      initialData.fromDriverApp ||
      initialData.source === 'DRIVER_APP' ||
      initialData.source === 'driver_app' ||
      initialData.loggedBy === 'DRIVER'
    );

    const handleVehicleSelect = (opt) => {
      set('vehicleId', opt._id);
      const foundVeh = vehicles.find((v) => v._id === opt._id);
      if (foundVeh && !formData.driverId) {
        const matchedDriverId =
          foundVeh.driverId ||
          foundVeh.assignedDriver?._id ||
          (typeof foundVeh.assignedDriver === 'string' ? foundVeh.assignedDriver : '') ||
          foundVeh.driver?._id ||
          '';
        if (matchedDriverId) {
          set('driverId', matchedDriverId);
        }
      }
    };

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
              {/* Row 1: Vehicle & Driver */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label className="basic-info-label">Vehicle *</label>
                  <SearchableDropdown
                    options={vehicleOptions}
                    selectedOption={selectedVehicleLabel}
                    placeholder="Select vehicle"
                    onSelect={handleVehicleSelect}
                  />
                </div>

                <div className="basic-info-form-field">
                  {isDriverAppSource ? (
                    <>
                      <label className="basic-info-label">Driver (Reported via Driver App)</label>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: '#f8fafc',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: 8,
                          minHeight: 40,
                        }}
                      >
                        <Smartphone size={16} color="#2563eb" />
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', flex: 1 }}>
                          {selectedDriverLabel ||
                            initialData.driverName ||
                            'Driver (Auto-filled from App)'}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            borderRadius: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Auto-filled
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="basic-info-label">Driver (Assigned / Reported by)</label>
                      <SearchableDropdown
                        options={driverOptions}
                        selectedOption={selectedDriverLabel}
                        placeholder={
                          driverOptions.length === 0 ? 'Select driver (optional)' : 'Select driver'
                        }
                        onSelect={(opt) => set('driverId', opt._id)}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Row 2: Date & Workshop */}
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
                <div className="basic-info-form-field">
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

              {/* Row 3: Current KM & Amount (mouse wheel disabled) */}
              <div className="basic-info-form-row">
                <div className="basic-info-form-field">
                  <label className="basic-info-label">Current KM</label>
                  <input
                    type="number"
                    min="0"
                    className="basic-info-input"
                    value={formData.currentKm}
                    onChange={(e) => set('currentKm', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="e.g., 45230"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="basic-info-form-field">
                  <label className="basic-info-label">Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="basic-info-input"
                    value={formData.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Row 4: Service / Repair Type & Optional Custom Type */}
              <div className="basic-info-form-row">
                <div
                  className="basic-info-form-field"
                  style={formData.type === 'Others / Miscellaneous' ? {} : { gridColumn: '1 / -1' }}
                >
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

                {formData.type === 'Others / Miscellaneous' && (
                  <div className="basic-info-form-field">
                    <label className="basic-info-label">
                      Specify {isService ? 'Service' : 'Repair'} Type *
                    </label>
                    <input
                      type="text"
                      className="basic-info-input"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder={
                        isService
                          ? 'e.g., CNG Kit Tuning, GPS Calibration'
                          : 'e.g., Side Mirror, Horn Wiring'
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              {/* Row 5: Notes / Issue Description */}
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
