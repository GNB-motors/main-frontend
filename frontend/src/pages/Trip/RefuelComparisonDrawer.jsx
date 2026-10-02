import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
  PlusCircle,
  ExternalLink,
  Info,
  MapPin,
} from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver';
import { formatINR } from '../../utils/formatters';
import './RefuelComparisonDrawer.css';

const RefuelComparisonDrawer = ({ open, onClose, log, onViewPhoto, onUploadBill }) => {
  if (!log) return null;

  const isUnverified = log.verificationStatus === 'UNVERIFIED';
  const isSlipOnly = log.verificationStatus === 'SLIP_ONLY';

  // Slip only exists when explicitly present or when log source is a standalone SLIP
  const slip = !isUnverified && (log.slip || (log.source === 'SLIP' ? log : null));
  const sensor =
    !isSlipOnly &&
    (log.sensor ||
      (log.sensorId || log.sensorLitres
        ? {
            id: log.sensorId,
            litres: log.sensorLitres,
            confirmationStatus: log.sensorConfirmationStatus,
            billVarianceL: log.sensorBillVarianceL,
            billFlag: log.sensorBillFlag,
            fuelPumpName: log.location && log.source === 'SENSOR' ? log.location : null,
            lat: log.lat ?? log.sensorLat ?? null,
            lng: log.lng ?? log.sensorLng ?? null,
          }
        : log.source === 'SENSOR'
          ? {
              id: log.id,
              litres: log.quantity != null && log.quantity !== '-' ? log.quantity : log.rawLitres,
              confirmationStatus: 'ESTIMATED',
              fuelPumpName: log.location && log.location !== '-' ? log.location : 'Highway Refuel',
              lat: log.lat ?? log.sensorLat ?? null,
              lng: log.lng ?? log.sensorLng ?? null,
            }
          : null));

  const slipLitres = slip ? (slip.litres ?? (log.source === 'SLIP' ? log.rawLitres : null)) : null;
  const slipAmount = slip
    ? (slip.totalAmount ?? (log.source === 'SLIP' ? log.rawTotalAmount : null))
    : null;
  const slipRate = slip ? (slip.rate ?? (log.source === 'SLIP' ? log.rawRate : null)) : null;
  const slipLocation = slip ? slip.location || (log.source === 'SLIP' ? log.location : null) : null;
  const docId = slip ? slip.documentId || (log.source === 'SLIP' ? log.documentId : null) : null;

  const sensorLitres = sensor
    ? (sensor.litres ??
      (log.source === 'SENSOR' ? (log.sensorLitres ?? log.rawLitres ?? log.quantity) : null))
    : null;

  const hasBoth = Boolean(slip && sensor && slipLitres != null && sensorLitres != null);
  const varianceL = hasBoth
    ? (sensor?.billVarianceL ??
      log.sensorBillVarianceL ??
      Math.round(Math.abs(slipLitres - sensorLitres) * 10) / 10)
    : null;

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
              {slip ? (
                <span className="rc-card-badge channel">{slip.submissionChannel || 'APP'}</span>
              ) : (
                <span className="rc-card-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                  AWAITING SLIP
                </span>
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
                  <span style={{ fontWeight: 600, color: 'var(--cluster-text, #334155)' }}>
                    No bill uploaded yet.
                  </span>
                  <p
                    style={{
                      margin: '2px 0 10px 0',
                      fontSize: 12,
                      color: 'var(--cluster-text-dim, #64748b)',
                      textAlign: 'center',
                    }}
                  >
                    Awaiting driver receipt submission via mobile app or WhatsApp.
                  </p>
                  <button
                    type="button"
                    className="rc-btn-secondary"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={handleUploadBillClick}
                  >
                    <PlusCircle size={14} /> Upload Bill Now
                  </button>
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
              {sensor ? (
                <span
                  className={`rc-card-badge ${
                    sensor.confirmationStatus === 'CONFIRMED' ? 'confirmed' : 'estimated'
                  }`}
                >
                  {sensor.confirmationStatus || 'ESTIMATED'}
                </span>
              ) : (
                <span className="rc-card-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  NO TELEMETRY
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
                    {sensor.lat != null && sensor.lng != null ? (
                      <a
                        href={`https://www.google.com/maps?q=${sensor.lat},${sensor.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mono"
                        style={{ fontSize: 12 }}
                        title={`Open coordinates in Google Maps (${sensor.lat}, ${sensor.lng})`}
                      >
                        <MapPin size={11} className="shrink-0 text-blue-500" />
                        <span>{`${Number(sensor.lat).toFixed(4)}, ${Number(sensor.lng).toFixed(4)}`}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-70" />
                      </a>
                    ) : (
                      <span className="rc-stat-value mono" style={{ fontSize: 12 }}>
                        —
                      </span>
                    )}
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
                  <span style={{ fontWeight: 600, color: 'var(--cluster-text, #334155)' }}>
                    No sensor telemetry match.
                  </span>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: 12,
                      color: 'var(--cluster-text-dim, #64748b)',
                      textAlign: 'center',
                    }}
                  >
                    No fuel level spike recorded by telematics for this refill time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variance Summary Footer */}
        {hasBoth && varianceL != null ? (
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
        ) : isUnverified ? (
          <div
            className="rc-variance-box"
            style={{ background: '#fffbeb', borderColor: '#fef3c7' }}
          >
            <span className="rc-variance-label">Reconciliation Variance</span>
            <span
              className="rc-variance-val"
              style={{ color: '#b45309', fontSize: 13, fontWeight: 600 }}
            >
              Pending Slip Upload
            </span>
          </div>
        ) : isSlipOnly ? (
          <div className="rc-variance-box">
            <span className="rc-variance-label">Reconciliation Variance</span>
            <span
              className="rc-variance-val"
              style={{ color: 'var(--cluster-text-dim, #64748b)', fontSize: 13, fontWeight: 500 }}
            >
              No Sensor Telemetry
            </span>
          </div>
        ) : null}

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
