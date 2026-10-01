import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Minus,
  Gauge,
  Fuel,
  IndianRupee,
  Search,
  X,
  MapPin,
  Navigation,
} from 'lucide-react';
import { formatDateIST } from '../../utils/dateUtils';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';

const PAGE_SIZE = 10;

const AlertCell = ({ interval }) => {
  const fe = interval.fleetEdge || {};
  const isFlagged = fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
  const reasons = fe.flagReasons || [];

  if (interval.status === 'ONGOING' || fe.status === 'PENDING') {
    return (
      <span className="mt-status-badge mt-status-badge--warning">
        <Clock size={11} /> Pending GPS
      </span>
    );
  }
  if (fe.status === 'FAILED' || fe.status === 'NO_DATA') {
    return (
      <span className="mt-status-badge mt-status-badge--neutral">
        <Minus size={11} /> No GPS
      </span>
    );
  }
  if (isFlagged && reasons.length > 0) {
    return (
      <span className="mt-status-badge mt-status-badge--danger" title={reasons.join('\n')}>
        <AlertTriangle size={11} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }
  if (fe.status === 'COMPUTED') {
    return (
      <span className="mt-status-badge mt-status-badge--success">
        <CheckCircle2 size={11} /> Validated
      </span>
    );
  }
  return <span className="mt-status-badge mt-status-badge--neutral">—</span>;
};

const getIntervalSource = (r) => {
  if (!r) return null;
  const s =
    r.routeSource?.name ||
    r.routeSource?.city ||
    (typeof r.routeSource === 'string' ? r.routeSource : null) ||
    r.source?.name ||
    r.source?.city ||
    (typeof r.source === 'string' ? r.source : null) ||
    r.startFuelLogId?.routeSource?.name ||
    r.startFuelLogId?.routeSource?.city ||
    (typeof r.startFuelLogId?.routeSource === 'string' ? r.startFuelLogId.routeSource : null) ||
    r.endFuelLogId?.routeSource?.name ||
    r.endFuelLogId?.routeSource?.city ||
    (typeof r.endFuelLogId?.routeSource === 'string' ? r.endFuelLogId.routeSource : null) ||
    r.tripId?.routeSource?.name ||
    (typeof r.tripId?.routeSource === 'string' ? r.tripId.routeSource : null) ||
    r.trip?.routeSource?.name ||
    (typeof r.trip?.routeSource === 'string' ? r.trip.routeSource : null);
  return s ? String(s).trim() : null;
};

const getIntervalDestination = (r) => {
  if (!r) return null;
  const d =
    r.routeDestination?.name ||
    r.routeDestination?.city ||
    (typeof r.routeDestination === 'string' ? r.routeDestination : null) ||
    r.destination?.name ||
    r.destination?.city ||
    (typeof r.destination === 'string' ? r.destination : null) ||
    r.endFuelLogId?.routeDestination?.name ||
    r.endFuelLogId?.routeDestination?.city ||
    (typeof r.endFuelLogId?.routeDestination === 'string'
      ? r.endFuelLogId.routeDestination
      : null) ||
    r.startFuelLogId?.routeDestination?.name ||
    r.startFuelLogId?.routeDestination?.city ||
    (typeof r.startFuelLogId?.routeDestination === 'string'
      ? r.startFuelLogId.routeDestination
      : null) ||
    r.tripId?.routeDestination?.name ||
    (typeof r.tripId?.routeDestination === 'string' ? r.tripId.routeDestination : null) ||
    r.trip?.routeDestination?.name ||
    (typeof r.trip?.routeDestination === 'string' ? r.trip.routeDestination : null);
  return d ? String(d).trim() : null;
};

const formatIntervalRoute = (r) => {
  const src = getIntervalSource(r);
  const dest = getIntervalDestination(r);

  if (src && dest) return `${src} → ${dest}`;
  if (src) return `${src} → —`;
  if (dest) return `— → ${dest}`;

  // Never fall back to pump location!
  return '—';
};

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
      apiClient.get('/api/mileage/intervals', {
        params: { page: pagination.page, limit: pagination.limit, vehicleId },
        signal,
      }),
    [JSON.stringify({ page: pagination.page, vehicleId })],
  );

  useEffect(() => {
    if (intervalsResponse) {
      const data = intervalsResponse.data?.data || [];
      setIntervals(data);
      if (data.length > 0 && !vehicleInfo) {
        setVehicleInfo(data[0].vehicleId);
      }
      const total =
        intervalsResponse.data?.pagination?.total ??
        intervalsResponse.data?.total ??
        intervalsResponse.data?.meta?.total ??
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
  const columns = useMemo(
    () => [
      {
        key: 'startDate',
        label: 'Date',
        width: '10%',
        render: (r) => (
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            {formatDateIST(r.startDate)}
          </span>
        ),
      },
      {
        key: 'route',
        label: 'Source → Destination',
        width: '18%',
        render: (r) => {
          const src = getIntervalSource(r);
          const dest = getIntervalDestination(r);
          const hasRoute = Boolean(src || dest);
          if (hasRoute) {
            return (
              <div className="mt-route-cell" title={`${src || '—'} → ${dest || '—'}`}>
                <span className="mt-route-pill">
                  <span className="mt-route-src">{src || '—'}</span>
                  <span className="mt-route-arrow">→</span>
                  <span className="mt-route-dest">{dest || '—'}</span>
                </span>
              </div>
            );
          }
          return <span className="text-slate-400 text-sm">—</span>;
        },
      },
      {
        key: 'odometerRange',
        label: 'Odometer Window',
        width: '16%',
        align: 'center',
        render: (r) => (
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            {r.startOdometer != null ? Number(r.startOdometer).toLocaleString() : '—'}
            {' → '}
            {r.endOdometer != null ? Number(r.endOdometer).toLocaleString() : '...'}
          </span>
        ),
      },
      {
        key: 'distanceKm',
        label: 'Distance',
        width: '11%',
        align: 'center',
        render: (r) => (
          <span className="font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
            {r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : '—'}
          </span>
        ),
      },
      {
        key: 'fuelConsumedLiters',
        label: 'Fuel Billed',
        width: '11%',
        align: 'center',
        render: (r) => (
          <span className="font-medium text-slate-700 dark:text-slate-300 text-[13.5px]">
            {r.fuelConsumedLiters != null ? `${r.fuelConsumedLiters.toFixed(2)} L` : '—'}
          </span>
        ),
      },
      {
        key: 'mileageKmPerL',
        label: 'Mileage',
        width: '12%',
        align: 'center',
        render: (r) =>
          r.mileageKmPerL != null ? (
            <div className="mt-mileage-pill">
              <span>{r.mileageKmPerL.toFixed(2)}</span>
              <span className="mt-unit">km/L</span>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">—</span>
          ),
      },
      {
        key: 'fuelCost',
        label: 'Fuel Cost',
        width: '12%',
        align: 'center',
        render: (r) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13.5px]">
            {r.fuelCost != null
              ? `₹${r.fuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : '—'}
          </span>
        ),
      },
      {
        key: 'alert',
        label: 'Telematics Status',
        width: '14%',
        align: 'center',
        render: (r) => <AlertCell interval={r} />,
      },
      {
        key: '_nav',
        label: 'Action',
        width: '10%',
        align: 'center',
        render: (r) => (
          <button
            type="button"
            className="mt-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/mileage-tracking/${r._id}`);
            }}
            title="Audit interval telemetry & fuel slips"
          >
            <span>Audit</span>
            <ChevronRight size={13} />
          </button>
        ),
      },
    ],
    [navigate],
  );

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
              className="pshell-btn pshell-btn--primary"
              onClick={() => navigate('/mileage-tracking/new')}
              title="Record a fuel entry for this vehicle"
            >
              <Plus size={14} />
              <span>Log Fuel</span>
            </button>
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
        <div className="mt-kpi-strip">
          {/* Average Mileage */}
          <div
            className={`mt-kpi-card ${statusTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('all')}
            title="Click to view all intervals"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Vehicle Avg Mileage</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--blue">
                <Gauge size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">
              <span>{stats.avg}</span>
              {stats.avg !== '—' && <span className="mt-kpi-card__unit">km/L</span>}
            </div>
            <div className="mt-kpi-card__sub">Across {pagination.total} intervals</div>
          </div>

          {/* Total Distance */}
          <div className="mt-kpi-card">
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Tracked Distance</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--purple">
                <MapPin size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">
              <span>{stats.totalDist.toFixed(1)}</span>
              <span className="mt-kpi-card__unit">km</span>
            </div>
            <div className="mt-kpi-card__sub">On active page</div>
          </div>

          {/* Total Fuel */}
          <div className="mt-kpi-card">
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Total Billed Fuel</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--green">
                <Fuel size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">
              <span>{stats.totalFuel.toFixed(1)}</span>
              <span className="mt-kpi-card__unit">L</span>
            </div>
            <div className="mt-kpi-card__sub">On active page</div>
          </div>

          {/* Flagged Anomalies */}
          <div
            className={`mt-kpi-card ${statusTab === 'flagged' ? 'is-active' : ''}`}
            onClick={() => setStatusTab((t) => (t === 'flagged' ? 'all' : 'flagged'))}
            title="Filter flagged anomaly intervals"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Flagged Anomalies</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--red">
                <AlertTriangle size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">{stats.flaggedCount}</div>
            <div className="mt-kpi-card__sub">Telematics divergence</div>
          </div>

          {/* Pending GPS */}
          <div
            className={`mt-kpi-card ${statusTab === 'pending' ? 'is-active' : ''}`}
            onClick={() => setStatusTab((t) => (t === 'pending' ? 'all' : 'pending'))}
            title="Filter pending intervals"
          >
            <div className="mt-kpi-card__top">
              <span className="mt-kpi-card__label">Pending Sync</span>
              <span className="mt-kpi-card__icon mt-kpi-card__icon--amber">
                <Clock size={14} />
              </span>
            </div>
            <div className="mt-kpi-card__val">{stats.pendingCount}</div>
            <div className="mt-kpi-card__sub">Awaiting full tank / GPS</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-toolbar">
          <div className="mt-tabs">
            <button
              type="button"
              className={`mt-tab ${statusTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('all')}
            >
              <span>All Intervals</span>
              <span className="mt-tab-count">{intervals.length}</span>
            </button>
            <button
              type="button"
              className={`mt-tab ${statusTab === 'flagged' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('flagged')}
            >
              <span>Flagged</span>
              <span className="mt-tab-count">{stats.flaggedCount}</span>
            </button>
            <button
              type="button"
              className={`mt-tab ${statusTab === 'clean' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('clean')}
            >
              <span>Validated OK</span>
              <span className="mt-tab-count">{stats.cleanCount}</span>
            </button>
            <button
              type="button"
              className={`mt-tab ${statusTab === 'pending' ? 'is-active' : ''}`}
              onClick={() => setStatusTab('pending')}
            >
              <span>Pending</span>
              <span className="mt-tab-count">{stats.pendingCount}</span>
            </button>
          </div>

          <div className="mt-toolbar__right">
            <div className="mt-search-box">
              <Search size={14} className="mt-search-icon" />
              <input
                type="text"
                className="mt-search-input"
                placeholder="Search route or status…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mt-search-clear"
                  onClick={() => setSearchQuery('')}
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
