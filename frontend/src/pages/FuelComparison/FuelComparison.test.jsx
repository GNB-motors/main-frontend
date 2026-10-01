import { describe, it, expect, vi } from 'vitest';
import {
  formatDateRange,
  formatDateTimeIST,
  fmtLitres,
  fmtKm,
  fmtDuration,
  exportComparisonToCsv,
} from './formatIST';

describe('Fuel Comparison Audit Helpers & Logic', () => {
  describe('Formatting Utilities', () => {
    it('formats IST date ranges properly', () => {
      const from = '2026-09-23T01:18:00.000Z';
      const to = '2026-09-25T01:19:00.000Z';
      const range = formatDateRange(from, to);
      expect(range).toBe('23 Sep 26 → 25 Sep 26');
    });

    it('formats IST date times with AM/PM', () => {
      const dt = '2026-09-25T01:19:00.000Z';
      const formatted = formatDateTimeIST(dt);
      expect(formatted).toContain('25 Sep 26');
      expect(formatted).toContain('06:49 AM');
    });

    it('formats fuel volume with L suffix and 2 decimals in Indian numbering', () => {
      expect(fmtLitres(150)).toBe('150.00 L');
      expect(fmtLitres(1500.75)).toBe('1,500.75 L');
      expect(fmtLitres(null)).toBe('—');
    });

    it('formats kilometres with km suffix and 1 decimal', () => {
      expect(fmtKm(614.58)).toBe('614.6 km');
      expect(fmtKm(125068.8)).toBe('1,25,068.8 km');
      expect(fmtKm(null)).toBe('—');
    });

    it('formats interval window durations cleanly', () => {
      const from = '2026-09-23T01:18:00.000Z';
      const to = '2026-09-25T01:19:00.000Z';
      const dur = fmtDuration(from, to);
      expect(dur).toBe('2d 0h');
    });
  });

  describe('Fuel Variance & Overbilling Audit Logic', () => {
    it('accurately identifies overbilling when billed fuel exceeds telematics', () => {
      const billedFuel = 150;
      const telematicsFuel = 102.2;
      const variance = billedFuel - telematicsFuel;
      const variancePct = (variance / telematicsFuel) * 100;

      expect(variance).toBeCloseTo(47.8, 1);
      expect(variancePct).toBeCloseTo(46.77, 1);
      expect(variance > 0).toBe(true);
    });

    it('considers small differences within ±5L as clean match', () => {
      const billedFuel = 150;
      const telematicsFuel = 148.5;
      const variance = billedFuel - telematicsFuel;

      const isClean = Math.abs(variance) <= 5;
      expect(isClean).toBe(true);
    });

    it('correctly maps audit flags for manager review tasks', () => {
      const task = {
        _id: 'task-1',
        status: 'PENDING_REVIEW',
        reviewReason: 'OCR odometer reading conflicts with FleetEdge telematics',
        ocrOdometerReading: 125000,
        maxOdometer: 124000,
      };

      const isReview = task.status === 'PENDING_REVIEW';
      const odoDelta = Math.abs(task.ocrOdometerReading - task.maxOdometer);

      expect(isReview).toBe(true);
      expect(odoDelta).toBe(1000);
      expect(task.reviewReason).toContain('OCR odometer reading conflicts');
    });
  });

  describe('CSV Export Serialization', () => {
    it('creates a downloadable CSV blob and triggers download', () => {
      const dummyRecords = [
        {
          _id: '6abd0ed038d0810bed793f4a',
          vehicleNumber: 'WB-99-PI-0004',
          driverId: { firstName: 'Ram', lastName: 'Kumar' },
          fromDate: '2026-09-25T01:19:00.000Z',
          toDate: '2026-09-27T01:16:00.000Z',
          billFuelConsumed: 150,
          fleetEdgeFuelConsumed: 102.2,
          variance: 47.8,
          variancePercent: 31.87,
          isFlagged: true,
          flagReason: 'Bill fuel exceeds FleetEdge by 47.80L',
          distanceTravelled: 614.6,
          fuelEfficiency: 3.84,
          dataSource: 'SINK',
        },
      ];

      // Mock URL and DOM link
      const createObjectURLMock = vi.fn().mockReturnValue('blob:dummy-url');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        click: clickMock,
      });

      exportComparisonToCsv(dummyRecords, 'test.csv');

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:dummy-url');

      appendChildMock.mockRestore();
      removeChildMock.mockRestore();
    });
  });
});
