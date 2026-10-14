import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { formatDateIST } from '../../utils/dateUtils';
import '../PageStyles.css';
import './MileageTracking.css';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { MileageTrackingService } from './MileageTrackingService';
import {
  getIntervalSource,
  getIntervalDestination,
  formatIntervalRoute,
} from './vehicleDetail/intervalRoute';
import useIntervalColumns from './vehicleDetail/useIntervalColumns';
import VehicleKpiStrip from './vehicleDetail/VehicleKpiStrip';
import IntervalToolbar from './vehicleDetail/IntervalToolbar';

const PAGE_SIZE = 10;

const MileageTrackingVehicleDetail = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const [intervals, setIntervals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all');

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const {
    data: intervalsResponse,
    loading: isLoading,
    error: intervalsError,
    refetch,
  } = useApi(
    (signal) =>
      MileageTrackingService.listIntervals(
        { page: pagination.page, limit: pagination.limit, vehicleId },
        { signal },
      ),
    [JSON.stringify({ page: pagination.page, vehicleId })],
  );

  useEffect(() => {
    if (intervalsResponse) {
      const data = intervalsResponse.data || [];
      setIntervals(data);
      if (data.length > 0 && !vehicleInfo) {
        setVehicleInfo(data[0].vehicleId);
      }
      const total =
        intervalsResponse.pagination?.total ??
        intervalsResponse.total ??
        intervalsResponse.meta?.total ??
        0;
      setPagination((p) => ({ ...p, total }));
    }
  }, [intervalsResponse, vehicleInfo]);

  useEffect(() => {
    if (intervalsError) toast.error('Failed to load mileage records');
  }, [intervalsError]);

  const regNumber = vehicleInfo?.registrationNumber || vehicleInfo?.vehicleNumber || 'Vehicle Logs';

  // Compute stats across loaded intervals
  const stats = useMemo(() => {
    const withMileage = intervals.filter((i) => i.mileageKmPerL != null && i.mileageKmPerL > 0);
    const avg =
      withMileage.length > 0
        ? (withMileage.reduce((acc, i) => acc + i.mileageKmPerL, 0) / withMileage.length).toFixed(2)
        : '—';
    const totalDist = intervals.reduce((acc, i) => acc + (i.distanceKm || 0), 0);
    const totalFuel = intervals.reduce((acc, i) => acc + (i.fuelConsumedLiters || 0), 0);
    const flaggedCount = intervals.filter((i) => {
      const fe = i.fleetEdge || {};
      return fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
    }).length;
    const cleanCount = intervals.filter(
      (i) =>
        i.fleetEdge?.status === 'COMPUTED' &&
        !i.fleetEdge?.isFlaggedFuel &&
        !i.fleetEdge?.isFlaggedDistance &&
        !i.fleetEdge?.isFlaggedMileage,
    ).length;
    const pendingCount = intervals.filter(
      (i) => i.status === 'ONGOING' || i.fleetEdge?.status === 'PENDING',
    ).length;

    return { avg, totalDist, totalFuel, flaggedCount, cleanCount, pendingCount };
  }, [intervals]);

  // Client search & filter
  const filteredIntervals = useMemo(() => {
    let result = intervals;

    // Filter by tab
    if (statusTab === 'flagged') {
      result = result.filter((i) => {
        const fe = i.fleetEdge || {};
        return fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
      });
    } else if (statusTab === 'clean') {
      result = result.filter(
        (i) =>
          i.fleetEdge?.status === 'COMPUTED' &&
          !i.fleetEdge?.isFlaggedFuel &&
          !i.fleetEdge?.isFlaggedDistance &&
          !i.fleetEdge?.isFlaggedMileage,
      );
    } else if (statusTab === 'pending') {
      result = result.filter((i) => i.status === 'ONGOING' || i.fleetEdge?.status === 'PENDING');
    }

    // Filter by search query
    const needle = searchQuery.trim().toLowerCase();
    if (needle) {
      result = result.filter((i) => {
        const routeText = formatIntervalRoute(i);
        const src = getIntervalSource(i);
        const dest = getIntervalDestination(i);
        const text = [routeText, src, dest, i.status, i.fleetEdge?.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(needle);
      });
    }

    return result;
  }, [intervals, statusTab, searchQuery]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((p) => ({ ...p, page }));
    }
  };

  // Export configuration for Excel (.xlsx) and CSV (.csv)
  const exportColumns = useMemo(
    () => [
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'route', label: 'Route (Source → Destination)', type: 'text' },
      { key: 'startOdo', label: 'Start Odometer (km)', type: 'number' },
      { key: 'endOdo', label: 'End Odometer (km)', type: 'number' },
      { key: 'distanceKm', label: 'Distance (km)', type: 'number' },
      { key: 'fuelLiters', label: 'Fuel Consumed (L)', type: 'number' },
      { key: 'mileageKmPerL', label: 'Mileage (km/L)', type: 'number' },
      { key: 'fuelCost', label: 'Fuel Cost (₹)', type: 'currency' },
      { key: 'gpsDistanceKm', label: 'GPS Distance (km)', type: 'number' },
      { key: 'gpsFuelL', label: 'GPS Fuel (L)', type: 'number' },
      { key: 'status', label: 'Telematics Status', type: 'text' },
    ],
    [],
  );

  const exportRows = useMemo(
    () =>
      intervals.map((r) => ({
        date: formatDateIST(r.startDate),
        source: getIntervalSource(r) || '',
        destination: getIntervalDestination(r) || '',
        route: formatIntervalRoute(r),
        startOdo: r.startOdometer != null ? Number(r.startOdometer) : null,
        endOdo: r.endOdometer != null ? Number(r.endOdometer) : null,
        distanceKm: r.distanceKm != null ? Number(r.distanceKm.toFixed(1)) : null,
        fuelLiters: r.fuelConsumedLiters != null ? Number(r.fuelConsumedLiters.toFixed(2)) : null,
        mileageKmPerL: r.mileageKmPerL != null ? Number(r.mileageKmPerL.toFixed(2)) : null,
        fuelCost: r.fuelCost != null ? Number(r.fuelCost) : null,
        gpsDistanceKm: r.fleetEdge?.distanceKm != null ? Number(r.fleetEdge.distanceKm) : null,
        gpsFuelL: r.fleetEdge?.fuelConsumedL != null ? Number(r.fleetEdge.fuelConsumedL) : null,
        status: r.fleetEdge?.status || r.status || 'PENDING',
      })),
    [intervals],
  );

  // Table columns definition
  const columns = useIntervalColumns(navigate);

  const hasActiveFilters = searchQuery.trim() !== '' || statusTab !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusTab('all');
  };

  return (
    <div className="mt-page-wrapper">
      <PageShell
        title={
          <div className="mt-breadcrumb">
            <button
              type="button"
              className="mt-breadcrumb__btn"
              onClick={() => navigate('/mileage-tracking')}
              title="Return to fleet overview"
            >
              <ChevronLeft size={16} />
              <span>Fleet Overview</span>
            </button>
            <span className="mt-breadcrumb__sep">/</span>
            <span className="mt-plate-badge mt-mono">{regNumber}</span>
          </div>
        }
        count={pagination.total}
        subtitle="Intervals audit log, fuel slip reconciliation and GPS validation"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="pshell-btn"
              onClick={() => refetch?.()}
              title="Refresh vehicle intervals"
              disabled={isLoading}
            >
              <RotateCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <ExportButton
              rows={exportRows}
              columns={exportColumns}
              filename={`mileage-${regNumber}-${new Date().toISOString().slice(0, 10)}`}
              disabled={isLoading || intervals.length === 0}
              buttonClass="pshell-btn"
            />
          </div>
        }
      >
        {/* Vehicle KPI Strip */}
        <VehicleKpiStrip
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          stats={stats}
          pagination={pagination}
        />

        {/* Toolbar */}
        <IntervalToolbar
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          intervals={intervals}
          stats={stats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          hasActiveFilters={hasActiveFilters}
          handleResetFilters={handleResetFilters}
        />

        {/* Table Card (100% Fit) */}
        <div className="mt-card">
          <div className="mt-table-wrap">
            <DataTable
              columns={columns}
              rows={filteredIntervals}
              rowKey={(r) => r._id}
              loading={isLoading}
              onRowClick={(r) => navigate(`/mileage-tracking/${r._id}`)}
              emptyTitle="No mileage records found"
              emptyHint={hasActiveFilters ? 'Try adjusting your search or filter criteria.' : null}
            />
          </div>

          {/* Pagination Footer */}
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
                of <span className="mt-mono font-bold">{pagination.total}</span> intervals
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

export default MileageTrackingVehicleDetail;
