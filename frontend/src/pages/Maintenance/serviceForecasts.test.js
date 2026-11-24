import { expect, it, vi } from 'vitest';
import { activeServiceForecasts, mergeServiceAlerts, loadServiceAlerts } from './serviceForecasts';
import { FleetDataService } from '../../services/FleetDataService';
import { getVehicleList } from '../../services/vehicleListService';
import { MaintenanceService } from './MaintenanceService';

vi.mock('../../services/FleetDataService', () => ({
  FleetDataService: { getMaintenancePredictions: vi.fn() },
}));
vi.mock('../../services/vehicleListService', () => ({ getVehicleList: vi.fn() }));
vi.mock('./MaintenanceService', () => ({ MaintenanceService: { getAlerts: vi.fn() } }));

const fleet = [
  { registrationNumber: 'WB1', status: 'AVAILABLE' },
  { registrationNumber: 'WB2', status: 'ON_TRIP' },
  { registrationNumber: 'WB3', status: 'DEACTIVATED' },
  { registrationNumber: 'WB4', status: 'AVAILABLE' },
];
const predictions = [
  {
    registrationNumber: 'WB1',
    risk: 'OVERDUE',
    kmUntilDue: -50,
    basis: 'TELEMETRY_START',
    lastServiceAt: '2026-09-15',
  },
  {
    registrationNumber: 'WB2',
    risk: 'OVERDUE',
    kmUntilDue: -200,
    basis: 'LAST_SERVICE',
    lastServiceAt: '2026-11-01',
  },
  { registrationNumber: 'WB3', risk: 'OVERDUE', kmUntilDue: -999 },
  { registrationNumber: 'OLD', risk: 'OVERDUE', kmUntilDue: -9999 },
];

it('matches active fleet membership, keeps missing forecasts unknown and orders by overdue km', () => {
  const rows = activeServiceForecasts(predictions, fleet);
  expect(rows.map((row) => row.registrationNumber)).toEqual(['WB2', 'WB1', 'WB4']);
  expect(rows[0].lastServiceAt).toBe('2026-11-01');
  expect(rows[1].lastServiceAt).toBeNull();
  expect(rows[2].risk).toBe('UNKNOWN');
});

it('uses those same overdue trucks in Fleet Alerts without duplicating legacy service alerts', () => {
  const rows = activeServiceForecasts(predictions, fleet);
  const alerts = mergeServiceAlerts(
    [
      { id: 'legacy', type: 'SERVICE_DUE', vehicleReg: 'WB1', resolved: false },
      { id: 'old-resolution', type: 'SERVICE_DUE', vehicleReg: 'WB1', resolved: true },
      { id: 'repair', type: 'HIGH_REPAIR_SPEND', vehicleReg: 'WB2', resolved: false },
    ],
    rows,
  );
  expect(
    alerts
      .filter((row) => row.type === 'SERVICE_DUE' && !row.resolved)
      .map((row) => row.vehicleReg),
  ).toEqual(['WB2', 'WB1']);
  expect(alerts.find((row) => row.id === 'legacy')).toBeUndefined();
  expect(alerts.find((row) => row.id === 'old-resolution').resolved).toBe(true);
  expect(alerts.find((row) => row.id === 'repair')).toBeTruthy();
});

it('loads alerts and predictions together, and does not report a healthy fleet if either fails', async () => {
  getVehicleList.mockResolvedValue(fleet);
  FleetDataService.getMaintenancePredictions.mockResolvedValue({ records: predictions });
  MaintenanceService.getAlerts.mockResolvedValue([]);
  expect((await loadServiceAlerts()).filter((row) => row.prediction)).toHaveLength(2);
  FleetDataService.getMaintenancePredictions.mockRejectedValue(new Error('Forecasts unavailable'));
  await expect(loadServiceAlerts()).rejects.toThrow('Forecasts unavailable');
});
