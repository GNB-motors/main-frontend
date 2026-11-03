import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
// Profile context removed - vehicles page should render independently
import { getThemeCSS } from '../../utils/colorTheme.js';
import './ProfilePage.css';
import './VehiclesPage.css';

// Import assets and icons
import { FileText, Plus, Upload } from 'lucide-react';
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
  buildAccountMap,
  VEHICLE_EXPORT_COLUMNS,
  mapVehicleForExport,
  vehicleExportMeta,
} from './vehicleList.js';
import { useFleetLink } from '../../contexts/fleetLinkContext';
import logger from '../../utils/logger';
import useVehicleManufacturers from './useVehicleManufacturers.js';
import VehicleListFilters from './VehicleListFilters.jsx';
import VehicleListService from './VehicleListService.js';

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
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { manufacturers, metadataError, retryMetadata } = useVehicleManufacturers();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [fleetEdgeAccounts, setFleetEdgeAccounts] = useState([]);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  const {
    index: linkIndex,
    data: linkData,
    error: linkError,
    openPanel: openRelinkPanel,
  } = useFleetLink();

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
    const controller = new AbortController();
    const fetchVehicles = async () => {
      setIsLoadingVehicles(true);
      setVehicleError(null);
      try {
        const result = await VehicleListService.getPage({
          businessRefId,
          page: currentPage,
          limit: itemsPerPage,
          manufacturer: manufacturerFilter,
          search: searchVehicleNo,
          view: statusFilter,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        // Fetch FleetEdge accounts for the column (fire-and-forget, don't block vehicle render)
        try {
          const accounts = await listAccounts({ signal: controller.signal });
          if (!controller.signal.aborted) setFleetEdgeAccounts(accounts || []);
        } catch {
          /* non-fatal */
        }
        if (controller.signal.aborted) return;
        setVehicles(result.data);
        setTotalPages(result.meta.totalPages);
        setTotalVehicles(result.meta.total);
      } catch (apiError) {
        if (controller.signal.aborted) return;
        logger.warn('VehiclesPage', 'Failed to fetch vehicles', apiError);
        setVehicleError(apiError?.message || 'Failed to load vehicles.');
      } finally {
        if (!controller.signal.aborted) setIsLoadingVehicles(false);
      }
    };
    fetchVehicles();
    return () => controller.abort();
  }, [
    businessRefId,
    currentPage,
    itemsPerPage,
    refreshKey,
    manufacturerFilter,
    searchVehicleNo,
    statusFilter,
  ]);

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
  const exportRows = useMemo(
    () => vehicles.map((v) => mapVehicleForExport(v, accountMap, linkIndex)),
    [vehicles, accountMap, linkIndex],
  );

  const fetchAllVehiclesForExport = async () => {
    const all = await VehicleListService.getMatching({
      businessRefId,
      manufacturer: manufacturerFilter,
      search: searchVehicleNo,
      view: statusFilter,
    });
    return all.map((vehicle) => mapVehicleForExport(vehicle, accountMap, linkIndex));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const activeFilterCount =
    Number(Boolean(searchVehicleNo.trim())) +
    Number(Boolean(manufacturerFilter)) +
    Number(statusFilter !== 'ALL');

  const columns = useVehicleColumns({
    accountMap,
    manufacturers,
    linkIndex,
    linkLoading: !linkData && !linkError,
    onReconnect: openRelinkPanel,
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
            onSearchChange={(value) => {
              setSearchVehicleNo(value);
              setCurrentPage(1);
            }}
            activeCount={activeFilterCount}
            onClear={() => {
              setSearchVehicleNo('');
              setManufacturerFilter('');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            right={
              <VehicleListFilters
                manufacturers={manufacturers}
                manufacturer={manufacturerFilter}
                view={statusFilter}
                onViewChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                onManufacturerChange={(value) => {
                  setManufacturerFilter(value);
                  setCurrentPage(1);
                }}
                metadataError={metadataError}
                retryMetadata={retryMetadata}
              />
            }
            searchPlaceholder="Search registration or chassis number"
          />
        }
        actions={
          <div className="vehicles-actions-btn-group">
            <NewButton
              variant="secondary"
              type="button"
              text="Vehicle Documents"
              prependIcon={<FileText size={15} />}
              onClick={() => navigate('/vehicles/dashboard')}
            />
            <ExportButton
              fetchAll={fetchAllVehiclesForExport}
              columns={VEHICLE_EXPORT_COLUMNS}
              filename="vehicles"
              meta={vehicleExportMeta({
                search: searchVehicleNo,
                manufacturer: manufacturerFilter,
                accountMap,
              })}
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
          rows={vehicles}
          rowKey={(vehicle) => vehicle.id}
          loading={isLoadingVehicles}
          error={vehicleError}
          onRetry={() => setRefreshKey((k) => k + 1)}
          showing={vehicles.length}
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
            !activeFilterCount && vehicles.length === 0
              ? 'No vehicles added yet'
              : 'No vehicles match your filters'
          }
          emptyHint={
            !activeFilterCount && vehicles.length === 0
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
