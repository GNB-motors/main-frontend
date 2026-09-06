import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AlertTriangle, Download } from 'lucide-react';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import { SyncStatusBar } from './fuelComparisonReportStatus.jsx';
import { useFuelComparisonColumns } from './useFuelComparisonColumns.jsx';
import { IST_ZONE, buildFuelComparisonCsv } from './fuelComparisonReportUtils.js';

const LIMIT = 20;

const FuelComparisonReport = () => {
  // Tab: 'all' | 'flagged'
  const [activeTab, setActiveTab] = useState('all');

  // Status widget
  const [status, setStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // All comparisons
  const [comparisons, setComparisons] = useState([]);
  const [compTotal, setCompTotal] = useState(0);
  const [compTotalPages, setCompTotalPages] = useState(0);
  const [compPage, setCompPage] = useState(1);
  const [isLoadingComp, setIsLoadingComp] = useState(false);
  const [compError, setCompError] = useState(null);

  // Flagged records
  const [flagged, setFlagged] = useState([]);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const [flaggedTotalPages, setFlaggedTotalPages] = useState(0);
  const [flaggedPage, setFlaggedPage] = useState(1);
  const [isLoadingFlagged, setIsLoadingFlagged] = useState(false);
  const [flaggedError, setFlaggedError] = useState(null);

  // Filters (all tab)
  const [flaggedOnly, setFlaggedOnly] = useState(false);

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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Fetch all comparisons ────────────────────────────────────────────────
  const fetchComparisons = useCallback(async () => {
    setIsLoadingComp(true);
    setCompError(null);
    try {
      const params = { page: compPage, limit: LIMIT };
      if (flaggedOnly) params.flaggedOnly = 'true';
      const data = await ReportsService.getExtensionComparisons(params);
      setComparisons(data.records || []);
      setCompTotal(data.total || 0);
      setCompTotalPages(data.totalPages || 0);
    } catch (err) {
      setCompError(err.detail || 'Could not load comparison data.');
    } finally {
      setIsLoadingComp(false);
    }
  }, [compPage, flaggedOnly]);

  // ── Fetch flagged records ────────────────────────────────────────────────
  const fetchFlagged = useCallback(async () => {
    setIsLoadingFlagged(true);
    setFlaggedError(null);
    try {
      const data = await ReportsService.getExtensionFlagged({ page: flaggedPage, limit: LIMIT });
      setFlagged(data.records || []);
      setFlaggedTotal(data.total || 0);
      setFlaggedTotalPages(data.totalPages || 0);
    } catch (err) {
      setFlaggedError(err.detail || 'Could not load flagged records.');
    } finally {
      setIsLoadingFlagged(false);
    }
  }, [flaggedPage]);

  // Trigger fetches when tab or dependencies change
  useEffect(() => {
    if (activeTab === 'all') fetchComparisons();
  }, [activeTab, fetchComparisons]);

  useEffect(() => {
    if (activeTab === 'flagged') fetchFlagged();
  }, [activeTab, fetchFlagged]);

  // Reset page when filter changes
  useEffect(() => {
    setCompPage(1);
  }, [flaggedOnly]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const records = activeTab === 'flagged' ? flagged : comparisons;
    const csv = buildFuelComparisonCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fuel_comparison_${activeTab}_${dayjs().tz(IST_ZONE).format('YYYY-MM-DD')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const columns = useFuelComparisonColumns();

  const currentRecords = activeTab === 'flagged' ? flagged : comparisons;
  const currentTotal = activeTab === 'flagged' ? flaggedTotal : compTotal;
  const currentPage = activeTab === 'flagged' ? flaggedPage : compPage;
  const currentTotalPages = activeTab === 'flagged' ? flaggedTotalPages : compTotalPages;
  const currentLoading = activeTab === 'flagged' ? isLoadingFlagged : isLoadingComp;
  const currentError = activeTab === 'flagged' ? flaggedError : compError;
  const setPage = activeTab === 'flagged' ? setFlaggedPage : setCompPage;

  const renderPageItems = () => {
    const items = [];
    for (let i = 1; i <= currentTotalPages; i++) {
      if (i === 1 || i === currentTotalPages || Math.abs(i - currentPage) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== '...') {
        items.push('...');
      }
    }
    return items;
  };

  return (
    <PageShell
      className="p-6"
      title="Fuel Comparison"
      subtitle="Compare bill fuel records against FleetEdge telematics to detect fuel variances"
      count={currentTotal}
      actions={
        <button
          type="button"
          className="pshell-btn pshell-btn--primary flex items-center gap-1.5"
          onClick={handleExportCSV}
          disabled={currentRecords.length === 0}
        >
          <Download size={14} /> Export CSV
        </button>
      }
      filters={
        <FilterBar
          chips={[
            { key: 'all', label: 'All Comparisons', count: compTotal },
            { key: 'flagged', label: 'Flagged Records', count: flaggedTotal },
          ]}
          selectedKeys={[activeTab]}
          onToggleChip={(key) => setActiveTab(key)}
          right={
            activeTab === 'all' ? (
              <div className="report-filters" style={{ marginTop: 0 }}>
                <div className="date-input-group">
                  <label htmlFor="fuel-comp-filter-select">Filter</label>
                  <Select
                    value={flaggedOnly ? 'flagged' : 'all'}
                    onValueChange={(val) => setFlaggedOnly(val === 'flagged')}
                  >
                    <SelectTrigger id="fuel-comp-filter-select" className="h-8 w-[160px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="flagged">Flagged Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null
          }
        />
      }
      footer={
        currentTotalPages > 1 ? (
          <div className="flex w-full items-center justify-between">
            <span className="text-dim text-xs">
              Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, currentTotal)}{' '}
              of {currentTotal}
            </span>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && setPage((p) => p - 1)}
                    className={
                      currentPage <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {renderPageItems().map((item, idx) =>
                  item === '...' ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={currentPage === item}
                        onClick={() => setPage(item)}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < currentTotalPages && setPage((p) => p + 1)}
                    className={
                      currentPage >= currentTotalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <SyncStatusBar
          status={status}
          isLoading={isLoadingStatus}
          error={statusError}
          onRefresh={fetchStatus}
        />

        {activeTab === 'all' && !isLoadingStatus && status?.flagged > 0 && (
          <div className="fuel-flagged-alert">
            <AlertTriangle size={15} />
            <span>
              <strong>{status.flagged}</strong> record{status.flagged !== 1 ? 's' : ''} where bill
              fuel exceeds FleetEdge — potential discrepancies detected.
            </span>
            <button
              type="button"
              className="fuel-flagged-alert-link"
              onClick={() => setActiveTab('flagged')}
            >
              View flagged →
            </button>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={currentRecords}
          rowKey={(r) => r._id}
          loading={currentLoading}
          error={currentError}
          onRetry={activeTab === 'flagged' ? fetchFlagged : fetchComparisons}
          showing={currentRecords.length}
          total={currentTotal}
          emptyTitle={
            activeTab === 'flagged' ? 'No flagged records found' : 'No comparison records found'
          }
          emptyHint={
            activeTab === 'flagged'
              ? 'All comparisons look good with no discrepancies.'
              : 'Try changing your filters.'
          }
        />
      </div>
    </PageShell>
  );
};

export default FuelComparisonReport;
