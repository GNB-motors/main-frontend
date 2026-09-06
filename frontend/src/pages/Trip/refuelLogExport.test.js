import { describe, it, expect } from 'vitest';
import { REFUEL_EXPORT_COLUMNS, buildExportRow } from './refuelLogExport';

describe('buildExportRow', () => {
  it('maps a full mapped log row to typed export values', () => {
    const row = buildExportRow({
      date: '2026-09-05',
      vehicleNo: 'WB 12A 3456',
      vehicleModel: 'Truck',
      driverName: 'Ram Singh',
      location: 'Dankuni',
      rawFuelType: 'DIESEL',
      rawLitres: 120,
      rawRate: 95.5,
      rawTotalAmount: 11460,
      rawOdometer: 45210,
      rawFillingType: 'FULL_TANK',
    });
    expect(row).toEqual({
      date: '2026-09-05',
      vehicleNo: 'WB 12A 3456',
      vehicleModel: 'Truck',
      driverName: 'Ram Singh',
      location: 'Dankuni',
      fuelTypeLabel: 'Diesel',
      quantity: 120,
      unitPrice: 95.5,
      totalAmount: 11460,
      odometer: 45210,
      fillingTypeLabel: 'Full tank',
    });
  });

  it('turns absent optionals into nulls, not placeholder strings', () => {
    const row = buildExportRow({
      date: '2026-09-05',
      vehicleNo: '-',
      vehicleModel: '-',
      driverName: '-',
      location: '-',
      rawFuelType: undefined,
      rawLitres: 0,
      rawRate: null,
      rawTotalAmount: undefined,
      rawOdometer: null,
      rawFillingType: 'MYSTERY',
    });
    expect(row.vehicleNo).toBeNull();
    expect(row.location).toBeNull();
    expect(row.fuelTypeLabel).toBe('Unknown');
    expect(row.quantity).toBe(0); // 0 is a value
    expect(row.unitPrice).toBeNull();
    expect(row.totalAmount).toBeNull();
    expect(row.odometer).toBeNull();
    expect(row.fillingTypeLabel).toBe('-');
  });

  it('never throws on null / garbage input', () => {
    expect(() => buildExportRow(null)).not.toThrow();
    expect(() => buildExportRow(undefined)).not.toThrow();
    const row = buildExportRow(null);
    expect(row.fuelTypeLabel).toBe('Unknown');
    expect(row.quantity).toBeNull();
  });

  it('labels AdBlue and partial fills in plain words', () => {
    const row = buildExportRow({ rawFuelType: 'ADBLUE', rawFillingType: 'PARTIAL' });
    expect(row.fuelTypeLabel).toBe('AdBlue');
    expect(row.fillingTypeLabel).toBe('Partial');
  });
});

describe('REFUEL_EXPORT_COLUMNS', () => {
  it('types the numeric columns so the sheet can total them', () => {
    const typed = Object.fromEntries(
      REFUEL_EXPORT_COLUMNS.filter((c) => c.type).map((c) => [c.key, c.type]),
    );
    expect(typed).toEqual({
      date: 'date',
      quantity: 'number',
      unitPrice: 'currency',
      totalAmount: 'currency',
      odometer: 'number',
    });
  });
});
