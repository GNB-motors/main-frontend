import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, ChevronDown, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import './DriversPage.css';
import { DriverService } from './DriverService.jsx';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme';
import { getToken, getBranchId, getProfileField } from '../../utils/session.js';
import LottieLoader from '../../components/LottieLoader.jsx';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';
import NewButton from '@/components/ui/NewButton';
import {
    getInitials,
    formatRole,
    FilterDropdown,
    EditDriverModal,
    DeleteDriverModal,
    DeactivateDriverModal,
    MoveEmployeeModal,
} from './Component/driversComponents.jsx';
import DriverTable from './Component/DriverTable.jsx';

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
    // Read businessRefId from session storage as a fallback
    const businessRefId = getProfileField('business_ref_id') || null;

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
        const token = getToken();
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
        const token = getToken();
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
        const activeBranchId = getBranchId();
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
         const token = getToken();
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
        const token = getToken();
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

                <DriverTable
                    drivers={paginatedDrivers}
                    isLoading={isLoading}
                    rows={itemsPerPage}
                    searchTerm={searchTerm}
                    openMenuDriverId={openMenuDriverId}
                    setOpenMenuDriverId={setOpenMenuDriverId}
                    menuPosition={menuPosition}
                    setMenuPosition={setMenuPosition}
                    onRowClick={(driver) => navigate('/drivers/add', { state: { editingDriver: driver } })}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                    onActivateHere={handleActivateHere}
                    onDeactivate={handleOpenDeactivate}
                    getInitials={getInitials}
                    formatRole={formatRole}
                />
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
