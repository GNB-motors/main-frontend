import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Gauge,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RotateCw,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { buildMileageTrackingColumns } from './mileageTrackingColumns';
import { formatMileageDate } from './mileageTrackingLogic';

const PAGE_SIZE = 10;

const MileageTrackingPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all');
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

  // Sync with Navbar search event
  useEffect(() => {
    const handleSearch = (e) => handleSearchChange(e.detail?.value ?? '');
    window.addEventListener('mileageSearchChange', handleSearch);
    return () => window.removeEventListener('mileageSearchChange', handleSearch);
  }, []);

  // Push total count up to Navbar
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
    refetch,
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

  // Computed KPI metrics
  const kpiStats = useMemo(() => {
    const totalVehicles = pagination.total || vehicles.length;
    const withMileage = vehicles.filter((v) => v.avgMileage != null && v.avgMileage > 0);
    const avg =
      withMileage.length > 0
        ? (withMileage.reduce((acc, v) => acc + v.avgMileage, 0) / withMileage.length).toFixed(2)
        : '—';
    const good = vehicles.filter((v) => v.healthStatus === 'GOOD').length;
    const stale = vehicles.filter((v) => v.healthStatus === 'NEEDS_REVIEW').length;
    const noData = vehicles.filter((v) => v.healthStatus === 'NO_DATA' || !v.healthStatus).length;

    return { totalVehicles, avg, good, stale, noData };
  }, [vehicles, pagination.total]);

  // Client-side filtering by active status tab
  const filteredVehicles = useMemo(() => {
    if (statusTab === 'all') return vehicles;
    return vehicles.filter((v) => {
      if (statusTab === 'NO_DATA') return v.healthStatus === 'NO_DATA' || !v.healthStatus;
      return v.healthStatus === statusTab;
    });
  }, [vehicles, statusTab]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPagination((p) => ({ ...p, page }));
  };

  const openVehicle = useCallback(
    (vehicleId) => {
      navigate(`/mileage-tracking/vehicle/${vehicleId}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () => buildMileageTrackingColumns({ onOpenVehicle: openVehicle }),
    [openVehicle],
  );

  // Export configuration for Excel (.xlsx) and CSV (.csv)
  const exportColumns = useMemo(
    () => [
      { key: 'vehicleNumber', label: 'Vehicle Number', type: 'text' },
      { key: 'completedTrips', label: 'Completed Trips', type: 'number' },
      { key: 'avgMileage', label: 'Avg Mileage (km/L)', type: 'number' },
      { key: 'lastOdometer', label: 'Last Odometer (km)', type: 'number' },
      { key: 'lastRefuelDate', label: 'Last Refuel Date', type: 'text' },
      { key: 'healthStatus', label: 'Health Status', type: 'text' },
    ],
    [],
  );

  const exportRows = useMemo(
    () =>
      vehicles.map((v) => ({
        vehicleNumber: v.vehicleNumber || '—',
        completedTrips: v.completedTrips ?? 0,
        avgMileage: v.avgMileage ? Number(v.avgMileage.toFixed(2)) : null,
        lastOdometer: v.lastOdometer ?? null,
        lastRefuelDate: v.lastRefuelDate ? formatMileageDate(v.lastRefuelDate) : '—',
        healthStatus: v.healthStatus || 'NO_DATA',
      })),
    [vehicles],
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusTab('all');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusTab !== 'all';

  return (
    <div className="mt-page-wrapper">
      <PageShell
        title="Mileage Tracking"
        count={pagination.total}
        subtitle="Fleet fuel efficiency and odometer performance across vehicles"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="pshell-btn pshell-btn--primary"
              onClick={() => navigate('/mileage-tracking/new')}
              title="Record a new refuel log entry"
            >
              <Plus size={15} />
              <span>Log Fuel</span>
            </button>
            <button
              type="button"
              className="pshell-btn"
              onClick={() => refetch?.()}
              title="Refresh telemetry overview"
              disabled={isLoading}
            >
              <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <ExportButton
              rows={exportRows}
              columns={exportColumns}
              filename={`fleet-mileage-telemetry-${new Date().toISOString().slice(0, 10)}`}
              disabled={isLoading || vehicles.length === 0}
            />
          </div>
        }
      >
        {/* High-Density 5-Metric KPI Strip */}
        <div className="mt-kpi-strip">
          {/* Fleet Avg Mileage */}
          <div
            className={`mt-kpi-card ${statusTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('all')}
            title="Click to view all vehicles"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Fleet Avg Mileage</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--blue">
                <Gauge size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">
              <span>{kpiStats.avg}</span>
              {kpiStats.avg !== '—' && <span className="mt-kpi-card__unit">km/L</span>}
            </div>
            <div className="mt-kpi-card__sub">Weighted active average</div>
          </div>

          {/* Tracked Vehicles */}
          <div
            className={`mt-kpi-card ${statusTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('all')}
            title="Click to view all vehicles"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Tracked Fleet</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--purple">
                <Truck size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">{kpiStats.totalVehicles}</div>
            <div className="mt-kpi-card__sub">Vehicles in registry</div>
          </div>

          {/* Good Health */}
          <div
            className={`mt-kpi-card ${statusTab === 'GOOD' ? 'is-active' : ''}`}
            onClick={() => setStatusTab((t) => (t === 'GOOD' ? 'all' : 'GOOD'))}
            title="Filter vehicles with good telemetry"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Healthy Active</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--green">
                <CheckCircle2 size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">{kpiStats.good}</div>
            <div className="mt-kpi-card__sub">Regular refuel intervals</div>
          </div>

          {/* Stale Data */}
          <div
            className={`mt-kpi-card ${statusTab === 'NEEDS_REVIEW' ? 'is-active' : ''}`}
            onClick={() => setStatusTab((t) => (t === 'NEEDS_REVIEW' ? 'all' : 'NEEDS_REVIEW'))}
            title="Filter vehicles with stale data"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Stale Data</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--amber">
                <Clock size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">{kpiStats.stale}</div>
            <div className="mt-kpi-card__sub">&gt;14 days without log</div>
          </div>

          {/* No Data */}
          <div
            className={`mt-kpi-card ${statusTab === 'NO_DATA' ? 'is-active' : ''}`}
            onClick={() => setStatusTab((t) => (t === 'NO_DATA' ? 'all' : 'NO_DATA'))}
            title="Filter vehicles with no logs"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">No Telemetry</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--red">
                <AlertCircle size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">{kpiStats.noData}</div>
            <div className="mt-kpi-card__sub">No mileage records</div>
          </div>
        </div>

        {/* Unified Single-Row Toolbar */}
        <div className="mt-toolbar">
          <div className="mt-tabs">
            <button
              type="button"
              className={`mt-tab ${statusTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('all')}
            >
              <span>All Vehicles</span>
              <span className="mt-tab-count">{kpiStats.totalVehicles}</span>
            </button>
            <button
              type="button"
              className={`mt-tab ${statusTab === 'GOOD' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('GOOD')}
            >
              <span>Good</span>
              <span className="mt-tab-count">{kpiStats.good}</span>
            </button>
            <button
              type="button"
              className={`mt-tab ${statusTab === 'NEEDS_REVIEW' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('NEEDS_REVIEW')}
            >
              <span>Stale Data</span>
              <span className="mt-tab-count">{kpiStats.stale}</span>
            </button>
            <button
              type="button"
              className={`mt-tab ${statusTab === 'NO_DATA' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('NO_DATA')}
            >
              <span>No Data</span>
              <span className="mt-tab-count">{kpiStats.noData}</span>
            </button>
          </div>

          <div className="mt-toolbar__right">
            <div className="mt-search-box">
              <Search size={14} className="mt-search-icon" />
              <input
                type="text"
                className="mt-search-input"
                placeholder="Search plate or status…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mt-search-clear"
                  onClick={() => handleSearchChange('')}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="mt-btn-reset"
                onClick={handleResetFilters}
                title="Reset active filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Modern 100% Fit Table Card */}
        <div className="mt-card">
          <div className="mt-table-wrap">
            <DataTable
              columns={columns}
              rows={filteredVehicles}
              rowKey={(v) => v.vehicleId}
              loading={isLoading}
              onRowClick={(v) => openVehicle(v.vehicleId)}
              emptyTitle="No vehicles match the active criteria"
              emptyHint={hasActiveFilters ? 'Try adjusting your search or tab filters.' : null}
            />
          </div>

          {/* Clean Pagination Footer */}
          {!isLoading && pagination.total > 0 && (
            <div className="mt-pagination">
              <div className="mt-pagination__info">
                Showing{' '}
                <span className="mt-mono font-bold">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                –
                <span className="mt-mono font-bold">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="mt-mono font-bold">{pagination.total}</span> vehicles
              </div>

              <div className="mt-pagination__controls">
                <button
                  type="button"
                  className="mt-pagination__btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span className="mt-pagination__page-indicator mt-mono">
                  {pagination.page} / {Math.max(1, totalPages)}
                </span>

                <button
                  type="button"
                  className="mt-pagination__btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default MileageTrackingPage;
