/**
 * Frontend Custom Report Field Definitions
 * Mirrors the server allowlist and provides UI presentation metadata.
 */

export const FRONTEND_FIELD_CATALOG = [
  // Driver
  { key: 'driverName', label: 'Driver Name', module: 'DRIVER', type: 'text' },
  { key: 'driverId', label: 'Driver ID', module: 'DRIVER', type: 'text' },
  { key: 'driverPhone', label: 'Driver Phone', module: 'DRIVER', type: 'text' },
  { key: 'driverStatus', label: 'Driver Status', module: 'DRIVER', type: 'badge' },
  { key: 'licenseNumber', label: 'License Number', module: 'DRIVER', type: 'text' },

  // Vehicle
  { key: 'vehicleNumber', label: 'Vehicle Number', module: 'VEHICLE', type: 'text' },
  { key: 'vehicleType', label: 'Vehicle Type', module: 'VEHICLE', type: 'text' },
  { key: 'manufacturer', label: 'Manufacturer', module: 'VEHICLE', type: 'text' },
  { key: 'model', label: 'Vehicle Model', module: 'VEHICLE', type: 'text' },
  { key: 'chassisNumber', label: 'Chassis Number', module: 'VEHICLE', type: 'text' },
  { key: 'branchName', label: 'Branch', module: 'VEHICLE', type: 'text' },

  // Fuel
  { key: 'fuelDate', label: 'Refuel Date', module: 'FUEL', type: 'date' },
  { key: 'fuelType', label: 'Fuel Type', module: 'FUEL', type: 'text' },
  { key: 'fillingType', label: 'Filling Type', module: 'FUEL', type: 'text' },
  { key: 'fuelQuantity', label: 'Fuel Quantity (L)', module: 'FUEL', type: 'number', unit: 'L' },
  { key: 'fuelRate', label: 'Fuel Rate (₹/L)', module: 'FUEL', type: 'currency' },
  { key: 'fuelAmount', label: 'Fuel Spend (₹)', module: 'FUEL', type: 'currency' },
  { key: 'pumpName', label: 'Pump Name', module: 'FUEL', type: 'text' },
  { key: 'billDetails', label: 'Bill Reference', module: 'FUEL', type: 'text' },

  // Trip & Mileage
  { key: 'tripDate', label: 'Trip Date', module: 'TRIP', type: 'date' },
  { key: 'tripDistance', label: 'Trip Distance (KM)', module: 'TRIP', type: 'number', unit: 'KM' },
  {
    key: 'startOdometer',
    label: 'Start Odometer (KM)',
    module: 'TRIP',
    type: 'number',
    unit: 'KM',
  },
  { key: 'endOdometer', label: 'End Odometer (KM)', module: 'TRIP', type: 'number', unit: 'KM' },
  { key: 'mileage', label: 'Mileage (KM/L)', module: 'TRIP', type: 'number', unit: 'KM/L' },
  { key: 'costPerKm', label: 'Cost Per KM (₹/KM)', module: 'TRIP', type: 'currency' },

  // AdBlue
  { key: 'adblueQuantity', label: 'AdBlue Added (L)', module: 'ADBLUE', type: 'number', unit: 'L' },
  { key: 'adblueAmount', label: 'AdBlue Amount (₹)', module: 'ADBLUE', type: 'currency' },
  {
    key: 'fleetEdgeConsumption',
    label: 'FleetEdge Consumed (L)',
    module: 'ADBLUE',
    type: 'number',
    unit: 'L',
  },
  {
    key: 'currentDefLevel',
    label: 'Current DEF Level (%)',
    module: 'ADBLUE',
    type: 'number',
    unit: '%',
  },
  {
    key: 'unreconciledQuantity',
    label: 'Unreconciled Variance (L)',
    module: 'ADBLUE',
    type: 'number',
    unit: 'L',
  },

  // Compliance
  { key: 'rcStatus', label: 'RC Status', module: 'COMPLIANCE', type: 'badge' },
  { key: 'rcExpiryDate', label: 'RC Expiry Date', module: 'COMPLIANCE', type: 'date' },
  { key: 'insuranceStatus', label: 'Insurance Status', module: 'COMPLIANCE', type: 'badge' },
  {
    key: 'insuranceExpiryDate',
    label: 'Insurance Expiry Date',
    module: 'COMPLIANCE',
    type: 'date',
  },
  { key: 'fitnessStatus', label: 'Fitness Status', module: 'COMPLIANCE', type: 'badge' },
  { key: 'fitnessExpiryDate', label: 'Fitness Expiry Date', module: 'COMPLIANCE', type: 'date' },
  { key: 'permitStatus', label: 'Permit Status', module: 'COMPLIANCE', type: 'badge' },
  { key: 'permitExpiryDate', label: 'Permit Expiry Date', module: 'COMPLIANCE', type: 'date' },
  { key: 'puccStatus', label: 'PUCC Status', module: 'COMPLIANCE', type: 'badge' },
  { key: 'puccExpiryDate', label: 'PUCC Expiry Date', module: 'COMPLIANCE', type: 'date' },
];

export const FRONTEND_FIELD_MAP = new Map(FRONTEND_FIELD_CATALOG.map((f) => [f.key, f]));

export function getFrontendField(key) {
  return FRONTEND_FIELD_MAP.get(key) || { key, label: key, type: 'text' };
}

export const DATASETS = [
  {
    id: 'fuel_transactions',
    label: 'Fuel Transactions',
    description: 'Detailed refuel logs with pump locations, amounts, rates and bills',
    category: 'FUEL',
  },
  {
    id: 'trips_mileage',
    label: 'Trips & Mileage',
    description: 'Trip distances, odometer readings, cycle fuel and fuel efficiency (km/L)',
    category: 'TRIP',
  },
  {
    id: 'vehicle_compliance',
    label: 'Vehicle Compliance & Documents',
    description: 'RC, insurance, fitness, permit, PUCC validity status and expiry timelines',
    category: 'COMPLIANCE',
  },
  {
    id: 'adblue_telemetry',
    label: 'AdBlue / DEF Telemetry & Reconciliation',
    description: 'DEF top-ups vs FleetEdge CAN consumption, variance and live tank levels',
    category: 'ADBLUE',
  },
  {
    id: 'driver_summary',
    label: 'Driver Fuel & Performance Summary',
    description: 'Aggregated driver fuel spend, litres, trips, distance and overall mileage',
    category: 'DRIVER',
  },
];

export const PROPOSED_UNSUPPORTED_FIELDS = [
  {
    key: 'gpsOverSpeedViolations',
    label: 'Over-Speed Violations Count',
    module: 'TRIP',
    reason: 'Requires real-time Valhalla map matching and speed limit telemetry ingestion.',
  },
  {
    key: 'fastagPlazaBreakdown',
    label: 'FASTag Plaza-by-Plaza Deductions',
    module: 'FUEL',
    reason: 'Requires live NPCI/NETC bank statement integration.',
  },
  {
    key: 'driverFatigueIncidents',
    label: 'Driver Fatigue / Drowsiness Incidents',
    module: 'DRIVER',
    reason: 'Requires in-cabin computer-vision DMS (Driver Monitoring System) hardware.',
  },
  {
    key: 'carbonEmissionIndex',
    label: 'Carbon Emission Index (CO2e)',
    module: 'COMPLIANCE',
    reason: 'Requires ARAI/emission factor lookup tables and fuel density calibration.',
  },
];

export const REPORT_TEMPLATES = [
  {
    id: 'tpl-driver-fuel-efficiency',
    name: 'Driver Fuel & Efficiency Summary',
    category: 'DRIVER',
    dataset: 'driver_summary',
    description:
      'High-level driver audit of diesel spent, distance completed, and realized km/L efficiency.',
    fields: [
      'driverName',
      'driverPhone',
      'driverStatus',
      'fuelQuantity',
      'fuelAmount',
      'tripDistance',
      'mileage',
      'costPerKm',
    ],
    sorting: { field: 'fuelAmount', order: 'desc' },
    aggregations: [
      { field: 'fuelQuantity', op: 'SUM' },
      { field: 'fuelAmount', op: 'SUM' },
      { field: 'tripDistance', op: 'SUM' },
      { field: 'mileage', op: 'AVG' },
    ],
  },
  {
    id: 'tpl-fleet-compliance-tracker',
    name: 'Fleet Document Compliance Tracker',
    category: 'COMPLIANCE',
    dataset: 'vehicle_compliance',
    description:
      'Operational view of document expiries across RC, Insurance, Fitness, Permit and PUCC.',
    fields: [
      'vehicleNumber',
      'vehicleType',
      'model',
      'rcStatus',
      'rcExpiryDate',
      'insuranceStatus',
      'insuranceExpiryDate',
      'fitnessStatus',
      'fitnessExpiryDate',
      'permitStatus',
      'permitExpiryDate',
      'puccStatus',
      'puccExpiryDate',
    ],
    sorting: { field: 'vehicleNumber', order: 'asc' },
    aggregations: [{ field: 'vehicleNumber', op: 'COUNT' }],
  },
  {
    id: 'tpl-fuel-bills-audit',
    name: 'Fuel Bills & Station Audit',
    category: 'FUEL',
    dataset: 'fuel_transactions',
    description:
      'Detailed financial and vendor reconciliation of diesel purchases by vehicle and pump.',
    fields: [
      'fuelDate',
      'vehicleNumber',
      'driverName',
      'fuelType',
      'fuelQuantity',
      'fuelRate',
      'fuelAmount',
      'pumpName',
      'billDetails',
    ],
    sorting: { field: 'fuelDate', order: 'desc' },
    aggregations: [
      { field: 'fuelQuantity', op: 'SUM' },
      { field: 'fuelAmount', op: 'SUM' },
    ],
  },
  {
    id: 'tpl-adblue-variance-telemetry',
    name: 'AdBlue Variance & Live Level',
    category: 'ADBLUE',
    dataset: 'adblue_telemetry',
    description:
      'Reconciles billed DEF additions against FleetEdge telematics CAN consumption and live tank levels.',
    fields: [
      'vehicleNumber',
      'vehicleType',
      'adblueQuantity',
      'adblueAmount',
      'fleetEdgeConsumption',
      'currentDefLevel',
      'unreconciledQuantity',
    ],
    sorting: { field: 'unreconciledQuantity', order: 'desc' },
    aggregations: [
      { field: 'adblueQuantity', op: 'SUM' },
      { field: 'adblueAmount', op: 'SUM' },
      { field: 'fleetEdgeConsumption', op: 'SUM' },
      { field: 'currentDefLevel', op: 'AVG' },
    ],
  },
];
