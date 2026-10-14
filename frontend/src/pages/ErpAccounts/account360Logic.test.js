import { describe, it, expect } from 'vitest';
import { creditUsage, openItemsTotal } from './account360Logic';

describe('creditUsage', () => {
  it('has no gauge without a credit limit', () => {
    expect(creditUsage(0, 50000)).toEqual({ utilisation: null, overLimit: false, overBy: 0 });
    expect(creditUsage(undefined, 50000)).toEqual({
      utilisation: null,
      overLimit: false,
      overBy: 0,
    });
  });

  it('has no gauge before the balance loads', () => {
    expect(creditUsage(100000, null)).toEqual({ utilisation: null, overLimit: false, overBy: 0 });
  });

  it('reports the share of the limit a debit balance uses', () => {
    expect(creditUsage(200000, 50000)).toEqual({ utilisation: 25, overLimit: false, overBy: 0 });
  });

  it('a zero balance uses none of the limit', () => {
    expect(creditUsage(200000, 0)).toEqual({ utilisation: 0, overLimit: false, overBy: 0 });
  });

  it('a credit (negative) balance uses none of the limit', () => {
    expect(creditUsage(200000, -75000)).toEqual({ utilisation: 0, overLimit: false, overBy: 0 });
  });

  it('exactly at the limit is full but not over', () => {
    expect(creditUsage(200000, 200000)).toEqual({
      utilisation: 100,
      overLimit: false,
      overBy: 0,
    });
  });

  it('above the limit says by how much', () => {
    expect(creditUsage(200000, 260000)).toEqual({
      utilisation: 130,
      overLimit: true,
      overBy: 60000,
    });
  });
});

describe('openItemsTotal', () => {
  it('sums outstanding amounts', () => {
    expect(openItemsTotal([{ outstandingAmount: 1000 }, { outstandingAmount: 2500.5 }])).toBe(
      3500.5,
    );
  });

  it('keeps a settled item at 0 instead of falling back to its net amount', () => {
    expect(openItemsTotal([{ outstandingAmount: 0, netAmount: 9000 }])).toBe(0);
  });

  it('falls back to net amount only when outstanding is missing', () => {
    expect(
      openItemsTotal([{ netAmount: 9000 }, { outstandingAmount: null, netAmount: 1000 }]),
    ).toBe(10000);
  });

  it('is zero for an empty page or items with no amounts', () => {
    expect(openItemsTotal([])).toBe(0);
    expect(openItemsTotal([{}])).toBe(0);
  });
});
