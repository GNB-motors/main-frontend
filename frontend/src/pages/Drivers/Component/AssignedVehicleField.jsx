import React, { useEffect, useId, useState } from 'react';
import { getVehicleList } from '../../../services/vehicleListService';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';

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
const AssignedVehicleField = ({ value, onChange, currentDriverId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [assignmentsByVehicle, setAssignmentsByVehicle] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const selectId = useId();

  useEffect(() => {
    let active = true;
    Promise.all([
      getVehicleList().catch(() => []),
      DriverVehicleAssignmentService.getAllActiveAssignments().catch(() => []),
    ]).then(([vehicleList, activeAssignments]) => {
      if (!active) return;
      setVehicles(vehicleList || []);
      const byVeh = new Map();
      for (const a of activeAssignments || []) {
        const vId = DriverVehicleAssignmentService.idOf(a.vehicleId);
        if (vId && !byVeh.has(String(vId))) {
          byVeh.set(String(vId), a);
        }
      }
      setAssignmentsByVehicle(byVeh);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedAssignment = value ? assignmentsByVehicle.get(String(value)) : null;
  const isAssignedToOther =
    selectedAssignment &&
    DriverVehicleAssignmentService.idOf(selectedAssignment.driverId) !==
      String(currentDriverId || '');

  const conflictingDriverName = selectedAssignment
    ? [selectedAssignment.driverId?.firstName, selectedAssignment.driverId?.lastName]
        .filter(Boolean)
        .join(' ') ||
      selectedAssignment.driverId?.mobileNumber ||
      'another driver'
    : '';

  return (
    <div className="basic-info-form-field">
      <label className="basic-info-label" htmlFor={selectId}>
        Assigned Vehicle
      </label>
      <select
        id={selectId}
        className="basic-info-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading...' : 'Not assigned'}</option>
        {vehicles.map((v) => {
          const assignment = assignmentsByVehicle.get(String(v._id));
          let suffix = '';
          if (assignment) {
            const assignedDriverId = DriverVehicleAssignmentService.idOf(assignment.driverId);
            const isThisDriver = currentDriverId && String(currentDriverId) === assignedDriverId;
            if (isThisDriver) {
              suffix = ' (Current driver)';
            } else {
              const dName =
                [assignment.driverId?.firstName, assignment.driverId?.lastName]
                  .filter(Boolean)
                  .join(' ') ||
                assignment.driverId?.mobileNumber ||
                '';
              suffix = dName ? ` (Assigned to ${dName})` : ' (Assigned)';
            }
          }
          return (
            <option key={v._id} value={v._id}>
              {vehicleLabel(v)}
              {suffix}
            </option>
          );
        })}
      </select>
      {isAssignedToOther && (
        <p
          style={{
            marginTop: '6px',
            fontSize: '12px',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>⚠️</span>
          <span>
            Currently assigned to <strong>{conflictingDriverName}</strong>. Saving will prompt for
            handover.
          </span>
        </p>
      )}
    </div>
  );
};

export default AssignedVehicleField;
