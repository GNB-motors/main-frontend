import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronLeft,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Route,
  Clock,
} from 'lucide-react';
import '../PageStyles.css';
import './MileageTracking.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import ExportButton from '../../components/ui/ExportButton';
import { fmtDateShort } from './mileageIntervalDetailFormat';
import {
  SlimAnomalyAlert,
  CompactKpiCard,
  ReconciliationMatrixTable,
  RefuelSlipsTable,
} from './mileageIntervalDetailCells';

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
      <PageShell title="Mileage Interval Audit">
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
  const vehicleId = interval.vehicleId?._id || interval.vehicleId;

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

  // Total fuel cost: end fill + all partial fills
  const endCost = interval.endFuelLogId?.totalAmount || 0;
  const partialCost = (interval.partialFuelLogIds || []).reduce(
    (sum, log) => sum + (log?.totalAmount || 0),
    0,
  );
  const fuelCost = endCost + partialCost || null;

  const exportColumns = [
    { key: 'metric', label: 'Metric', type: 'text' },
    { key: 'systemValue', label: 'System Value', type: 'text' },
    { key: 'telematicsValue', label: 'FleetEdge GPS Value', type: 'text' },
    { key: 'variance', label: 'Variance (Δ)', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
  ];

  const exportRows = [
    {
      metric: 'Mileage (km/L)',
      systemValue:
        interval.mileageKmPerL != null ? `${interval.mileageKmPerL.toFixed(2)} km/L` : '—',
      telematicsValue:
        fe.mileageKmPerL != null ? `${Number(fe.mileageKmPerL).toFixed(2)} km/L` : '—',
      variance:
        fe.mileageVariance != null
          ? `${fe.mileageVariance.toFixed(2)} (${fe.mileageVariancePct?.toFixed(1) || 0}%)`
          : '—',
      status: fe.isFlaggedMileage ? 'FLAGGED' : 'OK',
    },
    {
      metric: 'Distance (km)',
      systemValue: interval.distanceKm != null ? `${interval.distanceKm.toFixed(1)} km` : '—',
      telematicsValue: fe.distanceKm != null ? `${Number(fe.distanceKm).toFixed(1)} km` : '—',
      variance:
        fe.distanceVariance != null
          ? `${fe.distanceVariance.toFixed(1)} (${fe.distanceVariancePct?.toFixed(1) || 0}%)`
          : '—',
      status: fe.isFlaggedDistance ? 'FLAGGED' : 'OK',
    },
    {
      metric: 'Fuel Consumed (L)',
      systemValue:
        interval.fuelConsumedLiters != null ? `${interval.fuelConsumedLiters.toFixed(2)} L` : '—',
      telematicsValue: fe.fuelConsumedL != null ? `${Number(fe.fuelConsumedL).toFixed(2)} L` : '—',
      variance:
        fe.fuelVariance != null
          ? `${fe.fuelVariance.toFixed(2)} (${fe.fuelVariancePct?.toFixed(1) || 0}%)`
          : '—',
      status: fe.isFlaggedFuel ? 'FLAGGED' : 'OK',
    },
  ];

  return (
    <div className="mt-page-wrapper">
      <PageShell
        title={
          <div className="mt-breadcrumb">
            <button
              type="button"
              className="mt-breadcrumb__btn"
              onClick={() => navigate('/mileage-tracking')}
              title="Return to fleet overview"
            >
              <ChevronLeft size={16} />
              <span>Fleet Overview</span>
            </button>
            <span className="mt-breadcrumb__sep">/</span>
            <button
              type="button"
              className="mt-breadcrumb__btn"
              onClick={() =>
                navigate(vehicleId ? `/mileage-tracking/vehicle/${vehicleId}` : '/mileage-tracking')
              }
              title="Return to vehicle intervals"
            >
              <span className="mt-plate-badge mt-mono">{vehName}</span>
            </button>
            <span className="mt-breadcrumb__sep">/</span>
            <span className="mt-breadcrumb__current">Interval Detail</span>
          </div>
        }
        subtitle={`Billing period: ${fmtDateShort(interval.startDate)} → ${fmtDateShort(interval.endDate || interval.startDate)} • Odometer: ${interval.startOdometer?.toLocaleString() || '—'} → ${interval.endOdometer?.toLocaleString() || '—'} km`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="mt-btn"
              onClick={() =>
                navigate(vehicleId ? `/mileage-tracking/vehicle/${vehicleId}` : '/mileage-tracking')
              }
            >
              <ChevronLeft size={14} />
              <span>Back to Vehicle</span>
            </button>
            <ExportButton
              rows={exportRows}
              columns={exportColumns}
              filename={`mileage-audit-${vehName}-${id}`}
              buttonClass="mt-btn"
            />
            {interval.status === 'COMPLETED' ? (
              <span className="mt-badge-completed">
                <CheckCircle2 size={13} />
                <span>Completed</span>
              </span>
            ) : (
              <span className="mt-badge-ongoing">
                <Clock size={13} />
                <span>Ongoing</span>
              </span>
            )}
            {feComputed && hasAnyFlag && (
              <span className="mt-badge-flagged">
                <AlertTriangle size={13} />
                <span>{flags.length} Flags</span>
              </span>
            )}
            {feComputed && !hasAnyFlag && (
              <span className="mt-badge-validated">
                <CheckCircle2 size={13} />
                <span>GPS Validated</span>
              </span>
            )}
            {!feComputed && (
              <span className="mt-badge-pending">
                <Clock size={13} />
                <span>GPS Pending</span>
              </span>
            )}
          </div>
        }
      >
        <div className="mt-layer3-wrapper">
          {/* 1. Slim Anomaly Alert Bar */}
          {feComputed && hasAnyFlag && flags.length > 0 && <SlimAnomalyAlert flags={flags} />}

          {/* 2. Compact 3-KPI Executive Strip */}
          <div className="mt-compact-hero">
            <CompactKpiCard
              type="mileage"
              title="Effective Mileage"
              icon={Gauge}
              primaryValue={
                interval.mileageKmPerL != null ? Number(interval.mileageKmPerL).toFixed(2) : '—'
              }
              unit="km/L"
              systemValue={interval.mileageKmPerL}
              gpsValue={fe.mileageKmPerL}
              variancePct={fe.mileageVariancePct}
              extraNote={
                fe.mileageVariance != null
                  ? `Δ ${fe.mileageVariance > 0 ? '+' : ''}${fe.mileageVariance.toFixed(2)} km/L`
                  : null
              }
            />

            <CompactKpiCard
              type="distance"
              title="Tracked Distance"
              icon={Route}
              primaryValue={
                interval.distanceKm != null ? Number(interval.distanceKm).toFixed(1) : '—'
              }
              unit="km"
              systemValue={interval.distanceKm}
              gpsValue={fe.distanceKm}
              variancePct={fe.distanceVariancePct}
              extraNote={`Odo: ${interval.startOdometer?.toLocaleString() || '—'} → ${interval.endOdometer?.toLocaleString() || '—'}`}
            />

            <CompactKpiCard
              type="fuel"
              title="Fuel Billed"
              icon={Droplets}
              primaryValue={
                interval.fuelConsumedLiters != null
                  ? Number(interval.fuelConsumedLiters).toFixed(2)
                  : '—'
              }
              unit="L"
              systemValue={interval.fuelConsumedLiters}
              gpsValue={fe.fuelConsumedL}
              variancePct={fe.fuelVariancePct}
              extraNote={
                fuelCost
                  ? `Cost: ₹${fuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                  : null
              }
            />
          </div>

          {/* 3. Reconciliation Audit Matrix Table */}
          <ReconciliationMatrixTable interval={interval} />

          {/* 4. Refuel Receipts Slips Table */}
          <RefuelSlipsTable fuelEntries={fuelEntries} isOngoing={!interval.endFuelLogId} />
        </div>
      </PageShell>
    </div>
  );
};

export default MileageIntervalDetailPage;
