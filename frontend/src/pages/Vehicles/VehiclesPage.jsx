import React, { useState, useEffect } from 'react';
import { validateTokenBeforeRequest, handleAuthError } from '../../utils/authUtils';
import { toast } from 'react-toastify';
import './VehiclesPage.css';

// Import assets
import CardVehicleIcon from '../../assets/card-vehicle-icon.svg';
import OptionsIcon from '../../assets/options-icon.svg';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Import the services
import { ProfileService } from '../Profile/ProfileService.jsx';
import { VehicleService } from '../Profile/VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import { useVehicleActions } from './VehicleActionsContext.jsx';

const VehiclesPage = () => {
    const [profileData, setProfileData] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            // Validate token before making request
            if (!validateTokenBeforeRequest()) {
                setIsLoadingProfile(false);
                setProfileError('Authentication token not found or expired. Please log in again.');
                return;
            }

            setIsLoadingProfile(true);
            setProfileError(null);
            try {
                const token = localStorage.getItem('authToken');
                const profileResponse = await ProfileService.getProfile(token);
                setProfileData(profileResponse);
                // Store individual profile fields in localStorage
                localStorage.setItem('profile_id', profileResponse.id);
                localStorage.setItem('profile_user_id', profileResponse.user_id);
                localStorage.setItem('profile_company_name', profileResponse.company_name);
                localStorage.setItem('profile_business_ref_id', profileResponse.business_ref_id);
                localStorage.setItem('profile_color', profileResponse.profile_color);
                localStorage.setItem('profile_is_onboarded', profileResponse.is_onboarded.toString());
                localStorage.setItem('profile_is_superadmin', profileResponse.is_superadmin.toString());
                console.log("Profile data fetched:", profileResponse);
            } catch (apiError) {
                console.error('Failed to fetch profile:', apiError);
                setProfileError(apiError?.detail || 'Failed to load profile information.');
                
                // Handle 401 errors with auto-logout
                if (handleAuthError(apiError)) {
                    // Auth error handled, user will be redirected
                    return;
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    if (isLoadingProfile) {
        return <div className="vehicles-container" style={themeColors}>Loading...</div>;
    }

    if (profileError) {
        return <div className="vehicles-container" style={themeColors}><div className="profile-card error-message">{profileError}</div></div>;
    }

    if (!profileData) {
        return <div className="vehicles-container" style={themeColors}><div className="profile-card">Could not load profile data.</div></div>;
    }

    return (
        <div className="vehicles-container" style={themeColors}>
            <Vehicles profile={profileData} />
        </div>
    );
};

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
                            <img src={CardVehicleIcon} alt="Vehicle Icon" className="profile-vehicle-icon" />
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

// --- Vehicles Sub-component - Updated with toggleable Add Form ---
const Vehicles = ({ profile }) => {
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
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'checklist'
    const { setOnAddVehicle } = useVehicleActions();

    // Register the add vehicle handler with context
    useEffect(() => {
        setOnAddVehicle(() => () => setIsAddModalOpen(true));
        return () => setOnAddVehicle(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // setOnAddVehicle is stable, but we only want to register once

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest(`.vehicles-action-menu-container-${openMenuId}`)) {
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
            console.log("Vehicle remove request sent successfully for:", registrationNoToRemove);
            setIsDeleteModalOpen(false);
            setDeletingVehicle(null);
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

    // Limit vehicles to 3 for analysis
    const displayedVehicles = vehicles.slice(0, 3);

    return (
        <>
            {/* Tabs at the top - completely separate from table */}
            <div className="vehicles-tabs-container">
                <div className="vehicles-tabs">
                    <button 
                        className={`vehicles-tab-button ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        Vehicle List
                    </button>
                    <button 
                        className={`vehicles-tab-button ${activeTab === 'checklist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('checklist')}
                    >
                        Vehicle Checklist
                    </button>
                </div>
            </div>

            {/* --- Vehicle Page Container --- */}
            <div className="vehicles-page-container">
                {/* Error Messages */}
                {vehicleError && <div className="vehicles-error-message">{vehicleError}</div>}
                {formError && <div className="vehicles-error-message">{formError}</div>}

                {/* Tab Content */}
                {activeTab === 'list' && (
                    <div className="vehicles-table-container">
                        {isLoadingVehicles ? (
                            <div className="vehicles-loading">Loading vehicles...</div>
                        ) : (
                            <>
                                {displayedVehicles.length === 0 ? (
                                    <div className="vehicles-empty-state">
                                        <table className="vehicles-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Operator</th>
                                                    <th>Year</th>
                                                    <th>Make</th>
                                                    <th>Status</th>
                                                    <th>Current Meter</th>
                                                    <th>License Plate</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td colSpan="8" className="vehicles-no-data">
                                                        No vehicles added yet. Click 'Add Vehicle' to start.
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <table className="vehicles-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Operator</th>
                                                <th>Year</th>
                                                <th>Make</th>
                                                <th>Status</th>
                                                <th>Current Meter</th>
                                                <th>License Plate</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedVehicles.map(vehicle => (
                                                <tr key={vehicle.id}>
                                                    <td>
                                                        <div className="vehicles-name-cell">
                                                            <img src={CardVehicleIcon} alt="Vehicle" className="vehicles-icon-small" />
                                                            <span>{vehicle.registration_no}</span>
                                                        </div>
                                                    </td>
                                                    <td>-</td>
                                                    <td>-</td>
                                                    <td>{vehicle.vehicle_type || 'N/A'}</td>
                                                    <td>
                                                        <span className="vehicles-status-badge vehicles-status-active">Active</span>
                                                    </td>
                                                    <td>-</td>
                                                    <td>{vehicle.registration_no}</td>
                                                    <td className="vehicles-action-cell">
                                                        <div className={`vehicles-action-menu-container vehicles-action-menu-container-${vehicle.id}`} style={{ position: 'relative' }}>
                                                            <button
                                                                className="vehicles-action-menu-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
                                                                }}
                                                                disabled={isSubmitting}
                                                            >
                                                                <img src={OptionsIcon} alt="Options" />
                                                            </button>
                                                            {openMenuId === vehicle.id && (
                                                                <div className="vehicles-options-menu">
                                                                    <button onClick={() => handleEditVehicle(vehicle)} disabled={isSubmitting}>
                                                                        <Edit size={16} /> Edit
                                                                    </button>
                                                                    <button onClick={() => handleOpenDeleteModal(vehicle)} disabled={isSubmitting}>
                                                                        <Trash2 size={16} /> Remove
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'checklist' && (
                    <div className="vehicles-checklist-container">
                        <div className="vehicles-checklist-placeholder">
                            <p>Vehicle Checklist content will be displayed here.</p>
                            <p className="vehicles-checklist-note">This section is for vehicle inspection checklists and maintenance tracking.</p>
                        </div>
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
                                    <label>Registration No. *</label>
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
                                    <label>Vehicle Type *</label>
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
                                    <label>Chassis Number *</label>
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
}

export default VehiclesPage;

