// DataTable column definitions for the Drivers/Employees page.
// Follows the unified PageShell + DataTable design used across other sections.
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ActionMenu } from './Component/DriverMenuExtras.jsx';

export function useDriverColumns({
  openMenuDriverId,
  setOpenMenuDriverId,
  menuPosition,
  setMenuPosition,
  onEdit,
  onDelete,
  onActivateHere,
  onDeactivate,
  getInitials,
  formatRole,
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
      key: 'id',
      label: 'Emp ID',
      render: (driver) => (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: 'var(--ds-ink2, #334155)',
          }}
        >
          {driver.id ? `${driver.id.substring(0, 8)}...` : '-'}
        </span>
      ),
    },
    {
      key: 'mobileNumber',
      label: 'Contact',
      render: (driver) => (
        <span style={{ fontSize: '13px', color: 'var(--ds-ink2, #334155)' }}>
          {driver.mobileNumber || driver.email || '-'}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (driver) => (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #e2e8f0',
            display: 'inline-block',
          }}
        >
          {formatRole ? formatRole(driver.role, driver.is_superadmin) : driver.role || '-'}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (driver) => (
        <span style={{ fontSize: '13px', color: 'var(--ds-ink3, #64748b)' }}>
          {driver.email || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (driver) => {
        if (driver.branchStatus === 'DEACTIVATED') {
          return (
            <span
              title="This employee moved to another location and is deactivated here"
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
        <div
          className={`drivers-action-menu-container drivers-action-menu-container-${driver.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="drivers-action-menu-btn"
            type="button"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ds-ink2, #475569)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (openMenuDriverId === driver.id) {
                setOpenMenuDriverId(null);
                setMenuPosition(null);
              } else {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  top: rect.top,
                  bottom: rect.bottom,
                  right: rect.right,
                });
                setOpenMenuDriverId(driver.id);
              }
            }}
          >
            <MoreHorizontal size={18} />
          </button>
          {openMenuDriverId === driver.id && (
            <ActionMenu
              driver={driver}
              onEdit={onEdit}
              onDelete={onDelete}
              onActivateHere={onActivateHere}
              onDeactivate={onDeactivate}
              position={menuPosition}
            />
          )}
        </div>
      ),
    },
  ];
}
