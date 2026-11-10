import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataImportService from '@/services/DataImportService';
import {
  detectSheetMapping,
  detectedColumns,
  detectedEmployeeColumn,
  detectedVehicleColumn,
} from './employeeSheetPreview';

vi.mock('@/services/DataImportService', () => ({
  default: { preview: vi.fn() },
}));

describe('employee sheet preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the detected mapping when the operator has chosen no column', async () => {
    DataImportService.preview.mockResolvedValue({
      detectedMapping: { 'Mobile Number': 'employee', 'Truck No': 'vehicle' },
    });
    const file = new File(['a'], 'drivers.csv', { type: 'text/csv' });
    const detected = await detectSheetMapping(file, 'drivers');
    expect(detected).toEqual({ 'Mobile Number': 'employee', 'Truck No': 'vehicle' });
    expect(DataImportService.preview).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'drivers', mapping: {} }),
    );
  });

  it('reads both shapes the server may answer with', () => {
    const headers = ['Mobile Number', 'Truck No'];
    expect(detectedColumns({ 'Mobile Number': 'employee' }, headers)).toEqual({
      employee: 'Mobile Number',
    });
    expect(detectedColumns({ employee: 'Mobile Number' }, headers)).toEqual({
      employee: 'Mobile Number',
    });
    expect(detectedColumns({ 'Mobile Number': 'employee' }, ['Other'])).toEqual({});
  });

  it('finds the employee and vehicle columns', () => {
    const detected = { employee: 'Mobile Number', vehicle: 'Truck No' };
    const headers = ['Mobile Number', 'Truck No'];
    expect(detectedEmployeeColumn(detected, headers)).toBe('Mobile Number');
    expect(detectedVehicleColumn(detected, headers)).toBe('Truck No');
  });

  it('keeps working when the server cannot read the sheet', async () => {
    DataImportService.preview.mockRejectedValue(new Error('nope'));
    expect(await detectSheetMapping(new File(['a'], 'drivers.csv'), 'drivers')).toBeNull();
  });
});
