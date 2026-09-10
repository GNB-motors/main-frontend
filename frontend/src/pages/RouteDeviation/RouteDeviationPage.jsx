import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Route,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RouteDeviationService } from './RouteDeviationService.jsx';
import { formatINR, formatNum } from '../../utils/formatters';
import ExportButton from '../../components/ui/ExportButton';
import EmptyState from '../../components/cluster/EmptyState';
import './RouteDeviation.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_ZONE = 'Asia/Kolkata';
const LIMIT = 20;

const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);

const formatIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.format('DD MMM YYYY, hh:mm A') : '—';
};

const formatRelativeIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.fromNow() : null;
};

const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'tripId', label: 'Trip' },
  { key: 'maxOffKm', label: 'Max off-route (km)', type: 'number' },
  { key: 'extraKmEstimate', label: 'Extra km (est.)', type: 'number' },
  { key: 'estimatedExtraCostInr', label: 'Est. cost (INR)', type: 'currency' },
  { key: 'detectedAt', label: 'Detected', type: 'date' },
  { key: 'statusLabel', label: 'Status' },
];

export default function RouteDeviationPage() {
  // Filters
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'REVIEWED'

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
      setError(err.detail || err.message || 'Could not load route deviation events.');
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
      setError(err.detail || err.message || 'Could not mark the event reviewed.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleClearFilters = () => {
    setVehicleQuery('');
    setVehicle('');
    setInputFromDate('');
    setInputToDate('');
    setFromDate('');
    setToDate('');
    setStatusFilter('ALL');
  };

  // Client-side filtering by status
  const displayedEvents = useMemo(() => {
    if (statusFilter === 'OPEN') return events.filter((e) => e.status === 'OPEN');
    if (statusFilter === 'REVIEWED') return events.filter((e) => e.status === 'REVIEWED');
    return events;
  }, [events, statusFilter]);

  const pageCostInr = events.reduce((s, e) => s + (e.estimatedExtraCostInr || 0), 0);
  const reviewedCount = Math.max(0, total - openCount);
  const hasActiveFilters = Boolean(vehicle || fromDate || toDate || statusFilter !== 'ALL');

  const exportRows = displayedEvents.map((e) => ({
    ...e,
    statusLabel: e.status === 'OPEN' ? 'Please review' : 'Reviewed',
  }));

  return (
    <div className="pshell min-h-screen">
      {/* Header Row */}
      <header className="pshell-head mb-6">
        <div className="pshell-head-main">
          <div className="flex items-center gap-3">
            <h1 className="pshell-title text-2xl font-bold text-slate-900 tracking-tight">
              Route Deviation
            </h1>
            <span className="num inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-800">
              {formatNum(total)}
            </span>
          </div>
          <p className="pshell-subtitle text-sm text-slate-500 mt-1">
            Trips that left their designated corridor — cost figures are estimates, flags indicate
            review needed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="ov-btn"
            onClick={fetchData}
            disabled={isLoading}
            title="Refresh feed"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <ExportButton
            rows={exportRows}
            columns={EXPORT_COLUMNS}
            filename="route-deviation-events"
            disabled={!displayedEvents.length}
          />
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="font-semibold text-rose-700 hover:underline text-xs"
          >
            Try again
          </button>
        </div>
      )}

      {/* Operations KPI Metric Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Open / Review Needed */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Open — Please Review</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle size={14} />
            </span>
          </div>
          <span className="ov-kpi-value" style={{ color: openCount > 0 ? '#b45309' : undefined }}>
            {formatNum(openCount)}
          </span>
          <span className="ov-kpi-sub">trips pending triage</span>
        </div>

        {/* 2. Events in Window */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Events in Window</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <Route size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">{formatNum(total)}</span>
          <span className="ov-kpi-sub">corridor detours detected</span>
        </div>

        {/* 3. Reviewed */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Reviewed</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">{formatNum(reviewedCount)}</span>
          <span className="ov-kpi-sub">triaged & confirmed</span>
        </div>

        {/* 4. Est Detour Cost */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #f43f5e' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Est. Detour Cost</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <IndianRupee size={14} />
            </span>
          </div>
          <span className="ov-kpi-value" style={{ color: pageCostInr > 0 ? '#e11d48' : undefined }}>
            {formatINR(pageCostInr)}
          </span>
          <span className="ov-kpi-sub">estimated fuel & wear impact</span>
        </div>
      </div>

      {/* Unified Control Toolbar */}
      <div className="rd-toolbar">
        {/* Search Vehicle */}
        <div className="rd-search-box">
          <Search size={14} className="rd-search-icon" />
          <input
            type="search"
            value={vehicleQuery}
            onChange={(e) => {
              setVehicleQuery(e.target.value);
              setVehicle(e.target.value.trim());
            }}
            placeholder="Search vehicle number (e.g. WB25R9540)…"
            className="rd-search-input"
          />
        </div>

        {/* Date Range */}
        <div className="rd-date-group">
          <input
            type="date"
            value={inputFromDate}
            onChange={(e) => {
              setInputFromDate(e.target.value);
              setFromDate(e.target.value);
            }}
            className="rd-date-input"
            aria-label="From date"
          />
          <span className="text-slate-400 text-xs font-semibold">→</span>
          <input
            type="date"
            value={inputToDate}
            onChange={(e) => {
              setInputToDate(e.target.value);
              setToDate(e.target.value);
            }}
            className="rd-date-input"
            aria-label="To date"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="rd-filter-chips">
          <button
            type="button"
            className={`rd-chip ${statusFilter === 'ALL' ? 'rd-chip--active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>All Statuses</span>
            <span className="rd-chip-badge num">{total}</span>
          </button>
          <button
            type="button"
            className={`rd-chip ${statusFilter === 'OPEN' ? 'rd-chip--active' : ''}`}
            onClick={() => setStatusFilter('OPEN')}
          >
            <AlertTriangle
              size={12}
              className={statusFilter === 'OPEN' ? 'text-amber-300' : 'text-amber-500'}
            />
            <span>Please Review</span>
            <span className="rd-chip-badge num">{openCount}</span>
          </button>
          <button
            type="button"
            className={`rd-chip ${statusFilter === 'REVIEWED' ? 'rd-chip--active' : ''}`}
            onClick={() => setStatusFilter('REVIEWED')}
          >
            <CheckCircle2
              size={12}
              className={statusFilter === 'REVIEWED' ? 'text-emerald-300' : 'text-emerald-500'}
            />
            <span>Reviewed</span>
            <span className="rd-chip-badge num">{reviewedCount}</span>
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button type="button" className="rd-clear-btn" onClick={handleClearFilters}>
            <X size={13} />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {/* Main Table Panel */}
      <div className="rd-table-panel">
        <div className="rd-table-head">
          <div>
            <div className="rd-table-title">
              <Route size={16} className="text-blue-600" />
              <span>Corridor Deviation Feed</span>
              <span className="num text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {displayedEvents.length} shown
              </span>
            </div>
            <p className="rd-table-caption">
              Flagged trips that drifted beyond normal baseline corridors. Observe & triage.
            </p>
          </div>
        </div>

        {/* Content Body */}
        {isLoading && !events.length ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading route deviation feed…</span>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title={
                hasActiveFilters
                  ? 'No deviations match your filter'
                  : 'No route deviations in this window'
              }
              hint={
                hasActiveFilters
                  ? 'Try clearing the search query or adjusting the date range.'
                  : 'Vehicles are following their designated corridors, or no detour events were flagged in the last 30 days.'
              }
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="ov-btn mt-4 text-xs font-semibold"
                  >
                    Reset all filters
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Trip ID</th>
                  <th>Detected At</th>
                  <th style={{ textAlign: 'right' }}>Max Off Corridor</th>
                  <th style={{ textAlign: 'right' }}>Extra km (Est.)</th>
                  <th style={{ textAlign: 'right' }}>Est. Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedEvents.map((ev) => {
                  const isLargeDeviation = (ev.maxOffKm || 0) > 5;
                  const isBusy = reviewingId === ev._id;

                  return (
                    <tr key={ev._id}>
                      {/* Vehicle Number */}
                      <td>
                        <span className="reg-plate font-mono font-bold text-slate-900">
                          {ev.registrationNumber || '—'}
                        </span>
                      </td>

                      {/* Trip ID */}
                      <td>
                        <span
                          className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block"
                          title={ev.tripId}
                        >
                          {ev.tripId ? `…${String(ev.tripId).slice(-6)}` : '—'}
                        </span>
                      </td>

                      {/* Detected Timestamp */}
                      <td>
                        <div className="flex flex-col">
                          <span className="num font-mono text-xs text-slate-800 font-semibold">
                            {formatIST(ev.detectedAt)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatRelativeIST(ev.detectedAt)}
                          </span>
                        </div>
                      </td>

                      {/* Max Off-Route */}
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`num font-mono font-bold ${
                            isLargeDeviation ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {ev.maxOffKm != null ? `${ev.maxOffKm.toFixed(2)} km` : '—'}
                        </span>
                      </td>

                      {/* Extra km Estimate */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="num font-mono font-medium text-slate-700">
                          {ev.extraKmEstimate != null
                            ? `+${ev.extraKmEstimate.toFixed(1)} km`
                            : '—'}
                        </span>
                      </td>

                      {/* Estimated Cost */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="num font-mono font-bold text-rose-600">
                          {ev.estimatedExtraCostInr != null
                            ? formatINR(ev.estimatedExtraCostInr)
                            : '—'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        {ev.status === 'OPEN' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-amber-300 bg-amber-50 text-amber-800">
                            <AlertTriangle size={12} className="text-amber-600" />
                            <span>Please review</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border border-emerald-300 bg-emerald-50 text-emerald-800">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Reviewed</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }}>
                        {ev.status === 'OPEN' ? (
                          <button
                            type="button"
                            className="oa-ack-action"
                            disabled={isBusy}
                            onClick={() => handleReview(ev._id)}
                          >
                            {isBusy ? (
                              <>
                                <Loader2 size={12} className="animate-spin text-emerald-600" />
                                <span>Saving…</span>
                              </>
                            ) : (
                              <>
                                <Eye size={12} className="text-slate-600" />
                                <span>Mark reviewed</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span>Triage Done</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="rd-pagination">
            <div className="rd-page-info">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} deviation
              events
            </div>
            <div className="rd-page-controls">
              <button
                type="button"
                className="ov-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded border border-slate-200 font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="ov-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
