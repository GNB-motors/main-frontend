import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Plus, MoreHorizontal, Edit, Trash2, ChevronDown, X, Upload, ToggleRight, ToggleLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import './DriversPage.css';
import { DriverService } from './DriverService.jsx';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme';
import LottieLoader from '../../components/LottieLoader.jsx';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';
import NewButton from '@/components/ui/NewButton';

// Function to get initials from name
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

// Human-friendly labels for the role enum.
const ROLE_LABELS = { DRIVER: 'Driver', MANAGER: 'Manager', KAM: 'Key Account Manager', FIELD_AGENT: 'Field Agent', SUPER_ADMIN: 'Super Admin' };
const formatRole = (role, isSuperadmin) => {
    if (isSuperadmin) return 'Super Admin';
    return ROLE_LABELS[role] || role || 'Employee';
};

// --- Add Driver Modal Component ---
const AddDriverModal = ({ isOpen, onClose, onSubmit, isLoading: isSubmitting }) => {
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
const EditDriverModal = ({ isOpen, onClose, onSubmit, driver, isLoading: isSubmitting, availableVehicles = [] }) => {
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
const FilterDropdown = ({ isOpen, onClose, filters, tempFilters, onFilterChange, onApplyFilters, onClearFilters, isLoading, drivers = [] }) => {
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
const DriversTableSkeleton = ({ rows = 8 }) => (
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
const DeleteDriverModal = ({ isOpen, onClose, onConfirm, driver, isLoading: isDeleting }) => {
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
const DeactivateDriverModal = ({ isOpen, onClose, onConfirm, driver, isLoading }) => {
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
const MoveEmployeeModal = ({ isOpen, onClose, onConfirm, driver, isLoading }) => {
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
const ActionMenu = ({ driver, onEdit, onDelete, onActivateHere, onDeactivate, position }) => {
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


// --- Main DriversPage Component ---
const DriversPage = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading state for drivers list
    // True only until the first successful list load. Used to decide between the
    // full-page loader (initial mount) and the in-table skeleton (search/filter/paging refetches).
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState(null); // General page error
    const [actionError, setActionError] = useState(null); // Errors from Add/Edit/Delete actions
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    // Remove global page-content padding only for this page
    useEffect(() => {
        const pageContentEl = document.querySelector('.page-content');
        if (pageContentEl) {
            pageContentEl.classList.add('no-padding');
        }
        return () => {
            if (pageContentEl) {
                pageContentEl.classList.remove('no-padding');
            }
        };
    }, []);

    // Modal States
    // isAddModalOpen removed -- Add Employee is now a separate page at /drivers/add
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null); // Driver object to edit
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingDriver, setDeletingDriver] = useState(null); // Driver object to delete
    // Employee about to be deactivated in their current branch (confirm modal).
    const [deactivatingDriver, setDeactivatingDriver] = useState(null);
    // Employee whose activation here would move them out of another branch (warn modal).
    const [movingDriver, setMovingDriver] = useState(null);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    // Action Menu State
    const [openMenuDriverId, setOpenMenuDriverId] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null); // {top, bottom, right} from getBoundingClientRect

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Search & Filter State
    // `searchInput` mirrors the text box (updates on every keystroke, no refetch).
    // `searchTerm` is the debounced value that actually drives the server fetch.
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [filters, setFilters] = useState({
        role: '',
        vehicleAssignment: ''
    });
    const [tempFilters, setTempFilters] = useState({
        role: '',
        vehicleAssignment: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for add/edit/delete actions

    const [totalPages, setTotalPages] = useState(1);

    // Profile context removed - drivers page should render independently
    // Read businessRefId from localStorage as a fallback
    const businessRefId = localStorage.getItem('profile_business_ref_id') || null;

    // Close Action Menu on scroll to prevent detached floating menu
    useEffect(() => {
        const handleScroll = () => {
            if (openMenuDriverId !== null) {
                setOpenMenuDriverId(null);
            }
        };

        window.addEventListener('scroll', handleScroll, { capture: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [openMenuDriverId]);

    // --- Data Fetching ---
    const fetchDrivers = async () => {
        // Try to fetch drivers even if businessRefId is not present locally. Some backends may scope by token.
        setIsLoading(true); // Start loading drivers
        setError(null); // Clear general error on fetch
        setActionError(null); // Clear action errors on fetch
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Authentication required. Please log in.");
            setIsLoading(false);
            return;
        }

        try {
            console.log('Fetching employees list, orgId=', businessRefId || 'none');
            const params = { page: currentPage, limit: itemsPerPage };
            if (searchTerm) params.search = searchTerm;
            if (filters.role) params.role = filters.role;
            const result = await DriverService.getAllDrivers(businessRefId, params);

            const { data: items, meta } = result;

            // Normalize drivers to include a `name` convenience field used across the UI
            const normalizedDrivers = (items || []).map(d => ({
                ...d,
                id: d.id || d._id || d._id,
                firstName: d.firstName || d.first_name || '' ,
                lastName: d.lastName || d.last_name || '' ,
                name: d.name || `${(d.firstName || d.first_name || '').trim()} ${(d.lastName || d.last_name || '').trim()}`.trim(),
                // normalize contact fields used in UI
                mobileNumber: d.mobileNumber || d.mobile_number || d.mobile || '',
                email: d.email || d.email_address || '',
                // Legacy cross-org field agents carry a per-org membershipStatus; show
                // that. New branch-scoped field agents (and every other role) show their
                // real account status — membershipStatus is absent so this falls through.
                status: d.role === 'FIELD_AGENT' ? (d.membershipStatus || d.status) : d.status,
            }));
            setDrivers(normalizedDrivers);
            if (meta) {
                setTotalPages(meta.totalPages);
            } else {
                setTotalPages(Math.ceil(normalizedDrivers.length / itemsPerPage));
            }
            console.log("Drivers fetched:", normalizedDrivers, 'meta=', meta);
        } catch (apiError) {
            console.error("Failed to fetch drivers:", apiError);
            setError(apiError?.detail || "Could not load drivers list.");
        } finally {
            setIsLoading(false); // Finish loading drivers
            setHasLoadedOnce(true);
        }
    };

    const fetchVehicles = async () => {
        // Attempt to fetch vehicles even if businessRefId is not present locally.
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token present; skipping vehicles fetch.');
            return;
        }

        try {
            const data = await DriverService.getAvailableVehicles(businessRefId, token);
            // Normalize vehicle shape for the UI
            const normalized = (data || []).map(v => ({
                id: v._id || v.id || v._id,
                registration_no: v.registrationNumber || v.registration_no || v.registrationNumber,
                vehicle_type: v.vehicleType || v.vehicle_type || '',
                chassis_number: v.chassisNumber || v.chassis_number || '',
            }));
            setAvailableVehicles(normalized);
            console.log("Vehicles fetched:", data);
        } catch (apiError) {
            console.error("Failed to fetch vehicles:", apiError);
            // Don't set error state for vehicles, just log it
        }
    };

    useEffect(() => {
        // Always attempt to fetch drivers and vehicles; backend may scope by token even when org id
        // is not available locally. If token is missing, fetchDrivers will surface an auth error.
        fetchDrivers();
        fetchVehicles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessRefId, currentPage, searchTerm, filters.role]);

    // Debounce the search box into `searchTerm` so we fire one request after typing
    // settles instead of one per keystroke (each of which would re-render the table).
    useEffect(() => {
        const handle = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 300);
        return () => clearTimeout(handle);
    }, [searchInput]);

    // --- Action Handlers ---
    // handleAddDriver removed -- Add Employee is now a separate page at /drivers/add


    const handleOpenEditModal = (driver) => {
        // Navigate to the Add Driver page but pass the driver to edit via location state
        // so the same page can be used for editing with fields pre-filled.
        setOpenMenuDriverId(null); // Close action menu
        navigate('/drivers/add', { state: { editingDriver: driver } });
    };

    const handleOpenDeleteModal = (driver) => {
        setDeletingDriver(driver);
        setIsDeleteModalOpen(true);
        setOpenMenuDriverId(null); // Close action menu
    };

    // Activate a deactivated employee in the current location. If they are still
    // active in a DIFFERENT branch, activating here MOVES them (they get
    // deactivated there) — warn with a modal first. If they were simply
    // deactivated in this same branch, it's a plain re-enable, so run it directly.
    const handleActivateHere = (driver) => {
        setOpenMenuDriverId(null);
        const activeBranchId = localStorage.getItem('user_branchId');
        const isCrossBranchMove =
            driver.currentBranchId &&
            activeBranchId &&
            String(driver.currentBranchId) !== String(activeBranchId);
        if (isCrossBranchMove) {
            setMovingDriver(driver);
        } else {
            activateEmployee(driver);
        }
    };

    // Perform the actual activate/import call (shared by the direct path and the
    // "confirm move" modal). The active branch travels via X-Branch-Id (apiClient).
    const activateEmployee = async (driver) => {
        setIsActionSubmitting(true);
        try {
            await DriverService.importEmployee(driver.id);
            toast.success('Employee activated in this location');
            setMovingDriver(null);
            fetchDrivers();
        } catch (err) {
            toast.error(err?.message || err?.detail || 'Could not activate employee here');
        } finally {
            setIsActionSubmitting(false);
        }
    };

    // Open the confirm modal for deactivating an active employee in this branch.
    const handleOpenDeactivate = (driver) => {
        setOpenMenuDriverId(null);
        setDeactivatingDriver(driver);
    };

    // Deactivate an active employee in their current branch (no move). Suspends
    // their account and greys them out here until reactivated.
    const handleConfirmDeactivate = async (driver) => {
        setIsActionSubmitting(true);
        try {
            await DriverService.deactivateEmployee(driver.id);
            toast.success('Employee deactivated');
            setDeactivatingDriver(null);
            fetchDrivers();
        } catch (err) {
            toast.error(err?.message || err?.detail || 'Could not deactivate employee');
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleUpdateDriver = async (driverId, updateData) => {
         const token = localStorage.getItem('authToken');
         if (!token) {
             throw new Error("Missing auth token. Please log in again.");
         }
         setIsSubmitting(true);
         setActionError(null);
         try {
                    const updatedDriver = await DriverService.updateDriver(businessRefId, driverId, updateData);
                    const ud = {
                         ...updatedDriver,
                         id: updatedDriver.id || updatedDriver._id || updatedDriver._id,
                         firstName: updatedDriver.firstName || updatedDriver.first_name || '',
                         lastName: updatedDriver.lastName || updatedDriver.last_name || '',
                         name: updatedDriver.name || `${(updatedDriver.firstName || updatedDriver.first_name || '').trim()} ${(updatedDriver.lastName || updatedDriver.last_name || '').trim()}`.trim(),
                    };
                    setDrivers(prevDrivers =>
                        prevDrivers.map(d => (d.id === driverId ? ud : d))
                    );
             setIsEditModalOpen(false); // Close modal on success
             setEditingDriver(null);
             toast.success(`Employee "${updateData.name}" updated successfully!`);
         } catch (apiError) {
             console.error("Failed to update driver:", apiError);
             // Re-throw error for modal display
             throw apiError;
         } finally {
             setIsSubmitting(false);
         }
    };


     const handleDeleteDriver = async (driverId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setActionError("Authentication error. Please log in again.");
            return;
        }
        
        // Find the driver to check if it's the superadmin (although backend should prevent it)
        const driverToDelete = drivers.find(d => d.id === driverId);
        if (driverToDelete?.is_superadmin) {
            setActionError("Cannot delete the Super Admin account.");
            toast.error("Cannot delete the Super Admin account.");
            setIsDeleteModalOpen(false);
            setDeletingDriver(null);
            return;
        }

        setIsSubmitting(true);
        setActionError(null);
        try {
            await DriverService.deleteDriver(businessRefId, driverId);
            setDrivers(prev => prev.filter(d => d.id !== driverId)); // Update UI immediately
            setIsDeleteModalOpen(false); // Close modal on success
            setDeletingDriver(null);
            toast.success("Employee deleted successfully!");
        } catch (err) {
             console.error("Failed to delete employee:", err);
            const errorMessage = err.detail || err.message || "Failed to delete employee.";
            setActionError(errorMessage);
            toast.error(errorMessage);
        } finally {
             setIsSubmitting(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value);
    };

    // Filter handlers
    const handleFilterChange = (filterType, value) => {
        setTempFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setIsFilterDropdownOpen(false);
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            role: '',
            vehicleAssignment: ''
        };
        setTempFilters(clearedFilters);
        setFilters(clearedFilters);
        setIsFilterDropdownOpen(false);
    };

    const toggleFilterDropdown = () => {
        if (!isFilterDropdownOpen) {
            // When opening dropdown, sync temp filters with current filters
            setTempFilters(filters);
        }
        setIsFilterDropdownOpen(!isFilterDropdownOpen);
    };

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value => value !== '');

     // Client-side filtering with search and filters
    const filteredDrivers = useMemo(() => {
        let filtered = drivers;

        // Apply vehicle assignment filter
        if (filters.vehicleAssignment) {
            if (filters.vehicleAssignment === 'assigned') {
                filtered = filtered.filter(driver => driver.vehicle_registration_no);
            } else if (filters.vehicleAssignment === 'unassigned') {
                filtered = filtered.filter(driver => !driver.vehicle_registration_no);
            }
        }

        // Active employees first; deactivated ones sink to the bottom.
        return filtered.slice().sort((a, b) => {
            const ad = a.branchStatus === 'DEACTIVATED' ? 1 : 0;
            const bd = b.branchStatus === 'DEACTIVATED' ? 1 : 0;
            return ad - bd;
        });
    }, [drivers, filters.vehicleAssignment]);

    // The header count reflects only active employees (deactivated are excluded).
    const activeCount = useMemo(
        () => filteredDrivers.filter((d) => d.branchStatus !== 'DEACTIVATED').length,
        [filteredDrivers],
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters]);

    // Pagination calculations
    const paginatedDrivers = filteredDrivers;

    // Generate page numbers for pagination
    const generatePageNumbers = () => {
        const pages = [];
        
        if (totalPages <= 5) {
            // Show all pages if 5 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (currentPage > 3) {
                pages.push('...');
            }
            
            // Show pages around current page
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i);
                }
            }
            
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            
            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Close action menu and filter dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the action menu button/area AND outside the portal menu
            if (openMenuDriverId &&
                !event.target.closest(`.drivers-action-menu-container-${openMenuDriverId}`) &&
                !event.target.closest('.drivers-action-menu')) {
                setOpenMenuDriverId(null);
                setMenuPosition(null);
            }
            
            // Check if the click is outside the filter dropdown
            if (isFilterDropdownOpen && !event.target.closest('.drivers-filter-container')) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuDriverId, isFilterDropdownOpen]);


    // --- Render Logic ---
    // Full-page loader only on the very first mount. Subsequent refetches
    // (search / filter / pagination) keep the page shell mounted and show an
    // in-table shimmer skeleton instead, so the page no longer flickers.
    if (isLoading && !hasLoadedOnce) {
         return (
             <div className="drivers-container" style={themeColors}>
                 <LottieLoader
                     isLoading={true}
                     size="medium"
                     message="Loading drivers data..."
                     overlay={false}
                 />
             </div>
         );
     }

     // Show general page error first
     if (error) {
         return <div className="drivers-error-message">{error}</div>;
     }

    return (
        <>
            <div className="drivers-container" style={themeColors}>
                <div className="drivers-content-wrapper">
                    <div className="drivers-header">
                        <div>
                            <h3>
                                <span>Total employees </span>
                                <span>({activeCount})</span>
                            </h3>
                            <div className="drivers-actions">
                            <div className="search-filter-container">
                                <div className="drivers-search-input-wrapper">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Employee name or Id"
                                        className="drivers-search-input"
                                        value={searchInput}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                                <div className="drivers-filter-container">
                                    <NewButton
                                        variant="secondary"
                                        size="lg"
                                        iconOnly
                                        selected={hasActiveFilters}
                                        aria-label="Filter employees"
                                        onClick={toggleFilterDropdown}
                                    >
                                        <Filter size={14} />
                                        {hasActiveFilters && (
                                            <span className="drivers-filter-count-badge">
                                                {Object.values(filters).filter(value => value !== '').length}
                                            </span>
                                        )}
                                    </NewButton>
                                    
                                    <FilterDropdown
                                        isOpen={isFilterDropdownOpen}
                                        onClose={() => setIsFilterDropdownOpen(false)}
                                        filters={filters}
                                        tempFilters={tempFilters}
                                        onFilterChange={handleFilterChange}
                                        onApplyFilters={handleApplyFilters}
                                        onClearFilters={handleClearFilters}
                                        isLoading={false}
                                        drivers={drivers}
                                    />
                                </div>
                            </div>
                            <NewButton
                                variant="primary"
                                text="Add employee"
                                prependIcon={<Plus size={16} />}
                                onClick={() => navigate('/drivers/add')}
                            />
                            <NewButton
                                variant="secondary"
                                text="Bulk Upload"
                                prependIcon={<Upload size={16} />}
                                onClick={() => navigate('/drivers/bulk-upload')}
                            />
                        </div>
                    </div>

                    {actionError && <div className="drivers-error-message drivers-action-error">{actionError}</div>}
                </div>

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
                                <DriversTableSkeleton rows={itemsPerPage} />
                            ) : paginatedDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-grey-400)'}}>
                                        {searchTerm ? 'No drivers match your search.' : 'No drivers found for this business.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedDrivers.map((driver) => (
                                    <tr
                                        key={driver.id}
                                        className={`drivers-table-row ${openMenuDriverId === driver.id ? 'menu-open' : ''} ${driver.branchStatus === 'DEACTIVATED' ? 'drivers-table-row--deactivated' : ''}`}
                                        onClick={() => navigate('/drivers/add', { state: { editingDriver: driver } })}
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
                                                            onEdit={handleOpenEditModal}
                                                            onDelete={handleOpenDeleteModal}
                                                            onActivateHere={handleActivateHere}
                                                            onDeactivate={handleOpenDeactivate}
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
                </div>

                {/* Footer with Pagination - Always visible */}
                <div className="drivers-pagination-controls">
                    {/* Left Arrow */}
                    <button 
                        className="drivers-pagination-btn" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || totalPages <= 1}
                    >
                        <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
                    </button>

                    {/* Page Numbers */}
                    {generatePageNumbers().map((page, index) => {
                        if (page === '...') {
                            return (
                                <div key={`overflow-${index}`} className="drivers-page-overflow">
                                    <span>...</span>
                                </div>
                            );
                        }
                        return (
                            <button
                                key={page}
                                className={`drivers-page-number ${currentPage === page ? 'drivers-page-number-current' : ''}`}
                                onClick={() => handlePageChange(page)}
                                disabled={totalPages <= 1}
                            >
                                <span>{page}</span>
                            </button>
                        );
                    })}

                    {/* Right Arrow */}
                    <button 
                        className="drivers-pagination-btn" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages <= 1}
                    >
                        <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
                    </button>
                </div>

             {/* Render Modals */}
            {/* AddDriverModal removed -- Add Employee is a separate page now at /drivers/add */}
            <EditDriverModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateDriver}
                driver={editingDriver}
                isLoading={isSubmitting}
                availableVehicles={availableVehicles}
             />
            <DeleteDriverModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingDriver(null);
                }}
                onConfirm={handleDeleteDriver}
                driver={deletingDriver}
                isLoading={isSubmitting}
            />
            <DeactivateDriverModal
                isOpen={!!deactivatingDriver}
                onClose={() => setDeactivatingDriver(null)}
                onConfirm={handleConfirmDeactivate}
                driver={deactivatingDriver}
                isLoading={isActionSubmitting}
            />
            <MoveEmployeeModal
                isOpen={!!movingDriver}
                onClose={() => setMovingDriver(null)}
                onConfirm={activateEmployee}
                driver={movingDriver}
                isLoading={isActionSubmitting}
            />

        </div>
        </>
    );
};

export default DriversPage;