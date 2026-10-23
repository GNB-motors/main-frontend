import { formatInIST } from '../../utils/dateUtils';
import { useMemo } from 'react';
import { fmtDuration } from './formatIST.js';

/** Columns and rows for the Excel/CSV export of the loaded comparison records. */
const useComparisonExport = (records) => {
  // Export configuration for Excel (.xlsx) and CSV (.csv)
  const exportColumns = useMemo(
    () => [
      { key: 'taskId', label: 'Task ID', type: 'text' },
      { key: 'vehicle', label: 'Vehicle Registration', type: 'text' },
      { key: 'driver', label: 'Driver Name', type: 'text' },
      { key: 'fromDate', label: 'From Date (IST)', type: 'text' },
      { key: 'toDate', label: 'To Date (IST)', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'billedFuel', label: 'Billed Fuel (L)', type: 'number' },
      { key: 'telematicsFuel', label: 'Telematics Fuel (L)', type: 'number' },
      { key: 'varianceL', label: 'Variance (L)', type: 'number' },
      { key: 'variancePct', label: 'Variance (%)', type: 'number' },
      { key: 'auditStatus', label: 'Audit Status', type: 'text' },
      { key: 'flagReason', label: 'Flag Reason', type: 'text' },
      { key: 'odoStatus', label: 'Odometer Status', type: 'text' },
      { key: 'distanceKm', label: 'Distance (km)', type: 'number' },
      { key: 'minOdo', label: 'Min Odometer', type: 'number' },
      { key: 'maxOdo', label: 'Max Odometer', type: 'number' },
      { key: 'mileage', label: 'Mileage (km/L)', type: 'number' },
      { key: 'defConsumed', label: 'DEF Consumed (L)', type: 'number' },
    ],
    [],
  );

  const exportRows = useMemo(
    () =>
      records.map((r) => {
        const driverName = r.driverId
          ? `${r.driverId.firstName || ''} ${r.driverId.lastName || ''}`.trim()
          : '';
        const fromStr = r.fromDate ? formatInIST(r.fromDate, 'YYYY-MM-DD HH:mm') || '' : '';
        const toStr = r.toDate ? formatInIST(r.toDate, 'YYYY-MM-DD HH:mm') || '' : '';
        const durStr = fmtDuration(r.fromDate, r.toDate) || '';
        const varL = r.variance != null ? -r.variance : null;
        const varPct = r.variancePercent != null ? -r.variancePercent : null;
        const auditStatus = r.isFlagged
          ? 'FLAGGED'
          : r.status === 'PENDING_REVIEW'
            ? 'PENDING_REVIEW'
            : r.status === 'NO_DATA'
              ? 'NO_DATA'
              : 'MATCHED';
        const odoStatus = r.isOdometerFlagged
          ? 'MISMATCH'
          : r.status === 'PENDING_REVIEW'
            ? 'REVIEW_NEEDED'
            : r.ocrOdometerReading != null
              ? 'VERIFIED'
              : 'NOT_RECORDED';

        return {
          taskId: r._id,
          vehicle: r.vehicleId?.registrationNumber || r.vehicleNumber || '',
          driver: driverName,
          fromDate: fromStr,
          toDate: toStr,
          duration: durStr,
          billedFuel: r.billFuelConsumed != null ? Number(r.billFuelConsumed.toFixed(2)) : null,
          telematicsFuel:
            r.fleetEdgeFuelConsumed != null ? Number(r.fleetEdgeFuelConsumed.toFixed(2)) : null,
          varianceL: varL != null ? Number(varL.toFixed(2)) : null,
          variancePct: varPct != null ? Number(varPct.toFixed(1)) : null,
          auditStatus,
          flagReason: r.flagReason || '',
          odoStatus,
          distanceKm: r.distanceTravelled != null ? Number(r.distanceTravelled.toFixed(1)) : null,
          minOdo: r.minOdometer != null ? Number(r.minOdometer.toFixed(1)) : null,
          maxOdo: r.maxOdometer != null ? Number(r.maxOdometer.toFixed(1)) : null,
          mileage: r.fuelEfficiency != null ? Number(r.fuelEfficiency.toFixed(2)) : null,
          defConsumed: r.defConsumed != null ? Number(r.defConsumed.toFixed(2)) : null,
        };
      }),
    [records],
  );

  return { exportColumns, exportRows };
};

export default useComparisonExport;
