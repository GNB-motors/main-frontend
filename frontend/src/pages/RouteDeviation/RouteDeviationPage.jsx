import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RouteDeviationService } from './RouteDeviationService.jsx';
import { formatINR } from '../../utils/formatters';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_ZONE = 'Asia/Kolkata';
const LIMIT = 20;

const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);

const formatIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—';
};

const formatRelativeIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.fromNow() : null;
};

// Export columns — numbers stay numbers, the timestamp is a real date, so a
// file emailed off-screen still totals and sorts correctly.
const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'tripId', label: 'Trip' },
  { key: 'maxOffKm', label: 'Max off-route (km)', type: 'number' },
  { key: 'extraKmEstimate', label: 'Extra km (est.)', type: 'number' },
  { key: 'estimatedExtraCostInr', label: 'Est. cost (INR)', type: 'currency' },
  { key: 'detectedAt', label: 'Detected', type: 'date' },
  { key: 'statusLabel', label: 'Status' },
];

const KpiCard = ({ icon: Icon, label, value, sub, colorClass }) => (
  <div className={`fc-kpi-card fc-kpi-${colorClass}`}>
    <div className="fc-kpi-icon-wrap">{Icon ? <Icon size={20} /> : null}</div>
    <div className="fc-kpi-content">
      <span className="fc-kpi-label">{label}</span>
      <span className="fc-kpi-value">{value}</span>
      {sub && <span style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</span>}
    </div>
  </div>
);

const RouteDeviationPage = () => {
  // Filters
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Data
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (vehicle) params.vehicle = vehicle;
      if (fromDate) params.from = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
      if (toDate) params.to = dayjs.tz(toDate, IST_ZONE).endOf('day').utc().toISOString();
      const data = await RouteDeviationService.getEvents(params);
      setEvents(data.records || []);
      setTotal(data.total || 0);
      setOpenCount(data.openCount || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.detail || 'Could not load route deviation events.');
    } finally {
      setIsLoading(false);
    }
  }, [vehicle, fromDate, toDate, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setPage(1);
  }, [vehicle, fromDate, toDate]);

  const handleReview = async (id) => {
    setReviewingId(id);
    try {
      await RouteDeviationService.reviewEvent(id);
      await fetchData();
    } catch (err) {
      setError(err.detail || 'Could not mark the event reviewed.');
    } finally {
      setReviewingId(null);
    }
  };

  const pageCostInr = events.reduce((s, e) => s + (e.estimatedExtraCostInr || 0), 0);
  const activeFilterCount = [vehicle, fromDate, toDate].filter(Boolean).length;

  const exportRows = events.map((e) => ({
    ...e,
    statusLabel: e.status === 'OPEN' ? 'Please review' : 'Reviewed',
  }));

  const columns = [
    {
      key: 'registrationNumber',
      label: 'Vehicle',
      render: (ev) => <div className="fc-primary-text">{ev.registrationNumber || '—'}</div>,
    },
    {
      key: 'tripId',
      label: 'Trip',
      render: (ev) => (
        <div className="fc-secondary-text" title={ev.tripId}>
          {ev.tripId ? `…${String(ev.tripId).slice(-6)}` : '—'}
        </div>
      ),
    },
    {
      key: 'maxOffKm',
      label: 'Max off-route (km)',
      align: 'right',
      render: (ev) => <div className="fc-primary-text">{ev.maxOffKm ?? '—'}</div>,
    },
    {
      key: 'extraKmEstimate',
      label: 'Extra km (est.)',
      align: 'right',
      render: (ev) => <div className="fc-primary-text">{ev.extraKmEstimate ?? '—'}</div>,
    },
    {
      key: 'estimatedExtraCostInr',
      label: 'Est. cost (₹)',
      align: 'right',
      render: (ev) => (
        <div className="fc-primary-text">
          {ev.estimatedExtraCostInr != null ? formatINR(ev.estimatedExtraCostInr) : '—'}
        </div>
      ),
    },
    {
      key: 'detectedAt',
      label: 'Detected',
      render: (ev) => (
        <div className="fc-secondary-text" title={formatIST(ev.detectedAt)}>
          {formatRelativeIST(ev.detectedAt) || formatIST(ev.detectedAt)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (ev) =>
        ev.status === 'OPEN' ? (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            <AlertTriangle size={12} /> Please review
          </Badge>
        ) : (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            <CheckCircle2 size={12} /> Reviewed
          </Badge>
        ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (ev) =>
        ev.status === 'OPEN' ? (
          <button
            type="button"
            className="fc-btn fc-btn-primary"
            style={{ padding: '4px 10px', fontSize: 12 }}
            disabled={reviewingId === ev._id}
            onClick={() => handleReview(ev._id)}
          >
            {reviewingId === ev._id ? (
              <>
                <Loader2 size={13} className="fc-spin" /> Saving…
              </>
            ) : (
              <>
                <Eye size={13} /> Mark reviewed
              </>
            )}
          </button>
        ) : null,
    },
  ];

  return (
    <div className="fc-page">
      <PageShell
        title="Route Deviation"
        subtitle="Trips that left their usual corridor — costs are estimates, flags mean please review."
        count={total}
        actions={
          <ExportButton
            rows={exportRows}
            columns={EXPORT_COLUMNS}
            filename="route-deviation-events"
            disabled={!events.length}
          />
        }
        filters={
          <FilterBar
            searchValue={vehicleQuery}
            onSearchChange={(v) => {
              setVehicleQuery(v);
              setVehicle(v.trim());
            }}
            searchPlaceholder="Vehicle number (e.g. WB25R9540)…"
            from={inputFromDate}
            to={inputToDate}
            onRangeChange={(patch) => {
              if ('from' in patch) {
                setInputFromDate(patch.from);
                setFromDate(patch.from);
              }
              if ('to' in patch) {
                setInputToDate(patch.to);
                setToDate(patch.to);
              }
            }}
            activeCount={activeFilterCount}
            onClear={() => {
              setVehicleQuery('');
              setInputFromDate('');
              setInputToDate('');
              setVehicle('');
              setFromDate('');
              setToDate('');
            }}
          />
        }
        footer={
          totalPages > 1
            ? `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total} events`
            : null
        }
      >
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="fc-metrics-row" style={{ marginBottom: 16 }}>
          <KpiCard
            icon={AlertTriangle}
            label="Open — please review"
            value={openCount}
            colorClass="warning"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Events in window"
            value={total}
            colorClass="pending"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Reviewed"
            value={Math.max(0, total - openCount)}
            colorClass="success"
          />
          <KpiCard
            icon={Eye}
            label="Est. detour cost (page)"
            value={formatINR(pageCostInr)}
            sub="estimate"
            colorClass="nodata"
          />
        </div>

        <DataTable
          columns={columns}
          rows={events}
          rowKey={(ev) => ev._id}
          loading={isLoading}
          showing={events.length}
          total={total}
          activeFilters={activeFilterCount}
          emptyTitle="No route deviations in this window"
          emptyHint="Widen the date range or clear the vehicle filter."
        />

        {totalPages > 1 && (
          <div className="fc-pagination" style={{ marginTop: 12 }}>
            <div className="fc-page-controls">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
};

export default RouteDeviationPage;
