import React, { useState, useEffect } from 'react';
import { Search, Plus, Upload, TrendingUp } from 'lucide-react';
import './DriversPage.css';
import { DriverService } from './DriverService.js';
import { getVehicleList } from '../../services/vehicleListService';
import { useNavigate } from 'react-router-dom';
import { getThemeCSS } from '../../utils/colorTheme';
import { getToken, getProfileField } from '../../utils/session.js';
import LottieLoader from '../../components/LottieLoader.jsx';
import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { useDriverColumns } from './useDriverColumns.jsx';
import { getInitials, formatRole } from './Component/driverPresenters.js';
import { EditDriverModal } from './Component/EditDriverModal.jsx';
import {
  DeleteDriverModal,
  DeactivateDriverModal,
  MoveEmployeeModal,
} from './Component/DriverConfirmModals.jsx';
import DriverTable from './Component/DriverTable.jsx';
import DriversPagination from './Component/DriversPagination.jsx';
import DriverFilter from './Component/DriverFilter.jsx';
import DriverTrendDrawer from './Component/DriverTrendDrawer.jsx';
import BulkUploadDriversPanel from './BulkUploadDriversPanel.jsx';
import {
  normalizeDriver,
  normalizeVehicleOption,
  countActiveFilters,
  EMPLOYEE_EXPORT_COLUMNS,
  employeeExportMeta,
} from './driverList.js';
import { useDriverActions } from './useDriverActions.js';
import { useDriverListControls } from './useDriverListControls.js';
import logger from '../../utils/logger';

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

  const [showTrendsDrawer, setShowTrendsDrawer] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

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
      const normalizedDrivers = await DriverService.withAssignedVehicles(
        (items || []).map(normalizeDriver),
      );
      setDrivers(normalizedDrivers);
      if (meta) {
        setTotalPages(meta.totalPages);
      } else {
        setTotalPages(Math.ceil(normalizedDrivers.length / itemsPerPage));
      }
    } catch (apiError) {
      logger.warn('DriversPage', 'Failed to fetch drivers', apiError);
      setError(apiError?.message || 'Could not load drivers list.');
    } finally {
      setIsLoading(false); // Finish loading drivers
      setHasLoadedOnce(true);
    }
  };

  const fetchVehicles = async () => {
    // Attempt to fetch vehicles even if businessRefId is not present locally.
    const token = getToken();
    if (!token) {
      logger.warn('DriversPage', 'No auth token present; skipping vehicles fetch.');
      return;
    }

    try {
      const normalized = (await getVehicleList()).map(normalizeVehicleOption);
      setAvailableVehicles(normalized);
    } catch (apiError) {
      logger.warn('DriversPage', 'Failed to fetch vehicles', apiError);
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
    }, 400);
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
    currentPage,
    setCurrentPage,
    setActionError,
  });

  const columns = useDriverColumns({
    onEdit: handleOpenEditModal,
    onDelete: handleOpenDeleteModal,
    onActivateHere: handleActivateHere,
    onDeactivate: handleOpenDeactivate,
    getInitials,
    formatRole,
    isSubmitting: isSubmitting || isActionSubmitting,
  });

  const {
    handleSearchChange,
    handleFilterChange,
    handleApplyFilters,
    handleClearFilters,
    toggleFilterDropdown,
    activeCount,
    exportRows,
    fetchAllEmployeesForExport,
    paginatedDrivers,
    handlePageChange,
  } = useDriverListControls({
    drivers,
    filters,
    tempFilters,
    setTempFilters,
    setFilters,
    searchTerm,
    setSearchInput,
    isFilterDropdownOpen,
    setIsFilterDropdownOpen,
    businessRefId,
    totalPages,
    setCurrentPage,
  });

  // Show general page error first
  if (error && !hasLoadedOnce) {
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
              variant="secondary"
              text="Performance & Trends"
              prependIcon={<TrendingUp size={16} />}
              onClick={() => setShowTrendsDrawer(true)}
            />
            <NewButton
              variant="secondary"
              text="Bulk Upload"
              prependIcon={<Upload size={16} />}
              onClick={() => setShowBulkPanel(true)}
            />
            <NewButton
              variant="primary"
              text="Add Employee"
              prependIcon={<Plus size={16} />}
              onClick={() => navigate('/drivers/add')}
            />
          </>
        }
      >
        {actionError && (
          <div className="drivers-error-message drivers-action-error">{actionError}</div>
        )}

        <DataTable
          columns={columns}
          rows={paginatedDrivers}
          rowKey={(driver) => driver.id}
          loading={isLoading}
          error={error}
          onRetry={fetchDrivers}
          showing={paginatedDrivers.length}
          total={activeCount}
          activeFilters={activeFilterCount}
          toolbarExtra={
            <>
              <div className="dt-search">
                <Search size={13} aria-hidden />
                <input
                  type="search"
                  value={searchInput}
                  placeholder="Employee name or Id"
                  onChange={handleSearchChange}
                  aria-label="Employee name or Id"
                />
              </div>
              <ExportButton
                fetchAll={fetchAllEmployeesForExport}
                columns={EMPLOYEE_EXPORT_COLUMNS}
                filename="employees"
                meta={employeeExportMeta({ search: searchTerm, filters })}
                disabled={!exportRows.length}
                compact
              />
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
                compact
              />
            </>
          }
          paginated={true}
          pagination={
            totalPages > 1 || activeCount > 10 ? (
              <DriversPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            ) : null
          }
          emptyTitle={
            drivers.length === 0 ? 'No employees added yet' : 'No employees match your search'
          }
          emptyHint={
            drivers.length === 0
              ? 'Click "Add employee" to start.'
              : 'Try a different search term or role filter.'
          }
          emptyAction={
            <NewButton
              variant="primary"
              text="Add Employee"
              prependIcon={<Plus size={16} />}
              onClick={() => navigate('/drivers/add')}
            />
          }
          onRowClick={(driver) => {
            if (driver.branchStatus === 'DEACTIVATED') return;
            handleOpenEditModal(driver);
          }}
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
      <DriverTrendDrawer isOpen={showTrendsDrawer} onClose={() => setShowTrendsDrawer(false)} />

      <BulkUploadDriversPanel
        isOpen={showBulkPanel}
        onClose={() => setShowBulkPanel(false)}
        onUploaded={fetchDrivers}
      />
    </div>
  );
};

export default DriversPage;
