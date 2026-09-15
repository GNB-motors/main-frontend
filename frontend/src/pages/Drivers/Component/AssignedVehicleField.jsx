import React, { useEffect, useState } from 'react';
import { TripService } from '../../Trip/services';

const vehicleLabel = (v) => (v ? `${v.registrationNumber}${v.model ? ` - ${v.model}` : ''}` : '');

/**
 * Vehicle picker for the Employee form — a plain controlled <select>, saved
 * together with the rest of the employee on the form's own Save action (see
 * AddDriverPage's syncVehicleAssignment, called right after create/update).
 * No save/assign button of its own.
 *
 * Backed by the DriverVehicleAssignment ledger (app/modules/driverVehicleAssignment)
 * — a separate collection, not a field on Employee or Vehicle. Also editable
 * from Khata Ledger's Assignments tab; both surfaces read/write the same record.
 */
const AssignedVehicleField = ({ value, onChange }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TripService.getVehicles({ limit: 200 })
      .then((res) => setVehicles(res?.data || []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="basic-info-form-field">
      <label className="basic-info-label">Assigned Vehicle</label>
      <select
        className="basic-info-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading...' : 'Not assigned'}</option>
        {vehicles.map((v) => (
          <option key={v._id} value={v._id}>
            {vehicleLabel(v)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AssignedVehicleField;
