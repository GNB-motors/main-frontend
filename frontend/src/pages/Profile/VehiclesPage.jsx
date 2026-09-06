import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
// Profile context removed - vehicles page should render independently
import { getThemeCSS } from '../../utils/colorTheme.js';
import './ProfilePage.css';
import './VehiclesPage.css';

// Import assets and icons
import { Plus, Upload } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';

// Import the services
import { VehicleService } from './VehicleService.jsx';
import { listAccounts } from './FleetEdgeAccountService.jsx';
import { getToken, getProfileField } from '../../utils/session.js';
import { DeleteVehicleModal, VehicleActionMenu } from './VehicleModals.jsx';
import {
  normalizeVehicle,
  buildAccountMap,
  filterVehicles,
  describeFleetEdgeAccount,
  VEHICLE_EXPORT_COLUMNS,
  mapVehicleForExport,
  vehicleExportMeta,
} from './vehicleList.js';

const VehiclesPage = () => {
  const navigate = useNavigate();
  // Try to read business ref id from session storage as a fallback when profile context is absent
  const businessRefId = getProfileField('business_ref_id') || null;
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehicleError, setVehicleError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [fleetEdgeAccounts, setFleetEdgeAccounts] = useState([]);
  const [accountFilter, setAccountFilter] = useState('all'); // 'all' | 'untagged' | <accountId>

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
      const token = getToken();
      try {
        const result = await VehicleService.getAllVehicles(
          businessRefId,
          token,
          currentPage,
          itemsPerPage,
        );
        // Normalize API vehicle shape (camelCase) to UI expected snake_case
        const normalized = (result.data || []).map(normalizeVehicle);

        // Fetch FleetEdge accounts for the column (fire-and-forget, don't block vehicle render)
        try {
          const accounts = await listAccounts(token);
          setFleetEdgeAccounts(accounts || []);
        } catch {
          /* non-fatal */
        }
        setVehicles(normalized);
        setTotalPages(result.meta.totalPages);
        setTotalVehicles(result.meta.total);
      } catch (apiError) {
        console.error('Failed to fetch vehicles:', apiError);
        setVehicleError(apiError?.detail || 'Failed to load vehicles.');
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, [businessRefId, currentPage, itemsPerPage, refreshKey]);

  // --- Remove Vehicle ---
  const handleRemoveVehicle = async (vehicleIdToRemove) => {
    setFormError(null);
    setIsSubmitting(true);
    setOpenMenuId(null);
    const token = getToken();
    if (!token) {
      toast.warn('No auth token found. Request may fail.');
    }
    const originalVehicles = [...vehicles];
    const removedVehicle = vehicles.find((v) => v.id === vehicleIdToRemove);
    setVehicles((prevVehicles) => prevVehicles.filter((v) => v.id !== vehicleIdToRemove));
    try {
      await VehicleService.removeVehicle(businessRefId, vehicleIdToRemove, token);
      toast.success(
        `Vehicle "${removedVehicle?.registration_no || vehicleIdToRemove}" removed successfully!`,
      );
      setIsDeleteModalOpen(false);
      setDeletingVehicle(null);
    } catch (apiError) {
      console.error('Failed to remove vehicle:', apiError);
      const errorMessage = apiError?.detail || 'Could not remove vehicle.';
      setFormError(errorMessage);
      toast.error(errorMessage);
      setVehicles(originalVehicles);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Vehicle ---
  // Activate a deactivated (moved-away) vehicle back into the current location.
  // Re-import moves it here (active here, deactivated where it was).
  const handleActivateHere = async (vehicle) => {
    const token = getToken();
    try {
      await VehicleService.importVehicle(vehicle.id, token);
      toast.success('Vehicle activated in this location');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.detail || err?.message || 'Could not activate vehicle here');
    }
  };

  // --- Open Delete Modal ---
  const handleOpenDeleteModal = (vehicleToDelete) => {
    setDeletingVehicle(vehicleToDelete);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  // Build a map from accountId → account for fast lookup
  const accountMap = useMemo(() => buildAccountMap(fleetEdgeAccounts), [fleetEdgeAccounts]);

  // --- Filter vehicles by registration number + account ---
  const filteredVehicles = useMemo(
    () => filterVehicles(vehicles, { search: searchVehicleNo, accountFilter }),
    [vehicles, searchVehicleNo, accountFilter],
  );

  const exportRows = useMemo(
    () => filteredVehicles.map((v) => mapVehicleForExport(v, accountMap)),
    [filteredVehicles, accountMap],
  );

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

  const activeFilterCount = (searchVehicleNo.trim() ? 1 : 0) + (accountFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchVehicleNo('');
    setAccountFilter('all');
    setCurrentPage(1);
  };

  const accountSelect = fleetEdgeAccounts.length > 0 && (
    <select
      value={accountFilter}
      onChange={(e) => {
        setAccountFilter(e.target.value);
        setCurrentPage(1);
      }}
      className="vehicles-search-input"
      style={{ maxWidth: 200, cursor: 'pointer' }}
      title="Filter by FleetEdge account"
    >
      <option value="all">All FleetEdge accounts</option>
      <option value="untagged">Untagged</option>
      {fleetEdgeAccounts.map((a) => (
        <option key={a._id} value={String(a._id)}>
          {a.friendlyName || a.externalAccountId}
        </option>
      ))}
    </select>
  );

  const columns = [
    {
      key: 'registration_no',
      label: 'Vehicle No',
      render: (vehicle) => (
        <>
          <span style={{ fontWeight: 600 }}>{vehicle.registration_no}</span>
          {vehicle.branchStatus === 'DEACTIVATED' && (
            <span
              className="vehicle-badge"
              title="Moved to another location — deactivated here"
              style={{
                marginLeft: 8,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
              }}
            >
              Deactivated
            </span>
          )}
        </>
      ),
    },
    { key: 'model', label: 'Model', render: (vehicle) => vehicle.model || 'N/A' },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      render: (vehicle) =>
        vehicle.manufacturer && vehicle.manufacturer !== 'UNKNOWN' ? (
          <span
            className={`vehicle-badge manufacturer-${vehicle.manufacturer?.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {vehicle.manufacturer}
          </span>
        ) : (
          <span className="vehicle-badge vehicle-badge-unknown">—</span>
        ),
    },
    {
      key: 'vehicleCategory',
      label: 'Category',
      render: (vehicle) =>
        vehicle.vehicleCategory && vehicle.vehicleCategory !== 'UNKNOWN' ? (
          <span className={`vehicle-badge category-${vehicle.vehicleCategory?.toLowerCase()}`}>
            {vehicle.vehicleCategory}
          </span>
        ) : (
          <span className="vehicle-badge vehicle-badge-unknown">—</span>
        ),
    },
    {
      key: 'chassis_number',
      label: 'Chassis No',
      render: (vehicle) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {vehicle.chassis_number || 'N/A'}
        </span>
      ),
    },
    {
      key: 'fleetEdgeAccountId',
      label: 'FleetEdge Account',
      render: (vehicle) => {
        const acct = describeFleetEdgeAccount(vehicle, accountMap);
        if (!acct.tagged) {
          return <span style={{ fontStyle: 'italic', color: '#aaa', fontSize: 12 }}>untagged</span>;
        }
        return (
          <span
            title={acct.tip}
            className="vehicle-badge"
            style={{
              background: acct.isDisabled ? '#fef3c7' : '#eff6ff',
              color: acct.isDisabled ? '#92400e' : '#1d4ed8',
              border: `1px solid ${acct.isDisabled ? '#fde68a' : '#bfdbfe'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {acct.isDisabled && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'inline-block',
                }}
                title="Source account disabled"
              />
            )}
            {acct.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (vehicle) => (
        <VehicleActionMenu
          vehicle={vehicle}
          isOpen={openMenuId === vehicle.id}
          onToggle={(e) => {
            e.stopPropagation();
            setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
          }}
          onClose={() => setOpenMenuId(null)}
          isSubmitting={isSubmitting}
          onEdit={() => {
            setOpenMenuId(null);
            navigate('/vehicles/add', { state: { editingVehicle: vehicle } });
          }}
          onDelete={() => {
            handleOpenDeleteModal(vehicle);
          }}
          onActivateHere={() => handleActivateHere(vehicle)}
        />
      ),
    },
  ];

  // The page renders without profile context or businessRefId.

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <PageShell
        title="Vehicles"
        count={filteredVehicles.length}
        actions={
          <>
            <ExportButton
              rows={exportRows}
              columns={VEHICLE_EXPORT_COLUMNS}
              filename="vehicles"
              meta={vehicleExportMeta({ search: searchVehicleNo, accountFilter, accountMap })}
              disabled={!exportRows.length}
            />
            <NewButton
              variant="secondary"
              type="button"
              text="Bulk Upload"
              prependIcon={<Upload size={16} />}
              onClick={() => navigate('/vehicles/bulk-upload')}
              disabled={isSubmitting}
            />
            <NewButton
              variant="primary"
              type="button"
              text="Add Vehicle"
              prependIcon={<Plus size={16} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/vehicles/add');
              }}
              disabled={isSubmitting}
            />
          </>
        }
        filters={
          <FilterBar
            searchValue={searchVehicleNo}
            onSearchChange={setSearchVehicleNo}
            searchPlaceholder="Search by vehicle registration number"
            activeCount={activeFilterCount}
            onClear={clearFilters}
            right={accountSelect}
          />
        }
        footer={`Showing ${filteredVehicles.length} of ${totalVehicles} vehicles`}
      >
        {formError && (
          <p className="error-message" style={{ marginBottom: '10px', padding: '0 20px' }}>
            {formError}
          </p>
        )}

        <DataTable
          columns={columns}
          rows={filteredVehicles}
          rowKey={(vehicle) => vehicle.id}
          loading={isLoadingVehicles}
          error={vehicleError}
          onRetry={() => setRefreshKey((k) => k + 1)}
          showing={filteredVehicles.length}
          total={totalVehicles}
          activeFilters={activeFilterCount}
          emptyTitle={
            vehicles.length === 0 ? 'No vehicles added yet' : 'No vehicles match your search'
          }
          emptyHint={
            vehicles.length === 0
              ? 'Click "Add Vehicle" to start.'
              : 'Try a different registration number or account filter.'
          }
          emptyAction={
            <NewButton
              variant="primary"
              type="button"
              text="Add Vehicle"
              prependIcon={<Plus size={16} />}
              onClick={() => navigate('/vehicles/add')}
            />
          }
          onRowClick={(vehicle) => {
            // Deactivated (moved-away) vehicles are read-only here.
            if (vehicle.branchStatus === 'DEACTIVATED') return;
            navigate('/vehicles/add', { state: { editingVehicle: vehicle } });
          }}
        />

        {/* Pagination controls - server-side, always visible */}
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
      </PageShell>

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
    </div>
  );
};

export default VehiclesPage;
