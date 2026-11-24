import { FleetDataService } from '../../services/FleetDataService';
import { getVehicleList } from '../../services/vehicleListService';
import { MaintenanceService } from './MaintenanceService';

const regKey = (value) =>
  String(value || '')
    .replace(/\s/g, '')
    .toUpperCase();
const inactive = new Set(['DEACTIVATED', 'INACTIVE', 'DELETED', 'SOLD']);

export function activeServiceForecasts(predictions, vehicles) {
  const byReg = new Map();
  for (const row of predictions || []) {
    const key = regKey(row.registrationNumber);
    const previous = byReg.get(key);
    if (!previous || (Date.parse(row.computedAt) || 0) > (Date.parse(previous.computedAt) || 0))
      byReg.set(key, row);
  }
  const active = new Map();
  for (const vehicle of vehicles || []) {
    const key = regKey(vehicle.registrationNumber);
    if (
      key &&
      !inactive.has(String(vehicle.status || '').toUpperCase()) &&
      vehicle.isActive !== false
    )
      active.set(key, vehicle);
  }
  return [...active]
    .map(([key, vehicle]) => {
      const prediction = byReg.get(key);
      return {
        ...prediction,
        registrationNumber: vehicle.registrationNumber,
        vehicleId: vehicle._id || vehicle.id,
        risk: prediction?.risk || 'UNKNOWN',
        // TELEMETRY_START is the first reading, not a completed service.
        lastServiceAt: prediction?.basis === 'LAST_SERVICE' ? prediction.lastServiceAt : null,
      };
    })
    .sort((a, b) => {
      const rank = { OVERDUE: 0, DUE_SOON: 1, OK: 2, UNKNOWN: 3 };
      return (
        (rank[a.risk] ?? 3) - (rank[b.risk] ?? 3) ||
        (a.kmUntilDue ?? Infinity) - (b.kmUntilDue ?? Infinity) ||
        regKey(a.registrationNumber).localeCompare(regKey(b.registrationNumber))
      );
    });
}

export async function loadServiceForecasts() {
  const [predictions, vehicles] = await Promise.all([
    FleetDataService.getMaintenancePredictions(),
    getVehicleList(),
  ]);
  return activeServiceForecasts(predictions?.records, vehicles);
}

export function mergeServiceAlerts(alerts, forecasts) {
  const activeRegs = new Set(forecasts.map((row) => regKey(row.registrationNumber)));
  const other = alerts.filter(
    (alert) =>
      (alert.type !== 'SERVICE_DUE' || alert.resolved) &&
      (!alert.vehicleReg || activeRegs.has(regKey(alert.vehicleReg))),
  );
  return [
    ...other,
    ...forecasts
      .filter((row) => ['OVERDUE', 'DUE_SOON'].includes(row.risk))
      .map((row) => ({
        id: `prediction:${regKey(row.registrationNumber)}`,
        type: 'SERVICE_DUE',
        severity: row.risk === 'OVERDUE' ? 'CRITICAL' : 'WARNING',
        vehicleReg: row.registrationNumber,
        description:
          row.kmUntilDue != null
            ? row.kmUntilDue < 0
              ? `Service overdue by ${Math.round(Math.abs(row.kmUntilDue)).toLocaleString('en-IN')} km`
              : `Service due in ${Math.round(row.kmUntilDue).toLocaleString('en-IN')} km`
            : row.risk === 'OVERDUE'
              ? 'Service overdue — check the service record'
              : 'Service due soon',
        createdDate: row.computedAt,
        prediction: true,
        resolved: false,
      })),
  ];
}

export async function loadServiceAlerts() {
  const [alerts, forecasts] = await Promise.all([
    MaintenanceService.getAlerts(),
    loadServiceForecasts(),
  ]);
  return mergeServiceAlerts(alerts, forecasts);
}

export function serviceDaysText(days) {
  if (days == null || days === '' || !Number.isFinite(Number(days)))
    return 'Due date not projected';
  const value = Number(days);
  if (value === 0) return 'Due today';
  const n = Math.abs(value);
  const duration =
    n < 1 ? 'less than 1 day' : `${Math.round(n)} day${Math.round(n) === 1 ? '' : 's'}`;
  return value < 0 ? `Overdue by ${duration}` : `Due in ${duration}`;
}
