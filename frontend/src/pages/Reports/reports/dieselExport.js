import { label } from '../../../lib/vocabulary';
import { formatInIST } from '../../../utils/dateUtils';
import { ODOMETER_SOURCE } from '../../Mileage/refuelRows';

/** The unified feed's largest page (GET /api/fuel-logs/unified, limit ≤ 200). */
export const DIESEL_EXPORT_PAGE_SIZE = 200;

// The table hides a typed-in odometer's source; the sheet names it.
const ODOMETER_LABEL = { ...ODOMETER_SOURCE, MANUAL: 'Typed in' };

// The sheet's "date" cells carry no time, and the time of a fill matters: it
// gets a column of its own, in IST like the table.
export const DIESEL_EXPORT_COLUMNS = [
  { key: 'vehicleNo', label: 'Truck' },
  { key: 'model', label: 'Model' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'time', label: 'Time (IST)' },
  { key: 'driver', label: 'Driver' },
  { key: 'sensorLitres', label: 'Sensor (L)', type: 'number' },
  { key: 'billLitres', label: 'On bill (L)', type: 'number' },
  { key: 'result', label: 'Result' },
  { key: 'pump', label: 'Pump' },
  { key: 'rate', label: 'Rate (₹/L)', type: 'number' },
  { key: 'amount', label: 'Amount (₹)', type: 'currency' },
  { key: 'odometer', label: 'Odometer (km)', type: 'number' },
  { key: 'odometerSource', label: 'Odometer source' },
];

/** One fill (a mapUnifiedRow row) as the sheet shows it — the same values as the table. */
export function dieselExportRow(row) {
  return {
    vehicleNo: row.vehicleNo,
    model: row.model,
    date: row.at,
    time: row.at ? formatInIST(row.at, 'HH:mm') : null,
    driver: row.raw?.slip?.driverName || null,
    // A gauge jump is a sensor glitch, not fuel: the table shows 0 L for it.
    sensorLitres: row.result === 'GAUGE_JUMP' ? 0 : row.sensorLitres,
    billLitres: row.slipLitres,
    result: row.result ? label('refuel', row.result, null) : null,
    pump: row.location,
    rate: row.rate?.value ?? null,
    amount: row.totalAmount,
    odometer: row.odometer,
    odometerSource: row.odometerSource
      ? ODOMETER_LABEL[row.odometerSource] || row.odometerSource
      : null,
  };
}
