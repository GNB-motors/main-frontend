import { istDayEndISO, istDayStartISO, istDayString, shiftDay } from '../../utils/dateUtils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import { ReportsService } from '../Reports/ReportsService.js';
import { getUserRole } from '../../utils/session.js';
import { getThemeCSS } from '../../utils/colorTheme.js';
import ComparisonTable from './ComparisonTable.jsx';
import FuelComparisonDrawer from './FuelComparisonDrawer.jsx';
import ReviewModal from './ReviewModal.jsx';
import ComparisonKpiStrip from './ComparisonKpiStrip.jsx';
import ComparisonToolbar from './ComparisonToolbar.jsx';
import ComparisonHeaderActions from './ComparisonHeaderActions.jsx';
import useComparisonExport from './useComparisonExport.js';
import useComparisonMetrics from './useComparisonMetrics.js';
import useDrawerNavigation from './useDrawerNavigation.js';
import './FuelComparison.css';
import logger from '../../utils/logger';

const LIMIT = 20;

/**
 * `range` ({ from, to } calendar days): the /mileage hub's shared dates. When
 * given, the page follows it and hides its own date controls.
 */
const FuelComparisonPage = ({ embedded = false, range: hubRange = null }) => {
  const role = getUserRole();
  const themeColors = useMemo(() => getThemeCSS(role), [role]);

  // Tab State
  const [activeTab, setActiveTab] = useState('all');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('ALL');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');
  const fromDate = hubRange
    ? new Date(`${hubRange.from}T00:00:00.000+05:30`).toISOString()
    : inputFromDate;
  const toDate = hubRange
    ? new Date(`${hubRange.to}T23:59:59.999+05:30`).toISOString()
    : inputToDate;
  const [varianceFilter, setVarianceFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // New dates are a new result set: back to page 1 in the same render.
  const [shownDates, setShownDates] = useState(`${fromDate}|${toDate}`);
  if (shownDates !== `${fromDate}|${toDate}`) {
    setShownDates(`${fromDate}|${toDate}`);
    setPage(1);
  }

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

    const today = istDayString();
    if (presetKey === 'ALL') {
      setInputFromDate('');
      setInputToDate('');
    } else if (presetKey === 'TODAY') {
      setInputFromDate(istDayStartISO(today));
      setInputToDate(istDayEndISO(today));
    } else if (presetKey === 'YESTERDAY') {
      const y = shiftDay(today, -1);
      setInputFromDate(istDayStartISO(y));
      setInputToDate(istDayEndISO(y));
    } else if (presetKey === '7DAYS') {
      setInputFromDate(istDayStartISO(shiftDay(today, -6)));
      setInputToDate(istDayEndISO(today));
    } else if (presetKey === '30DAYS') {
      setInputFromDate(istDayStartISO(shiftDay(today, -29)));
      setInputToDate(istDayEndISO(today));
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

      if (fromDate) {
        params.fromDate = fromDate;
      }
      if (toDate) {
        params.toDate = toDate;
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
      logger.warn('FuelComparisonPage', 'Error fetching comparisons', err);
      toast.error('Failed to load fuel comparisons');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, searchQuery, fromDate, toDate, varianceFilter]);

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

  const { exportColumns, exportRows } = useComparisonExport(records);

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
      const msg = err?.message || 'An error occurred during task reconciliation';
      toast.error(msg);
      throw err;
    }
  };

  const { kpiMetrics, tabCounts } = useComparisonMetrics(records, status, total);

  const { currentDrawerIndex, handlePrevDrawer, handleNextDrawer } = useDrawerNavigation(
    records,
    activeDrawerTask,
    setActiveDrawerTask,
  );

  return (
    <div className="fc-page-wrapper" style={themeColors}>
      <PageShell
        embedded={embedded}
        title="Fuel Comparison"
        subtitle="CAN-bus telematics audit reconciling driver fuel bills against engine consumption"
        count={tabCounts.all ?? total}
        actions={
          <ComparisonHeaderActions
            handleSyncPipeline={handleSyncPipeline}
            isSyncing={isSyncing}
            exportRows={exportRows}
            exportColumns={exportColumns}
            activeTab={activeTab}
            records={records}
          />
        }
      >
        {/* Compact KPI Strip */}
        <ComparisonKpiStrip
          kpiMetrics={kpiMetrics}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Unified Toolbar: Status Tabs + Inline Filters */}
        <ComparisonToolbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setPage={setPage}
          tabCounts={tabCounts}
          hubRange={hubRange}
          datePreset={datePreset}
          handlePresetChange={handlePresetChange}
          inputFromDate={inputFromDate}
          setInputFromDate={setInputFromDate}
          inputToDate={inputToDate}
          setInputToDate={setInputToDate}
          varianceFilter={varianceFilter}
          setVarianceFilter={setVarianceFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilterCount={activeFilterCount}
          handleResetFilters={handleResetFilters}
        />

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
