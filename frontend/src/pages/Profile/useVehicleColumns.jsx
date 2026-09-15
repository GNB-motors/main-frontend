/* eslint-disable react-refresh/only-export-components */
// DataTable column definitions for the Vehicles page.
// Extracted from VehiclesPage.jsx (WS0.7) to keep the page under the file-size rule;
// cell markup preserved byte-identically.
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, ToggleRight } from 'lucide-react';
import { describeFleetEdgeAccount } from './vehicleList.js';

/**
 * VehicleInlineActions
 * Renders three icon buttons directly in the Actions column:
 *   👁  View profile  |  ✏️  Edit  |  🗑  Delete
 * For deactivated vehicles the edit/delete pair is replaced with "Mark as active".
 */
function VehicleInlineActions({ vehicle, isSubmitting, onEdit, onDelete, onActivateHere }) {
  const navigate = useNavigate();
  const isDeactivatedHere = vehicle?.branchStatus === 'DEACTIVATED';

  const handleView = (e) => {
    e.stopPropagation();
    navigate(`/vehicles/${encodeURIComponent(vehicle.registration_no)}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(vehicle);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(vehicle);
  };

  const handleActivate = (e) => {
    e.stopPropagation();
    onActivateHere(vehicle);
  };

  return (
    <div className="vehicle-inline-actions">
      {/* View profile — always available */}
      <button
        className="vehicle-inline-btn vehicle-inline-btn--view"
        onClick={handleView}
        disabled={isSubmitting}
        title="View profile"
        type="button"
      >
        <Eye size={16} />
      </button>

      {isDeactivatedHere ? (
        /* Deactivated vehicle: only action is to re-activate */
        <button
          className="vehicle-inline-btn vehicle-inline-btn--activate"
          onClick={handleActivate}
          disabled={isSubmitting}
          title="Mark as active"
          type="button"
        >
          <ToggleRight size={16} />
        </button>
      ) : (
        <>
          <button
            className="vehicle-inline-btn vehicle-inline-btn--edit"
            onClick={handleEdit}
            disabled={isSubmitting}
            title="Edit vehicle"
            type="button"
          >
            <Pencil size={16} />
          </button>
          <button
            className="vehicle-inline-btn vehicle-inline-btn--delete"
            onClick={handleDelete}
            disabled={isSubmitting}
            title="Delete vehicle"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  );
}

export function useVehicleColumns({ accountMap, isSubmitting, onEdit, onDelete, onActivateHere }) {
  return [
    {
      key: 'registration_no',
      label: 'Vehicle No',
      render: (vehicle) => (
        <>
          {/* The registration is the way into the vehicle's 360 page. The row
              itself still opens the edit form, so stop propagation here. */}
          <Link
            to={`/vehicles/${encodeURIComponent(vehicle.registration_no)}`}
            onClick={(e) => e.stopPropagation()}
            style={{ fontWeight: 600, color: 'var(--gnb-400)' }}
            title={`Open ${vehicle.registration_no} profile`}
          >
            {vehicle.registration_no}
          </Link>
          {vehicle.branchStatus === 'DEACTIVATED' && (
            <span
              className="vehicle-badge"
              title="Moved to another location — deactivated here"
              style={{
                marginLeft: 8,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
              }}
            >
              Deactivated
            </span>
          )}
        </>
      ),
    },
    { key: 'model', label: 'Model', render: (vehicle) => vehicle.model || 'N/A' },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      render: (vehicle) =>
        vehicle.manufacturer && vehicle.manufacturer !== 'UNKNOWN' ? (
          <span
            className={`vehicle-badge manufacturer-${vehicle.manufacturer?.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {vehicle.manufacturer}
          </span>
        ) : (
          <span className="vehicle-badge vehicle-badge-unknown">—</span>
        ),
    },
    {
      key: 'vehicleCategory',
      label: 'Category',
      render: (vehicle) =>
        vehicle.vehicleCategory && vehicle.vehicleCategory !== 'UNKNOWN' ? (
          <span className={`vehicle-badge category-${vehicle.vehicleCategory?.toLowerCase()}`}>
            {vehicle.vehicleCategory}
          </span>
        ) : (
          <span className="vehicle-badge vehicle-badge-unknown">—</span>
        ),
    },
    {
      key: 'chassis_number',
      label: 'Chassis No',
      render: (vehicle) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {vehicle.chassis_number || 'N/A'}
        </span>
      ),
    },
    {
      key: 'fleetEdgeAccountId',
      label: 'FleetEdge Account',
      render: (vehicle) => {
        const acct = describeFleetEdgeAccount(vehicle, accountMap);
        if (!acct.tagged) {
          return <span style={{ fontStyle: 'italic', color: '#aaa', fontSize: 12 }}>untagged</span>;
        }
        return (
          <span
            title={acct.tip}
            className="vehicle-badge"
            style={{
              background: acct.isDisabled ? '#fef3c7' : '#eff6ff',
              color: acct.isDisabled ? '#92400e' : '#1d4ed8',
              border: `1px solid ${acct.isDisabled ? '#fde68a' : '#bfdbfe'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {acct.isDisabled && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'inline-block',
                }}
                title="Source account disabled"
              />
            )}
            {acct.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (vehicle) => (
        <VehicleInlineActions
          vehicle={vehicle}
          isSubmitting={isSubmitting}
          onEdit={onEdit}
          onDelete={onDelete}
          onActivateHere={onActivateHere}
        />
      ),
    },
  ];
}
