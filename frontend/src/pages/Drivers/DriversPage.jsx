import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2, ChevronDown, X, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import './DriversPage.css';
import { DriverService } from './DriverService.jsx';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme';
import LottieLoader from '../../components/LottieLoader.jsx';

// Function to get initials from name
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
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
            setVehicleRegistrationNo('');
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
                        <button type="button" className="drivers-btn drivers-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="drivers-btn drivers-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Employee'}
                        </button>
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
                        <button type="button" className="drivers-btn drivers-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="drivers-btn drivers-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Filter Dropdown Component ---
const FilterDropdown = ({ isOpen, onClose, filters, tempFilters, onFilterChange, onApplyFilters, onClearFilters, isLoading, drivers = [] }) => {
    // Get unique roles from actual drivers data
    const getUniqueRoles = () => {
        const roles = new Set();
        drivers.forEach(driver => {
            if (driver.is_superadmin) {
                roles.add('Super Admin');
            } else if (driver.role) {
                roles.add(driver.role);
            } else {
                roles.add('Employee'); // Default role
            }
        });
        return Array.from(roles).sort();
    };

    const uniqueRoles = getUniqueRoles();
    
    const filterOptions = {
        role: [
            { value: '', label: 'All Roles' },
            ...uniqueRoles.map(role => ({ value: role, label: role }))
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
                <button 
                    className="drivers-btn drivers-btn-secondary" 
                    onClick={onClearFilters}
                    disabled={isLoading}
                >
                    Clear All
                </button>
                <button 
                    className="drivers-btn drivers-btn-primary" 
                    onClick={onApplyFilters}
                    disabled={isLoading}
                >
                    Apply Filters
                </button>
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
                    <button 
                        type="button" 
                        className="drivers-btn drivers-btn-secondary" 
                        onClick={onClose} 
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        className="drivers-btn drivers-btn-danger" 
                        onClick={() => onConfirm(driver.id)} 
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Employee'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Action Menu Component ---
const ActionMenu = ({ driver, onEdit, onDelete }) => {
    return (
        <div className="drivers-action-menu">
            <button onClick={() => onEdit(driver)}>
                <Edit size={16} /> Edit
            </button>
            {!driver.is_superadmin && ( // Prevent deleting superadmin
                <button onClick={() => onDelete(driver)} className="drivers-delete">
                    <Trash2 size={16} /> Delete
                </button>
            )}
        </div>
    );
};


// --- Main DriversPage Component ---
const DriversPage = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading state for drivers list
    const [error, setError] = useState(null); // General page error
    const [actionError, setActionError] = useState(null); // Errors from Add/Edit/Delete actions
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null); // Driver object to edit
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingDriver, setDeletingDriver] = useState(null); // Driver object to delete

    // Action Menu State
    const [openMenuDriverId, setOpenMenuDriverId] = useState(null);

    // Search & Filter State
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

    // Profile context removed - drivers page should render independently
    // Read businessRefId from localStorage as a fallback
    const businessRefId = localStorage.getItem('profile_business_ref_id') || null;

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
            const resp = await DriverService.getAllDrivers(businessRefId);

            // The backend may return either an array or a paginated envelope {status, data: [...], meta}
            let items = [];
            let meta = null;
            if (Array.isArray(resp)) {
                items = resp;
            } else if (resp && Array.isArray(resp.data)) {
                // resp may be { status: 'success', data: [...], meta: {...} }
                items = resp.data;
                meta = resp.meta || null;
            } else if (resp && Array.isArray(resp.data && resp.data.data)) {
                // defensive: resp.data.data
                items = resp.data.data;
                meta = resp.data.meta || null;
            } else {
                items = [];
            }

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
            }));
            setDrivers(normalizedDrivers);
            console.log("Drivers fetched:", normalizedDrivers, 'meta=', meta);
        } catch (apiError) {
            console.error("Failed to fetch drivers:", apiError);
            setError(apiError?.detail || "Could not load drivers list.");
        } finally {
            setIsLoading(false); // Finish loading drivers
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
    }, [businessRefId]);

    // --- Action Handlers ---
    const handleAddDriver = async (driverData) => {
        const token = localStorage.getItem('authToken');
        if (!token || !businessRefId) {
            throw new Error("Missing auth token or business ID.");
        }
        setIsSubmitting(true);
        setActionError(null); // Clear previous action error
        try {
            const newDriver = await DriverService.addDriver(businessRefId, driverData);
            const nd = {
                ...newDriver,
                id: newDriver.id || newDriver._id || newDriver._id,
                firstName: newDriver.firstName || newDriver.first_name || '',
                lastName: newDriver.lastName || newDriver.last_name || '',
                name: newDriver.name || `${(newDriver.firstName || newDriver.first_name || '').trim()} ${(newDriver.lastName || newDriver.last_name || '').trim()}`.trim(),
            };
            setDrivers(prevDrivers => [...prevDrivers, nd]); // Add new driver to state
            setIsAddModalOpen(false); // Close modal on success
            toast.success(`Employee "${driverData.name}" added successfully!`);
        } catch (apiError) {
             console.error("Failed to add driver:", apiError);
             // Re-throw the error so the modal can display it
             throw apiError;
        } finally {
             setIsSubmitting(false);
        }
    };

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

    const handleUpdateDriver = async (driverId, updateData) => {
         const token = localStorage.getItem('authToken');
         if (!token || !businessRefId) {
             throw new Error("Missing auth token or business ID.");
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
        if (!token || !businessRefId) {
            setActionError("Authentication error.");
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
             console.error("Failed to delete driver:", err);
            const errorMessage = err.detail || "Failed to delete driver.";
            setActionError(errorMessage);
            toast.error(errorMessage);
        } finally {
             setIsSubmitting(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
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

        // Apply search filter
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(driver =>
                driver.name?.toLowerCase().includes(lowerSearchTerm) ||
                driver.id?.toLowerCase().includes(lowerSearchTerm)
            );
        }

        // Apply role filter
        if (filters.role) {
            filtered = filtered.filter(driver => {
                if (filters.role === 'Super Admin') {
                    return driver.is_superadmin;
                }
                return driver.role === filters.role;
            });
        }

        // Apply vehicle assignment filter
        if (filters.vehicleAssignment) {
            if (filters.vehicleAssignment === 'assigned') {
                filtered = filtered.filter(driver => driver.vehicle_registration_no);
            } else if (filters.vehicleAssignment === 'unassigned') {
                filtered = filtered.filter(driver => !driver.vehicle_registration_no);
            }
        }

        return filtered;
    }, [drivers, searchTerm, filters]);

    // Close action menu and filter dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the action menu button/area
            if (openMenuDriverId && !event.target.closest(`.drivers-action-menu-container-${openMenuDriverId}`)) {
                setOpenMenuDriverId(null);
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
    // Only show loading for drivers data, not profile (handled by DashboardLayout)
    if (isLoading) {
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
            <div className="drivers-header">
                <h3>Total employees ({filteredDrivers.length})</h3>
                <div className="drivers-actions">
                    <div className="search-filter-container">
                        <div className="drivers-search-input-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Employee name or Id"
                                className="drivers-search-input"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="drivers-filter-container">
                            <button 
                                className={`drivers-filter-btn ${hasActiveFilters ? 'drivers-filter-btn-active' : ''}`} 
                                onClick={toggleFilterDropdown}
                            >
                                <Filter size={16} />
                                <span>Filter by</span>
                                <ChevronDown size={14} className={`drivers-filter-chevron ${isFilterDropdownOpen ? 'drivers-filter-chevron-open' : ''}`} />
                                {hasActiveFilters && (
                                    <span className="drivers-filter-count-badge">
                                        {Object.values(filters).filter(value => value !== '').length}
                                    </span>
                                )}
                            </button>
                            
                            
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
                    {/* Open the modal when button is clicked */}
                    <button className="drivers-add-driver-btn" onClick={() => navigate('/drivers/add')}>
                        <Plus size={16} />
                        <span>Add Employee</span>
                    </button>
                    <button 
                        className="drivers-add-driver-btn" 
                        onClick={() => navigate('/drivers/bulk-upload')}
                    >
                        <Upload size={16} />
                        <span>Bulk Upload</span>
                    </button>
                </div>

                {/* Display Action Errors (e.g., delete failed) */}
                {actionError && <div className="drivers-error-message drivers-action-error">{actionError}</div>}
            </div>

                <div className="drivers-table-container">
                    <table className="drivers-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Emp ID</th>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-grey-400)'}}>
                                        {searchTerm ? 'No drivers match your search.' : 'No drivers found for this business.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredDrivers.map((driver) => (
                                    <tr key={driver.id}>
                                        <td>
                                            <div className="drivers-driver-name-cell">
                                                <div className="drivers-driver-initials">{getInitials(driver.name)}</div>
                                                <div className="drivers-driver-info">
                                                    <span>{driver.name}</span>
                                                    <span className="drivers-driver-role">{driver.is_superadmin ? 'Super Admin' : driver.role || 'Employee'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{driver.id ? driver.id.substring(0, 8) + '...' : '-'}</td>
                                        <td>{driver.mobileNumber || driver.email || '-'}</td>
                                        <td>{driver.role || '-'}</td>
                                        <td>{driver.email || '-'}</td>
                                        <td className="drivers-action-cell"> {/* Added class for easier targeting */}
                                            <div className={`drivers-action-menu-container drivers-action-menu-container-${driver.id}`} style={{ position: 'relative' }}> {/* Container for positioning */}
                                                <button
                                                    className="drivers-action-menu-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent click outside handler
                                                        setOpenMenuDriverId(openMenuDriverId === driver.id ? null : driver.id);
                                                    }}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                                {openMenuDriverId === driver.id && (
                                                    <ActionMenu
                                                        driver={driver}
                                                        onEdit={handleOpenEditModal}
                                                        onDelete={handleOpenDeleteModal}
                                                    />
                                                )}
                                             </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="drivers-pagination-controls">
                    <button className="drivers-pagination-btn" disabled> <ChevronLeft size={16} /> </button>
                    <span className="drivers-page-info">Page 1 of 1</span>
                    <button className="drivers-pagination-btn" disabled> <ChevronRight size={16} /> </button>
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

        </div>
        </>
    );
};

export default DriversPage;