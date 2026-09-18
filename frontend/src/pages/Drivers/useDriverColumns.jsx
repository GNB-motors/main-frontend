/* eslint-disable react-refresh/only-export-components */
// DataTable column definitions for the Drivers/Employees page.
// Follows the unified PageShell + DataTable design used across other sections.
import React from 'react';
import { Eye, Pencil, Trash2, ToggleRight } from 'lucide-react';

/**
 * DriverInlineActions
 * Renders inline icon buttons directly in the Actions column, matching VehiclesPage:
 *   👁  View profile/edit  |  ✏️  Edit  |  🗑  Delete
 * For deactivated employees, the edit/delete pair is replaced with "Mark as active".
 */
function DriverInlineActions({ driver, isSubmitting, onEdit, onDelete, onActivateHere }) {
  const isDeactivatedHere = driver?.branchStatus === 'DEACTIVATED';

  const handleView = (e) => {
    e.stopPropagation();
    onEdit(driver);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(driver);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(driver);
  };

  const handleActivate = (e) => {
    e.stopPropagation();
    onActivateHere(driver);
  };

  return (
    <div className="vehicle-inline-actions driver-inline-actions">
      {/* View profile — always available */}
      <button
        className="vehicle-inline-btn vehicle-inline-btn--view"
        onClick={handleView}
        disabled={isSubmitting}
        title="View details"
        type="button"
      >
        <Eye size={16} />
      </button>

      {isDeactivatedHere ? (
        /* Deactivated employee: action is to re-activate */
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
            title="Edit employee"
            type="button"
          >
            <Pencil size={16} />
          </button>
          <button
            className="vehicle-inline-btn vehicle-inline-btn--delete"
            onClick={handleDelete}
            disabled={isSubmitting}
            title="Delete employee"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  );
}

export function useDriverColumns({
  onEdit,
  onDelete,
  onActivateHere,
  onDeactivate,
  getInitials,
  formatRole,
  isSubmitting = false,
}) {
  return [
    {
      key: 'name',
      label: 'Name',
      render: (driver) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-primary-100, #fee2e2)',
              color: 'var(--color-primary-700, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {getInitials ? getInitials(driver.name) : driver.name?.charAt(0) || 'E'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--ds-ink, #0f172a)', fontSize: '13.5px' }}>
              {driver.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--ds-ink3, #64748b)' }}>
              {formatRole ? formatRole(driver.role, driver.is_superadmin) : driver.role || 'Driver'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      label: 'Contact',
      render: (driver) => (
        <span style={{ fontSize: '13px', color: 'var(--ds-ink2, #334155)' }}>
          {driver.mobileNumber || '-'}
        </span>
      ),
    },
    {
      key: 'assignedVehicle',
      label: 'Assigned Vehicle',
      render: (driver) => {
        const hasVehicle = driver.assignedVehicle && driver.assignedVehicle !== 'Unassigned';
        return (
          <span
            style={{
              fontSize: '13px',
              fontWeight: hasVehicle ? 600 : 400,
              color: hasVehicle ? 'var(--ds-ink, #0f172a)' : 'var(--ds-ink3, #94a3b8)',
              fontFamily: hasVehicle ? 'var(--font-mono, monospace)' : 'inherit',
            }}
          >
            {driver.assignedVehicle || 'Unassigned'}
          </span>
        );
      },
    },
    {
      key: 'licenseNumber',
      label: 'License / Docs',
      render: (driver) => (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: 'var(--ds-ink2, #475569)',
          }}
        >
          {driver.licenseNumber || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (driver) => {
        if (driver.branchStatus === 'DEACTIVATED') {
          return (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                display: 'inline-block',
              }}
            >
              Deactivated
            </span>
          );
        }
        const st = (driver.status || 'PENDING').toUpperCase();
        const isAct = st === 'ACTIVE';
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              background: isAct ? '#dcfce7' : '#fef9c3',
              color: isAct ? '#166534' : '#854d0e',
              border: `1px solid ${isAct ? '#bbf7d0' : '#fef08a'}`,
              display: 'inline-block',
            }}
          >
            {driver.status || 'PENDING'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (driver) => (
        <DriverInlineActions
          driver={driver}
          isSubmitting={isSubmitting}
          onEdit={onEdit}
          onDelete={onDelete}
          onActivateHere={onActivateHere}
          onDeactivate={onDeactivate}
        />
      ),
    },
  ];
}
