import React from 'react';
import { CheckCircle, AlertTriangle, FileText, Activity } from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver';
import { formatINR } from '../../utils/formatters';

const RefuelComparisonDrawer = ({ open, onClose, log, onViewPhoto }) => {
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

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Refuel Verification Detail"
      subtitle={`${log.vehicleNo || 'Vehicle'} · ${log.date || ''} ${log.time || ''}`}
      width={620}
    >
      <div className="p-5 flex flex-col gap-5">
        {/* Verification Status Banner */}
        {log.verificationStatus === 'FLAGGED' && (
          <div className="flex items-start gap-3 bg-red-50 p-3.5 rounded-xl border border-red-200">
            <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-semibold text-red-900">Flagged: High Variance</p>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Bill claims {slipLitres || 0} L, but the tank sensor detected {sensorLitres || 0} L.
                Variance is {varianceL != null ? `${varianceL} L` : 'detected'}.
              </p>
            </div>
          </div>
        )}

        {log.verificationStatus === 'VERIFIED' && (
          <div className="flex items-start gap-3 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
            <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Verified Reconciliation</p>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Uploaded fuel slip matches the telematics tank refill within acceptable threshold (
                {varianceL != null ? `${varianceL} L difference` : 'match'}).
              </p>
            </div>
          </div>
        )}

        {log.verificationStatus === 'UNVERIFIED' && (
          <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
            <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-semibold text-amber-900">Unverified Refill</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Telematics detected {sensorLitres || log.quantity || 0} L refuel jump, but no fuel
                slip has been uploaded yet. Upload a slip to reconcile.
              </p>
            </div>
          </div>
        )}

        {log.verificationStatus === 'SLIP_ONLY' && (
          <div className="flex items-start gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <FileText className="text-gray-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-semibold text-gray-900">Slip Only (No Telematics Event)</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Fuel slip uploaded manually or via WhatsApp. No corresponding tank-sensor jump was
                recorded by telematics for this window.
              </p>
            </div>
          </div>
        )}

        {/* Side by side comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slip Side */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="bg-gray-50 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase text-gray-700 flex items-center gap-1.5">
                <FileText size={14} className="text-blue-600" /> Uploaded Bill
              </span>
              {slip && (
                <span className="text-[11px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {slip.submissionChannel || 'APP'}
                </span>
              )}
            </div>
            <div className="p-4 text-sm flex flex-col gap-3 flex-1 justify-between">
              {slip ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Billed Volume</span>
                    <span className="font-semibold text-gray-900 font-mono text-sm">
                      {slipLitres != null ? `${slipLitres} L` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-semibold text-gray-900 font-mono text-sm">
                      {slipAmount != null ? formatINR(slipAmount) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Rate / Litre</span>
                    <span className="font-mono text-gray-700">
                      {slipRate != null ? `₹${slipRate}/L` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Pump Location</span>
                    <span
                      className="text-right max-w-[150px] truncate font-medium text-gray-800"
                      title={slipLocation || ''}
                    >
                      {slipLocation || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Fuel Type</span>
                    <span className="text-gray-800 uppercase font-medium">
                      {slip.fuelType || log.fuelType || 'DIESEL'}
                    </span>
                  </div>
                  {docId && (
                    <button
                      type="button"
                      className="mt-3 w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 border border-blue-100"
                      onClick={() =>
                        onViewPhoto
                          ? onViewPhoto(log)
                          : window.open(`/documents/${docId}`, '_blank')
                      }
                    >
                      <FileText size={14} /> View Uploaded Photo
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 italic text-center py-8 text-xs flex flex-col items-center gap-2">
                  <FileText size={24} className="text-gray-300" />
                  No bill uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* Sensor Side */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="bg-gray-50 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase text-gray-700 flex items-center gap-1.5">
                <Activity size={14} className="text-emerald-600" /> Tank Sensor
              </span>
              {sensor?.confirmationStatus && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    sensor.confirmationStatus === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sensor.confirmationStatus}
                </span>
              )}
            </div>
            <div className="p-4 text-sm flex flex-col gap-3 flex-1 justify-between">
              {sensor ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Sensor Jump</span>
                    <span className="font-semibold text-gray-900 font-mono text-sm">
                      {sensorLitres != null ? `${sensorLitres} L` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Detected Pump</span>
                    <span
                      className="text-right max-w-[150px] truncate font-medium text-gray-800"
                      title={sensor.fuelPumpName || ''}
                    >
                      {sensor.fuelPumpName || 'Near Corridor'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Coordinates</span>
                    <span className="font-mono text-xs text-gray-600">
                      {sensor.lat && sensor.lng
                        ? `${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Sensor Timestamp</span>
                    <span className="text-gray-800 text-xs font-mono">{log.time || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 italic text-center py-8 text-xs flex flex-col items-center gap-2">
                  <Activity size={24} className="text-gray-300" />
                  No sensor telemetry match.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variance Summary Footer if both present */}
        {slip && sensor && varianceL != null && (
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Reconciliation Variance</span>
            <span
              className={`text-sm font-mono font-semibold ${
                log.verificationStatus === 'FLAGGED' ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {varianceL > 0 ? `+${varianceL} L` : `${varianceL} L`}
            </span>
          </div>
        )}
      </div>
    </SlideOver>
  );
};

export default RefuelComparisonDrawer;
