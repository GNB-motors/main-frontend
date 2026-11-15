import { describe, it, expect } from 'vitest';
import { kpisFromSummary, computeReceiptKpis } from './receiptKpis';

describe('kpisFromSummary', () => {
  it('reads the totals of the whole tab', () => {
    const kpis = kpisFromSummary({
      totalCount: 12,
      totalLitres: 1000,
      totalAmount: 90000,
      pendingCount: 3,
      missingOdoCount: 1,
      rateAnomaliesCount: 2,
    });
    expect(kpis.scope).toBe('tab');
    expect(kpis.totalCount).toBe(12);
    expect(kpis.totalLitres).toBe(1000);
    expect(kpis.totalAmount).toBe(90000);
    expect(kpis.avgRate).toBe('90.00');
  });

  it('leaves a total empty instead of calling it zero', () => {
    const kpis = kpisFromSummary({ totalCount: 0 });
    expect(kpis.totalLitres).toBeNull();
    expect(kpis.totalAmount).toBeNull();
    expect(kpis.pendingCount).toBeNull();
    expect(kpis.avgRate).toBe('—');
  });

  it('has nothing to say when the server sent nothing', () => {
    const kpis = kpisFromSummary(null);
    expect(kpis.scope).toBe('tab');
    expect(kpis.totalCount).toBeNull();
    expect(kpis.coverage).toBeNull();
  });

  it('keeps the coverage of the summary', () => {
    const kpis = kpisFromSummary({
      totalCount: 10,
      coverage: { totalBills: 10, billsWithAmount: 8, billsWithLitres: 9 },
    });
    expect(kpis.coverage.amount).toEqual({ with: 8, of: 10 });
    expect(kpis.coverage.litres).toEqual({ with: 9, of: 10 });
  });
});

describe('computeReceiptKpis', () => {
  it('measures only the page on screen', () => {
    const kpis = computeReceiptKpis([
      { litres: 100, rate: 90, amount: 9000, status: 'READY', odometerReading: 1000 },
      { litres: 50, rate: 90, amount: 4500, status: 'PUBLISHED', odometerReading: 1200 },
    ]);
    expect(kpis.scope).toBe('page');
    expect(kpis.totalCount).toBe(2);
    expect(kpis.totalLitres).toBe(150);
    expect(kpis.totalAmount).toBe(13500);
    expect(kpis.pendingCount).toBe(1);
    expect(kpis.pendingAmount).toBe(9000);
    expect(kpis.missingOdoCount).toBe(0);
    expect(kpis.avgRate).toBe('90.00');
  });

  it('counts the drafts with no odometer', () => {
    const kpis = computeReceiptKpis([{ litres: 10, amount: 900 }, { litres: 10, amount: 900 }]);
    expect(kpis.missingOdoCount).toBe(2);
  });

  it('says how many bills carry a number', () => {
    const kpis = computeReceiptKpis([
      { litres: 100, rate: 90, amount: 9000, odometerReading: 1 },
      { odometerReading: 2 },
    ]);
    expect(kpis.coverage.amount).toEqual({ with: 1, of: 2 });
    expect(kpis.coverage.litres).toEqual({ with: 1, of: 2 });
  });

  it('has no average rate for an empty page', () => {
    const kpis = computeReceiptKpis([]);
    expect(kpis.totalCount).toBe(0);
    expect(kpis.avgRate).toBe('—');
  });
});

describe('kpisFromSummary unknown totals', () => {
  it('a zero volume over real bills with no litres read is unknown, not 0 L', () => {
    const kpis = kpisFromSummary({ totalCount: 201, totalLitres: 0, totalAmount: 1000 });
    expect(kpis.totalLitres).toBeNull();
    expect(kpis.avgRate).toBe('—');
  });
  it('an empty tab keeps its zero', () => {
    expect(kpisFromSummary({ totalCount: 0, totalLitres: 0 }).totalLitres).toBe(0);
  });
});
