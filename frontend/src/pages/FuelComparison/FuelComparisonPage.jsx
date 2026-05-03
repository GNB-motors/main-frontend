import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, CircularProgress, Alert, FormControl, Select, MenuItem, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button
} from '@mui/material';
import {
    Fuel, AlertTriangle, CheckCircle2, Clock, RefreshCw,
    Activity, XCircle, Flag, Search, ShieldAlert, Gauge, Eye
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { CsvIcon } from '../../components/Icons';
import { getThemeCSS } from '../../utils/colorTheme';
import './FuelComparison.css';

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

// ─── Header KPI Card ──────────────────────────────────────────────────────────

const StatusKpiCard = ({ icon: Icon, label, value, colorClass }) => (
    <div className={`fc-kpi-card fc-kpi-${colorClass}`}>
        <div className="fc-kpi-icon-wrap">
            <Icon size={20} />
        </div>
        <div className="fc-kpi-content">
            <span className="fc-kpi-label">{label}</span>
            <span className="fc-kpi-value">{value ?? '0'}</span>
        </div>
    </div>
);

// ─── Live Errors Widget ───────────────────────────────────────────────────────

const LiveErrorsWidget = ({ status, isLoading }) => {
    if (isLoading) return null;
    
    // Fallback errors if we don't have detailed logs attached to status yet
    const displayErrors = status?.recentErrors || [];
    
    return (
        <div className="fc-live-errors-widget">
            <div className="fc-live-errors-header">
                <div className="fc-live-errors-title">
                    <ShieldAlert size={16} /> <span>Live Extension Errors</span>
                </div>
                {status?.failed > 0 && <span className="fc-error-badge">{status.failed}</span>}
            </div>
            <div className="fc-live-errors-list">
                {displayErrors.length === 0 ? (
                    <div className="fc-no-errors">
                        <CheckCircle2 size={16} /> No recent sync errors detected.
                    </div>
                ) : (
                    displayErrors.map((err, i) => (
                        <div key={i} className="fc-error-item">
                            <span className="fc-error-time">{formatRelativeIST(err.timestamp)}</span>
                            <span className="fc-error-msg">{err.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({ task, onClose, onApproved }) => {
    const [fromDate, setFromDate] = useState(
        task?.fromDate ? dayjs.utc(task.fromDate).tz(IST_ZONE).format('YYYY-MM-DDTHH:mm') : ''
    );
    const [toDate, setToDate] = useState(
        task?.toDate ? dayjs.utc(task.toDate).tz(IST_ZONE).format('YYYY-MM-DDTHH:mm') : ''
    );
    const [odometerReading, setOdometerReading] = useState(task?.ocrOdometerReading ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleApprove = async () => {
        setSaving(true);
        setError('');
        try {
            const updates = {};
            if (fromDate) updates.fromDate = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
            if (toDate)   updates.toDate   = dayjs.tz(toDate, IST_ZONE).utc().toISOString();
            if (odometerReading !== '') updates.odometerReading = parseFloat(odometerReading);
            await ReportsService.approveReviewTask(task._id, updates);
            onApproved();
        } catch (err) {
            setError(err.detail || 'Failed to approve task');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Gauge size={18} /> Review Odometer Task — {task?.vehicleId?.registrationNumber || task?.vehicleNumber}
            </DialogTitle>
            <DialogContent dividers>
                {/* Document photo */}
                {task?.odometerDoc?.publicUrl && (
                    <Box mb={2}>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Odometer document photo</p>
                        <img
                            src={task.odometerDoc.publicUrl}
                            alt="Odometer"
                            style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                        {task.odometerDoc.ocrData?.confidence != null && (
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                OCR confidence: {task.odometerDoc.ocrData.confidence}% · Status: {task.odometerDoc.ocrData.processingStatus}
                            </p>
                        )}
                    </Box>
                )}

                <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{task?.reviewReason}</p>

                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        label="From Date (IST)"
                        type="datetime-local"
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        fullWidth size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="To Date (IST)"
                        type="datetime-local"
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        fullWidth size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Corrected Odometer Reading (km)"
                        type="number"
                        value={odometerReading}
                        onChange={e => setOdometerReading(e.target.value)}
                        fullWidth size="small"
                        helperText={`FleetEdge reports: ${task?.maxOdometer ?? '—'} km`}
                    />
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button onClick={handleApprove} disabled={saving} variant="contained" color="primary">
                    {saving ? 'Approving…' : 'Approve & Release'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FuelComparisonPage = () => {
    const LIMIT = 20;

    const [themeColors] = useState(getThemeCSS());

    // Tab: 'all' | 'flagged' | 'review'
    const [activeTab, setActiveTab] = useState('all');

    // Status widget
    const [status, setStatus] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [statusError, setStatusError] = useState(null);

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

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

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

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCompPage(1); }, [activeTab, flaggedOnly, searchQuery, fromDate, toDate]);

    const activeRecords = activeTab === 'all' ? comparisons : activeTab === 'flagged' ? flagged : reviewTasks;
    const activeTotal   = activeTab === 'all' ? compTotal   : activeTab === 'flagged' ? flaggedTotal : reviewTotal;

    return (
        <div className="fc-page" style={themeColors}>
        {reviewingTask && (
            <ReviewModal
                task={reviewingTask}
                onClose={() => setReviewingTask(null)}
                onApproved={() => { setReviewingTask(null); fetchData(); fetchStatus(); }}
            />
        )}
            {/* Header & Title */}
            <div className="fc-header-bar">
                <div className="fc-title-area">
                    <div className="fc-icon-wrap">
                        <Fuel size={24} color="#0f172a" />
                    </div>
                    <div>
                        <h1 className="fc-title">Fuel Comparison</h1>
                        <span className="fc-subtitle">Live analytics from the FleetEdge Extension Sync</span>
                    </div>
                </div>
                <div className="fc-header-actions">
                    {status && (
                        <div className="fc-last-sync">
                            <Clock size={14} /> 
                            <span>Last Sync: {status.lastSyncAt ? formatRelativeIST(status.lastSyncAt) : 'Never'}</span>
                        </div>
                    )}
                    <button className="fc-btn fc-btn-icon" onClick={fetchStatus} title="Refresh Status">
                        <RefreshCw size={18} />
                    </button>
                    <button className="fc-btn fc-btn-primary">
                        <CsvIcon width={16} height={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="fc-metrics-row">
                <StatusKpiCard icon={Activity} label="Pending Sync" value={status?.pending} colorClass="pending" />
                <StatusKpiCard icon={CheckCircle2} label="Successful" value={status?.completed} colorClass="success" />
                <StatusKpiCard icon={AlertTriangle} label="Flagged" value={status?.flagged} colorClass="warning" />
                <LiveErrorsWidget status={status} isLoading={isLoadingStatus} />
            </div>

            {/* Table Area */}
            <div className="fc-content-card">
                <div className="fc-table-toolbar">
                    <div className="fc-tabs">
                        <button className={`fc-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                            All Comparisons
                            <span className="fc-tab-badge">{compTotal}</span>
                        </button>
                        <button className={`fc-tab ${activeTab === 'flagged' ? 'active alert' : ''}`} onClick={() => setActiveTab('flagged')}>
                            <AlertTriangle size={14} /> Flagged
                            <span className="fc-tab-badge fc-badge-alert">{flaggedTotal}</span>
                        </button>
                        <button className={`fc-tab ${activeTab === 'review' ? 'active review' : ''}`} onClick={() => setActiveTab('review')}>
                            <Gauge size={14} /> Pending Review
                            {reviewTotal > 0 && <span className="fc-tab-badge fc-badge-review">{reviewTotal}</span>}
                        </button>
                    </div>

                    <div className="fc-filters">
                        <div className="fc-search-box">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search vehicle or driver..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <input 
                            type="date" 
                            className="fc-date-input" 
                            title="From Date"
                            value={inputFromDate}
                            onChange={(e) => setInputFromDate(e.target.value)}
                        />
                        <span style={{color: '#94a3b8'}}>-</span>
                        <input 
                            type="date" 
                            className="fc-date-input" 
                            title="To Date"
                            value={inputToDate}
                            onChange={(e) => setInputToDate(e.target.value)}
                        />
                        <button className="fc-btn fc-btn-primary fc-filter-btn" onClick={applyFilter}>
                            Filter
                        </button>
                        {activeTab === 'all' && (
                            <FormControl size="small" className="fc-select">
                                <Select
                                    value={flaggedOnly ? 'flagged' : 'all'}
                                    onChange={(e) => setFlaggedOnly(e.target.value === 'flagged')}
                                    displayEmpty
                                    sx={{ minHeight: '36px', height: '36px', fontSize: '13px', borderRadius: '8px' }}
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="flagged">Flagged Only</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </div>
                </div>

                <div className="fc-table-wrap">
                    {isLoadingComp ? (
                        <div className="fc-loading-state">
                            <CircularProgress size={32} />
                            <p>Loading comparisons...</p>
                        </div>
                    ) : (
                        <table className="fc-table">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>Date Range</th>
                                    {activeTab !== 'review' && <th className="num-col">Billed (L)</th>}
                                    {activeTab !== 'review' && <th className="num-col">FleetEdge (L)</th>}
                                    {activeTab !== 'review' && <th className="num-col">Variance</th>}
                                    <th>Fuel Flag</th>
                                    <th>Odometer</th>
                                    {activeTab === 'review' && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {activeRecords.map((rec) => {
                                    const invertedVar = -(rec.variance || 0);
                                    const invertedPct = -(rec.variancePercent || 0);
                                    return (
                                    <tr key={rec._id}>
                                        <td>
                                            <div className="fc-primary-text">{rec.vehicleId?.registrationNumber || rec.vehicleNumber || '—'}</div>
                                        </td>
                                        <td>
                                            <div className="fc-secondary-text">
                                                {rec.driverId ? `${rec.driverId.firstName || ''} ${rec.driverId.lastName || ''}`.trim() : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fc-date-range">{formatDateRange(rec.fromDate, rec.toDate)}</div>
                                        </td>
                                        {activeTab !== 'review' && (
                                            <td className="num-col">
                                                <div className="fc-primary-text">{rec.billFuelConsumed?.toFixed(2) ?? '—'}</div>
                                            </td>
                                        )}
                                        {activeTab !== 'review' && (
                                            <td className="num-col">
                                                <div className="fc-primary-text">{rec.fleetEdgeFuelConsumed?.toFixed(2) ?? '—'}</div>
                                            </td>
                                        )}
                                        {activeTab !== 'review' && (
                                            <td className="num-col">
                                                <div className={`fc-variance-badge ${invertedVar > 0 ? 'ok' : 'over'}`}>
                                                    <span>{invertedVar > 0 ? '+' : ''}{invertedVar.toFixed(2)}L</span>
                                                    <span className="fc-pct">({invertedVar > 0 ? '+' : ''}{invertedPct.toFixed(1)}%)</span>
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            {rec.isFlagged ? (
                                                <Chip size="small" icon={<AlertTriangle size={12}/>} label="Flagged" color="warning" variant="outlined" />
                                            ) : rec.status === 'PENDING_REVIEW' ? (
                                                <Chip size="small" label="Pending" color="default" variant="outlined" />
                                            ) : (
                                                <Chip size="small" icon={<CheckCircle2 size={12}/>} label="OK" color="success" variant="outlined" />
                                            )}
                                        </td>
                                        <td>
                                            {rec.isOdometerFlagged ? (
                                                <Chip
                                                    size="small"
                                                    icon={<Gauge size={12}/>}
                                                    label="Odo Mismatch"
                                                    color="error"
                                                    variant="outlined"
                                                    title={rec.odometerFlagReason}
                                                />
                                            ) : rec.status === 'PENDING_REVIEW' ? (
                                                <Chip size="small" icon={<Gauge size={12}/>} label="Needs Review" color="warning" variant="outlined" title={rec.reviewReason} />
                                            ) : rec.ocrOdometerReading != null ? (
                                                <Chip size="small" icon={<CheckCircle2 size={12}/>} label="OK" color="success" variant="outlined" />
                                            ) : (
                                                <span className="fc-secondary-text">—</span>
                                            )}
                                        </td>
                                        {activeTab === 'review' && (
                                            <td>
                                                <button
                                                    className="fc-btn fc-btn-primary"
                                                    style={{ padding: '4px 10px', fontSize: 12 }}
                                                    onClick={() => setReviewingTask(rec)}
                                                >
                                                    <Eye size={13} /> Review
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )})}
                                {activeRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="fc-empty-state">No matching records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {compTotalPages > 1 && (
                    <div className="fc-pagination">
                         <span className="fc-page-info">
                            Showing {(compPage - 1) * LIMIT + 1}–{Math.min(compPage * LIMIT, activeTotal)} of {activeTotal} records
                        </span>
                        <div className="fc-page-controls">
                            <button disabled={compPage === 1} onClick={() => setCompPage(p => p - 1)}>Prev</button>
                            <span>Page {compPage} of {compTotalPages}</span>
                            <button disabled={compPage === compTotalPages} onClick={() => setCompPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FuelComparisonPage;
