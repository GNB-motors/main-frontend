export const FUEL_GROUPS = [
  { value: 'vehicle', label: 'Truck' },
  { value: 'driver', label: 'Driver' },
  { value: 'model', label: 'Model' },
];
export const TRIP_GROUPS = [
  ...FUEL_GROUPS.slice(0, 2),
  { value: 'hub', label: 'Plant' },
  { value: 'day', label: 'Day' },
];

export function sortReportRows(rows, key, order = 'desc') {
  return [...rows].sort((a, b) => {
    const av = a[key],
      bv = b[key];
    if (av == null) return bv == null ? 0 : 1;
    if (bv == null) return -1;
    const delta =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
    return (order === 'asc' ? delta : -delta) || String(a.id).localeCompare(String(b.id));
  });
}

export function reportQuery(filters, range, groupBy) {
  return {
    from: `${range.from}T00:00:00.000+05:30`,
    to: `${range.to}T23:59:59.999+05:30`,
    groupBy,
    ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
    ...(filters.vehicle !== 'all' && { vehicleId: filters.vehicle }),
    ...(filters.driver !== 'all' && { driverId: filters.driver }),
    ...(filters.search.trim() && { search: filters.search.trim() }),
  };
}

export const FUEL_EXPORT_COLUMNS = [
  { key: 'label', label: 'Group' },
  { key: 'dieselLitres', label: 'Diesel purchased (L)', type: 'number' },
  { key: 'dieselSpend', label: 'Diesel spend (₹)', type: 'currency' },
  { key: 'defLitres', label: 'AdBlue purchased (L)', type: 'number' },
  { key: 'defSpend', label: 'AdBlue spend (₹)', type: 'currency' },
  { key: 'totalSpend', label: 'Diesel + AdBlue spend (₹)', type: 'currency' },
  { key: 'distanceKm', label: 'Distance in eligible completed cycles (km)', type: 'number' },
  { key: 'cycleFuelLitres', label: 'Diesel in eligible cycles (L)', type: 'number' },
  { key: 'cycleDieselCost', label: 'Diesel cost in eligible cycles (₹)', type: 'currency' },
  { key: 'mileageKmpl', label: 'Completed-cycle mileage (km/L)', type: 'number' },
  { key: 'dieselCostPerKm', label: 'Eligible-cycle diesel cost (₹/km)', type: 'currency' },
  { key: 'cycleCount', label: 'Cycles used', type: 'number' },
  { key: 'excludedCycleCount', label: 'Cycles excluded', type: 'number' },
];

export const TRIP_EXPORT_COLUMNS = [
  { key: 'label', label: 'Group' },
  { key: 'tripCount', label: 'Completed trips', type: 'number' },
  { key: 'ladenKm', label: 'Known loaded distance (km)', type: 'number' },
  { key: 'approachKm', label: 'Known approach distance (km)', type: 'number' },
  { key: 'returnKm', label: 'Known return distance (km)', type: 'number' },
  { key: 'extraKm', label: 'Known extra distance (km)', type: 'number' },
  { key: 'businessCost', label: 'Known trip running cost (₹)', type: 'currency' },
  { key: 'approvedCost', label: 'Known approved extra running cost (₹)', type: 'currency' },
  { key: 'deviationCost', label: 'Known deviation cost (₹)', type: 'currency' },
  { key: 'totalCost', label: 'Known estimated running cost (₹)', type: 'currency' },
  { key: 'uncostedRecords', label: 'Records without a cost', type: 'number' },
  { key: 'partialCostRecords', label: 'Records with partial cost', type: 'number' },
];

export const RECORD_EXPORT_COLUMNS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'kind', label: 'Record type' },
  { key: 'vehicleNumber', label: 'Truck' },
  { key: 'driverName', label: 'Driver' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'distanceKm', label: 'Loaded distance (km)', type: 'number' },
  { key: 'distanceSource', label: 'Distance source' },
  { key: 'refuelLitres', label: 'Diesel bought during trip (L)', type: 'number' },
  { key: 'fuelUsedLitres', label: 'Laden / extra fuel consumed (L)', type: 'number' },
  { key: 'roleFuelL', label: 'Saved laden role fuel estimate (L)', type: 'number' },
  { key: 'mileageKmPerL', label: 'Laden mileage (km/L)', type: 'number' },
  { key: 'knownLadenFuelLitres', label: 'Known laden fuel including partial (L)', type: 'number' },
  { key: 'ladenFuelBasis', label: 'Laden fuel completeness' },
  { key: 'fuelSource', label: 'Laden fuel source' },
  { key: 'fuelReadingConflict', label: 'Saved role fuel differs from direct measurement' },
  { key: 'mileageEligible', label: 'Complete fuel available for mileage' },
  { key: 'extraKm', label: 'Extra distance (km)', type: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'totalCostInr', label: 'Known estimated running cost (₹)', type: 'currency' },
  { key: 'fuelCostInr', label: 'Digest-price fuel cost subtotal (₹)', type: 'currency' },
  { key: 'wearCostInr', label: 'Known wear cost (₹)', type: 'currency' },
  { key: 'fuelRateInrPerL', label: 'State-history diesel rate (₹/L)', type: 'number' },
  { key: 'priceState', label: 'Last refuelling state' },
  { key: 'priceDate', label: 'Stored diesel price date' },
  { key: 'stalePrice', label: 'Uses latest earlier quote' },
  { key: 'priceReason', label: 'Missing price reason' },
  { key: 'partialCost', label: 'Cost incomplete' },
];
