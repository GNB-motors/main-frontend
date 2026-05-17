import { formatDateIST, formatDateTimeIST } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Gauge, Satellite, AlertTriangle, CheckCircle2,
  Fuel, Activity, Clock, Droplets, MapPin,
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

const fmtDate = (d) => d ? formatDateTimeIST(d) : '—';

const fmtDateShort = (d) => d ? formatDateIST(d) : '—';

const getVarianceMeta = (pct) => {
  if (pct == null) return { color: '#6b7280', bg: '#f3f4f6', label: '—', Icon: Minus };
  const abs = Math.abs(pct);
  if (abs <= 10)  return { color: '#15803d', bg: '#f0fdf4', label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, Icon: CheckCircle2 };
  if (abs <= 50)  return { color: '#c56200', bg: '#fffbeb', label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, Icon: AlertTriangle };
  return          { color: '#b91c1c', bg: '#fef2f2', label: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`, Icon: XCircle };
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, iconColor = '#2A4FD6', children }) => (
  <div className="mid2-card">
    <div className="mid2-card-header">
      <div className="mid2-card-icon" style={{ background: `${iconColor}14`, color: iconColor }}>
        <Icon size={18} />
      </div>
      <h3 className="mid2-card-title">{title}</h3>
    </div>
    {children}
  </div>
);

const MetricRow = ({ label, value, highlight }) => (
  <div className="mid2-metric-row">
    <span className="mid2-metric-label">{label}</span>
    <span className={`mid2-metric-value ${highlight ? 'mid2-metric-highlight' : ''}`}>
      {value ?? '—'}
    </span>
  </div>
);

const VarianceBlock = ({ label, system, gps, varianceKm, variancePct, unit = '' }) => {
  const meta = getVarianceMeta(variancePct);
  const { Icon: VIcon } = meta;

  // Calculate bar ratio (how much of the bar each value fills)
  const sysVal = system ?? 0;
  const gpsVal = gps ?? 0;
  const maxVal = Math.max(sysVal, gpsVal);
  const sysPct = maxVal > 0 ? (sysVal / maxVal) * 100 : 0;
  const gpsPct = maxVal > 0 ? (gpsVal / maxVal) * 100 : 0;

  return (
    <div className="mid2-variance-block">
      <div className="mid2-vb-title">{label}</div>
      <div className="mid2-vb-values">
        <div className="mid2-vb-col">
          <span className="mid2-vb-sub">SYSTEM</span>
          <span className="mid2-vb-val">{system != null ? `${Number(system).toFixed(2)}${unit}` : '—'}</span>
        </div>
        <span className="mid2-vb-vs">vs</span>
        <div className="mid2-vb-col">
          <span className="mid2-vb-sub">GPS</span>
          <span className="mid2-vb-val">{gps != null ? `${Number(gps).toFixed(2)}${unit}` : '—'}</span>
        </div>
      </div>
      <div className="mid2-vb-bars">
        <div className="mid2-vb-bar-track">
          <div className="mid2-vb-bar-fill mid2-vb-bar-sys" style={{ width: `${sysPct}%` }} />
        </div>
        <div className="mid2-vb-bar-track">
          <div className="mid2-vb-bar-fill mid2-vb-bar-gps" style={{ width: `${gpsPct}%` }} />
        </div>
      </div>
      <div className="mid2-vb-delta" style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}33` }}>
        <VIcon size={13} />
        <span>
          {varianceKm != null ? `Δ ${Math.abs(varianceKm).toFixed(1)}${unit}` : ''}
          {' '}{meta.label}
        </span>
      </div>
    </div>
  );
};

const TimelineEntry = ({ log, label, type, isLast }) => {
  const dotColor = type === 'partial' ? '#f59e0b' : '#22c55e';
  const labelColor = type === 'partial' ? '#b45309' : '#15803d';
  if (!log) return null;
  return (
    <div className="mid2-tl-entry">
      <div className="mid2-tl-track">
        <div className="mid2-tl-dot" style={{ backgroundColor: dotColor }} />
        {!isLast && <div className="mid2-tl-line" />}
      </div>
      <div className="mid2-tl-content">
        <div className="mid2-tl-label" style={{ color: labelColor }}>{label.toUpperCase()}</div>
        <div className="mid2-tl-details">
          <span className="mid2-tl-item"><Fuel size={13} /> {fmt(log.litres, 2, 'L')}</span>
          <span className="mid2-tl-item"><Gauge size={13} /> {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}</span>
          <span className="mid2-tl-item"><Clock size={13} /> {fmtDate(log.refuelTime)}</span>
          {log.location && <span className="mid2-tl-item"><MapPin size={13} /> {log.location}</span>}
        </div>
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
        const data = res.data?.data;
        if (data) {
          setInterval(data);
        } else {
          toast.error('Mileage interval not found');
          navigate('/mileage-tracking');
        }
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
      <div className="mid2-page">
        <div className="loading-state"><p>Loading interval data...</p></div>
      </div>
    );
  }

  if (!interval) return null;

  const fe = interval.fleetEdge || {};
  const feComputed = fe.status === 'COMPUTED';
  const vehName = interval.vehicleId?.registrationNumber || 'Unknown Vehicle';

  const flags = fe.flagReasons || [];
  const hasFuelFlag = fe.isFlaggedFuel;
  const hasDistFlag = fe.isFlaggedDistance;
  const hasMileFlag = fe.isFlaggedMileage;
  const hasAnyFlag = hasFuelFlag || hasDistFlag || hasMileFlag;

  // Collect all fuel log entries for the timeline
  const fuelEntries = [];
  if (interval.startFuelLogId) fuelEntries.push({ log: interval.startFuelLogId, label: 'Full Tank (Start)', type: 'start' });
  (interval.partialFuelLogIds || []).forEach((log, i) => {
    fuelEntries.push({ log, label: `Partial Fill ${i + 1}`, type: 'partial' });
  });
  if (interval.endFuelLogId) fuelEntries.push({ log: interval.endFuelLogId, label: 'Full Tank (End)', type: 'end' });

  return (
    <div className="mid2-page">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mid2-header">
        <div className="mid2-header-bottom">
          <div className="mid2-header-left">
            <button className="mid2-back-btn" onClick={() => navigate('/mileage-tracking')} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="mid2-title">{vehName}</h2>
              <p className="mid2-subtitle">
                {fmtDateShort(interval.startDate)} → {fmtDateShort(interval.endDate || interval.startDate)}
              </p>
            </div>
          </div>
          <div className="mid2-header-right">
            <span
              className="mid2-badge"
              style={interval.status === 'COMPLETED'
                ? { background: 'rgba(37,186,76,0.08)', color: '#15803d', border: '1px solid rgba(37,186,76,0.2)' }
                : { background: 'rgba(251,191,35,0.08)', color: '#b45309', border: '1px solid rgba(251,191,35,0.2)' }}
            >
              {interval.status}
            </span>
            {feComputed && hasAnyFlag && (
              <span className="mid2-badge" style={{ background: 'rgba(239,68,68,0.08)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={12} /> Anomaly Detected
              </span>
            )}
            {feComputed && !hasAnyFlag && (
              <span className="mid2-badge" style={{ background: 'rgba(37,186,76,0.08)', color: '#15803d', border: '1px solid rgba(37,186,76,0.2)' }}>
                <CheckCircle2 size={12} /> GPS Validated ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="mid2-content">

        {/* Flag Alert */}
        {feComputed && hasAnyFlag && flags.length > 0 && (
          <div className="mid2-flag-banner">
            <AlertTriangle size={18} />
            <div>
              <strong>Anomalies detected in FleetEdge comparison</strong>
              <ul className="mid2-flag-list">
                {flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* ── Top Row: System + GPS ────────────────────────────────── */}
        <div className="mid2-grid-2">

          {/* System Mileage */}
          <SectionCard title="System Mileage (Bill-Based)" icon={Gauge} iconColor="#2A4FD6">
            <div className="mid2-metric-list">
              <MetricRow label="Start Odometer" value={interval.startOdometer != null ? `${interval.startOdometer.toLocaleString()} km` : '—'} />
              <MetricRow label="End Odometer" value={interval.endOdometer != null ? `${interval.endOdometer.toLocaleString()} km` : '—'} />
              <MetricRow label="Distance" value={fmt(interval.distanceKm, 1, 'km')} />
              <MetricRow label="Fuel Consumed" value={fmt(interval.fuelConsumedLiters, 2, 'L')} />
              <MetricRow label="Mileage" value={fmt(interval.mileageKmPerL, 2, 'km/L')} highlight />
              <MetricRow label="Period Start" value={fmtDate(interval.startDate)} />
              <MetricRow label="Period End" value={fmtDate(interval.endDate)} />
            </div>
          </SectionCard>

          {/* FleetEdge GPS */}
          {feComputed ? (
            <SectionCard title="FleetEdge GPS Validation" icon={Satellite} iconColor="#0891b2">
              <div className="mid2-metric-list">
                <MetricRow label="GPS Distance" value={fmt(fe.distanceKm, 1, 'km')} />
                <MetricRow label="GPS Fuel Consumed" value={fmt(fe.fuelConsumedL, 2, 'L')} />
                <MetricRow label="GPS Mileage" value={fmt(fe.mileageKmPerL, 2, 'km/L')} highlight />
                <MetricRow label="Snapshots" value={fe.snapshotCount ?? '—'} />
                <MetricRow label="First Snapshot" value={fmtDate(fe.firstSnapshotAt)} />
                <MetricRow label="Last Snapshot" value={fmtDate(fe.lastSnapshotAt)} />
                <MetricRow label="Computed At" value={fmtDate(fe.computedAt)} />
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="FleetEdge GPS Validation" icon={Satellite} iconColor="#6b7280">
              <div className="mid2-gps-empty">
                {fe.status === 'FAILED' ? (
                  <>
                    <XCircle size={40} color="#b91c1c" />
                    <p className="mid2-gps-empty-title">GPS Validation Failed</p>
                    <p className="mid2-gps-empty-sub">{fe.failureReason || 'FleetEdge returned no data for this vehicle.'}</p>
                    <p className="mid2-gps-empty-sub">Attempts: {fe.attempts ?? 0}</p>
                  </>
                ) : (
                  <>
                    <Satellite size={40} color="#94a3b8" />
                    <p className="mid2-gps-empty-title">GPS Data Pending</p>
                    <p className="mid2-gps-empty-sub">FleetEdge comparison has not been completed yet for this interval. The sync will run automatically.</p>
                  </>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Variance Comparison ──────────────────────────────────── */}
        {feComputed && (
          <SectionCard title="Variance Comparison — System vs GPS" icon={Activity} iconColor="#7c3aed">
            <div className="mid2-variance-grid">
              <VarianceBlock
                label="Distance"
                system={interval.distanceKm}
                gps={fe.distanceKm}
                varianceKm={fe.distanceVarianceKm}
                variancePct={fe.distanceVariancePct}
                unit=" km"
              />
              <VarianceBlock
                label="Fuel Consumed"
                system={interval.fuelConsumedLiters}
                gps={fe.fuelConsumedL}
                varianceKm={fe.fuelVarianceL}
                variancePct={fe.fuelVariancePct}
                unit=" L"
              />
              <VarianceBlock
                label="Mileage"
                system={interval.mileageKmPerL}
                gps={fe.mileageKmPerL}
                varianceKm={fe.mileageVariance}
                variancePct={fe.mileageVariancePct}
                unit=" km/L"
              />
            </div>
            <div className="mid2-variance-legend">
              <span style={{ color: '#15803d' }}><CheckCircle2 size={12} /> ≤10% — Normal</span>
              <span style={{ color: '#c56200' }}><AlertTriangle size={12} /> 10–50% — Review</span>
              <span style={{ color: '#b91c1c' }}><XCircle size={12} /> &gt;50% — Flagged</span>
            </div>
          </SectionCard>
        )}

        {/* ── Fuel Logs Timeline ──────────────────────────────────── */}
        <SectionCard title="Fuel Logs in this Interval" icon={Droplets} iconColor="#0891b2">
          <div className="mid2-timeline">
            {fuelEntries.map((entry, i) => (
              <TimelineEntry
                key={entry.log._id || i}
                log={entry.log}
                label={entry.label}
                type={entry.type}
                isLast={i === fuelEntries.length - 1}
              />
            ))}
            {!interval.endFuelLogId && (
              <div className="mid2-tl-ongoing">
                <Info size={14} /> Interval is still <strong>ONGOING</strong> — awaiting next full tank fill.
              </div>
            )}
          </div>
        </SectionCard>

      </div>
    </div>
  );
};

export default MileageIntervalDetailPage;