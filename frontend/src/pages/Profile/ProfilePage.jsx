import React, { useState, useEffect } from 'react';
import { validateTokenBeforeRequest, handleAuthError } from '../../utils/authUtils';
import { toast } from 'react-toastify';
import './ProfilePage.css';

// Import assets
import DefaultAvatar from '../../assets/default-avatar.png';
import EditIcon from '../../assets/edit-icon.svg';
import UserIcon from '../../assets/user-icon.svg';
import VehicleIcon from '../../assets/vehicle-icon.svg';
import AddIcon from '../../assets/add-icon.svg'; // Make sure this is used or remove if not
import OptionsIcon from '../../assets/options-icon.svg';
import CardVehicleIcon from '../../assets/card-vehicle-icon.svg';
import { Plus, Edit, Trash2 } from 'lucide-react'; // Import icons for buttons and dropdown

// Import the services
import { ProfileService } from './ProfileService.jsx';
import { VehicleService } from './VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('info');
    const [profileData, setProfileData] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
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
                // Fetch both profile and user info in parallel
                const [profileResponse, userInfoResponse] = await Promise.all([
                    ProfileService.getProfile(token),
                    ProfileService.getUserInfo()
                ]);
                setProfileData(profileResponse);
                setUserInfo(userInfoResponse);
                // Store individual profile fields in localStorage
                if (profileResponse._id) localStorage.setItem('profile_id', profileResponse._id);
                if (profileResponse.ownerEmail) localStorage.setItem('profile_owner_email', profileResponse.ownerEmail);
                if (profileResponse.companyName) localStorage.setItem('profile_company_name', profileResponse.companyName);
                if (profileResponse.gstin) localStorage.setItem('profile_gstin', profileResponse.gstin);
                if (profileResponse.primaryThemeColor) localStorage.setItem('primaryThemeColor', profileResponse.primaryThemeColor);
                console.log("Profile data fetched:", profileResponse);
                console.log("User info fetched:", userInfoResponse);
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

    const renderContent = () => {
        // Profile loading is now handled by DashboardLayout
        if (profileError) return <div className="profile-card error-message">{profileError}</div>;
        if (!profileData) return <div className="profile-card">Could not load profile data.</div>;

        switch (activeTab) {
            case 'info': return <UserInfo profile={profileData} userInfo={userInfo} />;
            case 'vehicles': return <Vehicles profile={profileData} />;
            default: return <UserInfo profile={profileData} userInfo={userInfo} />;
        }
    };

    return (
        <div className="profile-container" style={themeColors}>
            <div className="profile-sidebar">
                <h3>User Profile</h3>
                <nav className="profile-nav">
                    <button onClick={() => setActiveTab('info')} className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}>
                        <img src={UserIcon} alt="User Info" /> <span>User Info</span>
                    </button>
                    <button onClick={() => setActiveTab('vehicles')} className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}>
                         <img src={VehicleIcon} alt="Vehicles" /> <span>Vehicles</span>
                    </button>
                </nav>
            </div>
            <div className="profile-content">{renderContent()}</div>
        </div>
    );
};

// UserInfo component - Display only, no editing
const UserInfo = ({ profile, userInfo }) => {
    // Split username into first and last name
    const nameParts = userInfo?.username?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
        <div className="profile-card">
            <h4>Your account information</h4>
            <div className="avatar-section">
                 <div className="avatar-container">
                     <img src={DefaultAvatar} alt="User Avatar" className="avatar-img" />
                 </div>
                 <div className="avatar-details">
                     <h5>{profile?.company_name || 'Company Name'}</h5>
                     <p>Business Ref: {profile?.business_ref_id || 'N/A'}</p>
                      <p>Role: {profile?.is_superadmin ? 'Super Admin' : 'Admin'}</p>
                 </div>
            </div>
            <div className="info-form">
                <div className="form-row">
                     <div className="form-group">
                         <label>First Name</label>
                         <input 
                             type="text" 
                             value={firstName} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Last Name</label>
                         <input 
                             type="text" 
                             value={lastName} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                 <div className="form-row">
                     <div className="form-group">
                         <label>Location</label>
                         <input 
                             type="text" 
                             value={userInfo?.location || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Mobile Number</label>
                         <input 
                             type="tel" 
                             value={userInfo?.mobile_number || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                 <div className="form-row">
                     <div className="form-group">
                         <label>GSTIN</label>
                         <input 
                             type="text" 
                             value={userInfo?.gstin || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Email</label>
                         <input 
                             type="email" 
                             value={userInfo?.email || ''} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                <div className="form-actions">
                    <div className="profile-edit-notice">
                        <p>If you need to edit your information, please contact the administrator.</p>
                    </div>
                </div>
            </div>
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // <-- State to control modal visibility
    const [showEditForm, setShowEditForm] = useState(false); // <-- State to control edit form visibility
    const [editingVehicle, setEditingVehicle] = useState(null); // <-- Vehicle being edited
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // <-- State to control delete modal visibility
    const [deletingVehicle, setDeletingVehicle] = useState(null); // <-- Vehicle being deleted

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.vehicle-item-actions')) {
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
            // ... fetch logic remains the same ...
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
        setFormError(null); // Clear previous form error
        try {
            const addedVehicle = await VehicleService.addVehicle(profile.business_ref_id, vehicleData, token);
            setVehicles(prevVehicles => [...prevVehicles, addedVehicle]);
            setIsAddModalOpen(false); // Close modal on success
            toast.success(`Vehicle "${vehicleData.registration_no}" added successfully!`);
        } catch (apiError) {
            console.error("Failed to add vehicle:", apiError);
            // Re-throw the error so the modal can display it
            throw apiError;
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Remove Vehicle ---
    const handleRemoveVehicle = async (registrationNoToRemove) => {
        // ... remove logic remains the same ...
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
        setOpenMenuId(null); // Close action menu
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
        
        // Enhanced validation for required fields
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
            
            // Update the vehicle in the list
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


    return (
        <>
            {/* --- Vehicle List Card --- */}
            <div className="profile-card">
                {/* Updated Header with Add Button - Adjusted Alignment & Removed Border */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline', // <-- Changed to baseline
                    marginBottom: 'var(--spacing-lg)' // <-- Removed border and paddingBottom
                 }}>
                    {/* Removed default margin from h4 */}
                    <h4 style={{ margin: 0 }}>Your Vehicles (Business: {profile?.business_ref_id || 'N/A'})</h4>
                    {/* Add Vehicle Button */}
                    <button
                        className="profile-btn profile-btn-main"
                        style={{ padding: '8px 12px', fontSize: '14px' }}
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={isSubmitting}
                    >
                        <Plus size={16} style={{ marginRight: '4px'}} />
                        Add Vehicle
                    </button>
                </div>

                {isLoadingVehicles && <p>Loading vehicles...</p>}
                {vehicleError && <p className="error-message">{vehicleError}</p>}
                {formError && <p className="error-message" style={{ marginBottom: '10px' }}>{formError}</p>}


                {!isLoadingVehicles && !vehicleError && (
                    <div className="vehicles-list">
                        {vehicles.length === 0 && <p>No vehicles added yet. Click 'Add Vehicle' to start.</p>}
                        {/* Vehicle mapping remains the same */}
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} className="vehicle-item">
                                <div className="vehicle-item-info">
                                    <img src={CardVehicleIcon} alt="Vehicle Icon" className="vehicle-item-icon" />
                                    <div className="vehicle-item-details">
                                        <h5>{vehicle.registration_no}</h5>
                                        <p>Type: {vehicle.vehicle_type || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="vehicle-item-actions">
                                    <button
                                        className="options-btn"
                                        onClick={() => setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)}
                                        disabled={isSubmitting}
                                    >
                                        <img src={OptionsIcon} alt="Options"/>
                                    </button>
                                    {openMenuId === vehicle.id && (
                                        <div className="options-menu">
                                            <button onClick={() => handleEditVehicle(vehicle)} disabled={isSubmitting}>
                                                <Edit size={16} /> Edit
                                            </button>
                                            <button onClick={() => handleOpenDeleteModal(vehicle)} disabled={isSubmitting}>
                                                <Trash2 size={16} /> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
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

export default ProfilePage;