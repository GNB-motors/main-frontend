import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Fuel, AlertTriangle, CheckCircle2, Clock, RefreshCw,
    Activity, XCircle, Flag, Search, ShieldAlert, Gauge, Eye,
    Database, Wifi, WifiOff, Play, Loader2
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { CsvIcon } from '../../components/Icons';
import { getThemeCSS } from '../../utils/colorTheme';
import { getUserRole } from '../../utils/session.js';
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

const StatusKpiCard = (props) => {
    const { icon: Icon, label, value, colorClass } = props;
    return (
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
};

// ─── Live Errors Widget ───────────────────────────────────────────────────────

const LiveErrorsWidget = ({ status, isLoading, userErrors }) => {
    if (isLoading) return null;

    const reauthErrors = (userErrors || []).filter(e => e.errorCode === 'FLEETEDGE_REAUTH_REQUIRED');
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
                {reauthErrors.map((err, i) => (
                    <div key={`reauth-${i}`} className="fc-error-item fc-error-reauth">
                        <WifiOff size={12} />
                        <span className="fc-error-msg">
                            Re-auth needed: <strong>{err.externalFleetId || 'FleetEdge account'}</strong> — reconnect via the extension
                        </span>
                    </div>
                ))}
                {displayErrors.length === 0 && reauthErrors.length === 0 ? (
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

// ─── FleetEdge Connectivity Bar ───────────────────────────────────────────────

const FleetEdgeConnectivityBar = ({ connectivity, status }) => {
    if (!connectivity) return null;

    const accounts = connectivity.accounts || [];
    const pull = connectivity.pull || {};
    const connected = accounts.filter(a => a.status === 'ACTIVE').length;
    const needsReauth = accounts.filter(a => a.status === 'NEEDS_REAUTH').length;
    const pullingNow = status?.pullingNow > 0 || pull.running;

    const fmtTime = (iso) => {
        if (!iso) return null;
        return dayjs.utc(iso).tz(IST_ZONE).format('HH:mm');
    };

    return (
        <div className={`fc-connectivity-bar ${needsReauth > 0 ? 'fc-conn-degraded' : ''}`}>
            <div className="fc-conn-left">
                {needsReauth > 0 ? <WifiOff size={14} /> : <Wifi size={14} />}
                <span className="fc-conn-label">FleetEdge</span>
                <span className="fc-conn-chip fc-conn-ok">{connected} connected</span>
                {needsReauth > 0 && (
                    <span className="fc-conn-chip fc-conn-warn">{needsReauth} need re-auth</span>
                )}
            </div>
            <div className="fc-conn-right">
                {pullingNow && (
                    <span className="fc-conn-chip fc-conn-pulling">
                        <Loader2 size={11} className="fc-spin" /> pulling now
                    </span>
                )}
                {pull.lastRunAt && (
                    <span className="fc-conn-meta">last pull {fmtTime(pull.lastRunAt)}</span>
                )}
                {pull.nextRunAt && (
                    <span className="fc-conn-meta">next ~{fmtTime(pull.nextRunAt)}</span>
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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gauge size={18} /> Review Odometer Task — {task?.vehicleId?.registrationNumber || task?.vehicleNumber}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
                {/* Document photo */}
                {task?.odometerDoc?.publicUrl && (
                    <div className="mb-4">
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
                    </div>
                )}

                <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{task?.reviewReason}</p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="review-from-date">From Date (IST)</Label>
                        <Input
                            id="review-from-date"
                            type="datetime-local"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="review-to-date">To Date (IST)</Label>
                        <Input
                            id="review-to-date"
                            type="datetime-local"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="review-odometer">Corrected Odometer Reading (km)</Label>
                        <Input
                            id="review-odometer"
                            type="number"
                            value={odometerReading}
                            onChange={e => setOdometerReading(e.target.value)}
                            className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">FleetEdge reports: {task?.maxOdometer ?? '—'} km</p>
                    </div>
                </div>
                {error && (
                    <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleApprove} disabled={saving}>
                        {saving ? 'Approving…' : 'Approve & Release'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

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
            setTimeout(() => { fetchStatus(); fetchConnectivity(); }, 2500);
        } catch (err) {
            console.error('Pull now failed:', err);
        } finally {
            setIsPulling(false);
        }
    };

    useEffect(() => { fetchStatus(); fetchConnectivity(); fetchUserErrors(); }, [fetchStatus, fetchConnectivity, fetchUserErrors]);

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

    const reauthCount = (connectivity?.accounts || []).filter(a => a.status === 'NEEDS_REAUTH').length;

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
                    {canPullNow && (
                        <button
                            className="fc-btn fc-btn-secondary"
                            onClick={handlePullNow}
                            disabled={isPulling}
                            title="Trigger an immediate FleetEdge pull + backfill"
                        >
                            {isPulling
                                ? <><Loader2 size={15} className="fc-spin" /> Pulling…</>
                                : <><Play size={15} /> Pull Now</>
                            }
                        </button>
                    )}
                    <button className="fc-btn fc-btn-icon" onClick={() => { fetchStatus(); fetchConnectivity(); fetchUserErrors(); }} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                    <button className="fc-btn fc-btn-primary">
                        <CsvIcon width={16} height={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* FleetEdge connectivity summary */}
            <FleetEdgeConnectivityBar connectivity={connectivity} status={status} />

            {/* Reauth banner — shown when one or more accounts need re-authentication */}
            {reauthCount > 0 && (
                <div className="fc-reauth-banner">
                    <WifiOff size={14} />
                    <span>
                        {reauthCount} FleetEdge account{reauthCount > 1 ? 's' : ''} need re-authentication.
                        Open the gnbedge extension and click <strong>Reconnect</strong> on the affected account.
                    </span>
                </div>
            )}

            {/* Top Metrics Row */}
            <div className="fc-metrics-row">
                <StatusKpiCard icon={Activity} label="Pending Sync" value={status?.pending} colorClass="pending" />
                <StatusKpiCard icon={CheckCircle2} label="Successful" value={status?.completed} colorClass="success" />
                <StatusKpiCard icon={AlertTriangle} label="Flagged" value={status?.flagged} colorClass="warning" />
                <StatusKpiCard icon={Database} label="No Data" value={status?.noData ?? 0} colorClass="nodata" />
                <StatusKpiCard icon={XCircle} label="Needs Action" value={status?.needsAction ?? 0} colorClass="warning" />
                <LiveErrorsWidget status={status} isLoading={isLoadingStatus} userErrors={userErrors} />
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
                    </div>
                </div>

                <div className="fc-table-wrap">
                    {isLoadingComp ? (
                        <div className="fc-loading-state">
                            <Loader2 size={32} className="animate-spin" />
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
                                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700"><AlertTriangle size={12}/> Flagged</Badge>
                                            ) : rec.status === 'PENDING_REVIEW' ? (
                                                <Badge className="bg-amber-100 text-amber-800"><AlertTriangle size={12}/> Needs Action</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700"><CheckCircle2 size={12}/> OK</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {rec.isOdometerFlagged ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-red-300 bg-red-50 text-red-700"
                                                    title={rec.odometerFlagReason}
                                                >
                                                    <Gauge size={12}/> Odo Mismatch
                                                </Badge>
                                            ) : rec.status === 'PENDING_REVIEW' ? (
                                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700" title={rec.reviewReason}><Gauge size={12}/> Needs Review</Badge>
                                            ) : rec.ocrOdometerReading != null ? (
                                                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700"><CheckCircle2 size={12}/> OK</Badge>
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
