/* eslint-disable react-refresh/only-export-components -- helper exports (getInitials, formatRole, ROLE_LABELS) live alongside the components that use them */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { X, Edit, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';

// Function to get initials from name
export const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

// Human-friendly labels for the role enum.
export const ROLE_LABELS = { DRIVER: 'Driver', MANAGER: 'Manager', KAM: 'Key Account Manager', FIELD_AGENT: 'Field Agent', SUPER_ADMIN: 'Super Admin' };
export const formatRole = (role, isSuperadmin) => {
    if (isSuperadmin) return 'Super Admin';
    return ROLE_LABELS[role] || role || 'Employee';
};

// --- Add Driver Modal Component ---
export const AddDriverModal = ({ isOpen, onClose, onSubmit, isLoading: isSubmitting }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [location, setLocation] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DRIVER');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (!firstName) {
            setError("First name is required.");
            return;
        }

        const driverData = {
            firstName: firstName || null,
            lastName: lastName || null,
            email: email || null,
            mobileNumber: mobileNumber || null,
            location: location || null,
            password: password || null,
            role: role || 'DRIVER',
        };

        try {
            await onSubmit(driverData);
            // Clear form and close modal on successful submission (handled by parent)
            // No need to clear here if useEffect handles it based on isOpen
        } catch (submitError) {
            const errorMessage = submitError?.detail || "Failed to add driver. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    // Reset form when modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setFirstName('');
            setLastName('');
            setEmail('');
            setMobileNumber('');
            setLocation('');
            setPassword('');
            setRole('DRIVER');
            setError(null);
        }
    }, [isOpen]);


    if (!isOpen) return null;

    return (
        <div className="drivers-modal-overlay" onClick={onClose}>
            <div className="drivers-modal-content" onClick={e => e.stopPropagation()}>
                <div className="drivers-modal-header">
                    <h4>Add New Employee</h4>
                    <button onClick={onClose} className="drivers-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="drivers-modal-form">
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="driverFirstName">First Name *</label>
                            <input
                                id="driverFirstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="driverLastName">Last Name</label>
                            <input
                                id="driverLastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="driverEmail">Email</label>
                            <input
                                id="driverEmail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="driverMobile">Mobile Number</label>
                            <input
                                id="driverMobile"
                                type="text"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="+919XXXXXXXXX"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="driverLocation">Location</label>
                            <input
                                id="driverLocation"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Pune Base"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="driverPassword">Password</label>
                            <input
                                id="driverPassword"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Temporary password"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="driverRole">Role</label>
                            <input
                                id="driverRole"
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g., DRIVER, MANAGER"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {error && <div className="drivers-error-message">{error}</div>}

                    <div className="drivers-modal-actions">
                        <NewButton
                            variant="secondary"
                            size="md"
                            type="button"
                            text="Cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        />
                        <NewButton
                            variant="primary"
                            size="md"
                            type="submit"
                            text="Add Employee"
                            loading={isSubmitting}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Edit Driver Modal Component ---
export const EditDriverModal = ({ isOpen, onClose, onSubmit, driver, isLoading: isSubmitting, availableVehicles = [] }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [location, setLocation] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState('');
    const [error, setError] = useState(null);

    // Populate form when driver data is available
    useEffect(() => {
        if (driver) {
            setFirstName(driver.firstName || driver.first_name || '');
            setLastName(driver.lastName || driver.last_name || '');
            setEmail(driver.email || '');
            setMobileNumber(driver.mobileNumber || driver.mobile_number || '');
            setLocation(driver.location || '');
            setRole(driver.role || '');
            setStatus(driver.status || 'PENDING');
            setVehicleRegistrationNo(driver.vehicle_registration_no || ''); // Use vehicle_registration_no from backend
            setError(null);
        }
        // Reset if modal closes or driver changes to null
        if (!isOpen || !driver) {
            setFirstName('');
            setLastName('');
            setEmail('');
            setMobileNumber('');
            setLocation('');
            setRole('');
            setStatus('');
            setVehicleRegistrationNo('');
            setError(null);
        }
    }, [driver, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!firstName) {
            setError("First name is required.");
            return;
        }

        // Prepare only the fields allowed by EmployeeUpdate schema
        const updateData = {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            email: email || undefined,
            mobileNumber: mobileNumber || undefined,
            location: location || undefined,
            role: role || undefined,
            status: status || undefined,
            vehicle_registration_no: vehicleRegistrationNo || null // Send null if empty string
        };

        try {
            await onSubmit(driver.id, updateData); // Pass driver ID and updateData
            // Parent handles closing and state update
        } catch (submitError) {
            const errorMessage = submitError?.detail || "Failed to update driver. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    if (!isOpen || !driver) return null;

    return (
        <div className="drivers-modal-overlay" onClick={onClose}>
            <div className="drivers-modal-content" onClick={e => e.stopPropagation()}>
                <div className="drivers-modal-header">
                    <h4>Edit Employee: {`${driver?.firstName || ''} ${driver?.lastName || ''}`.trim() || driver?.name}</h4>
                    <button onClick={onClose} className="drivers-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="drivers-modal-form">
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverFirstName">First Name *</label>
                            <input
                                id="editDriverFirstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverLastName">Last Name</label>
                            <input
                                id="editDriverLastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverEmail">Email</label>
                            <input
                                id="editDriverEmail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverMobile">Mobile Number</label>
                            <input
                                id="editDriverMobile"
                                type="text"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="+919XXXXXXXXX"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverLocation">Location</label>
                            <input
                                id="editDriverLocation"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Pune Base"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverRole">Role</label>
                            <input
                                id="editDriverRole"
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g., Driver, Manager"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverStatus">Status</label>
                            <select
                                id="editDriverStatus"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={isSubmitting}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <div className="drivers-form-row">
                        <div className="drivers-form-group">
                            <label htmlFor="editDriverVehicle">Assign Vehicle (Optional)</label>
                            <select
                                id="editDriverVehicle"
                                value={vehicleRegistrationNo}
                                onChange={(e) => setVehicleRegistrationNo(e.target.value)}
                                disabled={isSubmitting}
                            >
                                <option value="">Select a vehicle (optional)</option>
                                {availableVehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.registration_no}>
                                        {vehicle.registration_no} - {vehicle.vehicle_type || 'Unknown Type'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <div className="drivers-error-message">{error}</div>}

                    <div className="drivers-modal-actions">
                        <NewButton
                            variant="secondary"
                            size="md"
                            type="button"
                            text="Cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        />
                        <NewButton
                            variant="primary"
                            size="md"
                            type="submit"
                            text="Save Changes"
                            loading={isSubmitting}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Filter Dropdown Component ---
export const FilterDropdown = ({ isOpen, onClose, filters, tempFilters, onFilterChange, onApplyFilters, onClearFilters, isLoading, drivers = [] }) => {
    // Canonical assignable roles are always offered (so FIELD_AGENT is selectable even
    // when none are loaded yet), plus any extra roles present in the fetched data.
    const getRoleOptions = () => {
        const values = new Set(['DRIVER', 'MANAGER', 'KAM', 'FIELD_AGENT']);
        drivers.forEach(driver => {
            if (driver.is_superadmin) values.add('SUPER_ADMIN');
            else if (driver.role) values.add(driver.role);
        });
        return Array.from(values).map(value => ({ value, label: ROLE_LABELS[value] || value }));
    };

    const filterOptions = {
        role: [
            { value: '', label: 'All Roles' },
            ...getRoleOptions()
        ],
        vehicleAssignment: [
            { value: '', label: 'All' },
            { value: 'assigned', label: 'Has Vehicle' },
            { value: 'unassigned', label: 'No Vehicle' }
        ]
    };

    if (!isOpen) return null;

    return (
        <div className="drivers-filter-dropdown">
            <div className="drivers-filter-header">
                <h4>Filter Employees</h4>
                <button onClick={onClose} className="drivers-filter-close-btn">
                    <X size={16} />
                </button>
            </div>

            <div className="drivers-filter-content">
                {/* Role Filter */}
                <div className="drivers-filter-group">
                    <label className="drivers-filter-label">
                        Role
                        {filters.role && <span className="drivers-filter-indicator"></span>}
                    </label>
                    <select
                        value={tempFilters.role}
                        onChange={(e) => onFilterChange('role', e.target.value)}
                        disabled={isLoading}
                        className={filters.role ? 'drivers-filter-selected' : ''}
                    >
                        {filterOptions.role.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Vehicle Assignment Filter */}
                <div className="drivers-filter-group">
                    <label className="drivers-filter-label">
                        Vehicle Assignment
                        {filters.vehicleAssignment && <span className="drivers-filter-indicator"></span>}
                    </label>
                    <select
                        value={tempFilters.vehicleAssignment}
                        onChange={(e) => onFilterChange('vehicleAssignment', e.target.value)}
                        disabled={isLoading}
                        className={filters.vehicleAssignment ? 'drivers-filter-selected' : ''}
                    >
                        {filterOptions.vehicleAssignment.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            <div className="drivers-filter-actions">
                <NewButton
                    variant="secondary"
                    size="sm"
                    text="Clear All"
                    onClick={onClearFilters}
                    disabled={isLoading}
                />
                <NewButton
                    variant="primary"
                    size="sm"
                    text="Apply Filters"
                    onClick={onApplyFilters}
                    disabled={isLoading}
                />
            </div>

            {isLoading && (
                <div className="drivers-filter-loader">
                    <div className="drivers-spinner"></div>
                    <span>Applying filters...</span>
                </div>
            )}
        </div>
    );
};

// --- Table Skeleton (shimmer) shown while the list is (re)loading ---
export const DriversTableSkeleton = ({ rows = 8 }) => (
    <>
        {Array.from({ length: rows }).map((_, i) => (
            <tr key={`skeleton-${i}`} className="drivers-table-row drivers-skeleton-row">
                <td>
                    <div className="drivers-driver-name-cell">
                        <div className="drivers-skeleton drivers-skeleton-avatar"></div>
                        <div className="drivers-driver-info">
                            <span className="drivers-skeleton drivers-skeleton-text drivers-skeleton-text-lg"></span>
                            <span className="drivers-skeleton drivers-skeleton-text drivers-skeleton-text-sm"></span>
                        </div>
                    </div>
                </td>
                <td><span className="drivers-skeleton drivers-skeleton-text"></span></td>
                <td><span className="drivers-skeleton drivers-skeleton-text"></span></td>
                <td><span className="drivers-skeleton drivers-skeleton-text"></span></td>
                <td><span className="drivers-skeleton drivers-skeleton-text drivers-skeleton-text-lg"></span></td>
                <td><span className="drivers-skeleton drivers-skeleton-pill"></span></td>
            </tr>
        ))}
    </>
);

// --- Delete Driver Modal Component ---
export const DeleteDriverModal = ({ isOpen, onClose, onConfirm, driver, isLoading: isDeleting }) => {
    if (!isOpen || !driver) return null;

    return (
        <div className="drivers-modal-overlay" onClick={onClose}>
            <div className="drivers-modal-content" onClick={e => e.stopPropagation()}>
                <div className="drivers-modal-header">
                    <h4>Delete Employee</h4>
                    <button onClick={onClose} className="drivers-close-btn">&times;</button>
                </div>

                <div className="drivers-delete-content">
                    <div className="drivers-delete-warning">
                        <div className="drivers-warning-icon">⚠️</div>
                        <p>This action cannot be undone. The employee will be permanently removed from the system.</p>
                    </div>

                    <div className="drivers-delete-employee-info">
                        <div className="drivers-driver-name-cell">
                            <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
                            <div className="drivers-driver-info">
                                <span className="drivers-driver-name">{driver.name}</span>
                                <span className="drivers-driver-role">{driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="drivers-modal-actions">
                    <NewButton
                        variant="secondary"
                        size="md"
                        type="button"
                        text="Cancel"
                        onClick={onClose}
                        disabled={isDeleting}
                    />
                    <NewButton
                        variant="danger"
                        size="md"
                        type="button"
                        text="Delete Employee"
                        onClick={() => onConfirm(driver.id)}
                        loading={isDeleting}
                    />
                </div>
            </div>
        </div>
    );
};

// --- Deactivate Employee Modal ---
// Confirms turning an active employee off in their current branch (no move).
export const DeactivateDriverModal = ({ isOpen, onClose, onConfirm, driver, isLoading }) => {
    if (!isOpen || !driver) return null;

    return (
        <div className="drivers-modal-overlay" onClick={onClose}>
            <div className="drivers-modal-content" onClick={e => e.stopPropagation()}>
                <div className="drivers-modal-header">
                    <h4>Deactivate Employee</h4>
                    <button onClick={onClose} className="drivers-close-btn">&times;</button>
                </div>

                <div className="drivers-delete-content">
                    <div className="drivers-delete-warning">
                        <div className="drivers-warning-icon">⚠️</div>
                        <p>This employee will be deactivated and won't be able to log in or be assigned work until you reactivate them. You can turn them back on anytime with “Mark as active”.</p>
                    </div>

                    <div className="drivers-delete-employee-info">
                        <div className="drivers-driver-name-cell">
                            <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
                            <div className="drivers-driver-info">
                                <span className="drivers-driver-name">{driver.name}</span>
                                <span className="drivers-driver-role">{driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="drivers-modal-actions">
                    <NewButton variant="secondary" size="md" type="button" text="Cancel" onClick={onClose} disabled={isLoading} />
                    <NewButton variant="danger" size="md" type="button" text="Deactivate" onClick={() => onConfirm(driver)} loading={isLoading} />
                </div>
            </div>
        </div>
    );
};

// --- Move (Activate elsewhere) Modal ---
// Warns that activating an employee here will move them out of their current branch.
export const MoveEmployeeModal = ({ isOpen, onClose, onConfirm, driver, isLoading }) => {
    if (!isOpen || !driver) return null;

    const fromBranch = driver.currentBranchName || 'another location';

    return (
        <div className="drivers-modal-overlay" onClick={onClose}>
            <div className="drivers-modal-content" onClick={e => e.stopPropagation()}>
                <div className="drivers-modal-header">
                    <h4>Move Employee Here</h4>
                    <button onClick={onClose} className="drivers-close-btn">&times;</button>
                </div>

                <div className="drivers-delete-content">
                    <div className="drivers-delete-warning">
                        <div className="drivers-warning-icon">⚠️</div>
                        <p>
                            This employee is currently active in <strong>{fromBranch}</strong>. Activating them here will
                            move them to this location and deactivate them in <strong>{fromBranch}</strong>. Their history there stays intact.
                        </p>
                    </div>

                    <div className="drivers-delete-employee-info">
                        <div className="drivers-driver-name-cell">
                            <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
                            <div className="drivers-driver-info">
                                <span className="drivers-driver-name">{driver.name}</span>
                                <span className="drivers-driver-role">{driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="drivers-modal-actions">
                    <NewButton variant="secondary" size="md" type="button" text="Cancel" onClick={onClose} disabled={isLoading} />
                    <NewButton variant="primary" size="md" type="button" text="Move Here" onClick={() => onConfirm(driver)} loading={isLoading} />
                </div>
            </div>
        </div>
    );
};

// --- Action Menu Component (portal-based to escape table stacking context) ---
export const ActionMenu = ({ driver, onEdit, onDelete, onActivateHere, onDeactivate, position }) => {
    if (!position) return null;

    // Employees deactivated in this location (moved to another branch) can't be
    // edited/assigned here — the only action is to activate them back here.
    const isDeactivatedHere = driver.branchStatus === 'DEACTIVATED';
    // Legacy cross-org field agents carry a per-org membershipStatus and are
    // managed via membership, not branch-deactivated. New field agents are
    // branch-scoped employees and deactivate like a Driver/Manager.
    const isLegacyFieldAgent = driver.role === 'FIELD_AGENT' && driver.membershipStatus != null;
    // Owner/Super Admin are enterprise-level and never branch-deactivated.
    const canDeactivate =
        !isDeactivatedHere &&
        !driver.is_superadmin &&
        !driver.isOwner &&
        !isLegacyFieldAgent;

    // Decide whether to open upward (if too close to the bottom of the viewport).
    // Height grows with the number of items so the upward flip is accurate.
    const itemCount = isDeactivatedHere ? 1 : (1 /* edit */ + (canDeactivate ? 1 : 0) + (!driver.is_superadmin ? 1 : 0));
    const MENU_HEIGHT = 24 + itemCount * 34;
    const spaceBelow = window.innerHeight - position.bottom;
    const openUpward = spaceBelow < MENU_HEIGHT + 16;

    const style = {
        position: 'fixed',
        right: window.innerWidth - position.right,
        zIndex: 99999,
        ...(openUpward
            ? { bottom: window.innerHeight - position.top + 4 }
            : { top: position.bottom + 4 }),
    };

    return createPortal(
        <div className="drivers-action-menu" style={style}>
            {isDeactivatedHere ? (
                <button
                    className="drivers-action-menu-item"
                    onClick={(e) => { e.stopPropagation(); onActivateHere(driver); }}
                >
                    <ToggleRight size={16} />
                    <span>Mark as active</span>
                </button>
            ) : (
                <>
                    <button className="drivers-action-menu-item" onClick={(e) => { e.stopPropagation(); onEdit(driver); }}>
                        <Edit size={16} />
                        <span>Edit</span>
                    </button>
                    {canDeactivate && (
                        <button className="drivers-action-menu-item" onClick={(e) => { e.stopPropagation(); onDeactivate(driver); }}>
                            <ToggleLeft size={16} />
                            <span>Deactivate</span>
                        </button>
                    )}
                    {!driver.is_superadmin && ( // Prevent deleting superadmin
                        <>
                            <div className="drivers-action-menu-divider"></div>
                            <button className="drivers-action-menu-item" onClick={(e) => { e.stopPropagation(); onDelete(driver); }}>
                                <Trash2 size={16} />
                                <span>Delete</span>
                            </button>
                        </>
                    )}
                </>
            )}
        </div>,
        document.body
    );
};
