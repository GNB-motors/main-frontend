import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, CircularProgress, Alert, FormControl, Select, MenuItem
} from '@mui/material';
import {
    Fuel, AlertTriangle, CheckCircle2, Clock, RefreshCw,
    Zap, Activity, XCircle, Flag
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon } from '../../../components/Icons';

// Extend dayjs with timezone and relative time support
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_ZONE = 'Asia/Kolkata';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toIST = (utcStr) => {
    if (!utcStr) return null;
    return dayjs.utc(utcStr).tz(IST_ZONE);
};

const formatIST = (utcStr) => {
    const d = toIST(utcStr);
    if (!d) return '—';
    return d.format('DD MMM YYYY, hh:mm A [IST]');
};

const formatRelativeIST = (utcStr) => {
    const d = toIST(utcStr);
    if (!d) return null;
    return d.fromNow();
};

const formatDateRange = (from, to) => {
    const f = from ? dayjs.utc(from).tz(IST_ZONE).format('DD MMM YY') : '—';
    const t = to ? dayjs.utc(to).tz(IST_ZONE).format('DD MMM YY') : '—';
    return `${f} → ${t}`;
};

// ─── Status KPI Card ──────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const StatusKpiCard = ({ icon: Icon, label, value, iconColor, bgColor, accent }) => (
    <div className="trip-ledger-kpi-card fuel-kpi-card" style={accent ? { outline: `2px solid ${accent}` } : {}}>
        <div className="trip-ledger-kpi-icon" style={{ background: bgColor || 'rgba(47,88,238,0.10)' }}>
            <Icon size={18} color={iconColor || '#2F58EE'} />
        </div>
        <div className="trip-ledger-kpi-content">
            <span className="trip-ledger-kpi-l bel">{label}</span>
            <span className="trip-ledger-kpi-value">{value ?? '—'}</span>
        </div>
    </div>
);

// ─── Sync Status Bar ──────────────────────────────────────────────────────────

const SyncStatusBar = ({ status, isLoading, error, onRefresh }) => {
    if (isLoading) {
        return (
            <div className="fuel-status-bar">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <span style={{ fontSize: 13, color: '#5d5d5e' }}>Loading sync status…</span>
                </Box>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fuel-status-bar">
                <Alert severity="warning" sx={{ py: 0.5, fontSize: 13 }}>{error}</Alert>
            </div>
        );
    }

    if (!status) return null;

    const lastSync = status.lastSyncAt ? formatRelativeIST(status.lastSyncAt) : null;
    const lastSyncFull = status.lastSyncAt ? formatIST(status.lastSyncAt) : null;

    return (
        <div className="fuel-status-bar">
            {/* KPI cards row */}
            <div className="fuel-status-kpis">
                <StatusKpiCard
                    icon={Clock}
                    label="Pending"
                    value={status.pending ?? 0}
                    iconColor="#F39C12"
                    bgColor="rgba(243,156,18,0.10)"
                />
                <StatusKpiCard
                    icon={Activity}
                    label="In Progress"
                    value={status.inProgress ?? 0}
                    iconColor="#2F58EE"
                    bgColor="rgba(47,88,238,0.10)"
                />
                <StatusKpiCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={status.completed ?? 0}
                    iconColor="#2ECC71"
                    bgColor="rgba(46,204,113,0.10)"
                />
                <StatusKpiCard
                    icon={XCircle}
                    label="Failed"
                    value={status.failed ?? 0}
                    iconColor="#E74C3C"
                    bgColor="rgba(231,76,60,0.10)"
                />
                <StatusKpiCard
                    icon={Flag}
                    label="Flagged"
                    value={status.flagged ?? 0}
                    iconColor="#E67E22"
                    bgColor="rgba(230,126,34,0.10)"
                    accent={status.flagged > 0 ? '#E67E22' : undefined}
                />
            </div>

            {/* Sync info + refresh */}
            <div className="fuel-status-meta">
                <div className="fuel-sync-state">
                    {status.isUpToDate ? (
                        <span className="fuel-sync-badge fuel-sync-ok">
                            <CheckCircle2 size={13} /> All caught up
                        </span>
                    ) : (
                        <span className="fuel-sync-badge fuel-sync-pending">
                            <Clock size={13} /> {status.pending ?? 0} pending
                        </span>
                    )}
                </div>
                {lastSync && (
                    <span className="fuel-last-sync" title={lastSyncFull}>
                        Last sync: {lastSync}
                    </span>
                )}
                <button className="fuel-refresh-btn" onClick={onRefresh} title="Refresh status">
                    <RefreshCw size={14} />
                </button>
            </div>
        </div>
    );
};

// ─── Variance Badge ───────────────────────────────────────────────────────────

const VarianceBadge = ({ variance, variancePercent }) => {
    const isOver = variance > 0;
    return (
        <div className={`fuel-variance-cell ${isOver ? 'fuel-variance-over' : 'fuel-variance-ok'}`}>
            <span className="fuel-variance-abs">{isOver ? '+' : ''}{variance?.toFixed(2)} L</span>
            <span className="fuel-variance-pct">({isOver ? '+' : ''}{variancePercent?.toFixed(1)}%)</span>
        </div>
    );
};

// ─── Status Flag Badge ────────────────────────────────────────────────────────

const FlagBadge = ({ isFlagged }) => (
    isFlagged
        ? <span className="fuel-status-badge fuel-badge-flagged"><AlertTriangle size={12} /> Flagged</span>
        : <span className="fuel-status-badge fuel-badge-ok"><CheckCircle2 size={12} /> OK</span>
);

// ─── Comparison Table ─────────────────────────────────────────────────────────

const ComparisonTable = ({ records, isLoading, error, emptyMessage }) => {
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
                <span style={{ marginLeft: 12, color: '#5d5d5e', fontSize: 14 }}>Loading records…</span>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

    return (
        <div className="fuel-table-container">
            <table className="fuel-comparison-table">
                <thead>
                    <tr>
                        <th>Vehicle No.</th>
                        <th>Driver</th>
                        <th style={{ textAlign: 'right' }}>Bill Fuel (L)</th>
                        <th style={{ textAlign: 'right' }}>FleetEdge Fuel (L)</th>
                        <th style={{ textAlign: 'right' }}>Variance</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th>Date Range</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="fuel-empty-state">
                                {emptyMessage || 'No records found.'}
                            </td>
                        </tr>
                    ) : (
                        records.map((rec) => (
                            <tr
                                key={rec._id}
                                className={rec.isFlagged ? 'fuel-row-flagged' : ''}
                                title={rec.flagReason || ''}
                            >
                                <td>
                                    <div className="cell-primary">
                                        {rec.vehicleId?.registrationNumber || '—'}
                                    </div>
                                </td>
                                <td>
                                    <div className="cell-primary">
                                        {rec.driverId
                                            ? `${rec.driverId.firstName || ''} ${rec.driverId.lastName || ''}`.trim() || '—'
                                            : '—'}
                                    </div>
                                    {rec.driverId?.mobileNumber && (
                                        <div className="cell-secondary">{rec.driverId.mobileNumber}</div>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="cell-primary">{rec.billFuelConsumed?.toFixed(2) ?? '—'}</div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="cell-primary">{rec.fleetEdgeFuelConsumed?.toFixed(2) ?? '—'}</div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <VarianceBadge
                                        variance={rec.variance}
                                        variancePercent={rec.variancePercent}
                                    />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <FlagBadge isFlagged={rec.isFlagged} />
                                </td>
                                <td>
                                    <div className="cell-secondary fuel-date-range">
                                        {formatDateRange(rec.fromDate, rec.toDate)}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ currentPage, totalPages, totalRecords, limit, onPageChange }) => {
    const generatePageNumbers = () => {
        const pages = [];
        const maxShow = 7;
        if (totalPages <= maxShow) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    if (totalPages <= 1) return null;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalRecords);

    return (
        <div className="trip-ledger-pagination">
            <span className="pagination-info">
                Showing {start}–{end} of {totalRecords} records
            </span>
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >‹</button>
                {generatePageNumbers().map((p, idx) =>
                    p === '...'
                        ? <span key={`el-${idx}`} className="pagination-ellipsis">…</span>
                        : <button
                            key={p}
                            className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                            onClick={() => onPageChange(p)}
                        >{p}</button>
                )}
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >›</button>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FuelComparisonReport = () => {
    const LIMIT = 20;

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

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

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
    useEffect(() => { setCompPage(1); }, [flaggedOnly]);

    // ── Export CSV ────────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        const records = activeTab === 'flagged' ? flagged : comparisons;
        const headers = [
            'Vehicle No.', 'Driver', 'Bill Fuel (L)', 'FleetEdge Fuel (L)',
            'Variance (L)', 'Variance (%)', 'Status', 'From Date', 'To Date'
        ];
        const rows = records.map(rec => [
            rec.vehicleId?.registrationNumber || '',
            rec.driverId ? `${rec.driverId.firstName || ''} ${rec.driverId.lastName || ''}`.trim() : '',
            rec.billFuelConsumed?.toFixed(2) || '',
            rec.fleetEdgeFuelConsumed?.toFixed(2) || '',
            rec.variance?.toFixed(2) || '',
            rec.variancePercent?.toFixed(2) || '',
            rec.isFlagged ? 'Flagged' : 'OK',
            rec.fromDate ? dayjs.utc(rec.fromDate).tz(IST_ZONE).format('DD/MM/YYYY') : '',
            rec.toDate ? dayjs.utc(rec.toDate).tz(IST_ZONE).format('DD/MM/YYYY') : '',
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `fuel_comparison_${activeTab}_${dayjs().tz(IST_ZONE).format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ padding: '24px' }}>
            {/* Header */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Fuel size={22} color="#E67E22" />
                        <h3 className="report-title">Fuel Comparison</h3>
                    </div>
                    <button
                        className="export-btn"
                        onClick={handleExportCSV}
                        title="Export current view to CSV"
                    >
                        <CsvIcon width={24} height={24} />
                    </button>
                </div>

                {/* Sync Status Bar */}
                <SyncStatusBar
                    status={status}
                    isLoading={isLoadingStatus}
                    error={statusError}
                    onRefresh={fetchStatus}
                />

                {/* Tab Bar + Filters */}
                <div className="fuel-tab-row">
                    <div className="fuel-tab-bar">
                        <button
                            className={`fuel-tab ${activeTab === 'all' ? 'fuel-tab-active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Comparisons
                            {compTotal > 0 && <span className="fuel-tab-count">{compTotal}</span>}
                        </button>
                        <button
                            className={`fuel-tab ${activeTab === 'flagged' ? 'fuel-tab-active fuel-tab-flagged-active' : ''}`}
                            onClick={() => setActiveTab('flagged')}
                        >
                            <AlertTriangle size={13} />
                            Flagged Records
                            {flaggedTotal > 0 && (
                                <span className="fuel-tab-count fuel-tab-count-flagged">{flaggedTotal}</span>
                            )}
                        </button>
                    </div>

                    {/* Only show filter on "All" tab */}
                    {activeTab === 'all' && (
                        <div className="report-filters" style={{ marginTop: 0 }}>
                            <div className="date-input-group">
                                <label>Filter</label>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <Select
                                        value={flaggedOnly ? 'flagged' : 'all'}
                                        onChange={(e) => setFlaggedOnly(e.target.value === 'flagged')}
                                        displayEmpty
                                    >
                                        <MenuItem value="all">All Records</MenuItem>
                                        <MenuItem value="flagged">Flagged Only</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Flagged alert banner */}
            {activeTab === 'all' && !isLoadingStatus && status?.flagged > 0 && (
                <div className="fuel-flagged-alert">
                    <AlertTriangle size={15} />
                    <span>
                        <strong>{status.flagged}</strong> record{status.flagged !== 1 ? 's' : ''} where bill fuel exceeds FleetEdge — potential discrepancies detected.
                    </span>
                    <button
                        className="fuel-flagged-alert-link"
                        onClick={() => setActiveTab('flagged')}
                    >
                        View flagged →
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="report-content">
                {activeTab === 'all' ? (
                    <>
                        <ComparisonTable
                            records={comparisons}
                            isLoading={isLoadingComp}
                            error={compError}
                            emptyMessage="No comparison records found. Try changing your filter."
                        />
                        <Pagination
                            currentPage={compPage}
                            totalPages={compTotalPages}
                            totalRecords={compTotal}
                            limit={LIMIT}
                            onPageChange={setCompPage}
                        />
                    </>
                ) : (
                    <>
                        <ComparisonTable
                            records={flagged}
                            isLoading={isLoadingFlagged}
                            error={flaggedError}
                            emptyMessage="No flagged records found — all comparisons look good!"
                        />
                        <Pagination
                            currentPage={flaggedPage}
                            totalPages={flaggedTotalPages}
                            totalRecords={flaggedTotal}
                            limit={LIMIT}
                            onPageChange={setFlaggedPage}
                        />
                    </>
                )}
            </div>
        </Box>
    );
};

export default FuelComparisonReport;
