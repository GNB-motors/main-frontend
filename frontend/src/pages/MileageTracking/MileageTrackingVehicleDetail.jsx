import { formatDateIST } from '../../utils/dateUtils';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronRight, Plus, ChevronLeft, AlertTriangle, CheckCircle2, Clock, Minus } from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { activeFilterCount, footerSummary } from '../../lib/tableState';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';

const PAGE_SIZE = 10;

const AlertCell = ({ interval }) => {
  const fe = interval.fleetEdge || {};
  const isFlagged = fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
  const reasons = fe.flagReasons || [];

  if (interval.status === 'ONGOING' || fe.status === 'PENDING') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C56200', fontSize: 12, fontWeight: 500 }}>
        <Clock size={13} /> Pending
      </span>
    );
  }
  if (fe.status === 'FAILED' || fe.status === 'NO_DATA') {
    return (
      <span style={{ color: '#9ca3af', fontSize: 12 }}>No GPS</span>
    );
  }
  if (isFlagged && reasons.length > 0) {
    return (
      <span
        title={reasons.join('\n')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b91c1c', fontSize: 12, fontWeight: 500, cursor: 'help' }}
      >
        <AlertTriangle size={13} /> {reasons.length > 1 ? `${reasons.length} flags` : 'Flagged'}
      </span>
    );
  }
  if (fe.status === 'COMPUTED') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#187A32', fontSize: 12, fontWeight: 500 }}>
        <CheckCircle2 size={13} /> OK
      </span>
    );
  }
  return <span style={{ color: '#9ca3af' }}><Minus size={13} /></span>;
};

/** Plain-text summary of the alert cell, used for search and export. */
const alertText = (interval) => {
  const fe = interval.fleetEdge || {};
  const isFlagged = fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;
  const reasons = fe.flagReasons || [];
  if (interval.status === 'ONGOING' || fe.status === 'PENDING') return 'Pending';
  if (fe.status === 'FAILED' || fe.status === 'NO_DATA') return 'No GPS';
  if (isFlagged && reasons.length > 0) return `${reasons.length} flag${reasons.length > 1 ? 's' : ''}`;
  if (fe.status === 'COMPUTED') return 'OK';
  return '';
};

// Column defs shared by the table and the export. The backend /mileage/intervals
// schema accepts only page/limit/vehicleId/driverId — no q — so the search is
// client-side over the loaded page and the export covers exactly those rows.
const intervalColumns = [
  { key: 'startDate', label: 'Date', type: 'date', render: (r) => formatDateIST(r.startDate) },
  { key: 'pumpName', label: 'Pump Location', render: (r) => r.pumpName || '—' },
  { key: 'sourceName', label: 'Source', render: (r) => r.sourceName || '—' },
  { key: 'destName', label: 'Destination', render: (r) => r.destName || '—' },
  {
    key: 'startOdometer', label: 'Start Odo', align: 'right', type: 'number',
    render: (r) => (r.startOdometer != null ? r.startOdometer.toLocaleString() : '—'),
  },
  {
    key: 'endOdometer', label: 'End Odo', align: 'right', type: 'number',
    render: (r) => (r.endOdometer != null ? r.endOdometer.toLocaleString() : '...'),
  },
  {
    key: 'distanceKm', label: 'Distance', align: 'right', type: 'number',
    render: (r) => (r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : '—'),
  },
  {
    key: 'fuelConsumedLiters', label: 'Fuel (L)', align: 'right', type: 'number',
    render: (r) => (r.fuelConsumedLiters != null ? r.fuelConsumedLiters.toFixed(2) : '—'),
  },
  {
    key: 'mileageKmPerL', label: 'Mileage (km/L)', align: 'right', type: 'number',
    render: (r) => (r.mileageKmPerL != null
      ? <span style={{ color: '#2563eb', fontWeight: 600 }}>{r.mileageKmPerL.toFixed(2)}</span>
      : '—'),
  },
  {
    key: 'defConsumed', label: 'DEF', align: 'right', type: 'number',
    render: (r) => (r.defConsumed != null ? `${r.defConsumed.toFixed(1)} L` : '—'),
  },
  {
    key: 'fuelCost', label: 'Cost (₹)', align: 'right', type: 'currency',
    render: (r) => (r.fuelCost != null
      ? <span style={{ fontWeight: 600 }}>₹{r.fuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
      : '—'),
  },
  { key: 'alert', label: 'Alert', render: (r) => <AlertCell interval={r} /> },
];

// Display-only column appended inside the component (needs navigate); the
// export uses INTERVAL_COLUMNS, which stops before it.
const INTERVAL_COLUMNS = intervalColumns;

const MileageTrackingVehicleDetail = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const [intervals, setIntervals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  const { data: intervalsResponse, loading: isLoading, error: intervalsError, refetch } = useApi(
    (signal) => apiClient.get('/api/mileage/intervals', {
      params: { page: pagination.page, limit: pagination.limit, vehicleId },
      signal,
    }),
    [JSON.stringify({ page: pagination.page, vehicleId })]
  );

  useEffect(() => {
    if (intervalsResponse) {
      const data = intervalsResponse.data?.data || [];
      setIntervals(data);
      if (data.length > 0 && !vehicleInfo) {
        setVehicleInfo(data[0].vehicleId);
      }
      const total = intervalsResponse.data?.pagination?.total ?? intervalsResponse.data?.total ?? intervalsResponse.data?.meta?.total ?? 0;
      setPagination(p => ({ ...p, total }));
    }
  }, [intervalsResponse, vehicleInfo]);

  useEffect(() => {
    if (intervalsError) toast.error('Failed to load mileage records');
  }, [intervalsError]);

  // Client-side search over the loaded page — the intervals endpoint has no
  // text filter (its Joi schema would 400 on an unknown param), and the
  // interval set here belongs to a single vehicle.
  const flatIntervals = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const searchable = intervals.map((i) => ({
      ...i,
      sourceName: i.routeSource?.name || null,
      destName: i.routeDestination?.name || null,
      defConsumed: i.fleetEdge?.defConsumed ?? null,
      alert: alertText(i),
    }));
    if (!needle) return searchable;
    return searchable.filter((i) =>
      [i.pumpName, i.sourceName, i.destName, i.alert]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(needle))
    );
  }, [intervals, q]);

  const columns = useMemo(() => [
    ...intervalColumns,
    {
      key: '_nav', label: '',
      render: (r) => (
        <button
          className="view-details-btn"
          onClick={(e) => { e.stopPropagation(); navigate(`/mileage-tracking/${r._id}`); }}
        >
          <ChevronRight size={14} />
        </button>
      ),
    },
  ], [navigate]);

  const searching = q.trim() !== '';

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(p => ({ ...p, page }));
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pagination.page > 3) pages.push('...');
      for (let i = Math.max(2, pagination.page - 1); i <= Math.min(totalPages - 1, pagination.page + 1); i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }
      if (pagination.page < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="page-container mileage-listing-container">
      {/* Breadcrumb Header */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <button onClick={() => navigate('/mileage-tracking')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
          <ChevronLeft size={16} />
          <span style={{ marginLeft: 4 }}>Fleet Overview</span>
        </button>
        <ChevronRight size={14} color="#9ca3af" />
        <span style={{ fontWeight: 600, color: '#111827' }}>
          {vehicleInfo ? vehicleInfo.registrationNumber : 'Vehicle Logs'}
        </span>
      </div>

      {/* Content */}
      <div className="mileage-content-area" style={{ height: 'calc(100% - 60px)' }}>
        <PageShell
          className="mileage-detail-shell"
          title={vehicleInfo ? vehicleInfo.registrationNumber : 'Vehicle Logs'}
          subtitle="Mileage intervals for this vehicle"
          count={pagination.total}
          filters={(
            <FilterBar
              searchValue={q}
              onSearchChange={setQ}
              searchPlaceholder="Search pump, route or alert…"
              activeCount={activeFilterCount({ q })}
              onClear={() => setQ('')}
              right={(
                <ExportButton
                  rows={flatIntervals}
                  columns={INTERVAL_COLUMNS}
                  filename={`mileage-${vehicleInfo?.registrationNumber || vehicleId}`}
                  meta={{
                    filters: [
                      { label: 'Search', value: q.trim() || '—' },
                      { label: 'Scope', value: 'Current page of this vehicle’s intervals' },
                    ],
                    generatedAt: new Date(),
                  }}
                />
              )}
            />
          )}
          footer={`${footerSummary({ showing: flatIntervals.length, total: pagination.total, activeFilters: activeFilterCount({ q }) })}${pagination.total > pagination.limit ? ' · search covers the loaded page' : ''}`}
        >
          <DataTable
            columns={columns}
            rows={flatIntervals}
            rowKey={(r) => r._id}
            loading={isLoading && intervals.length === 0}
            error={intervalsError}
            onRetry={refetch}
            showing={flatIntervals.length}
            total={pagination.total}
            activeFilters={activeFilterCount({ q })}
            onRowClick={(r) => navigate(`/mileage-tracking/${r._id}`)}
            emptyTitle={searching ? 'No records match your search' : 'No mileage records found'}
            emptyHint={searching
              ? 'The search covers the records loaded on this page — try a different term or another page.'
              : 'Log a fuel entry to start tracking this vehicle’s mileage.'}
            emptyAction={searching ? null : (
              <button className="empty-action-btn" onClick={() => navigate('/mileage-tracking/new')}>
                <Plus size={16} /> Log Fuel
              </button>
            )}
          />
        </PageShell>
      </div>

      {/* Pagination Footer */}
      {pagination.total > 0 && (
      <div className="mileage-pagination-controls">
        <button
          className="mileage-pagination-btn"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1 || totalPages <= 1}
        >
          <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
        </button>

        {generatePageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <div key={`overflow-${index}`} className="mileage-page-overflow">
                <span>...</span>
              </div>
            );
          }
          return (
            <button
              key={page}
              className={`mileage-page-number ${pagination.page === page ? 'mileage-page-number-current' : ''}`}
              onClick={() => handlePageChange(page)}
              disabled={totalPages <= 1}
            >
              <span>{page}</span>
            </button>
          );
        })}

        <button
          className="mileage-pagination-btn"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === totalPages || totalPages <= 1}
        >
          <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </div>
      )}
    </div>
  );
};

export default MileageTrackingVehicleDetail;
