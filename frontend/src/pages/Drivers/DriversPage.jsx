import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Upload } from 'lucide-react';
import './DriversPage.css';
import { DriverService } from './DriverService.jsx';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme';
import { getToken, getProfileField } from '../../utils/session.js';
import LottieLoader from '../../components/LottieLoader.jsx';
import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import {
  getInitials,
  formatRole,
  EditDriverModal,
  DeleteDriverModal,
  DeactivateDriverModal,
  MoveEmployeeModal,
} from './Component/driversComponents.jsx';
import DriverTable from './Component/DriverTable.jsx';
import DriversPagination from './Component/DriversPagination.jsx';
import DriverFilter from './Component/DriverFilter.jsx';
import {
  normalizeDriver,
  normalizeVehicleOption,
  filterAndSortDrivers,
  countActiveDrivers,
  countActiveFilters,
} from './driverList.js';
import { useDriverActions } from './useDriverActions.js';

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
    vehicleAssignment: '',
  });
  const [tempFilters, setTempFilters] = useState({
    role: '',
    vehicleAssignment: '',
  });

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
      setError('Authentication required. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (filters.role) params.role = filters.role;
      const result = await DriverService.getAllDrivers(businessRefId, params);

      const { data: items, meta } = result;

      // Normalize drivers to include a `name` convenience field used across the UI
      const normalizedDrivers = (items || []).map(normalizeDriver);
      setDrivers(normalizedDrivers);
      if (meta) {
        setTotalPages(meta.totalPages);
      } else {
        setTotalPages(Math.ceil(normalizedDrivers.length / itemsPerPage));
      }
    } catch (apiError) {
      console.error('Failed to fetch drivers:', apiError);
      setError(apiError?.detail || 'Could not load drivers list.');
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
      const normalized = (data || []).map(normalizeVehicleOption);
      setAvailableVehicles(normalized);
    } catch (apiError) {
      console.error('Failed to fetch vehicles:', apiError);
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
  const {
    isEditModalOpen,
    editingDriver,
    isDeleteModalOpen,
    deletingDriver,
    deactivatingDriver,
    movingDriver,
    isActionSubmitting,
    isSubmitting,
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setDeletingDriver,
    setDeactivatingDriver,
    setMovingDriver,
    handleOpenEditModal,
    handleOpenDeleteModal,
    handleActivateHere,
    handleOpenDeactivate,
    handleConfirmDeactivate,
    handleUpdateDriver,
    handleDeleteDriver,
    activateEmployee,
  } = useDriverActions({
    navigate,
    businessRefId,
    drivers,
    setDrivers,
    fetchDrivers,
    setOpenMenuDriverId,
    setActionError,
  });

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterDropdownOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      role: '',
      vehicleAssignment: '',
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

  // Client-side filtering with search and filters
  const filteredDrivers = useMemo(
    () => filterAndSortDrivers(drivers, filters.vehicleAssignment),
    [drivers, filters.vehicleAssignment],
  );

  // The header count reflects only active employees (deactivated are excluded).
  const activeCount = useMemo(() => countActiveDrivers(filteredDrivers), [filteredDrivers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const paginatedDrivers = filteredDrivers;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Close action menu and filter dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the action menu button/area AND outside the portal menu
      if (
        openMenuDriverId &&
        !event.target.closest(`.drivers-action-menu-container-${openMenuDriverId}`) &&
        !event.target.closest('.drivers-action-menu')
      ) {
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

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="drivers-container" style={themeColors}>
      <PageShell
        title="Employees"
        count={activeCount}
        actions={
          <>
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
          </>
        }
        filters={
          <FilterBar
            searchValue={searchInput}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Employee name or Id"
            activeCount={activeFilterCount}
            onClear={handleClearFilters}
            right={
              <DriverFilter
                isOpen={isFilterDropdownOpen}
                onToggle={toggleFilterDropdown}
                onClose={() => setIsFilterDropdownOpen(false)}
                filters={filters}
                tempFilters={tempFilters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                activeFilterCount={activeFilterCount}
                drivers={drivers}
              />
            }
          />
        }
      >
        {actionError && (
          <div className="drivers-error-message drivers-action-error">{actionError}</div>
        )}

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

        {/* Pagination controls - server-side, always visible */}
        <DriversPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </PageShell>

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
  );
};

export default DriversPage;
