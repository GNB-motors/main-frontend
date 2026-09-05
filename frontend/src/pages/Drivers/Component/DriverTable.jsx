import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { DriversTableSkeleton, ActionMenu } from './driversComponents.jsx';

// --- Drivers Table Component ---
// Receives everything the inline table JSX referenced from the parent scope:
// the (filtered/paginated) drivers list, loading state, action-menu state +
// setters, and the parent handlers. No state lives here.
const DriverTable = ({
    drivers,
    isLoading,
    rows,
    searchTerm,
    openMenuDriverId,
    setOpenMenuDriverId,
    menuPosition,
    setMenuPosition,
    onRowClick,
    onEdit,
    onDelete,
    onActivateHere,
    onDeactivate,
    getInitials,
    formatRole,
}) => {
    return (
        <div className="drivers-table-container">
            <div className="drivers-table-wrapper">
                <table className="drivers-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Emp ID</th>
                            <th>Contact</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    {isLoading ? (
                        <DriversTableSkeleton rows={rows} />
                    ) : drivers.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-grey-400)'}}>
                                {searchTerm ? 'No drivers match your search.' : 'No drivers found for this business.'}
                            </td>
                        </tr>
                    ) : (
                        drivers.map((driver) => (
                            <tr
                                key={driver.id}
                                className={`drivers-table-row ${openMenuDriverId === driver.id ? 'menu-open' : ''} ${driver.branchStatus === 'DEACTIVATED' ? 'drivers-table-row--deactivated' : ''}`}
                                onClick={() => onRowClick(driver)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>
                                    <div className="drivers-driver-name-cell">
                                        <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
                                        <div className="drivers-driver-info">
                                            <span>{driver.name}</span>
                                            <span className="drivers-driver-role">{formatRole(driver.role, driver.is_superadmin)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{driver.id ? driver.id.substring(0, 8) + '...' : '-'}</td>
                                <td>{driver.mobileNumber || driver.email || '-'}</td>
                                <td>{formatRole(driver.role, driver.is_superadmin)}</td>
                                <td>{driver.email || '-'}</td>
                                <td>
                                    <div className="drivers-status-cell">
                                        {driver.branchStatus === 'DEACTIVATED' ? (
                                            <div
                                                className="drivers-status-badge drivers-status-suspended"
                                                title="This employee moved to another location and is deactivated here"
                                            >
                                                <span>Deactivated</span>
                                            </div>
                                        ) : (
                                            <div className={`drivers-status-badge drivers-status-${(driver.status || 'PENDING').toLowerCase()}`}>
                                                <span>{driver.status || 'PENDING'}</span>
                                            </div>
                                        )}
                                        <div className={`drivers-action-menu-container drivers-action-menu-container-${driver.id}`}>
                                            <button
                                                className="drivers-action-menu-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (openMenuDriverId === driver.id) {
                                                        setOpenMenuDriverId(null);
                                                        setMenuPosition(null);
                                                    } else {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setMenuPosition({ top: rect.top, bottom: rect.bottom, right: rect.right });
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
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            </div>
        </div>
    );
};

export default DriverTable;
