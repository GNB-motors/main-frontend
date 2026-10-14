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
import { VehicleService } from './VehicleService.js';
import { listAccounts } from './FleetEdgeAccountService.js';
import { getToken, getProfileField } from '../../utils/session.js';
import { DeleteVehicleModal } from './VehicleModals.jsx';
import BulkUploadVehiclesPanel from './BulkUploadVehiclesPanel.jsx';
import VehiclesPagination from './VehiclesPagination.jsx';
import { useVehicleColumns } from './useVehicleColumns.jsx';
import {
  normalizeVehicle,
  buildAccountMap,
  filterVehicles,
  VEHICLE_EXPORT_COLUMNS,
  mapVehicleForExport,
  vehicleExportMeta,
} from './vehicleList.js';
import logger from '../../utils/logger';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [fleetEdgeAccounts, setFleetEdgeAccounts] = useState([]);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

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

  // --- Fetch Vehicles ---
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoadingVehicles(true);
      setVehicleError(null);
      try {
        const result = await VehicleService.getAllVehicles(
          businessRefId,
          currentPage,
          itemsPerPage,
        );
        // Normalize API vehicle shape (camelCase) to UI expected snake_case
        const normalized = (result.data || []).map(normalizeVehicle);

        // Fetch FleetEdge accounts for the column (fire-and-forget, don't block vehicle render)
        try {
          const accounts = await listAccounts();
          setFleetEdgeAccounts(accounts || []);
        } catch {
          /* non-fatal */
        }
        setVehicles(normalized);
        setTotalPages(result.meta.totalPages);
        setTotalVehicles(result.meta.total);
      } catch (apiError) {
        logger.warn('VehiclesPage', 'Failed to fetch vehicles', apiError);
        setVehicleError(apiError?.message || 'Failed to load vehicles.');
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
    const token = getToken();
    if (!token) {
      toast.warn('No auth token found. Request may fail.');
    }
    const originalVehicles = [...vehicles];
    const removedVehicle = vehicles.find((v) => v.id === vehicleIdToRemove);
    setVehicles((prevVehicles) => prevVehicles.filter((v) => v.id !== vehicleIdToRemove));
    try {
      await VehicleService.removeVehicle(vehicleIdToRemove);
      toast.success(
        `Vehicle "${removedVehicle?.registration_no || vehicleIdToRemove}" removed successfully!`,
      );
      setIsDeleteModalOpen(false);
      setDeletingVehicle(null);
      // Re-sync paginated counts/pages with the server after removal. If that was the
      // only row on a page past the first, step back a page; otherwise refetch in place.
      if (originalVehicles.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        setRefreshKey((k) => k + 1);
      }
    } catch (apiError) {
      logger.warn('VehiclesPage', 'Failed to remove vehicle', apiError);
      const errorMessage = apiError?.message || 'Could not remove vehicle.';
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
    try {
      await VehicleService.importVehicle(vehicle.id);
      toast.success('Vehicle activated in this location');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Could not activate vehicle here');
    }
  };

  // --- Open Delete Modal ---
  const handleOpenDeleteModal = (vehicleToDelete) => {
    setDeletingVehicle(vehicleToDelete);
    setIsDeleteModalOpen(true);
  };

  // Build a map from accountId → account for fast lookup
  const accountMap = useMemo(() => buildAccountMap(fleetEdgeAccounts), [fleetEdgeAccounts]);

  const [statusFilter, setStatusFilter] = useState('ALL');

  // --- Filter vehicles by registration number and status ---
  const filteredVehicles = useMemo(() => {
    let list = filterVehicles(vehicles, { search: searchVehicleNo });
    if (statusFilter === 'ACTIVE') {
      list = list.filter((v) => v.status === 'ACTIVE' || v.isActive);
    } else if (statusFilter === 'UNASSIGNED') {
      list = list.filter((v) => !v.assignedDriver && !v.driver_id && !v.assigned_driver_id);
    } else if (statusFilter === 'FLEETEDGE') {
      list = list.filter((v) => Boolean(v.fleetEdgeAccountId || v.fleet_edge_vehicle_id));
    }
    return list;
  }, [vehicles, searchVehicleNo, statusFilter]);

  const exportRows = useMemo(
    () => filteredVehicles.map((v) => mapVehicleForExport(v, accountMap)),
    [filteredVehicles, accountMap],
  );

  // Export must cover every matching vehicle, not just the currently-loaded
  // page — pull all pages from the API (capped at the backend's max `limit`
  // of 1000 per request) before applying the same search filter as the table.
  const fetchAllVehiclesForExport = async () => {
    const EXPORT_PAGE_LIMIT = 1000;
    const first = await VehicleService.getAllVehicles(businessRefId, 1, EXPORT_PAGE_LIMIT);
    const all = (first.data || []).map(normalizeVehicle);
    const totalPages = first.meta?.totalPages || 1;
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await VehicleService.getAllVehicles(businessRefId, page, EXPORT_PAGE_LIMIT);
      all.push(...(next.data || []).map(normalizeVehicle));
    }
    return filterVehicles(all, { search: searchVehicleNo }).map((v) =>
      mapVehicleForExport(v, accountMap),
    );
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

  const activeFilterCount = searchVehicleNo.trim() ? 1 : 0;

  const columns = useVehicleColumns({
    accountMap,
    isSubmitting,
    onEdit: (vehicle) => navigate('/vehicles/add', { state: { editingVehicle: vehicle } }),
    onDelete: handleOpenDeleteModal,
    onActivateHere: handleActivateHere,
  });

  // The page renders without profile context or businessRefId.

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <PageShell
        title="Vehicles"
        count={totalVehicles}
        filters={
          <FilterBar
            searchValue={searchVehicleNo}
            onSearchChange={setSearchVehicleNo}
            searchPlaceholder="Search by vehicle registration number"
            filterChips={[
              { id: 'ALL', label: 'All', count: totalVehicles },
              { id: 'ACTIVE', label: 'Active Fleet' },
              { id: 'UNASSIGNED', label: 'Unassigned' },
              { id: 'FLEETEDGE', label: 'FleetEdge Linked' },
            ]}
            activeChip={statusFilter}
            onChipSelect={setStatusFilter}
          />
        }
        actions={
          <div className="vehicles-actions-btn-group">
            <ExportButton
              fetchAll={fetchAllVehiclesForExport}
              columns={VEHICLE_EXPORT_COLUMNS}
              filename="vehicles"
              meta={vehicleExportMeta({ search: searchVehicleNo, accountMap })}
              disabled={!exportRows.length}
              newButtonStyle
              align="left"
            />
            <NewButton
              variant="secondary"
              type="button"
              text="Bulk Upload"
              prependIcon={<Upload size={15} />}
              onClick={() => setShowBulkPanel(true)}
              disabled={isSubmitting}
            />
            <NewButton
              variant="primary"
              type="button"
              text="Add Vehicle"
              prependIcon={<Plus size={15} strokeWidth={2.4} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/vehicles/add');
              }}
              disabled={isSubmitting}
            />
          </div>
        }
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
          paginated={true}
          pagination={
            totalPages > 1 || totalVehicles > 10 ? (
              <VehiclesPagination
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
              />
            ) : null
          }
          emptyTitle={
            vehicles.length === 0 ? 'No vehicles added yet' : 'No vehicles match your search'
          }
          emptyHint={
            vehicles.length === 0
              ? 'Click "Add Vehicle" to start.'
              : 'Try a different registration number.'
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
            // Clicking a row opens the vehicle profile (360) page.
            navigate(`/vehicles/${encodeURIComponent(vehicle.registration_no)}`);
          }}
        />
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

      {/* Bulk Upload Side Panel */}
      <BulkUploadVehiclesPanel
        isOpen={showBulkPanel}
        onClose={() => setShowBulkPanel(false)}
        onUploaded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default VehiclesPage;
