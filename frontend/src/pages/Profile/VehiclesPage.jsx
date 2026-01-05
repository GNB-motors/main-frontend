import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
// Profile context removed - vehicles page should render independently
import { getPrimaryColor, getThemeCSS } from '../../utils/colorTheme.js';
import './ProfilePage.css';
import './VehiclesPage.css';

// Import assets and icons
import { Plus, Edit, Trash2, MoreVertical, Upload } from 'lucide-react';

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
    const [model, setModel] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (!registrationNo || !chassisNumber) {
            setError("All fields are required: Registration Number and Chassis Number.");
            return;
        }

        const vehicleData = {
            registration_no: registrationNo,
            chassis_number: chassisNumber,
            model: model || null,
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
            setModel('');
            setChassisNumber('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    console.log('AddVehicleModal rendering, isOpen:', isOpen);

    return (
        <div className="vehicle-modal-overlay" onClick={onClose}>
            <div className="vehicle-modal-content" onClick={e => e.stopPropagation()}>
                <div className="vehicle-modal-header">
                    <h4>Add New Vehicle</h4>
                    <button onClick={onClose} className="vehicle-modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="vehicle-modal-form">
                    <div className="vehicle-form-row">
                        <div className="vehicle-form-group">
                            <label htmlFor="vehicleRegistrationNo">Registration Number *</label>
                            <input
                                id="vehicleRegistrationNo"
                                type="text"
                                value={registrationNo}
                                onChange={(e) => setRegistrationNo(e.target.value)}
                                placeholder="e.g., WB11F7262"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="vehicle-form-group">
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
                    <div className="vehicle-form-row">
                        <div className="vehicle-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="model">Model *</label>
                            <input
                                id="model"
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="e.g., 4830TC, LPT 4830"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {error && <div className="vehicle-error-message">{error}</div>}

                    <div className="vehicle-modal-actions">
                        <button type="button" className="vehicle-btn vehicle-btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="vehicle-btn vehicle-btn-primary" disabled={isSubmitting}>
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
    const navigate = useNavigate();
    // Try to read business ref id from localStorage as a fallback when profile context is absent
    const businessRefId = localStorage.getItem('profile_business_ref_id') || null;
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
            setIsLoadingVehicles(true);
            setVehicleError(null);
            const token = localStorage.getItem('authToken');
            try {
                const data = await VehicleService.getAllVehicles(businessRefId, token);
                // Normalize API vehicle shape (camelCase) to UI expected snake_case
                const normalized = (data || []).map(v => ({
                    id: v._id || v.id || v._id, // keep id if present
                    registration_no: v.registrationNumber || v.registration_no || v.registrationNumber,
                    vehicle_type: v.vehicleType || v.vehicle_type || '',
                    chassis_number: v.chassisNumber || v.chassis_number || '',
                    model: v.model || '',
                    status: v.status || '',
                    inventory: v.inventory || [],
                    // New classification fields
                    manufacturer: v.manufacturer || null,
                    vehicleCategory: v.vehicleCategory || null,
                    classification: v.classification || null,
                }));
                setVehicles(normalized);
                console.log("Vehicles fetched:", normalized);
            } catch (apiError) {
                console.error('Failed to fetch vehicles:', apiError);
                setVehicleError(apiError?.detail || 'Failed to load vehicles.');
            } finally {
                setIsLoadingVehicles(false);
            }
        };
        fetchVehicles();
    }, [businessRefId]);

    // --- Add Vehicle ---
    const handleAddVehicle = async (vehicleData) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.warn('No auth token found. Request may fail.');
        }
        setIsSubmitting(true);
        setFormError(null);
        try {
            console.log('Adding vehicle with data:', vehicleData);
            const addedVehicle = await VehicleService.addVehicle(businessRefId, vehicleData, token);
            console.log('Vehicle added, API response:', addedVehicle);
            
            // Normalize returned vehicle to UI shape
            const nv = {
                id: addedVehicle._id || addedVehicle.id,
                registration_no: addedVehicle.registrationNumber || addedVehicle.registration_no || vehicleData.registration_no,
                vehicle_type: addedVehicle.vehicleType || addedVehicle.vehicle_type || '',
                chassis_number: addedVehicle.chassisNumber || addedVehicle.chassis_number || vehicleData.chassis_number,
                model: addedVehicle.model || vehicleData.model || '',
                status: addedVehicle.status || 'AVAILABLE',
                inventory: addedVehicle.inventory || [],
                // New classification fields
                manufacturer: addedVehicle.manufacturer || null,
                vehicleCategory: addedVehicle.vehicleCategory || null,
                classification: addedVehicle.classification || null,
            };
            console.log('Normalized vehicle for UI:', nv);
            setVehicles(prevVehicles => [...prevVehicles, nv]);
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
        if (!token) {
            toast.warn('No auth token found. Request may fail.');
        }
        const originalVehicles = [...vehicles];
        setVehicles(prevVehicles => prevVehicles.filter(v => v.registration_no !== registrationNoToRemove));
        try {
            await VehicleService.removeVehicle(businessRefId, registrationNoToRemove, token);
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
        const chassisNumber = e.target.chassisNumber.value.trim();
        const modelValue = e.target.model.value.trim();
        const token = localStorage.getItem('authToken');
        
        if (!regNo || !chassisNumber || !modelValue) {
            setFormError("All fields are required: Registration Number, Chassis Number, and Model.");
            setIsSubmitting(false);
            return;
        }
        
        if (!token) {
            toast.warn('No auth token found. Request may fail.');
        }
        if (!editingVehicle) {
            setFormError('No vehicle selected for editing.');
            setIsSubmitting(false);
            return;
        }
        
        const updatedVehicleData = { 
            registration_no: regNo, 
            chassis_number: chassisNumber,
            model: modelValue,
        };
        
        try {
            const updatedVehicle = await VehicleService.updateVehicle(
                businessRefId,
                // pass the DB id (ObjectId) as required by PATCH /vehicles/{id}
                editingVehicle.id || editingVehicle._id || editingVehicle.registration_no,
                updatedVehicleData,
                token
            );
            
            // Normalize the updated vehicle response
            const normalizedUpdated = {
                id: updatedVehicle._id || updatedVehicle.id || editingVehicle.id,
                registration_no: updatedVehicle.registrationNumber || updatedVehicle.registration_no || regNo,
                vehicle_type: updatedVehicle.vehicleType || updatedVehicle.vehicle_type || '',
                chassis_number: updatedVehicle.chassisNumber || updatedVehicle.chassis_number || chassisNumber,
                model: updatedVehicle.model || modelValue,
                status: updatedVehicle.status || editingVehicle.status || '',
                inventory: updatedVehicle.inventory || [],
                manufacturer: updatedVehicle.manufacturer || null,
                vehicleCategory: updatedVehicle.vehicleCategory || null,
                classification: updatedVehicle.classification || null,
            };
            
            setVehicles(prevVehicles => 
                prevVehicles.map(v => 
                    v.id === editingVehicle.id ? normalizedUpdated : v
                )
            );
            
            setShowEditForm(false);
            setEditingVehicle(null);
            toast.success(`Vehicle "${regNo}" updated successfully!`);
            console.log("Vehicle updated successfully:", normalizedUpdated);
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

    // --- Pagination logic ---
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

    // Generate page numbers for pagination (similar to DriversPage)
    const generatePageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 7;
        
        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
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

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchVehicleNo]);

    // The page renders without profile context or businessRefId.

    return (
        <>
            <div className="vehicles-page-container" style={themeColors}>
                <div className="vehicles-content-wrapper">
                    {/* Header Section */}
                    <div className="vehicles-header">
                        <div>
                            <h3>
                                <span>Total vehicles </span>
                                <span>({filteredVehicles.length})</span>
                            </h3>
                            <div className="vehicles-actions">
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
                                <button
                                    type="button"
                                    className="vehicles-add-btn"
                                    onClick={() => navigate('/vehicles/bulk-upload')}
                                    disabled={isSubmitting}
                                >
                                    <Upload size={16} />
                                    <span>Bulk Upload</span>
                                </button>
                                <button
                                    type="button"
                                    className="vehicles-add-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Add Vehicle button clicked, opening modal...');
                                        setIsAddModalOpen(true);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <Plus size={16} />
                                    <span>Add Vehicle</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="vehicles-table-section">
                        {isLoadingVehicles && <p style={{ fontSize: '14px', color: '#8b8b8c', padding: '20px' }}>Loading vehicles...</p>}
                        {vehicleError && <p className="error-message" style={{ padding: '20px' }}>{vehicleError}</p>}
                        {formError && <p className="error-message" style={{ marginBottom: '10px', padding: '0 20px' }}>{formError}</p>}

                        {!isLoadingVehicles && !vehicleError && (
                            <div className="vehicles-table-container">
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
                                    <div className="vehicles-table-wrapper">
                                        <table className="vehicles-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '140px' }}>Vehicle No</th>
                                                    <th style={{ width: '120px' }}>Model</th>
                                                    <th style={{ width: '140px' }}>Manufacturer</th>
                                                    <th style={{ width: '100px' }}>Category</th>
                                                    <th style={{ width: '180px' }}>Chassis No</th>
                                                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedVehicles.map(vehicle => (
                                                    <tr key={vehicle.id}>
                                                        <td style={{ fontWeight: 600 }}>{vehicle.registration_no}</td>
                                                        <td>{vehicle.model || 'N/A'}</td>
                                                        <td>
                                                            {vehicle.manufacturer && vehicle.manufacturer !== 'UNKNOWN' ? (
                                                                <span className={`vehicle-badge manufacturer-${vehicle.manufacturer?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                                    {vehicle.manufacturer}
                                                                </span>
                                                            ) : (
                                                                <span className="vehicle-badge vehicle-badge-unknown">—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {vehicle.vehicleCategory && vehicle.vehicleCategory !== 'UNKNOWN' ? (
                                                                <span className={`vehicle-badge category-${vehicle.vehicleCategory?.toLowerCase()}`}>
                                                                    {vehicle.vehicleCategory}
                                                                </span>
                                                            ) : (
                                                                <span className="vehicle-badge vehicle-badge-unknown">—</span>
                                                            )}
                                                        </td>
                                                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{vehicle.chassis_number || 'N/A'}</td>
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
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Section with Pagination - Always visible */}
                {!isLoadingVehicles && !vehicleError && filteredVehicles.length > 0 && (
                    <div className="vehicles-pagination-controls">
                        {/* Left Arrow */}
                        <button 
                            className="vehicles-pagination-btn" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || totalPages <= 1}
                        >
                            <span>←</span>
                        </button>

                        {/* Page Numbers */}
                        {generatePageNumbers().map((page, index) => {
                            if (page === '...') {
                                return (
                                    <div key={`overflow-${index}`} className="vehicles-page-overflow">
                                        <span>...</span>
                                    </div>
                                );
                            }
                            return (
                                <button
                                    key={page}
                                    className={`vehicles-page-number ${currentPage === page ? 'vehicles-page-number-current' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                    disabled={totalPages <= 1}
                                >
                                    <span>{page}</span>
                                </button>
                            );
                        })}

                        {/* Right Arrow */}
                        <button 
                            className="vehicles-pagination-btn" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages <= 1}
                        >
                            <span>→</span>
                        </button>
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
                                        placeholder="e.g., WB11F7262" 
                                        defaultValue={editingVehicle.registration_no}
                                        required 
                                        disabled={isSubmitting} 
                                    />
                                </div>
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
                            <div className="form-row">
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Model *</label>
                                    <input
                                        name="model"
                                        type="text"
                                        placeholder="e.g., 4830TC, LPT 4830"
                                        defaultValue={editingVehicle.model || ''}
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
