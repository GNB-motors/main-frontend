import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Fuel,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import PageShell from '../../components/ui/PageShell';
import ExportButton from '../../components/ui/ExportButton';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { getUserRole } from '../../utils/session.js';
import { getThemeCSS } from '../../utils/colorTheme.js';
import ComparisonTable from './ComparisonTable.jsx';
import FuelComparisonDrawer from './FuelComparisonDrawer.jsx';
import ReviewModal from './ReviewModal.jsx';
import { IST_ZONE, toIST, fmtDuration, fmtLitres } from './formatIST.js';
import './FuelComparison.css';

const LIMIT = 20;

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'review', label: 'Needs Review' },
  { key: 'clean', label: 'Verified Clean' },
];

const DATE_PRESETS = [
  { key: 'ALL', label: 'All Dates' },
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: '7DAYS', label: 'Last 7 Days' },
  { key: '30DAYS', label: 'Last 30 Days' },
  { key: 'CUSTOM', label: 'Custom Range' },
];

const VARIANCE_OPTIONS = [
  { key: 'ALL', label: 'All Variances' },
  { key: 'OVERBILLED', label: '⚠️ Flagged Overbilling' },
  { key: 'CLEAN', label: '✓ Within Tolerance' },
  { key: 'NO_DATA', label: '⚪ No Telematics' },
];

const FuelComparisonPage = () => {
  const role = getUserRole();
  const themeColors = useMemo(() => getThemeCSS(role), [role]);

  // Tab State
  const [activeTab, setActiveTab] = useState('all');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('ALL');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');
  const [varianceFilter, setVarianceFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Data
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Slideover & Modal States
  const [activeDrawerTask, setActiveDrawerTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);

  // Compute Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeTab !== 'all') count += 1;
    if (searchQuery.trim()) count += 1;
    if (datePreset !== 'ALL') count += 1;
    if (varianceFilter !== 'ALL') count += 1;
    return count;
  }, [activeTab, searchQuery, datePreset, varianceFilter]);

  // Handle Preset Changes
  const handlePresetChange = (presetKey) => {
    setDatePreset(presetKey);
    setPage(1);

    const now = dayjs().tz(IST_ZONE);
    if (presetKey === 'ALL') {
      setInputFromDate('');
      setInputToDate('');
    } else if (presetKey === 'TODAY') {
      setInputFromDate(now.startOf('day').toISOString());
      setInputToDate(now.endOf('day').toISOString());
    } else if (presetKey === 'YESTERDAY') {
      const y = now.subtract(1, 'day');
      setInputFromDate(y.startOf('day').toISOString());
      setInputToDate(y.endOf('day').toISOString());
    } else if (presetKey === '7DAYS') {
      setInputFromDate(now.subtract(6, 'day').startOf('day').toISOString());
      setInputToDate(now.endOf('day').toISOString());
    } else if (presetKey === '30DAYS') {
      setInputFromDate(now.subtract(29, 'day').startOf('day').toISOString());
      setInputToDate(now.endOf('day').toISOString());
    }
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
    setDatePreset('ALL');
    setInputFromDate('');
    setInputToDate('');
    setVarianceFilter('ALL');
    setPage(1);
  };

  // Fetch Summary Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await ReportsService.getExtensionStatus();
      if (res && res.success !== false) {
        setStatus(res);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Fetch Comparison Records
  const fetchComparisons = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
      };

      if (activeTab === 'flagged') {
        params.flaggedOnly = 'true';
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (inputFromDate) {
        params.fromDate = inputFromDate;
      }
      if (inputToDate) {
        params.toDate = inputToDate;
      }

      let fetchedTasks = [];
      let totalCount = 0;
      let calculatedPages = 1;

      if (activeTab === 'review') {
        const res = await ReportsService.getPendingReviewTasks({ page, limit: LIMIT });
        if (res) {
          fetchedTasks = res.records || res.tasks || [];
          totalCount = res.total ?? fetchedTasks.length;
          calculatedPages = res.totalPages ?? (Math.ceil(totalCount / LIMIT) || 1);
        }
      } else {
        const res = await ReportsService.getExtensionComparisons(params);
        if (res) {
          fetchedTasks = res.records || res.tasks || [];
          totalCount = res.total ?? 0;
          calculatedPages = res.totalPages ?? 1;
        }
      }

      // Client-side refinements
      let filtered = fetchedTasks;
      if (activeTab === 'clean') {
        filtered = filtered.filter(
          (t) =>
            !t.isFlagged &&
            t.status !== 'NO_DATA' &&
            t.status !== 'PENDING_REVIEW' &&
            !t.needsAction,
        );
      }

      if (varianceFilter === 'OVERBILLED') {
        filtered = filtered.filter((t) => (t.variance ?? 0) < 0 || t.isFlagged);
      } else if (varianceFilter === 'CLEAN') {
        filtered = filtered.filter((t) => Math.abs(t.variance ?? 0) <= 5 && !t.isFlagged);
      } else if (varianceFilter === 'NO_DATA') {
        filtered = filtered.filter((t) => t.status === 'NO_DATA');
      }

      setRecords(filtered);
      setTotal(totalCount);
      setTotalPages(calculatedPages);
    } catch (err) {
      console.error('Error fetching comparisons:', err);
      toast.error('Failed to load fuel comparisons');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, searchQuery, inputFromDate, inputToDate, varianceFilter]);

  // Initial and reactive data loads
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  // Sync Live Pipeline
  const handleSyncPipeline = async () => {
    setIsSyncing(true);
    try {
      const res = await ReportsService.triggerPullNow();
      if (res && res.success !== false) {
        toast.success(res.message || 'Telematics audit sync triggered. Updating intervals…');
      } else {
        toast.info('Telematics sync initiated');
      }
      setTimeout(() => {
        fetchStatus();
        fetchComparisons();
      }, 1200);
    } catch {
      toast.error('Failed to initiate telematics sync');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export configuration for Excel (.xlsx) and CSV (.csv)
  const exportColumns = useMemo(
    () => [
      { key: 'taskId', label: 'Task ID', type: 'text' },
      { key: 'vehicle', label: 'Vehicle Registration', type: 'text' },
      { key: 'driver', label: 'Driver Name', type: 'text' },
      { key: 'fromDate', label: 'From Date (IST)', type: 'text' },
      { key: 'toDate', label: 'To Date (IST)', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'billedFuel', label: 'Billed Fuel (L)', type: 'number' },
      { key: 'telematicsFuel', label: 'Telematics Fuel (L)', type: 'number' },
      { key: 'varianceL', label: 'Variance (L)', type: 'number' },
      { key: 'variancePct', label: 'Variance (%)', type: 'number' },
      { key: 'auditStatus', label: 'Audit Status', type: 'text' },
      { key: 'flagReason', label: 'Flag Reason', type: 'text' },
      { key: 'odoStatus', label: 'Odometer Status', type: 'text' },
      { key: 'distanceKm', label: 'Distance (km)', type: 'number' },
      { key: 'minOdo', label: 'Min Odometer', type: 'number' },
      { key: 'maxOdo', label: 'Max Odometer', type: 'number' },
      { key: 'mileage', label: 'Mileage (km/L)', type: 'number' },
      { key: 'defConsumed', label: 'DEF Consumed (L)', type: 'number' },
    ],
    [],
  );

  const exportRows = useMemo(
    () =>
      records.map((r) => {
        const driverName = r.driverId
          ? `${r.driverId.firstName || ''} ${r.driverId.lastName || ''}`.trim()
          : '';
        const fromStr = r.fromDate ? toIST(r.fromDate)?.format('YYYY-MM-DD HH:mm') || '' : '';
        const toStr = r.toDate ? toIST(r.toDate)?.format('YYYY-MM-DD HH:mm') || '' : '';
        const durStr = fmtDuration(r.fromDate, r.toDate) || '';
        const varL = r.variance != null ? -r.variance : null;
        const varPct = r.variancePercent != null ? -r.variancePercent : null;
        const auditStatus = r.isFlagged
          ? 'FLAGGED'
          : r.status === 'PENDING_REVIEW'
            ? 'PENDING_REVIEW'
            : r.status === 'NO_DATA'
              ? 'NO_DATA'
              : 'MATCHED';
        const odoStatus = r.isOdometerFlagged
          ? 'MISMATCH'
          : r.status === 'PENDING_REVIEW'
            ? 'REVIEW_NEEDED'
            : r.ocrOdometerReading != null
              ? 'VERIFIED'
              : 'NOT_RECORDED';

        return {
          taskId: r._id,
          vehicle: r.vehicleId?.registrationNumber || r.vehicleNumber || '',
          driver: driverName,
          fromDate: fromStr,
          toDate: toStr,
          duration: durStr,
          billedFuel: r.billFuelConsumed != null ? Number(r.billFuelConsumed.toFixed(2)) : null,
          telematicsFuel:
            r.fleetEdgeFuelConsumed != null ? Number(r.fleetEdgeFuelConsumed.toFixed(2)) : null,
          varianceL: varL != null ? Number(varL.toFixed(2)) : null,
          variancePct: varPct != null ? Number(varPct.toFixed(1)) : null,
          auditStatus,
          flagReason: r.flagReason || '',
          odoStatus,
          distanceKm: r.distanceTravelled != null ? Number(r.distanceTravelled.toFixed(1)) : null,
          minOdo: r.minOdometer != null ? Number(r.minOdometer.toFixed(1)) : null,
          maxOdo: r.maxOdometer != null ? Number(r.maxOdometer.toFixed(1)) : null,
          mileage: r.fuelEfficiency != null ? Number(r.fuelEfficiency.toFixed(2)) : null,
          defConsumed: r.defConsumed != null ? Number(r.defConsumed.toFixed(2)) : null,
        };
      }),
    [records],
  );

  // Drawer & Modal interactions
  const handleOpenDrawer = (record) => {
    setActiveDrawerTask(record);
  };

  const handleCloseDrawer = () => {
    setActiveDrawerTask(null);
  };

  const handleOpenReview = (record) => {
    setReviewTask(record);
  };

  const handleCloseReview = () => {
    setReviewTask(null);
  };

  const handleSaveReview = async (taskId, payload) => {
    try {
      const res = await ReportsService.approveReviewTask(taskId, payload);
      if (res && res.success !== false) {
        toast.success('Task reconciled and updated successfully');
        handleCloseReview();
        if (
          activeDrawerTask &&
          (activeDrawerTask._id === taskId || activeDrawerTask.id === taskId)
        ) {
          setActiveDrawerTask(null);
        }
        fetchStatus();
        fetchComparisons();
        return true;
      } else {
        const errorMsg = res?.message || 'Failed to update review task';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'An error occurred during task reconciliation';
      toast.error(msg);
      throw err;
    }
  };

  // Aggregate KPI Metrics
  const kpiMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalTelematics = 0;
    let flaggedCount = status?.flagged ?? 0;
    let cleanCount =
      status?.completed != null && status?.flagged != null
        ? Math.max(0, status.completed - status.flagged)
        : 0;
    let pendingCount = status?.needsAction ?? 0;

    records.forEach((r) => {
      totalBilled += r.billFuelConsumed || 0;
      totalTelematics += r.fleetEdgeFuelConsumed || 0;
      if (!r.isFlagged && r.status === 'COMPLETED') cleanCount += 1;
    });

    return {
      totalBilled,
      totalTelematics,
      flaggedCount,
      cleanCount,
      pendingCount,
    };
  }, [records, status]);

  // Tab counts
  const tabCounts = useMemo(
    () => ({
      all: status?.total ?? total,
      flagged: status?.flagged ?? 0,
      review: status?.needsAction ?? 0,
      clean:
        status?.completed != null && status?.flagged != null
          ? Math.max(0, status.completed - status.flagged)
          : null,
    }),
    [status, total],
  );

  // Drawer Next / Prev Navigation
  const currentDrawerIndex = useMemo(() => {
    if (!activeDrawerTask) return -1;
    return records.findIndex((r) => r._id === activeDrawerTask._id);
  }, [activeDrawerTask, records]);

  const handlePrevDrawer = () => {
    if (currentDrawerIndex > 0) {
      setActiveDrawerTask(records[currentDrawerIndex - 1]);
    }
  };

  const handleNextDrawer = () => {
    if (currentDrawerIndex >= 0 && currentDrawerIndex < records.length - 1) {
      setActiveDrawerTask(records[currentDrawerIndex + 1]);
    }
  };

  return (
    <div className="fc-page-wrapper" style={themeColors}>
      <PageShell
        title="Fuel Comparison"
        subtitle="CAN-bus telematics audit reconciling driver fuel bills against engine consumption"
        count={tabCounts.all ?? total}
        actions={
          <div className="fc-header-actions">
            <span className="fc-engine-pill">
              <span className="fc-engine-dot" />
              Telematics Sink Active
            </span>

            <button
              type="button"
              className="pshell-btn"
              onClick={handleSyncPipeline}
              disabled={isSyncing}
              title="Refresh comparisons and run on-demand backend audit"
              aria-label="Sync comparisons"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Auditing…' : 'Sync Live'}</span>
            </button>

            <ExportButton
              rows={exportRows}
              columns={exportColumns}
              filename={`fuel-comparison-audit-${activeTab !== 'all' ? activeTab : 'all'}`}
              disabled={records.length === 0}
              buttonClass="pshell-btn pshell-btn--primary"
            />
          </div>
        }
      >
        {/* Compact KPI Strip */}
        <div className="fc-kpi-grid">
          {/* Total Billed */}
          <div className="fc-kpi-card">
            <div className="fc-kpi-card__head">
              <span className="fc-kpi-card__title">Total Billed</span>
              <div className="fc-kpi-card__icon fc-kpi-card__icon--blue">
                <Fuel size={16} />
              </div>
            </div>
            <div className="fc-kpi-card__val fc-mono">{fmtLitres(kpiMetrics.totalBilled)}</div>
          </div>

          {/* CAN-bus Telematics */}
          <div className="fc-kpi-card">
            <div className="fc-kpi-card__head">
              <span className="fc-kpi-card__title">CAN-bus Telematics</span>
              <div className="fc-kpi-card__icon fc-kpi-card__icon--purple">
                <Radio size={16} />
              </div>
            </div>
            <div className="fc-kpi-card__val fc-mono">{fmtLitres(kpiMetrics.totalTelematics)}</div>
          </div>

          {/* Flagged Divergence (Filterable) */}
          <button
            type="button"
            className={`fc-kpi-card fc-kpi-card--interactive ${
              kpiMetrics.flaggedCount > 0 ? 'fc-kpi-card--alert' : ''
            } ${activeTab === 'flagged' ? 'is-active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'flagged' ? 'all' : 'flagged')}
            title="Click to toggle flagged discrepancies"
          >
            <div className="fc-kpi-card__head">
              <span className="fc-kpi-card__title">Flagged Divergence</span>
              <div className="fc-kpi-card__icon fc-kpi-card__icon--red">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="fc-kpi-card__val fc-mono text-red-600 dark:text-red-400">
              {kpiMetrics.flaggedCount}
            </div>
          </button>

          {/* Verified Clean (Filterable) */}
          <button
            type="button"
            className={`fc-kpi-card fc-kpi-card--interactive ${
              activeTab === 'clean' ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab(activeTab === 'clean' ? 'all' : 'clean')}
            title="Click to toggle verified clean records"
          >
            <div className="fc-kpi-card__head">
              <span className="fc-kpi-card__title">Verified Clean</span>
              <div className="fc-kpi-card__icon fc-kpi-card__icon--green">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="fc-kpi-card__val fc-mono text-emerald-600 dark:text-emerald-400">
              {kpiMetrics.cleanCount}
            </div>
          </button>

          {/* Needs Review (Filterable) */}
          <button
            type="button"
            className={`fc-kpi-card fc-kpi-card--interactive ${
              kpiMetrics.pendingCount > 0 ? 'fc-kpi-card--warn' : ''
            } ${activeTab === 'review' ? 'is-active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'review' ? 'all' : 'review')}
            title="Click to toggle pending review records"
          >
            <div className="fc-kpi-card__head">
              <span className="fc-kpi-card__title">Needs Review</span>
              <div className="fc-kpi-card__icon fc-kpi-card__icon--amber">
                <Clock size={16} />
              </div>
            </div>
            <div className="fc-kpi-card__val fc-mono text-amber-600 dark:text-amber-400">
              {kpiMetrics.pendingCount}
            </div>
          </button>
        </div>

        {/* Unified Toolbar: Status Tabs + Inline Filters */}
        <div className="fc-toolbar">
          {/* Status Tabs */}
          <div className="fc-tabs" role="tablist">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                className={`fc-tab ${activeTab === t.key ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab(t.key);
                  setPage(1);
                }}
              >
                <span>{t.label}</span>
                {tabCounts[t.key] != null && (
                  <span
                    className={`fc-tab__count ${
                      (t.key === 'flagged' || t.key === 'review') && tabCounts[t.key] > 0
                        ? 'fc-tab__count--alert'
                        : ''
                    }`}
                  >
                    {tabCounts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Inline Filter Controls */}
          <div className="fc-filters-row">
            {/* Date Preset */}
            <div className="fc-select-wrap">
              <select
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="fc-select fc-select--compact"
                aria-label="Filter by date range"
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Dates */}
            {datePreset === 'CUSTOM' && (
              <div className="fc-custom-dates">
                <input
                  type="date"
                  className="fc-date-input"
                  value={inputFromDate}
                  onChange={(e) => setInputFromDate(e.target.value)}
                  aria-label="From date"
                />
                <span className="fc-date-sep">→</span>
                <input
                  type="date"
                  className="fc-date-input"
                  value={inputToDate}
                  onChange={(e) => setInputToDate(e.target.value)}
                  aria-label="To date"
                />
              </div>
            )}

            {/* Variance Severity */}
            <div className="fc-select-wrap">
              <select
                value={varianceFilter}
                onChange={(e) => {
                  setVarianceFilter(e.target.value);
                  setPage(1);
                }}
                className="fc-select fc-select--compact"
                aria-label="Filter by variance severity"
              >
                {VARIANCE_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="fc-search-box">
              <Search size={13} className="fc-search-icon" />
              <input
                type="text"
                className="fc-search-input"
                placeholder="Search plate or driver…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="fc-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Reset Filters */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="fc-btn-reset"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Compact Table (NO horizontal scroll, NO checkboxes) */}
        <ComparisonTable
          activeTab={activeTab}
          records={records}
          total={total}
          totalPages={totalPages}
          page={page}
          limit={LIMIT}
          isLoading={isLoading}
          activeFilters={activeFilterCount}
          onPageChange={setPage}
          onSelectRow={handleOpenDrawer}
          onReview={handleOpenReview}
          onResetFilters={handleResetFilters}
        />
      </PageShell>

      {/* Slideover Audit Drawer */}
      <FuelComparisonDrawer
        task={activeDrawerTask}
        isOpen={Boolean(activeDrawerTask)}
        onClose={handleCloseDrawer}
        onReview={handleOpenReview}
        onApproved={() => {
          fetchStatus();
          fetchComparisons();
        }}
        onPrev={currentDrawerIndex > 0 ? handlePrevDrawer : null}
        onNext={
          currentDrawerIndex >= 0 && currentDrawerIndex < records.length - 1
            ? handleNextDrawer
            : null
        }
        hasPrev={currentDrawerIndex > 0}
        hasNext={currentDrawerIndex >= 0 && currentDrawerIndex < records.length - 1}
      />

      {/* Modal for review/reconciliation */}
      {reviewTask && (
        <ReviewModal
          task={reviewTask}
          onClose={handleCloseReview}
          onSave={handleSaveReview}
          onApproved={() => {
            fetchStatus();
            fetchComparisons();
          }}
        />
      )}
    </div>
  );
};

export default FuelComparisonPage;
