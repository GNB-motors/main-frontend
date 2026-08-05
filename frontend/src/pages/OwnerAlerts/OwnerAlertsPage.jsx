import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Chip, FormControl, Select, MenuItem } from '@mui/material';
import {
    Bell, AlertTriangle, RefreshCw, Search, Check, Loader2, Truck
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { OwnerAlertsService, ALERT_TYPE_LABELS } from './OwnerAlertsService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import { formatINR } from '../../utils/formatters';
import '../FuelComparison/FuelComparison.css';
import './OwnerAlerts.css';

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

const OwnerAlertsPage = () => {
    const [themeColors] = useState(getThemeCSS());

    // Filters
    const [vehicleQuery, setVehicleQuery] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [type, setType] = useState('');
    const [ackFilter, setAckFilter] = useState('unacknowledged');

    // Data
    const [alerts, setAlerts] = useState([]);
    const [total, setTotal] = useState(0);
    const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ackingId, setAckingId] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = { page, limit: LIMIT };
            if (vehicle) params.vehicle = vehicle;
            if (type) params.type = type;
            if (ackFilter !== 'all') params.acknowledged = ackFilter === 'acknowledged';
            const data = await OwnerAlertsService.getAlerts(params);
            setAlerts(data.records || []);
            setTotal(data.total || 0);
            setUnacknowledgedCount(data.unacknowledgedCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            setError(err.detail || 'Could not load alerts.');
        } finally {
            setIsLoading(false);
        }
    }, [vehicle, type, ackFilter, page]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [vehicle, type, ackFilter]);

    const applyVehicleFilter = () => setVehicle(vehicleQuery.trim());

    const handleAck = async (id) => {
        setAckingId(id);
        try {
            await OwnerAlertsService.acknowledgeAlert(id);
            await fetchData();
        } catch (err) {
            setError(err.detail || 'Could not acknowledge the alert.');
        } finally {
            setAckingId(null);
        }
    };

    return (
        <div className="fc-page" style={themeColors}>
            {/* Header */}
            <div className="fc-header-bar">
                <div className="fc-title-area">
                    <div className="fc-icon-wrap">
                        <Bell size={24} color="#0f172a" />
                    </div>
                    <div>
                        <h1 className="fc-title">Owner Alerts</h1>
                        <span className="fc-subtitle">
                            In-app alerts across your fleet — everything here means please review, nothing is an accusation
                        </span>
                    </div>
                </div>
                <div className="fc-header-actions">
                    {unacknowledgedCount > 0 && (
                        <span className="oa-unacked-badge">{unacknowledgedCount} to review</span>
                    )}
                    <button className="fc-btn fc-btn-icon" onClick={fetchData} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="oa-error-banner"><AlertTriangle size={14} /> {error}</div>
            )}

            {/* Filters */}
            <div className="fc-content-card">
                <div className="fc-table-toolbar">
                    <div className="fc-filters">
                        <div className="fc-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Vehicle number..."
                                value={vehicleQuery}
                                onChange={(e) => setVehicleQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyVehicleFilter()}
                            />
                        </div>
                        <button className="fc-btn fc-btn-primary fc-filter-btn" onClick={applyVehicleFilter}>
                            Filter
                        </button>
                        <FormControl size="small" className="fc-select">
                            <Select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                displayEmpty
                                sx={{ minHeight: '36px', height: '36px', fontSize: '13px', borderRadius: '8px', minWidth: 190 }}
                            >
                                <MenuItem value="">All Types</MenuItem>
                                {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                                    <MenuItem key={value} value={value}>{label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" className="fc-select">
                            <Select
                                value={ackFilter}
                                onChange={(e) => setAckFilter(e.target.value)}
                                displayEmpty
                                sx={{ minHeight: '36px', height: '36px', fontSize: '13px', borderRadius: '8px', minWidth: 160 }}
                            >
                                <MenuItem value="unacknowledged">To Review</MenuItem>
                                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                                <MenuItem value="all">All</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>

                {/* Alert feed */}
                {isLoading ? (
                    <div className="fc-loading-state">
                        <CircularProgress size={32} />
                        <p>Loading alerts...</p>
                    </div>
                ) : (
                    <div className="oa-alerts-list">
                        {alerts.length === 0 && (
                            <div className="fc-empty-state" style={{ padding: 24 }}>
                                No alerts match these filters.
                            </div>
                        )}
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`oa-alert-card ${alert.acknowledged ? 'oa-acked' : ''}`}>
                                <div className="oa-alert-icon">
                                    <AlertTriangle size={16} />
                                </div>
                                <div className="oa-alert-main">
                                    <div className="oa-alert-hero">
                                        {alert.inrEstimate != null && (
                                            <span className="oa-alert-inr">{formatINR(alert.inrEstimate)} est.</span>
                                        )}
                                        <span className="oa-alert-message">{alert.message}</span>
                                    </div>
                                    <div className="oa-alert-meta">
                                        <Chip
                                            size="small"
                                            label={ALERT_TYPE_LABELS[alert.type] || alert.type}
                                            color={alert.type === 'FUEL_SIPHON_SUSPECTED' ? 'warning' : 'default'}
                                            variant="outlined"
                                        />
                                        {alert.vehicleNumber && (
                                            <span className="oa-alert-vehicle"><Truck size={12} /> {alert.vehicleNumber}</span>
                                        )}
                                        <span title={formatIST(alert.at)}>{formatRelativeIST(alert.at) || formatIST(alert.at)}</span>
                                    </div>
                                </div>
                                {!alert.acknowledged && (
                                    <button
                                        className="fc-btn fc-btn-secondary oa-ack-btn"
                                        disabled={ackingId === alert.id}
                                        onClick={() => handleAck(alert.id)}
                                    >
                                        {ackingId === alert.id
                                            ? <><Loader2 size={13} className="fc-spin" /> Saving…</>
                                            : <><Check size={13} /> Acknowledge</>}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="fc-pagination">
                        <span className="fc-page-info">
                            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} alerts
                        </span>
                        <div className="fc-page-controls">
                            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                            <span>Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerAlertsPage;
