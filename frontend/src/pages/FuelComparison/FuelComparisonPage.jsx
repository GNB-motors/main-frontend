import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Database,
  WifiOff,
  Play,
  Loader2,
} from 'lucide-react';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { CsvIcon } from '../../components/Icons';
import { getThemeCSS } from '../../utils/colorTheme';
import { getUserRole } from '../../utils/session.js';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import StatusKpiCard from './StatusKpiCard.jsx';
import LiveErrorsWidget from './LiveErrorsWidget.jsx';
import FleetEdgeConnectivityBar from './FleetEdgeConnectivityBar.jsx';
import ReviewModal from './ReviewModal.jsx';
import ComparisonTable from './ComparisonTable.jsx';
import './FuelComparison.css';

const FuelComparisonPage = () => {
  const LIMIT = 20;

  const [themeColors] = useState(getThemeCSS());

  // Tab: 'all' | 'flagged' | 'review'
  const [activeTab, setActiveTab] = useState('all');

  const userRole = getUserRole() || '';
  const canPullNow = ['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);

  // Status widget
  const [status, setStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [, setStatusError] = useState(null);

  // FleetEdge connectivity + user errors
  const [connectivity, setConnectivity] = useState(null);
  const [userErrors, setUserErrors] = useState([]);
  const [isPulling, setIsPulling] = useState(false);

  // Filter
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputFromDate, setInputFromDate] = useState('');
  const [inputToDate, setInputToDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Data
  const [comparisons, setComparisons] = useState([]);
  const [compTotal, setCompTotal] = useState(0);
  const [compTotalPages, setCompTotalPages] = useState(0);
  const [compPage, setCompPage] = useState(1);
  const [isLoadingComp, setIsLoadingComp] = useState(false);
  const [flagged, setFlagged] = useState([]);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);

  // Review modal
  const [reviewingTask, setReviewingTask] = useState(null);

  // ── Fetch sync status ────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      const data = await ReportsService.getExtensionStatus();
      setStatus(data);
    } catch (err) {
      setStatusError(err.detail || 'Could not load sync status.');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const fetchConnectivity = useCallback(async () => {
    const data = await ReportsService.getFleetEdgeConnectivity();
    setConnectivity(data);
  }, []);

  const fetchUserErrors = useCallback(async () => {
    const errors = await ReportsService.getUserErrors();
    setUserErrors(Array.isArray(errors) ? errors : []);
  }, []);

  const handlePullNow = async () => {
    setIsPulling(true);
    try {
      await ReportsService.triggerPullNow();
      setTimeout(() => {
        fetchStatus();
        fetchConnectivity();
      }, 2500);
    } catch (err) {
      console.error('Pull now failed:', err);
    } finally {
      setIsPulling(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchConnectivity();
    fetchUserErrors();
  }, [fetchStatus, fetchConnectivity, fetchUserErrors]);

  // Date inputs are committed to the fetch only when Filter is clicked.
  const applyFilter = () => {
    setFromDate(inputFromDate);
    setToDate(inputToDate);
    setCompPage(1);
  };

  // ── Fetch Data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoadingComp(true);
    try {
      if (activeTab === 'all') {
        const params = { page: compPage, limit: LIMIT };
        if (flaggedOnly) params.flaggedOnly = 'true';
        if (searchQuery) params.search = searchQuery;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        const data = await ReportsService.getExtensionComparisons(params);
        setComparisons(data.records || []);
        setCompTotal(data.total || 0);
        setCompTotalPages(data.totalPages || 0);
      } else if (activeTab === 'flagged') {
        const data = await ReportsService.getExtensionFlagged({ page: compPage, limit: LIMIT });
        setFlagged(data.records || []);
        setFlaggedTotal(data.total || 0);
        setCompTotalPages(data.totalPages || 0);
      } else {
        const data = await ReportsService.getPendingReviewTasks({ page: compPage, limit: LIMIT });
        setReviewTasks(data.records || []);
        setReviewTotal(data.total || 0);
        setCompTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingComp(false);
    }
  }, [activeTab, compPage, flaggedOnly, searchQuery, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setCompPage(1);
  }, [activeTab, flaggedOnly, searchQuery, fromDate, toDate]);

  const reauthCount = (connectivity?.accounts || []).filter(
    (a) => a.status === 'NEEDS_REAUTH',
  ).length;

  const activeRecords =
    activeTab === 'all' ? comparisons : activeTab === 'flagged' ? flagged : reviewTasks;
  const activeTotal =
    activeTab === 'all' ? compTotal : activeTab === 'flagged' ? flaggedTotal : reviewTotal;

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (flaggedOnly ? 1 : 0);

  const refreshAll = () => {
    fetchStatus();
    fetchConnectivity();
    fetchUserErrors();
  };

  return (
    <div className="fc-page" style={themeColors}>
      <PageShell
        title="Fuel Comparison"
        subtitle="Live analytics from the FleetEdge Extension Sync"
        count={activeTotal}
        freshnessAt={status?.lastSyncAt}
        actions={
          <>
            {canPullNow && (
              <button
                className="fc-btn fc-btn-secondary"
                onClick={handlePullNow}
                disabled={isPulling}
                title="Trigger an immediate FleetEdge pull + backfill"
              >
                {isPulling ? (
                  <>
                    <Loader2 size={15} className="fc-spin" /> Pulling…
                  </>
                ) : (
                  <>
                    <Play size={15} /> Pull Now
                  </>
                )}
              </button>
            )}
            <button className="fc-btn fc-btn-icon" onClick={refreshAll} title="Refresh">
              <RefreshCw size={18} />
            </button>
            {/* Inert before the chassis conversion — kept without a handler on purpose. */}
            <button className="fc-btn fc-btn-primary">
              <CsvIcon width={16} height={16} /> Export CSV
            </button>
          </>
        }
        filters={
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search vehicle or driver..."
            from={inputFromDate}
            to={inputToDate}
            onRangeChange={(patch) => {
              if (patch.from !== undefined) setInputFromDate(patch.from);
              if (patch.to !== undefined) setInputToDate(patch.to);
            }}
            chips={[
              { key: 'all', label: 'All Comparisons', count: compTotal },
              { key: 'flagged', label: 'Flagged', count: flaggedTotal },
              { key: 'review', label: 'Pending Review', count: reviewTotal || null },
            ]}
            selectedKeys={[activeTab]}
            onToggleChip={setActiveTab}
            right={
              <>
                <button className="fc-btn fc-btn-primary fc-filter-btn" onClick={applyFilter}>
                  Filter
                </button>
                {activeTab === 'all' && (
                  <Select
                    value={flaggedOnly ? 'flagged' : 'all'}
                    onValueChange={(v) => setFlaggedOnly(v === 'flagged')}
                  >
                    <SelectTrigger size="sm" className="w-auto min-w-32 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="flagged">Flagged Only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </>
            }
          />
        }
      >
        {/* FleetEdge connectivity summary */}
        <FleetEdgeConnectivityBar connectivity={connectivity} status={status} />

        {/* Reauth banner — shown when one or more accounts need re-authentication */}
        {reauthCount > 0 && (
          <div className="fc-reauth-banner">
            <WifiOff size={14} />
            <span>
              {reauthCount} FleetEdge account{reauthCount > 1 ? 's' : ''} need re-authentication.
              Open the gnbedge extension and click <strong>Reconnect</strong> on the affected
              account.
            </span>
          </div>
        )}

        {/* Top Metrics Row */}
        <div className="fc-metrics-row">
          <StatusKpiCard
            icon={Activity}
            label="Pending Sync"
            value={status?.pending}
            colorClass="pending"
          />
          <StatusKpiCard
            icon={CheckCircle2}
            label="Successful"
            value={status?.completed}
            colorClass="success"
          />
          <StatusKpiCard
            icon={AlertTriangle}
            label="Flagged"
            value={status?.flagged}
            colorClass="warning"
          />
          <StatusKpiCard
            icon={Database}
            label="No Data"
            value={status?.noData ?? 0}
            colorClass="nodata"
          />
          <StatusKpiCard
            icon={XCircle}
            label="Needs Action"
            value={status?.needsAction ?? 0}
            colorClass="warning"
          />
          <LiveErrorsWidget status={status} isLoading={isLoadingStatus} userErrors={userErrors} />
        </div>

        {/* Table Area */}
        <div className="fc-content-card">
          <ComparisonTable
            activeTab={activeTab}
            records={activeRecords}
            total={activeTotal}
            totalPages={compTotalPages}
            page={compPage}
            limit={LIMIT}
            isLoading={isLoadingComp}
            activeFilters={activeFilterCount}
            onPageChange={setCompPage}
            onReview={setReviewingTask}
          />
        </div>
      </PageShell>

      {reviewingTask && (
        <ReviewModal
          task={reviewingTask}
          onClose={() => setReviewingTask(null)}
          onApproved={() => {
            setReviewingTask(null);
            fetchData();
            fetchStatus();
          }}
        />
      )}
    </div>
  );
};

export default FuelComparisonPage;
