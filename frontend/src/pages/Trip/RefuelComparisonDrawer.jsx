import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
  PlusCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver';
import { formatINR } from '../../utils/formatters';
import './RefuelComparisonDrawer.css';

const RefuelComparisonDrawer = ({ open, onClose, log, onViewPhoto, onUploadBill }) => {
  if (!log) return null;

  const slip = log.slip || (log.source === 'SLIP' || log.rawLitres ? log : null);
  const sensor =
    log.sensor ||
    (log.sensorId || log.sensorLitres
      ? {
          id: log.sensorId,
          litres: log.sensorLitres,
          confirmationStatus: log.sensorConfirmationStatus,
          billVarianceL: log.sensorBillVarianceL,
          billFlag: log.sensorBillFlag,
        }
      : null);

  const slipLitres = slip?.litres ?? log.rawLitres ?? null;
  const slipAmount = slip?.totalAmount ?? log.rawTotalAmount ?? null;
  const slipRate = slip?.rate ?? log.rawRate ?? null;
  const slipLocation = slip?.location || log.location || null;
  const docId = slip?.documentId || log.documentId;

  const sensorLitres = sensor?.litres ?? log.sensorLitres ?? null;
  const varianceL =
    sensor?.billVarianceL ??
    log.sensorBillVarianceL ??
    (slipLitres != null && sensorLitres != null
      ? Math.round(Math.abs(slipLitres - sensorLitres) * 10) / 10
      : null);

  const handleUploadBillClick = () => {
    onClose();
    if (onUploadBill) {
      onUploadBill(log);
      return;
    }
    const vehicleId = log.vehicleId || '';
    const refuelTime = log.refuelTime || log.at || '';
    const litres = sensorLitres || log.quantity || '';
    window.location.href = `/mileage-tracking/new?vehicleId=${encodeURIComponent(vehicleId)}&refuelTime=${encodeURIComponent(refuelTime)}&litres=${encodeURIComponent(litres)}`;
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Refuel Verification Detail"
      subtitle={`${log.vehicleNo || 'Vehicle'} · ${log.date || ''} ${log.time || ''}`}
      width={620}
    >
      <div className="rc-drawer-body">
        {/* Verification Status Banner */}
        {log.verificationStatus === 'FLAGGED' && (
          <div className="rc-banner flagged">
            <AlertTriangle className="rc-banner-icon text-red-500" size={18} />
            <div>
              <p className="rc-banner-title">Flagged: High Variance</p>
              <p className="rc-banner-desc">
                Bill claims {slipLitres || 0} L, but the tank sensor detected {sensorLitres || 0} L.
                Variance is {varianceL != null ? `${varianceL} L` : 'detected'}.
              </p>
            </div>
          </div>
        )}

        {log.verificationStatus === 'VERIFIED' && (
          <div className="rc-banner verified">
            <CheckCircle className="rc-banner-icon text-emerald-600" size={18} />
            <div>
              <p className="rc-banner-title">Verified Reconciliation</p>
              <p className="rc-banner-desc">
                Uploaded fuel slip matches the telematics tank refill within acceptable threshold (
                {varianceL != null ? `${varianceL} L difference` : 'match'}).
              </p>
            </div>
          </div>
        )}

        {log.verificationStatus === 'UNVERIFIED' && (
          <div className="rc-banner unverified">
            <AlertTriangle className="rc-banner-icon text-amber-600" size={18} />
            <div>
              <p className="rc-banner-title">Unverified Refill</p>
              <p className="rc-banner-desc">
                Telematics detected {sensorLitres || log.quantity || 0} L refuel jump, but no fuel
                slip has been uploaded yet. Upload a slip to reconcile.
              </p>
              <div className="rc-banner-action">
                <button type="button" className="rc-btn-primary" onClick={handleUploadBillClick}>
                  <PlusCircle size={15} /> Upload Bill for this Refuel
                </button>
              </div>
            </div>
          </div>
        )}

        {log.verificationStatus === 'SLIP_ONLY' && (
          <div className="rc-banner slip_only">
            <FileText className="rc-banner-icon text-gray-600" size={18} />
            <div>
              <p className="rc-banner-title">Slip Only (No Telematics Event)</p>
              <p className="rc-banner-desc">
                Fuel slip uploaded manually or via WhatsApp. No corresponding tank-sensor jump was
                recorded by telematics for this window.
              </p>
            </div>
          </div>
        )}

        {/* Side by side comparison cards */}
        <div className="rc-comparison-grid">
          {/* Slip Side */}
          <div className="rc-card">
            <div className="rc-card-header">
              <span className="rc-card-title">
                <FileText size={15} style={{ color: 'var(--gnb-400, #2563eb)' }} /> Uploaded Bill
              </span>
              {slip && (
                <span className="rc-card-badge channel">{slip.submissionChannel || 'APP'}</span>
              )}
            </div>
            <div className="rc-card-body">
              {slip ? (
                <>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Billed Volume</span>
                    <span className="rc-stat-value mono">
                      {slipLitres != null ? `${slipLitres} L` : '—'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Total Amount</span>
                    <span className="rc-stat-value mono">
                      {slipAmount != null ? formatINR(slipAmount) : '—'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Rate / Litre</span>
                    <span className="rc-stat-value mono">
                      {slipRate != null ? `₹${slipRate}/L` : '—'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Pump Location</span>
                    <span
                      className="rc-stat-value truncate"
                      style={{ maxWidth: 160 }}
                      title={slipLocation || ''}
                    >
                      {slipLocation || '—'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Fuel Type</span>
                    <span className="rc-stat-value" style={{ textTransform: 'uppercase' }}>
                      {slip.fuelType || log.fuelType || 'DIESEL'}
                    </span>
                  </div>
                  {docId && (
                    <button
                      type="button"
                      className="rc-btn-secondary"
                      style={{ marginTop: 8, width: '100%' }}
                      onClick={() =>
                        onViewPhoto
                          ? onViewPhoto(log)
                          : window.open(`/documents/${docId}`, '_blank')
                      }
                    >
                      <FileText size={14} /> View Uploaded Photo
                    </button>
                  )}
                </>
              ) : (
                <div className="rc-empty-state">
                  <FileText size={28} className="rc-empty-icon" />
                  <span>No bill uploaded yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sensor Side */}
          <div className="rc-card">
            <div className="rc-card-header">
              <span className="rc-card-title">
                <Activity size={15} style={{ color: 'var(--signal-ok, #10b981)' }} /> Tank Sensor
              </span>
              {sensor?.confirmationStatus && (
                <span
                  className={`rc-card-badge ${
                    sensor.confirmationStatus === 'CONFIRMED' ? 'confirmed' : 'estimated'
                  }`}
                >
                  {sensor.confirmationStatus}
                </span>
              )}
            </div>
            <div className="rc-card-body">
              {sensor ? (
                <>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Sensor Jump</span>
                    <span className="rc-stat-value mono">
                      {sensorLitres != null ? `${sensorLitres} L` : '—'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Detected Pump</span>
                    <span
                      className="rc-stat-value truncate"
                      style={{ maxWidth: 160 }}
                      title={sensor.fuelPumpName || ''}
                    >
                      {sensor.fuelPumpName || 'Highway Refuel'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Coordinates</span>
                    <span className="rc-stat-value mono" style={{ fontSize: 12 }}>
                      {sensor.lat && sensor.lng
                        ? `${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}`
                        : '—'}
                    </span>
                  </div>
                  <div className="rc-stat-row">
                    <span className="rc-stat-label">Sensor Timestamp</span>
                    <span className="rc-stat-value mono" style={{ fontSize: 12 }}>
                      {log.time || '—'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="rc-empty-state">
                  <Activity size={28} className="rc-empty-icon" />
                  <span>No sensor telemetry match.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variance Summary Footer if both present */}
        {slip && sensor && varianceL != null && (
          <div className="rc-variance-box">
            <span className="rc-variance-label">Reconciliation Variance</span>
            <span
              className={`rc-variance-val ${
                log.verificationStatus === 'FLAGGED' ? 'flagged' : 'clean'
              }`}
            >
              {varianceL > 0 ? `+${varianceL} L` : `${varianceL} L`}
            </span>
          </div>
        )}

        {/* Diesel Rate / Pricing Transparency Notice */}
        <div className="rc-rate-notice">
          <Info size={16} />
          <div>
            <strong>Fuel Rate Provenance:</strong> Diesel price per litre and total financial cost
            are derived from physical driver fuel receipts. Tank sensors detect physical liquid
            volume changes; financial entries are verified upon slip submission.
          </div>
        </div>
      </div>
    </SlideOver>
  );
};

export default RefuelComparisonDrawer;
