import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CircularProgress, Chip } from '@mui/material';
import {
    Fuel, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
    Search, MapPin, FileWarning, Droplets, ArrowLeft, Info
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import { formatINR } from '../../utils/formatters';
import EvidenceDrawer from '../../components/cluster/EvidenceDrawer.jsx';
import '../FuelComparison/FuelComparison.css';
import './FuelIntegrity.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_ZONE = 'Asia/Kolkata';
const FEED_LIMIT = 100;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);

const formatIST = (utcStr) => {
    const d = toIST(utcStr);
    return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—';
};

const formatRelativeIST = (utcStr) => {
    const d = toIST(utcStr);
    return d ? d.fromNow() : null;
};

const formatLitres = (value) =>
    value == null ? '—' : `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)} L`;

const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, sub, colorClass }) => (
    <div className={`fc-kpi-card fc-kpi-${colorClass}`}>
        <div className="fc-kpi-icon-wrap">
            {Icon ? <Icon size={20} /> : null}
        </div>
        <div className="fc-kpi-content">
            <span className="fc-kpi-label">{label}</span>
            <span className="fc-kpi-value">{value}</span>
            {sub && <span className="fi-kpi-sub">{sub}</span>}
        </div>
    </div>
);

// ─── Confirmation status badge ────────────────────────────────────────────────

const ConfirmationBadge = ({ status }) => {
    if (status === 'CONFIRMED') {
        return <Chip size="small" label="Confirmed" color="success" variant="outlined" />;
    }
    if (status === 'REJECTED') {
        return <Chip size="small" label="Rejected" color="default" variant="outlined" />;
    }
    return (
        <span title="Estimated from the tank-level jump — FleetEdge confirms in ~4h">
            <Chip size="small" icon={<Info size={12} />} label="Estimated" color="warning" variant="outlined" />
        </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FuelIntegrityPage = () => {
    const [themeColors] = useState(getThemeCSS());

    // Filters
    const [vehicleQuery, setVehicleQuery] = useState('');
    const [inputFromDate, setInputFromDate] = useState('');
    const [inputToDate, setInputToDate] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Data
    const [summary, setSummary] = useState(null);
    const [fills, setFills] = useState([]);
    const [windows, setWindows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Per-vehicle drill-down
    const [drillVehicle, setDrillVehicle] = useState(null);
    const [evidenceWindow, setEvidenceWindow] = useState(null);

    const buildParams = useCallback(() => {
        const params = {};
        if (vehicle) params.vehicle = vehicle;
        if (fromDate) params.from = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
        if (toDate) params.to = dayjs.tz(toDate, IST_ZONE).endOf('day').utc().toISOString();
        return params;
    }, [vehicle, fromDate, toDate]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = buildParams();
            const [summaryData, fillsData, windowsData] = await Promise.all([
                FuelIntegrityService.getSummary(params),
                FuelIntegrityService.getFills({ ...params, page: 1, limit: FEED_LIMIT }),
                FuelIntegrityService.getWindows(params),
            ]);
            setSummary(summaryData);
            setFills(fillsData.records || []);
            setWindows(windowsData.records || []);
        } catch (err) {
            setError(err.detail || 'Could not load fuel integrity data.');
        } finally {
            setIsLoading(false);
        }
    }, [buildParams]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const applyFilter = () => {
        setVehicle(vehicleQuery.trim());
        setFromDate(inputFromDate);
        setToDate(inputToDate);
    };

    const pricePerL = summary?.fuelPriceInrPerL ?? 95;

    // Merged events feed: ▲ fills + ▼ siphon-suspected windows, newest first
    const events = useMemo(() => {
        const fillEvents = fills.map((f) => ({
            id: `fill-${f._id}`,
            kind: 'fill',
            vehicle: f.registrationNumber,
            litres: f.litres,
            inr: f.litres != null ? f.litres * pricePerL : null,
            at: f.at,
            lat: f.lat,
            lng: f.lng,
            confirmationStatus: f.confirmationStatus,
            billFlag: f.billFlag,
            billVarianceL: f.billVarianceL,
        }));
        const lossEvents = windows
            .filter((w) => w.siphonSuspected)
            .map((w) => ({
                id: `loss-${w._id}`,
                kind: 'loss',
                vehicle: w.registrationNumber,
                litres: w.unaccountedLossL,
                inr: w.unaccountedLossL != null ? Math.max(0, w.unaccountedLossL) * pricePerL : null,
                at: w.windowTo,
                windowFrom: w.windowFrom,
                windowTo: w.windowTo,
                confidence: w.siphonConfidence,
            }));
        return [...fillEvents, ...lossEvents]
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, FEED_LIMIT);
    }, [fills, windows, pricePerL]);

    // Drill-down data for the selected vehicle
    const drillFills = useMemo(
        () => fills.filter((f) => f.registrationNumber === drillVehicle),
        [fills, drillVehicle],
    );
    const drillWindows = useMemo(
        () => windows.filter((w) => w.registrationNumber === drillVehicle),
        [windows, drillVehicle],
    );

    // Daily buckets (IST) for the drill-down timeline chart
    const drillChartData = useMemo(() => {
        const buckets = {};
        const bucketFor = (ts) => {
            const key = toIST(ts)?.format('DD MMM');
            if (!key) return null;
            if (!buckets[key]) buckets[key] = { day: key, fills: 0, loss: 0 };
            return buckets[key];
        };
        drillFills.forEach((f) => {
            const b = bucketFor(f.at);
            if (b) b.fills += f.litres || 0;
        });
        drillWindows.forEach((w) => {
            if (!w.siphonSuspected) return;
            const b = bucketFor(w.windowTo);
            if (b) b.loss += Math.max(0, w.unaccountedLossL || 0);
        });
        return Object.values(buckets).map((b) => ({
            ...b,
            fills: Math.round(b.fills * 10) / 10,
            loss: Math.round(b.loss * 10) / 10,
        }));
    }, [drillFills, drillWindows]);

    const totals = summary?.totals;

    return (
        <div className="fc-page" style={themeColors}>
            {/* Header */}
            <div className="fc-header-bar">
                <div className="fc-title-area">
                    <div className="fc-icon-wrap">
                        <Fuel size={24} color="#0f172a" />
                    </div>
                    <div>
                        <h1 className="fc-title">Fuel Integrity</h1>
                        <span className="fc-subtitle">
                            Tank-sensor mass balance per vehicle — all ₹ figures are estimates, flags mean please review
                        </span>
                    </div>
                </div>
                <div className="fc-header-actions">
                    <button className="fc-btn fc-btn-icon" onClick={fetchData} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {error && <div className="fi-error-banner"><AlertTriangle size={14} /> {error}</div>}

            {/* Fleet summary strip */}
            <div className="fc-metrics-row">
                <KpiCard
                    icon={TrendingUp}
                    label="Total Fills"
                    value={formatLitres(totals?.fillsLitres)}
                    sub={summary ? `last ${dayjs(summary.window?.to).diff(dayjs(summary.window?.from), 'day')} days` : ''}
                    colorClass="success"
                />
                <KpiCard
                    icon={TrendingDown}
                    label="Unexplained Loss"
                    value={formatLitres(totals?.siphonSuspectedLossL)}
                    sub="please review"
                    colorClass="warning"
                />
                <KpiCard
                    icon={AlertTriangle}
                    label="Est. Loss Value"
                    value={formatINR(totals?.siphonSuspectedLossInr)}
                    sub={`at ₹${pricePerL}/L (estimate)`}
                    colorClass="warning"
                />
                <KpiCard
                    icon={FileWarning}
                    label="Flagged Bills"
                    value={totals?.billFlagCount ?? 0}
                    sub="bill vs tank mismatch"
                    colorClass="pending"
                />
                <KpiCard
                    icon={Droplets}
                    label="DEF Flags"
                    value={totals?.defFlagCount ?? 0}
                    sub="AdBlue ratio off"
                    colorClass="nodata"
                />
            </div>

            {/* Filters */}
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

                {isLoading ? (
                    <div className="fc-loading-state">
                        <CircularProgress size={32} />
                        <p>Loading fuel integrity data...</p>
                    </div>
                ) : (
                    <>
                        {/* Events feed */}
                        <div className="fi-section-title">Events — fills ▲ and suspected losses ▼ (newest first)</div>
                        <div className="fi-events-list">
                            {events.length === 0 && (
                                <div className="fc-empty-state" style={{ padding: 24 }}>
                                    No fills or suspected losses in this window.
                                </div>
                            )}
                            {events.map((ev) => (
                                <div key={ev.id} className={`fi-event-row ${ev.kind === 'loss' ? 'fi-event-loss' : ''}`}>
                                    <div className={`fi-event-icon ${ev.kind === 'fill' ? 'fi-icon-fill' : 'fi-icon-loss'}`}>
                                        {ev.kind === 'fill' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <div className="fi-event-main">
                                        <div className="fi-event-topline">
                                            <span className="fc-primary-text">{ev.vehicle || '—'}</span>
                                            {ev.kind === 'fill' ? (
                                                <span className="fi-event-kind fi-kind-fill">Fill</span>
                                            ) : (
                                                <span
                                                    className="fi-event-kind fi-kind-loss"
                                                    title="Unaccounted loss — can also be sensor drift or a missed fill. Please review."
                                                >
                                                    Suspected loss{ev.confidence ? ` · ${ev.confidence.toLowerCase()} confidence` : ''}
                                                </span>
                                            )}
                                            {ev.billFlag && (
                                                <span className="fi-event-kind fi-kind-bill" title={`Bill variance ${ev.billVarianceL} L — please review`}>
                                                    Bill flag
                                                </span>
                                            )}
                                        </div>
                                        <div className="fi-event-subline">
                                            {ev.kind === 'loss' && ev.windowFrom && (
                                                <span>{toIST(ev.windowFrom)?.format('DD MMM')} → {toIST(ev.windowTo)?.format('DD MMM')} · </span>
                                            )}
                                            <span title={formatIST(ev.at)}>{formatRelativeIST(ev.at) || formatIST(ev.at)}</span>
                                            {ev.lat != null && ev.lng != null && (
                                                <>
                                                    {' · '}
                                                    <a
                                                        className="fi-map-link"
                                                        href={mapsLink(ev.lat, ev.lng)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <MapPin size={12} /> map
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="fi-event-figures">
                                        <span className={`fi-event-litres ${ev.kind === 'loss' ? 'fi-loss' : ''}`}>
                                            {ev.kind === 'fill' ? '+' : '−'}{formatLitres(Math.abs(ev.litres ?? 0))}
                                        </span>
                                        {ev.inr != null && (
                                            <span className="fi-event-inr">≈ {formatINR(ev.inr)} est.</span>
                                        )}
                                        {ev.kind === 'fill' && <ConfirmationBadge status={ev.confirmationStatus} />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Per-vehicle rollup */}
                        <div className="fi-section-title">Per-vehicle rollup</div>
                        <div className="fc-table-wrap">
                            <table className="fc-table">
                                <thead>
                                    <tr>
                                        <th>Vehicle</th>
                                        <th className="num-col">Fills (L)</th>
                                        <th className="num-col">Unexplained Loss (L)</th>
                                        <th className="num-col">Est. Loss (₹)</th>
                                        <th className="num-col">Flagged Bills</th>
                                        <th className="num-col">DEF Flags</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(summary?.vehicles || []).map((v) => (
                                        <tr key={v.registrationNumber}>
                                            <td><div className="fc-primary-text">{v.registrationNumber}</div></td>
                                            <td className="num-col"><div className="fc-primary-text">{v.fillsLitres}</div></td>
                                            <td className="num-col">
                                                <div className={`fc-primary-text ${v.siphonSuspectedLossL > 0 ? 'fi-loss' : ''}`}>
                                                    {v.siphonSuspectedLossL}
                                                </div>
                                            </td>
                                            <td className="num-col"><div className="fc-primary-text">{formatINR(v.siphonSuspectedLossInr)}</div></td>
                                            <td className="num-col">
                                                {v.billFlagCount > 0
                                                    ? <Chip size="small" label={v.billFlagCount} color="warning" variant="outlined" />
                                                    : <span className="fc-secondary-text">0</span>}
                                            </td>
                                            <td className="num-col">
                                                {v.defFlagCount > 0
                                                    ? <Chip size="small" label={v.defFlagCount} color="warning" variant="outlined" />
                                                    : <span className="fc-secondary-text">0</span>}
                                            </td>
                                            <td>
                                                <button
                                                    className="fc-btn fc-btn-primary"
                                                    style={{ padding: '4px 10px', fontSize: 12 }}
                                                    onClick={() => setDrillVehicle(v.registrationNumber)}
                                                >
                                                    Drill down
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(summary?.vehicles || []).length === 0 && (
                                        <tr><td colSpan="7" className="fc-empty-state">No fuel data in this window.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Per-vehicle drill-down */}
            {drillVehicle && !isLoading && (
                <div className="fc-content-card fi-drilldown">
                    <div className="fc-table-toolbar">
                        <div className="fi-section-title" style={{ margin: 0 }}>
                            {drillVehicle} — fuel timeline
                        </div>
                        <button className="fc-btn fc-btn-secondary" onClick={() => setDrillVehicle(null)}>
                            <ArrowLeft size={14} /> Close
                        </button>
                    </div>

                    {drillChartData.length > 0 ? (
                        <div className="fi-chart-wrap">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={drillChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} unit=" L" />
                                    <Tooltip formatter={(value, name) => [`${value} L`, name === 'fills' ? 'Fills ▲' : 'Suspected loss ▼']} />
                                    <Legend formatter={(value) => (value === 'fills' ? 'Fills ▲' : 'Suspected loss ▼')} />
                                    <Bar dataKey="fills" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="fc-empty-state" style={{ padding: 24 }}>No chart data for this vehicle in the window.</div>
                    )}

                    <div className="fi-section-title">Mass-balance windows</div>
                    <div className="fc-table-wrap">
                        <table className="fc-table">
                            <thead>
                                <tr>
                                    <th>Window</th>
                                    <th className="num-col">Fills (L)</th>
                                    <th className="num-col">Engine Burn (L)</th>
                                    <th className="num-col">Tank Δ (L)</th>
                                    <th className="num-col">Unaccounted (L)</th>
                                    <th>Review</th>
                                    <th className="num-col">DEF %</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {drillWindows.map((w) => (
                                    <tr key={w._id}>
                                        <td>
                                            <div className="fc-date-range">
                                                {toIST(w.windowFrom)?.format('DD MMM YY') || '—'} → {toIST(w.windowTo)?.format('DD MMM YY') || '—'}
                                            </div>
                                        </td>
                                        <td className="num-col"><div className="fc-primary-text">{w.fillsLitres ?? '—'}</div></td>
                                        <td className="num-col"><div className="fc-primary-text">{w.engineBurnL ?? '—'}</div></td>
                                        <td className="num-col"><div className="fc-primary-text">{w.tankDeltaL ?? '—'}</div></td>
                                        <td className="num-col">
                                            <div className={`fc-primary-text ${w.unaccountedLossL > 0 ? 'fi-loss' : ''}`}>
                                                {w.unaccountedLossL ?? '—'}
                                                {w.unaccountedLossPct != null && <span className="fc-pct"> ({w.unaccountedLossPct}%)</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {w.siphonSuspected ? (
                                                <span title="Unaccounted loss — can also be sensor drift, a unit misdetection or a missed fill. Please review.">
                                                    <Chip size="small" icon={<AlertTriangle size={12} />} label={`Please review · ${(w.siphonConfidence || 'low').toLowerCase()}`} color="warning" variant="outlined" />
                                                </span>
                                            ) : (
                                                <Chip size="small" label="OK" color="success" variant="outlined" />
                                            )}
                                        </td>
                                        <td className="num-col">
                                            {w.defRatioFlag ? (
                                                <Chip size="small" label={`${w.defToFuelRatioPct ?? '—'}% · ${w.defRatioFlag.toLowerCase()}`} color="warning" variant="outlined" title="AdBlue-to-fuel ratio off — please review" />
                                            ) : (
                                                <span className="fc-secondary-text">{w.defToFuelRatioPct != null ? `${w.defToFuelRatioPct}%` : '—'}</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="fc-btn fc-btn-secondary"
                                                style={{ padding: '4px 10px', fontSize: 12 }}
                                                onClick={() => setEvidenceWindow(w)}
                                            >
                                                Show working
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {drillWindows.length === 0 && (
                                    <tr><td colSpan="7" className="fc-empty-state">No mass-balance windows for this vehicle.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <EvidenceDrawer
                open={!!evidenceWindow}
                onClose={() => setEvidenceWindow(null)}
                window={evidenceWindow}
                context={{ fuelPriceInrPerL: pricePerL }}
            />
        </div>
    );
};

export default FuelIntegrityPage;
