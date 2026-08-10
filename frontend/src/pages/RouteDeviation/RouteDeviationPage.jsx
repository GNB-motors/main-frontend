import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Chip } from '@mui/material';
import {
    Route, AlertTriangle, RefreshCw, Search, CheckCircle2, Eye, Loader2
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RouteDeviationService } from './RouteDeviationService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import '../FuelComparison/FuelComparison.css';

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

const formatInr = (value) =>
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value || 0))}`;

const KpiCard = ({ icon: Icon, label, value, sub, colorClass }) => (
    <div className={`fc-kpi-card fc-kpi-${colorClass}`}>
        <div className="fc-kpi-icon-wrap">
            {Icon ? <Icon size={20} /> : null}
        </div>
        <div className="fc-kpi-content">
            <span className="fc-kpi-label">{label}</span>
            <span className="fc-kpi-value">{value}</span>
            {sub && <span style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</span>}
        </div>
    </div>
);

const RouteDeviationPage = () => {
    const [themeColors] = useState(getThemeCSS());

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

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [vehicle, fromDate, toDate]);

    const applyFilter = () => {
        setVehicle(vehicleQuery.trim());
        setFromDate(inputFromDate);
        setToDate(inputToDate);
    };

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

    return (
        <div className="fc-page" style={themeColors}>
            {/* Header */}
            <div className="fc-header-bar">
                <div className="fc-title-area">
                    <div className="fc-icon-wrap">
                        <Route size={24} color="#0f172a" />
                    </div>
                    <div>
                        <h1 className="fc-title">Route Deviation</h1>
                        <span className="fc-subtitle">
                            Trips that left their usual corridor — costs are estimates, flags mean please review
                        </span>
                    </div>
                </div>
                <div className="fc-header-actions">
                    <button className="fc-btn fc-btn-icon" onClick={fetchData} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {/* KPI strip */}
            <div className="fc-metrics-row">
                <KpiCard icon={AlertTriangle} label="Open — please review" value={openCount} colorClass="warning" />
                <KpiCard icon={Route} label="Events in window" value={total} colorClass="pending" />
                <KpiCard icon={CheckCircle2} label="Reviewed" value={Math.max(0, total - openCount)} colorClass="success" />
                <KpiCard icon={Eye} label="Est. detour cost (page)" value={formatInr(pageCostInr)} sub="estimate" colorClass="nodata" />
            </div>

            {/* Table */}
            <div className="fc-content-card">
                <div className="fc-table-toolbar">
                    <div className="fc-filters">
                        <div className="fc-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Vehicle number (e.g. WB25R9540)..."
                                value={vehicleQuery}
                                onChange={(e) => setVehicleQuery(e.target.value)}
                            />
                        </div>
                        <input
                            type="date"
                            className="fc-date-input"
                            title="From Date"
                            value={inputFromDate}
                            onChange={(e) => setInputFromDate(e.target.value)}
                        />
                        <span style={{ color: '#94a3b8' }}>-</span>
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
                    </div>
                </div>

                <div className="fc-table-wrap">
                    {isLoading ? (
                        <div className="fc-loading-state">
                            <CircularProgress size={32} />
                            <p>Loading route deviation events...</p>
                        </div>
                    ) : (
                        <table className="fc-table">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Trip</th>
                                    <th className="num-col">Max Off-route (km)</th>
                                    <th className="num-col">Extra km (est.)</th>
                                    <th className="num-col">Est. Cost (₹)</th>
                                    <th>Detected</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((ev) => (
                                    <tr key={ev._id}>
                                        <td><div className="fc-primary-text">{ev.registrationNumber || '—'}</div></td>
                                        <td>
                                            <div className="fc-secondary-text" title={ev.tripId}>
                                                {ev.tripId ? `…${String(ev.tripId).slice(-6)}` : '—'}
                                            </div>
                                        </td>
                                        <td className="num-col"><div className="fc-primary-text">{ev.maxOffKm ?? '—'}</div></td>
                                        <td className="num-col"><div className="fc-primary-text">{ev.extraKmEstimate ?? '—'}</div></td>
                                        <td className="num-col">
                                            <div className="fc-primary-text">
                                                {ev.estimatedExtraCostInr != null ? formatInr(ev.estimatedExtraCostInr) : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fc-secondary-text" title={formatIST(ev.detectedAt)}>
                                                {formatRelativeIST(ev.detectedAt) || formatIST(ev.detectedAt)}
                                            </div>
                                        </td>
                                        <td>
                                            {ev.status === 'OPEN' ? (
                                                <Chip size="small" icon={<AlertTriangle size={12} />} label="Please review" color="warning" variant="outlined" />
                                            ) : (
                                                <Chip size="small" icon={<CheckCircle2 size={12} />} label="Reviewed" color="success" variant="outlined" />
                                            )}
                                        </td>
                                        <td>
                                            {ev.status === 'OPEN' && (
                                                <button
                                                    className="fc-btn fc-btn-primary"
                                                    style={{ padding: '4px 10px', fontSize: 12 }}
                                                    disabled={reviewingId === ev._id}
                                                    onClick={() => handleReview(ev._id)}
                                                >
                                                    {reviewingId === ev._id
                                                        ? <><Loader2 size={13} className="fc-spin" /> Saving…</>
                                                        : <><Eye size={13} /> Mark reviewed</>}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && (
                                    <tr><td colSpan="8" className="fc-empty-state">No route deviations in this window.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="fc-pagination">
                        <span className="fc-page-info">
                            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} events
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

export default RouteDeviationPage;
