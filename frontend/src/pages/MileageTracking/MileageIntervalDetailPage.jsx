import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Gauge,
  Satellite,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Droplets,
  XCircle,
  Info,
} from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import { fmt, fmtDate, fmtDateShort } from './mileageIntervalDetailFormat';
import { SectionCard, MetricRow, VarianceBlock, TimelineEntry } from './mileageIntervalDetailCells';

const MileageIntervalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interval, setInterval] = useState(null);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const {
    data: intervalResponse,
    loading: isLoading,
    error: intervalError,
  } = useApi(
    (signal) => apiClient.get(`/api/mileage/intervals/${id}`, { signal }),
    [JSON.stringify({ id })],
    {
      enabled: !!id,
    },
  );

  useEffect(() => {
    if (intervalResponse) {
      const data = intervalResponse.data?.data;
      if (data) {
        setInterval(data);
      } else {
        toast.error('Mileage interval not found');
        navigate('/mileage-tracking');
      }
    }
  }, [intervalResponse, navigate]);

  useEffect(() => {
    if (intervalError) {
      toast.error('Failed to load mileage interval');
      navigate('/mileage-tracking');
    }
  }, [intervalError, navigate]);

  if (isLoading) {
    return (
      <PageShell title="Mileage Interval">
        <div className="loading-state">
          <p>Loading interval data...</p>
        </div>
      </PageShell>
    );
  }

  if (!interval) return null;

  const fe = interval.fleetEdge || {};
  const feComputed = fe.status === 'COMPUTED';
  const vehName = interval.vehicleId?.registrationNumber || 'Unknown Vehicle';

  const flags = fe.flagReasons || [];
  const hasAnyFlag = fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage;

  // Collect all fuel log entries for the timeline
  const fuelEntries = [];
  if (interval.startFuelLogId) {
    fuelEntries.push({ log: interval.startFuelLogId, label: 'Full Tank (Start)', type: 'start' });
  }
  (interval.partialFuelLogIds || []).forEach((log, i) => {
    fuelEntries.push({ log, label: `Partial Fill ${i + 1}`, type: 'partial' });
  });
  if (interval.endFuelLogId) {
    fuelEntries.push({ log: interval.endFuelLogId, label: 'Full Tank (End)', type: 'end' });
  }

  // Total fuel cost: end fill + all partial fills (start fill belongs to the previous interval)
  const endCost = interval.endFuelLogId?.totalAmount || 0;
  const partialCost = (interval.partialFuelLogIds || []).reduce(
    (sum, log) => sum + (log?.totalAmount || 0),
    0,
  );
  const fuelCost = endCost + partialCost || null;

  const routeFuelLog = interval.endFuelLogId || interval.startFuelLogId;
  const routeSource = routeFuelLog?.routeSource;
  const routeDestination = routeFuelLog?.routeDestination;

  return (
    <PageShell
      title={vehName}
      subtitle={`${fmtDateShort(interval.startDate)} → ${fmtDateShort(interval.endDate || interval.startDate)}`}
      actions={
        <>
          <button className="mid2-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <span
            className="mid2-badge"
            style={
              interval.status === 'COMPLETED'
                ? {
                    background: 'rgba(37,186,76,0.08)',
                    color: '#15803d',
                    border: '1px solid rgba(37,186,76,0.2)',
                  }
                : {
                    background: 'rgba(251,191,35,0.08)',
                    color: '#b45309',
                    border: '1px solid rgba(251,191,35,0.2)',
                  }
            }
          >
            {interval.status}
          </span>
          {feComputed && hasAnyFlag && (
            <span
              className="mid2-badge"
              style={{
                background: 'rgba(239,68,68,0.08)',
                color: '#b91c1c',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle size={12} /> Anomaly Detected
            </span>
          )}
          {feComputed && !hasAnyFlag && (
            <span
              className="mid2-badge"
              style={{
                background: 'rgba(37,186,76,0.08)',
                color: '#15803d',
                border: '1px solid rgba(37,186,76,0.2)',
              }}
            >
              <CheckCircle2 size={12} /> GPS Validated ✓
            </span>
          )}
        </>
      }
    >
      {feComputed && hasAnyFlag && flags.length > 0 && (
        <div className="mid2-flag-banner">
          <AlertTriangle size={18} />
          <div>
            <strong>Anomalies detected in FleetEdge comparison</strong>
            <ul className="mid2-flag-list">
              {flags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mid2-grid-2">
        <SectionCard title="System Mileage (Bill-Based)" icon={Gauge} iconColor="#2A4FD6">
          <div className="mid2-metric-list">
            <MetricRow
              label="Start Odometer"
              value={
                interval.startOdometer != null
                  ? `${interval.startOdometer.toLocaleString()} km`
                  : '—'
              }
            />
            <MetricRow
              label="End Odometer"
              value={
                interval.endOdometer != null ? `${interval.endOdometer.toLocaleString()} km` : '—'
              }
            />
            <MetricRow label="Distance" value={fmt(interval.distanceKm, 1, 'km')} />
            <MetricRow label="Fuel Consumed" value={fmt(interval.fuelConsumedLiters, 2, 'L')} />
            <MetricRow
              label="Fuel Cost"
              value={
                fuelCost
                  ? `₹${fuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                  : '—'
              }
            />
            {routeSource && (
              <MetricRow
                label="Route From"
                value={`${routeSource.name}${routeSource.city ? `, ${routeSource.city}` : ''}`}
              />
            )}
            {routeDestination && (
              <MetricRow
                label="Route To"
                value={`${routeDestination.name}${routeDestination.city ? `, ${routeDestination.city}` : ''}`}
              />
            )}
            <MetricRow label="Mileage" value={fmt(interval.mileageKmPerL, 2, 'km/L')} highlight />
            <MetricRow label="Period Start" value={fmtDate(interval.startDate)} />
            <MetricRow label="Period End" value={fmtDate(interval.endDate)} />
          </div>
        </SectionCard>

        {feComputed ? (
          <SectionCard title="FleetEdge GPS Validation" icon={Satellite} iconColor="#0891b2">
            <div className="mid2-metric-list">
              <MetricRow label="GPS Distance" value={fmt(fe.distanceKm, 1, 'km')} />
              <MetricRow label="GPS Fuel Consumed" value={fmt(fe.fuelConsumedL, 2, 'L')} />
              <MetricRow label="GPS Mileage" value={fmt(fe.mileageKmPerL, 2, 'km/L')} highlight />
              <MetricRow label="DEF Consumed" value={fmt(fe.defConsumed, 2, 'L')} />
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
                  <p className="mid2-gps-empty-sub">
                    {fe.failureReason || 'FleetEdge returned no data for this vehicle.'}
                  </p>
                  <p className="mid2-gps-empty-sub">Attempts: {fe.attempts ?? 0}</p>
                </>
              ) : (
                <>
                  <Satellite size={40} color="#94a3b8" />
                  <p className="mid2-gps-empty-title">GPS Data Pending</p>
                  <p className="mid2-gps-empty-sub">
                    FleetEdge comparison has not been completed yet for this interval. The sync will
                    run automatically.
                  </p>
                </>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {feComputed && (
        <SectionCard
          title="Variance Comparison — System vs GPS"
          icon={Activity}
          iconColor="#7c3aed"
        >
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
            <span style={{ color: '#15803d' }}>
              <CheckCircle2 size={12} /> ≤10% — Normal
            </span>
            <span style={{ color: '#c56200' }}>
              <AlertTriangle size={12} /> 10–50% — Review
            </span>
            <span style={{ color: '#b91c1c' }}>
              <XCircle size={12} /> &gt;50% — Flagged
            </span>
          </div>
        </SectionCard>
      )}

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
              <Info size={14} /> Interval is still <strong>ONGOING</strong> — awaiting next full
              tank fill.
            </div>
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
};

export default MileageIntervalDetailPage;
