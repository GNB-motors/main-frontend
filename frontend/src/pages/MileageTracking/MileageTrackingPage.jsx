import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import { generateMileagePageNumbers } from './mileageTrackingLogic';
import { buildMileageTrackingColumns } from './mileageTrackingColumns';

const PAGE_SIZE = 10;

const MileageTrackingPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // Receive search input from the Navbar
  useEffect(() => {
    const handleSearch = (e) => handleSearchChange(e.detail?.value ?? '');
    window.addEventListener('mileageSearchChange', handleSearch);
    return () => window.removeEventListener('mileageSearchChange', handleSearch);
  }, []);

  // Push total count up to the Navbar
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('mileageCountUpdate', { detail: { count: pagination.total } }),
    );
  }, [pagination.total]);

  // Reset Navbar state on unmount
  useEffect(
    () => () => {
      window.dispatchEvent(new CustomEvent('mileageCountUpdate', { detail: { count: 0 } }));
      window.dispatchEvent(new CustomEvent('mileageSearchReset', { detail: { value: '' } }));
    },
    [],
  );

  const {
    data: fleetResponse,
    loading: isLoading,
    error: fleetError,
  } = useApi(
    (signal) =>
      apiClient.get('/api/mileage/fleet-overview', {
        params: { page: pagination.page, limit: pagination.limit, search: searchQuery },
        signal,
      }),
    [JSON.stringify({ page: pagination.page, search: searchQuery })],
  );

  useEffect(() => {
    if (fleetResponse) {
      setVehicles(fleetResponse.data?.data || []);
      setPagination((p) => ({ ...p, total: fleetResponse.data?.meta?.total ?? 0 }));
    }
  }, [fleetResponse]);

  useEffect(() => {
    if (fleetError) toast.error('Failed to load fleet mileage overview');
  }, [fleetError]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPagination((p) => ({ ...p, page }));
  };

  const openVehicle = (vehicleId) => navigate(`/mileage-tracking/vehicle/${vehicleId}`);
  const columns = buildMileageTrackingColumns({ onOpenVehicle: openVehicle });

  return (
    <PageShell
      title="Mileage Tracking"
      count={pagination.total}
      filters={
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search vehicles…"
        />
      }
    >
      <DataTable
        columns={columns}
        rows={vehicles}
        rowKey={(v) => v.vehicleId}
        loading={isLoading}
        onRowClick={(v) => openVehicle(v.vehicleId)}
        emptyTitle="No vehicles found for mileage tracking"
        emptyHint={searchQuery ? 'Try adjusting your search' : null}
      />

      {pagination.total > 0 && (
        <div className="mileage-pagination-controls">
          <button
            className="mileage-pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || totalPages <= 1}
          >
            <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
          </button>

          {generateMileagePageNumbers(totalPages, pagination.page).map((page, index) =>
            page === '...' ? (
              <div key={`overflow-${index}`} className="mileage-page-overflow">
                <span>...</span>
              </div>
            ) : (
              <button
                key={page}
                className={`mileage-page-number ${pagination.page === page ? 'mileage-page-number-current' : ''}`}
                onClick={() => handlePageChange(page)}
                disabled={totalPages <= 1}
              >
                <span>{page}</span>
              </button>
            ),
          )}

          <button
            className="mileage-pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages || totalPages <= 1}
          >
            <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      )}
    </PageShell>
  );
};

export default MileageTrackingPage;
