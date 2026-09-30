import { describe, it, expect } from 'vitest';
import {
  fmtMoney,
  fmtLitres,
  fmtDate,
  fmtRelativeTime,
  verifyFuelMath,
  evaluateOcrQuality,
  getOdometerMeta,
  crossVerifyStation,
  filterByDatePreset,
  computeReceiptKpis,
} from './ReceiptApproval.shared';

describe('ReceiptApproval.shared — WhatsApp Fuel Approvals Unit Tests', () => {
  describe('Formatting Helpers', () => {
    it('formats Indian currency correctly', () => {
      expect(fmtMoney(12500)).toBe('₹12,500');
      expect(fmtMoney(89.5)).toBe('₹89.5');
      expect(fmtMoney(null)).toBe('—');
      expect(fmtMoney(undefined)).toBe('—');
    });

    it('formats litres with L suffix', () => {
      expect(fmtLitres(240)).toBe('240 L');
      expect(fmtLitres(150.75)).toBe('150.75 L');
      expect(fmtLitres(null)).toBe('—');
    });

    it('formats date and relative time', () => {
      const past = new Date(Date.now() - 3600000); // 1 hour ago
      expect(fmtRelativeTime(past)).toBe('1h ago');
      expect(fmtRelativeTime(null)).toBe('—');
      expect(fmtDate(null)).toBe('—');
    });
  });

  describe('Fuel Math Verification (Solves OCR Accuracy Question)', () => {
    it('verifies exact math when litres * rate == amount', () => {
      // 200 Litres * ₹89.50/L = ₹17,900
      const math = verifyFuelMath(200, 89.5, 17900);
      expect(math).not.toBeNull();
      expect(math.isValid).toBe(true);
      expect(math.diff).toBe(0);
    });

    it('allows minor rounding tolerance within ±₹2.5', () => {
      // 142.33 Litres * ₹89.45 = ₹12,731.42, billed as ₹12,732
      const math = verifyFuelMath(142.33, 89.45, 12732);
      expect(math.isValid).toBe(true);
      expect(math.diff).toBeLessThan(1);
    });

    it('detects fraudulent or miscalculated slips', () => {
      // 200 Litres * ₹89.50 = ₹17,900, but receipt claims ₹25,000
      const math = verifyFuelMath(200, 89.5, 25000);
      expect(math.isValid).toBe(false);
      expect(math.diff).toBe(7100);
    });
  });

  describe('evaluateOcrQuality (Replaces arbitrary 98% with verifiable score)', () => {
    it('awards high confidence when all fields match and math is verified', () => {
      const draft = {
        litres: 240,
        rate: 89.5,
        amount: 21480,
        plateText: 'WB25R9540',
        vehicleReg: 'WB25R9540',
        odometerReading: 145000,
      };
      const res = evaluateOcrQuality(draft);
      expect(res.level).toBe('high');
      expect(res.score).toBeGreaterThanOrEqual(85);
      expect(res.tags.some((t) => t.key === 'math' && t.valid)).toBe(true);
    });

    it('penalizes missing volume and amount as low confidence', () => {
      const brokenDraft = {
        litres: null,
        rate: 89.5,
        amount: null,
      };
      const res = evaluateOcrQuality(brokenDraft);
      expect(res.level).toBe('low');
      expect(res.label).toBe('Needs Review');
    });
  });

  describe('getOdometerMeta (Odometer Source & Missing Odo Flagging)', () => {
    it('flags missing odometer with warning pill if reading is null', () => {
      const draft = { odometerReading: null };
      const meta = getOdometerMeta(draft);
      expect(meta.isMissing).toBe(true);
      expect(meta.badgeText).toBe('Missing Odometer');
      expect(meta.badgeClass).toContain('missing');
    });

    it('flags missing odometer if adminNotes contains MISSING_ODOMETER', () => {
      const draft = { adminNotes: 'NEEDS_REVIEW:MISSING_ODOMETER' };
      const meta = getOdometerMeta(draft);
      expect(meta.isMissing).toBe(true);
    });

    it('identifies FleetEdge CAN-bus auto telematics sync', () => {
      const draft = {
        odometerReading: 154200,
        odometerSource: 'FLEETEDGE',
      };
      const meta = getOdometerMeta(draft);
      expect(meta.isMissing).toBe(false);
      expect(meta.badgeText).toBe('FleetEdge Auto');
      expect(meta.displayReading).toBe('1,54,200 km');
    });

    it('identifies dash photo OCR extraction', () => {
      const draft = {
        odometerReading: 89340,
        odometerPhotoProvided: true,
        odometerSource: 'OCR',
      };
      const meta = getOdometerMeta(draft);
      expect(meta.badgeText).toBe('Dash Photo OCR');
    });
  });

  describe('crossVerifyStation (Telematics Station & Benchmark Rate)', () => {
    it('compares bill rate with state benchmark rate and calculates variance', () => {
      const draft = {
        stationName: 'IOCL Highway Service Station',
        rate: 89.65,
        pumpLocation: { lat: 23.41, lng: 87.21 },
      };
      const info = crossVerifyStation(draft);
      expect(info.stationName).toBe('IOCL Highway Service Station');
      expect(info.isRateNormal).toBe(true);
      expect(info.haltTime).toContain('mins');
    });
  });

  describe('computeReceiptKpis', () => {
    it('accurately computes summary metrics across drafts', () => {
      const drafts = [
        { status: 'READY', litres: 100, rate: 90, amount: 9000, odometerReading: 10000 },
        { status: 'READY', litres: 200, rate: 90, amount: 18000, odometerReading: null }, // Missing odo
        { status: 'PUBLISHED', litres: 150, rate: 90, amount: 13500, odometerReading: 12000 },
      ];
      const kpis = computeReceiptKpis(drafts);
      expect(kpis.totalCount).toBe(3);
      expect(kpis.totalLitres).toBe(450);
      expect(kpis.totalAmount).toBe(40500);
      expect(kpis.pendingCount).toBe(2);
      expect(kpis.pendingAmount).toBe(27000);
      expect(kpis.missingOdoCount).toBe(1);
    });
  });

  describe('filterByDatePreset', () => {
    it('returns all items for ALL preset', () => {
      const items = [{ createdAt: new Date().toISOString() }];
      expect(filterByDatePreset(items, 'ALL')).toHaveLength(1);
    });

    it('filters today correctly', () => {
      const today = new Date().toISOString();
      const lastYear = new Date(Date.now() - 365 * 86400000).toISOString();
      const items = [{ createdAt: today }, { createdAt: lastYear }];
      const res = filterByDatePreset(items, 'TODAY');
      expect(res).toHaveLength(1);
    });
  });
});
