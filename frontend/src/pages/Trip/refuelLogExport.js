/**
 * Refuel-log export mapping (WS0.7) — typed rows for ExportButton so an
 * emailed sheet still totals and sorts (audit §7.7). Numbers stay numbers;
 * labels go through the vocabulary instead of raw UPPER_SNAKE constants.
 *
 * Pure module; unit tests live next to it.
 */

export const REFUEL_EXPORT_COLUMNS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'vehicleNo', label: 'Vehicle No' },
  { key: 'vehicleModel', label: 'Vehicle Model' },
  { key: 'driverName', label: 'Driver Name' },
  { key: 'location', label: 'Location' },
  { key: 'fuelTypeLabel', label: 'Fuel Type' },
  { key: 'quantity', label: 'Quantity (L)', type: 'number' },
  { key: 'unitPrice', label: 'Unit Price (₹)', type: 'currency' },
  { key: 'totalAmount', label: 'Total Amount (₹)', type: 'currency' },
  { key: 'odometer', label: 'Odometer (km)', type: 'number' },
  { key: 'fillingTypeLabel', label: 'Type' },
];

const FUEL_TYPE_LABELS = {
  DIESEL: 'Diesel',
  ADBLUE: 'AdBlue',
};

const FILLING_TYPE_LABELS = {
  FULL_TANK: 'Full tank',
  PARTIAL: 'Partial',
};

/**
 * Map one mapped refuel-log row (shape produced by fetchRefuelLogs in
 * RefuelLogsPage) to a typed export row. Never throws; absent values become
 * null so the sheet cell is empty rather than a stray "-".
 *
 * @param {Object} log mapped refuel-log row
 * @returns {Object} export row keyed to REFUEL_EXPORT_COLUMNS
 */
export const buildExportRow = (log) => ({
  date: log?.date || null,
  vehicleNo: log?.vehicleNo && log.vehicleNo !== '-' ? log.vehicleNo : null,
  vehicleModel: log?.vehicleModel && log.vehicleModel !== '-' ? log.vehicleModel : null,
  driverName: log?.driverName && log.driverName !== '-' ? log.driverName : null,
  location: log?.location && log.location !== '-' ? log.location : null,
  fuelTypeLabel: FUEL_TYPE_LABELS[log?.rawFuelType] || 'Unknown',
  quantity: log?.rawLitres ?? null,
  unitPrice: log?.rawRate ?? null,
  totalAmount: log?.rawTotalAmount ?? null,
  odometer: log?.rawOdometer ?? null,
  fillingTypeLabel: FILLING_TYPE_LABELS[log?.rawFillingType] || '-',
});
