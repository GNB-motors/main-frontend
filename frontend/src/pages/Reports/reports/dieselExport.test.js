import { describe, expect, it, vi } from 'vitest';
import { mapUnifiedRow } from '../../Mileage/refuelRows';
import { ReportsService } from '../ReportsService.js';
import { DIESEL_EXPORT_COLUMNS, dieselExportRow } from './dieselExport';

const feedRow = (over = {}) => ({
  id: 'f1',
  vehicleNumber: 'WB11F4362',
  vehicleModel: 'Tata Signa',
  at: '2026-11-20T20:15:00Z',
  verificationStatus: 'VERIFIED',
  slip: {
    litres: 200,
    rate: 92.5,
    totalAmount: 18500,
    stationName: 'HP Kolaghat',
    odometerReading: 152340,
    odometerSource: 'OCR',
    driverName: 'Satradhun Rai',
    fuelType: 'DIESEL',
  },
  sensor: { litres: 198.4, billVarianceL: -1.6 },
  ...over,
});

describe('dieselExportRow', () => {
  it('writes a fill the way the table shows it, with the time in IST', () => {
    const row = dieselExportRow(mapUnifiedRow(feedRow()));
    expect(row).toMatchObject({
      vehicleNo: 'WB11F4362',
      model: 'Tata Signa',
      date: '2026-11-20T20:15:00Z',
      time: '01:45',
      driver: 'Satradhun Rai',
      sensorLitres: 198.4,
      billLitres: 200,
      result: 'Bill matches',
      pump: 'HP Kolaghat',
      rate: 92.5,
      amount: 18500,
      odometer: 152340,
      odometerSource: 'Odometer photo',
    });
    expect(Object.keys(row).sort()).toEqual(DIESEL_EXPORT_COLUMNS.map((c) => c.key).sort());
  });

  it('leaves the bill side blank for a fill with no bill', () => {
    const row = dieselExportRow(
      mapUnifiedRow(feedRow({ slip: null, verificationStatus: 'UNVERIFIED' })),
    );
    expect(row).toMatchObject({ billLitres: null, rate: null, amount: null, driver: null });
    expect(row.sensorLitres).toBe(198.4);
  });

  it('names a typed-in odometer', () => {
    const fill = feedRow();
    fill.slip.odometerSource = 'MANUAL';
    expect(dieselExportRow(mapUnifiedRow(fill)).odometerSource).toBe('Typed in');
  });
});

describe('fetchAllReportRows', () => {
  it('walks every page at the page size the API allows', async () => {
    const fetchPage = vi.fn(async ({ page }) => ({
      data: [`row${page}`],
      meta: { totalPages: 3 },
    }));
    const rows = await ReportsService.fetchAllReportRows(
      fetchPage,
      { fuelType: 'DIESEL' },
      { limit: 200 },
    );
    expect(rows).toEqual(['row1', 'row2', 'row3']);
    expect(fetchPage).toHaveBeenCalledWith({ fuelType: 'DIESEL', page: 2, limit: 200 });
  });
});
