import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Gauge, Satellite, AlertTriangle, CheckCircle2,
  Fuel, Ruler, Activity, Clock, Droplets, TrendingUp, TrendingDown,
  Minus, XCircle, Info,
} from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v, decimals = 2, unit = '') => {
  if (v == null) return '—';
  return `${Number(v).toFixed(decimals)}${unit ? ' ' + unit : ''}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const fmtDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Returns { color, bg, label, Icon } for a variance percentage
const getVarianceMeta = (pct) => {
  if (pct == null) return { color: '#6b7280', bg: '#f3f4f6', label: '—', Icon: Minus };
  const abs = Math.abs(pct);
  if (abs <= 10)  return { color: '#15803d', bg: '#f0fdf4', label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, Icon: CheckCircle2 };
  if (abs <= 50)  return { color: '#c56200', bg: '#fffbeb', label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, Icon: AlertTriangle };
  return          { color: '#b91c1c', bg: '#fef2f2', label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, Icon: XCircle };
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const DetailCard = ({ title, icon: Icon, iconColor = '#2A4FD6', children }) => (
  <div className="mid-detail-card">
    <div className="mid-card-header">
      <div className="mid-card-icon" style={{ background: `${iconColor}18`, color: iconColor }}>
        <Icon size={18} />
      </div>
      <h3 className="mid-card-title">{title}</h3>
    </div>
    {children}
  </div>
);

const MetricRow = ({ label, value, unit, highlight }) => (
  <div className="mid-metric-row">
    <span className="mid-metric-label">{label}</span>
    <span className="mid-metric-value" style={highlight ? { color: '#2A4FD6', fontWeight: 700 } : {}}>
      {value ?? '—'}{unit ? ` ${unit}` : ''}
    </span>
  </div>
);

const VarianceRow = ({ label, system, gps, varianceKm, variancePct, unit = '' }) => {
  const meta = getVarianceMeta(variancePct);
  const { Icon: VIcon } = meta;
  return (
    <div className="mid-variance-row">
      <span className="mid-variance-label">{label}</span>
      <div className="mid-variance-cells">
        <div className="mid-variance-cell system">
          <span className="mid-vc-sub">System</span>
          <span className="mid-vc-val">{system != null ? `${Number(system).toFixed(2)}${unit}` : '—'}</span>
        </div>
        <div className="mid-variance-vs">vs</div>
        <div className="mid-variance-cell gps">
          <span className="mid-vc-sub">GPS</span>
          <span className="mid-vc-val">{gps != null ? `${Number(gps).toFixed(2)}${unit}` : '—'}</span>
        </div>
        <div className="mid-variance-badge-wrap">
          <span className="mid-variance-badge" style={{ background: meta.bg, color: meta.color }}>
            <VIcon size={12} />
            {varianceKm != null ? `Δ ${Math.abs(varianceKm).toFixed(1)}${unit}` : ''}
            {' '}{meta.label}
          </span>
        </div>
      </div>
    </div>
  );
};

const FuelLogEntry = ({ log, label, type }) => {
  const typeColors = {
    start: { bg: '#eff6ff', border: '#bfdbfe', label: '#1d4ed8' },
    partial: { bg: '#fefce8', border: '#fde68a', label: '#b45309' },
    end: { bg: '#f0fdf4', border: '#bbf7d0', label: '#15803d' },
  };
  const c = typeColors[type] || typeColors.partial;
  if (!log) return null;
  return (
    <div className="mid-fuellog-entry" style={{ background: c.bg, borderColor: c.border }}>
      <div className="mid-fuellog-badge" style={{ background: c.border, color: c.label }}>{label}</div>
      <div className="mid-fuellog-details">
        <span><Fuel size={13} /> {fmt(log.litres, 2, 'L')}</span>
        <span><Gauge size={13} /> {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}</span>
        <span><Clock size={13} /> {fmtDate(log.refuelTime)}</span>
        {log.location && <span>📍 {log.location}</span>}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const MileageIntervalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interval, setInterval] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  useEffect(() => {
    const fetchInterval = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/api/mileage/intervals/${id}`);
        setInterval(res.data?.data);
      } catch {
        toast.error('Failed to load mileage interval');
        navigate('/mileage-tracking');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchInterval();
  }, [id]);

  if (isLoading) {
    return (
      <div className="mid-page">
        <div className="loading-state"><p>Loading interval data...</p></div>
      </div>
    );
  }

  if (!interval) return null;

  const fe = interval.fleetEdge || {};
  const feComputed = fe.status === 'COMPUTED';
  const vehName = interval.vehicleId?.registrationNumber || 'Unknown Vehicle';

  // Flag indicators
  const flags = fe.flagReasons || [];
  const hasFuelFlag = fe.isFlaggedFuel;
  const hasDistFlag = fe.isFlaggedDistance;
  const hasMileFlag = fe.isFlaggedMileage;
  const hasAnyFlag  = hasFuelFlag || hasDistFlag || hasMileFlag;

  return (
    <div className="mid-page">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mid-header">
        <div className="mid-header-left">
          <button className="mileage-back-circle" onClick={() => navigate('/mileage-tracking')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="mid-title">{vehName}</h2>
            <p className="mid-subtitle">
              {fmtDateShort(interval.startDate)} → {fmtDateShort(interval.endDate || interval.startDate)}
            </p>
          </div>
        </div>
        <div className="mid-header-badges">
          <span
            className="status-badge"
            style={interval.status === 'COMPLETED'
              ? { background: 'rgba(37,186,76,0.1)', color: '#187A32' }
              : { background: 'rgba(251,191,35,0.1)', color: '#C56200' }}
          >
            {interval.status}
          </span>
          {feComputed && hasAnyFlag && (
            <span className="status-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#b91c1c' }}>
              <AlertTriangle size={12} style={{ marginRight: 4 }} />Anomaly Detected
            </span>
          )}
          {feComputed && !hasAnyFlag && (
            <span className="status-badge" style={{ background: 'rgba(37,186,76,0.1)', color: '#187A32' }}>
              <CheckCircle2 size={12} style={{ marginRight: 4 }} />GPS Validated ✓
            </span>
          )}
        </div>
      </div>

      <div className="mid-content">

        {/* ── Flag Alert Banner ─────────────────────────────────────────────── */}
        {feComputed && hasAnyFlag && flags.length > 0 && (
          <div className="mid-flag-banner">
            <AlertTriangle size={18} />
            <div>
              <strong>Anomalies detected in FleetEdge comparison</strong>
              <ul className="mid-flag-list">
                {flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* ── Top Row: System + FleetEdge cards ────────────────────────────── */}
        <div className="mid-top-row">

          {/* System Mileage Card */}
          <DetailCard title="System Mileage (Bill-Based)" icon={Gauge} iconColor="#2A4FD6">
            <div className="mid-metric-list">
              <MetricRow label="Start Odometer" value={interval.startOdometer != null ? `${interval.startOdometer.toLocaleString()} km` : '—'} />
              <MetricRow label="End Odometer"   value={interval.endOdometer != null ? `${interval.endOdometer.toLocaleString()} km` : '—'} />
              <MetricRow label="Distance"       value={fmt(interval.distanceKm, 1, 'km')} />
              <MetricRow label="Fuel Consumed"  value={fmt(interval.fuelConsumedLiters, 2, 'L')} />
              <MetricRow label="Mileage"        value={fmt(interval.mileageKmPerL, 2, 'km/L')} highlight />
              <MetricRow label="Period Start"   value={fmtDate(interval.startDate)} />
              <MetricRow label="Period End"     value={fmtDate(interval.endDate)} />
            </div>
          </DetailCard>

          {/* FleetEdge GPS Card */}
          {feComputed ? (
            <DetailCard title="FleetEdge GPS Validation" icon={Satellite} iconColor="#0891b2">
              <div className="mid-metric-list">
                <MetricRow label="GPS Distance"      value={fmt(fe.distanceKm, 1, 'km')} />
                <MetricRow label="GPS Fuel Consumed" value={fmt(fe.fuelConsumedL, 2, 'L')} />
                <MetricRow label="GPS Mileage"       value={fmt(fe.mileageKmPerL, 2, 'km/L')} highlight />
                <MetricRow label="Snapshots"         value={fe.snapshotCount ?? '—'} />
                <MetricRow label="First Snapshot"    value={fmtDate(fe.firstSnapshotAt)} />
                <MetricRow label="Last Snapshot"     value={fmtDate(fe.lastSnapshotAt)} />
                <MetricRow label="Computed At"       value={fmtDate(fe.computedAt)} />
              </div>
            </DetailCard>
          ) : (
            <DetailCard title="FleetEdge GPS Validation" icon={Satellite} iconColor="#6b7280">
              <div className="mid-gps-pending">
                {fe.status === 'FAILED' ? (
                  <>
                    <XCircle size={40} color="#b91c1c" />
                    <p className="mid-gps-pending-title">GPS Validation Failed</p>
                    <p className="mid-gps-pending-sub">{fe.failureReason || 'FleetEdge returned no data for this vehicle.'}</p>
                    <p className="mid-gps-pending-sub">Attempts: {fe.attempts ?? 0}</p>
                  </>
                ) : (
                  <>
                    <Satellite size={40} color="#94a3b8" />
                    <p className="mid-gps-pending-title">GPS Data Pending</p>
                    <p className="mid-gps-pending-sub">FleetEdge comparison has not been completed yet for this interval. The sync will run automatically.</p>
                  </>
                )}
              </div>
            </DetailCard>
          )}
        </div>

        {/* ── Variance Comparison ──────────────────────────────────────────── */}
        {feComputed && (
          <DetailCard title="Variance Comparison — System vs GPS" icon={Activity} iconColor="#7c3aed">
            <div className="mid-variance-list">
              <VarianceRow
                label="Distance"
                system={interval.distanceKm}
                gps={fe.distanceKm}
                varianceKm={fe.distanceVarianceKm}
                variancePct={fe.distanceVariancePct}
                unit=" km"
              />
              <VarianceRow
                label="Fuel Consumed"
                system={interval.fuelConsumedLiters}
                gps={fe.fuelConsumedL}
                varianceKm={fe.fuelVarianceL}
                variancePct={fe.fuelVariancePct}
                unit=" L"
              />
              <VarianceRow
                label="Mileage"
                system={interval.mileageKmPerL}
                gps={fe.mileageKmPerL}
                varianceKm={fe.mileageVariance}
                variancePct={fe.mileageVariancePct}
                unit=" km/L"
              />
            </div>
            <div className="mid-variance-legend">
              <span style={{ color: '#15803d' }}><CheckCircle2 size={12} /> ≤10% — Normal</span>
              <span style={{ color: '#c56200' }}><AlertTriangle size={12} /> 10–50% — Review</span>
              <span style={{ color: '#b91c1c' }}><XCircle size={12} /> &gt;50% — Flagged</span>
            </div>
          </DetailCard>
        )}

        {/* ── Fuel Logs ─────────────────────────────────────────────────────── */}
        <DetailCard title="Fuel Logs in this Interval" icon={Droplets} iconColor="#0891b2">
          <div className="mid-fuellog-list">
            <FuelLogEntry log={interval.startFuelLogId} label="Full Tank (Start)" type="start" />
            {(interval.partialFuelLogIds || []).map((log, i) => (
              <FuelLogEntry key={log._id || i} log={log} label={`Partial Fill ${i + 1}`} type="partial" />
            ))}
            {interval.endFuelLogId && (
              <FuelLogEntry log={interval.endFuelLogId} label="Full Tank (End)" type="end" />
            )}
            {!interval.endFuelLogId && (
              <div className="mid-fuellog-ongoing">
                <Info size={14} /> Interval is still <strong>ONGOING</strong> — awaiting next full tank fill.
              </div>
            )}
          </div>
        </DetailCard>

      </div>
    </div>
  );
};

export default MileageIntervalDetailPage;
