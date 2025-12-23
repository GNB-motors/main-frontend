import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useProfile } from './ProfileContext.jsx';
import { getPrimaryColor, getThemeCSS } from '../../utils/colorTheme.js';
import './ProfilePage.css';

// Import assets and icons
import { Plus, Edit, Trash2, MoreVertical, Upload } from 'lucide-react';

// Import Material-UI components
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

// Import the services
import { VehicleService } from './VehicleService.jsx';

// --- Delete Vehicle Modal Component ---
const DeleteVehicleModal = ({ isOpen, onClose, onConfirm, vehicle, isLoading: isDeleting }) => {
    if (!isOpen || !vehicle) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
                <div className="profile-modal-header">
                    <h4>Delete Vehicle</h4>
                    <button onClick={onClose} className="profile-modal-close-btn">&times;</button>
                </div>
                
                <div className="profile-delete-content">
                    <div className="profile-delete-warning">
                        <div className="profile-warning-icon">⚠️</div>
                        <p>This action cannot be undone. The vehicle will be permanently removed from the system.</p>
                    </div>
                    
                    <div className="profile-delete-vehicle-info">
                        <div className="profile-vehicle-info">
                            <div className="profile-vehicle-details">
                                <span className="profile-vehicle-registration">{vehicle.registration_no}</span>
                                <span className="profile-vehicle-type">{vehicle.vehicle_type || 'Unknown Type'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-modal-actions">
                    <button 
                        type="button" 
                        className="profile-btn profile-btn-secondary" 
                        onClick={onClose} 
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        className="profile-btn profile-btn-danger" 
                        onClick={() => onConfirm(vehicle.registration_no)} 
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Vehicle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Add Vehicle Modal Component ---
const AddVehicleModal = ({ isOpen, onClose, onSubmit, isLoading: isSubmitting }) => {
    const [registrationNo, setRegistrationNo] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (!registrationNo || !vehicleType || !chassisNumber) {
            setError("All fields are required: Registration Number, Vehicle Type, and Chassis Number.");
            return;
        }

        const vehicleData = {
            registration_no: registrationNo,
            vehicle_type: vehicleType,
            chassis_number: chassisNumber
        };

        try {
            await onSubmit(vehicleData);
            // Clear form and close modal on successful submission (handled by parent)
        } catch (submitError) {
            const errorMessage = submitError?.detail || "Failed to add vehicle. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    // Reset form when modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setRegistrationNo('');
            setVehicleType('');
            setChassisNumber('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
                <div className="profile-modal-header">
                    <h4>Add New Vehicle</h4>
                    <button onClick={onClose} className="profile-modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="profile-modal-form">
                    <div className="profile-form-row">
                        <div className="profile-form-group">
                            <label htmlFor="vehicleRegistrationNo">Registration Number *</label>
                            <input
                                id="vehicleRegistrationNo"
                                type="text"
                                value={registrationNo}
                                onChange={(e) => setRegistrationNo(e.target.value)}
                                placeholder="e.g., ABC123XYZ"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="profile-form-group">
                            <label htmlFor="vehicleType">Vehicle Type *</label>
                            <input
                                id="vehicleType"
                                type="text"
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                placeholder="e.g., Truck, Tanker"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="profile-form-row">
                        <div className="profile-form-group full-width">
                            <label htmlFor="chassisNumber">Chassis Number *</label>
                            <input
                                id="chassisNumber"
                                type="text"
                                value={chassisNumber}
                                onChange={(e) => setChassisNumber(e.target.value)}
                                placeholder="e.g., MAT828113S2C05629"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {error && <div className="profile-error-message">{error}</div>}

                    <div className="profile-modal-actions">
                        <button type="button" className="profile-btn profile-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="profile-btn profile-btn-main" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Vehicles Page Component ---
const VehiclesPage = () => {
    // Get profile data from context
    const { profile, isLoadingProfile, profileError } = useProfile();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingVehicle, setDeletingVehicle] = useState(null);
    const [searchVehicleNo, setSearchVehicleNo] = useState('');
    const [themeColors, setThemeColors] = useState(getThemeCSS());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Update theme colors when component mounts or profile color changes
    useEffect(() => {
        const updateTheme = () => {
            const newTheme = getThemeCSS();
            console.log('VehiclesPage theme colors:', newTheme);
            setThemeColors(newTheme);
        };

        updateTheme();

        window.addEventListener('storage', updateTheme);
        return () => {
            window.removeEventListener('storage', updateTheme);
        };
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside the actions menu and button
            const isClickOnMenu = event.target.closest('.vehicle-actions-menu');
            const isClickOnButton = event.target.closest('.vehicle-actions-menu-btn');
            
            if (openMenuId && !isClickOnMenu && !isClickOnButton) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // --- Fetch Vehicles ---
    useEffect(() => {
        const fetchVehicles = async () => {
            if (!profile?.business_ref_id) {
                setVehicleError("Business reference ID not found.");
                setIsLoadingVehicles(false);
                return;
            }
            setIsLoadingVehicles(true);
            setVehicleError(null);
            const token = localStorage.getItem('authToken');
            if (!token) {
                setVehicleError('Authentication token not found.');
                setIsLoadingVehicles(false);
                return;
            }
            try {
                const data = await VehicleService.getAllVehicles(profile.business_ref_id, token);
                setVehicles(data || []);
                console.log("Vehicles fetched:", data);
            } catch (apiError) {
                console.error('Failed to fetch vehicles:', apiError);
                setVehicleError(apiError?.detail || 'Failed to load vehicles.');
            } finally {
                setIsLoadingVehicles(false);
            }
        };
        fetchVehicles();
    }, [profile]);

    // --- Add Vehicle ---
    const handleAddVehicle = async (vehicleData) => {
        const token = localStorage.getItem('authToken');
        if (!token || !profile?.business_ref_id) {
            throw new Error("Missing auth token or business ID.");
        }
        setIsSubmitting(true);
        setFormError(null);
        try {
            const addedVehicle = await VehicleService.addVehicle(profile.business_ref_id, vehicleData, token);
            setVehicles(prevVehicles => [...prevVehicles, addedVehicle]);
            setIsAddModalOpen(false);
            toast.success(`Vehicle "${vehicleData.registration_no}" added successfully!`);
        } catch (apiError) {
            console.error("Failed to add vehicle:", apiError);
            throw apiError;
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Remove Vehicle ---
    const handleRemoveVehicle = async (registrationNoToRemove) => {
        setFormError(null);
        setIsSubmitting(true);
        setOpenMenuId(null);
        const token = localStorage.getItem('authToken');
        if (!token || !profile?.business_ref_id) {
            setFormError("Cannot remove vehicle: Missing auth token or business ID.");
            setIsSubmitting(false);
            return;
        }
        const originalVehicles = [...vehicles];
        setVehicles(prevVehicles => prevVehicles.filter(v => v.registration_no !== registrationNoToRemove));
        try {
            await VehicleService.removeVehicle(profile.business_ref_id, registrationNoToRemove, token);
            toast.success(`Vehicle "${registrationNoToRemove}" removed successfully!`);
            setIsDeleteModalOpen(false);
            setDeletingVehicle(null);
            console.log("Vehicle remove request sent successfully for:", registrationNoToRemove);
        } catch (apiError) {
            console.error("Failed to remove vehicle:", apiError);
            const errorMessage = apiError?.detail || "Could not remove vehicle. Backend endpoint might be missing.";
            setFormError(errorMessage);
            toast.error(errorMessage);
            setVehicles(originalVehicles);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Edit Vehicle ---
    const handleEditVehicle = (vehicleToEdit) => {
        console.log("Attempting to edit vehicle:", vehicleToEdit);
        setOpenMenuId(null);
        setEditingVehicle(vehicleToEdit);
        setShowEditForm(true);
        setFormError(null);
    };

    // --- Open Delete Modal ---
    const handleOpenDeleteModal = (vehicleToDelete) => {
        setDeletingVehicle(vehicleToDelete);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    // --- Update Vehicle ---
    const handleUpdateVehicle = async (e) => {
        e.preventDefault();
        setFormError(null);
        setIsSubmitting(true);
        
        const regNo = e.target.regNo.value.trim();
        const vehicleType = e.target.vehicleType.value.trim();
        const chassisNumber = e.target.chassisNumber.value.trim();
        const token = localStorage.getItem('authToken');
        
        if (!regNo || !vehicleType || !chassisNumber) {
            setFormError("All fields are required: Registration Number, Vehicle Type, and Chassis Number.");
            setIsSubmitting(false);
            return;
        }
        
        if (!token || !profile?.business_ref_id || !editingVehicle) {
            setFormError("Authentication token, business ID, or vehicle data not found.");
            setIsSubmitting(false);
            return;
        }
        
        const updatedVehicleData = { 
            registration_no: regNo, 
            vehicle_type: vehicleType,
            chassis_number: chassisNumber
        };
        
        try {
            const updatedVehicle = await VehicleService.updateVehicle(
                profile.business_ref_id, 
                editingVehicle.registration_no, 
                updatedVehicleData, 
                token
            );
            
            setVehicles(prevVehicles => 
                prevVehicles.map(v => 
                    v.id === editingVehicle.id ? updatedVehicle : v
                )
            );
            
            setShowEditForm(false);
            setEditingVehicle(null);
            toast.success(`Vehicle "${updatedVehicleData.registration_no}" updated successfully!`);
            console.log("Vehicle updated successfully:", updatedVehicle);
        } catch (apiError) {
            console.error("Failed to update vehicle:", apiError);
            const errorMessage = apiError?.detail || "Could not update vehicle.";
            setFormError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Cancel Edit ---
    const handleCancelEdit = () => {
        setShowEditForm(false);
        setEditingVehicle(null);
        setFormError(null);
    };

    // --- Filter vehicles by registration number ---
    const filteredVehicles = vehicles.filter(vehicle => {
        if (!searchVehicleNo.trim()) return true;
        return vehicle.registration_no.toLowerCase().includes(searchVehicleNo.toLowerCase());
    });

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchVehicleNo]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

    // Handle loading and errors
    if (isLoadingProfile) {
        return <div className="profile-card">Loading profile...</div>;
    }

    if (profileError) {
        return <div className="profile-card error-message">{profileError}</div>;
    }

    if (!profile || !profile.business_ref_id) {
        return <div className="profile-card">Profile data not found. Please log in again.</div>;
    }

    return (
        <>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '0',
                backgroundColor: 'var(--color-grey-100)',
                ...themeColors
            }}>
                {/* Header Section */}
                <div className="vehicles-header">
                    <h3>Total vehicles ({filteredVehicles.length})</h3>
                    
                    {/* Search and Action Controls */}
                    <div className="vehicles-header-controls">
                        {/* Search Bar */}
                        <div className="vehicles-search-container">
                            <input
                                type="text"
                                value={searchVehicleNo}
                                onChange={(e) => setSearchVehicleNo(e.target.value)}
                                placeholder="Search by vehicle registration number"
                                className="vehicles-search-input"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button
                                className="vehicles-btn-secondary"
                                onClick={() => navigate('/vehicles/bulk-upload')}
                                disabled={isSubmitting}
                            >
                                <Upload size={16} />
                                Bulk Upload
                            </button>
                            <button
                                className="vehicles-btn-primary"
                                onClick={() => setIsAddModalOpen(true)}
                                disabled={isSubmitting}
                            >
                                <Plus size={16} />
                                Add Vehicle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 'var(--spacing-lg)',
                    overflow: 'auto',
                    backgroundColor: 'var(--color-white)',
                    margin: 'var(--spacing-lg)',
                    marginBottom: 0,
                    borderRadius: 'var(--border-radius-lg)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                    {isLoadingVehicles && <p style={{ fontSize: '14px', color: '#8b8b8c' }}>Loading vehicles...</p>}
                    {vehicleError && <p className="error-message">{vehicleError}</p>}
                    {formError && <p className="error-message" style={{ marginBottom: '10px' }}>{formError}</p>}

                    {!isLoadingVehicles && !vehicleError && (
                        <div className="vehicle-table-container" style={{ padding: 0 }}>
                            {filteredVehicles.length === 0 ? (
                                <p style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#8b8b8c',
                                    fontSize: '14px',
                                    margin: 0
                                }}>
                                    {vehicles.length === 0 ? 'No vehicles added yet. Click "Add Vehicle" to start.' : 'No vehicles match your search.'}
                                </p>
                            ) : (
                                <table className="vehicle-table" style={{ borderRadius: 0, border: 'none', marginTop: '-1px' }}>
                                    <thead>
                                        <tr>
                                            <th>Vehicle No</th>
                                            <th>Model No</th>
                                            <th>Chassis No</th>
                                            <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedVehicles.map(vehicle => (
                                            <tr key={vehicle.id}>
                                                <td>{vehicle.registration_no}</td>
                                                <td>{vehicle.vehicle_type || 'N/A'}</td>
                                                <td>{vehicle.chassis_number || 'N/A'}</td>
                                                <td style={{ textAlign: 'center', position: 'relative' }}>
                                                    <button
                                                        className="vehicle-actions-menu-btn"
                                                        onClick={() => setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)}
                                                        disabled={isSubmitting}
                                                        title="Actions"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    {openMenuId === vehicle.id && (
                                                        <div className="vehicle-actions-menu" style={{ pointerEvents: 'auto' }}>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    console.log('Edit clicked for vehicle:', vehicle);
                                                                    handleEditVehicle(vehicle);
                                                                }} 
                                                                disabled={isSubmitting}
                                                                style={{ pointerEvents: 'auto' }}
                                                            >
                                                                <Edit size={16} /> Edit
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    console.log('Delete clicked for vehicle:', vehicle);
                                                                    handleOpenDeleteModal(vehicle);
                                                                }} 
                                                                disabled={isSubmitting}
                                                                style={{ pointerEvents: 'auto' }}
                                                            >
                                                                <Trash2 size={16} /> Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Section with Pagination */}
                {!isLoadingVehicles && !vehicleError && filteredVehicles.length > 0 && (
                    <div style={{
                        backgroundColor: 'var(--color-white)',
                        margin: 'var(--spacing-lg) var(--spacing-lg) var(--spacing-lg) var(--spacing-lg)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--border-radius-lg)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                        {filteredVehicles.length > itemsPerPage && (
                            <Stack spacing={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(event, page) => setCurrentPage(page)}
                                    color="primary"
                                    size="medium"
                                />
                                <span style={{
                                    fontSize: '13px',
                                    color: '#6b7280'
                                }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                            </Stack>
                        )}
                    </div>
                )}
            </div>

            {/* --- Edit Vehicle Modal --- */}
            {showEditForm && editingVehicle && (
                <div className="modal-overlay" onClick={handleCancelEdit}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Vehicle: {editingVehicle.registration_no}</h3>
                            <button 
                                className="modal-close-btn" 
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                            >
                                ×
                            </button>
                        </div>
                        <form className="modal-form" onSubmit={handleUpdateVehicle}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vehicle No *</label>
                                    <input 
                                        name="regNo" 
                                        type="text" 
                                        placeholder="e.g., ABC123XYZ" 
                                        defaultValue={editingVehicle.registration_no}
                                        required 
                                        disabled={isSubmitting} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Model No *</label>
                                    <input 
                                        name="vehicleType" 
                                        type="text" 
                                        placeholder="e.g., Truck, Tanker" 
                                        defaultValue={editingVehicle.vehicle_type || ''}
                                        required 
                                        disabled={isSubmitting} 
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Chassis No *</label>
                                    <input 
                                        name="chassisNumber" 
                                        type="text" 
                                        placeholder="e.g., MAT828113S2C05629" 
                                        defaultValue={editingVehicle.chassis_number || ''}
                                        required 
                                        disabled={isSubmitting} 
                                    />
                                </div>
                            </div>
                            {formError && <p className="error-message">{formError}</p>}
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="profile-btn profile-btn-secondary" 
                                    onClick={handleCancelEdit} 
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="profile-btn profile-btn-main" 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Vehicle Modal */}
            <AddVehicleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddVehicle}
                isLoading={isSubmitting}
            />
            {/* Delete Vehicle Modal */}
            <DeleteVehicleModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingVehicle(null);
                }}
                onConfirm={handleRemoveVehicle}
                vehicle={deletingVehicle}
                isLoading={isSubmitting}
            />
        </>
    );
};

export default VehiclesPage;
