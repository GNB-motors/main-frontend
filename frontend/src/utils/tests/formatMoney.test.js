import { inr, litres, num, pct, money, signedInr, drCr } from '../formatMoney.js';
import { formatINR } from '../formatters.js';

describe('formatMoney.js — central currency formatting', () => {
  describe('inr', () => {
    // One rupee implementation app-wide: inr is formatINR, with a missing
    // amount shown as a dash rather than as ₹0.
    it('prints exactly what formatINR prints', () => {
      for (const v of [0, 999, 45300, 1200000, -4200, 12345678.9]) {
        expect(inr(v)).toBe(formatINR(v));
      }
    });

    it('formats with Indian grouping, no paise', () => {
      expect(inr(1200000)).toBe('₹12,00,000');
      expect(inr(0)).toBe('₹0');
    });

    it('renders an em-dash for a missing amount, never ₹0', () => {
      expect(inr(null)).toBe('—');
      expect(inr(undefined)).toBe('—');
      expect(inr('')).toBe('—');
    });

    it('still prints ₹0 when zero is the real amount', () => {
      expect(inr(0)).toBe('₹0');
    });

    it('rounds away paise', () => {
      expect(inr(1234.6)).toBe('₹1,235');
    });
  });

  describe('num', () => {
    it('formats plain integers with Indian grouping', () => {
      expect(num(120000)).toBe('1,20,000');
    });

    it('keeps printing 0 for a missing count — a count that was not sent is none', () => {
      expect(num(null)).toBe('0');
    });
  });

  describe('litres', () => {
    it('reads a normal value', () => {
      expect(litres(120.4)).toBe('120 L');
    });

    it('renders an em-dash for a missing volume, never 0 L', () => {
      expect(litres(null)).toBe('—');
      expect(litres(undefined)).toBe('—');
    });

    it('still prints 0 L when zero is the real volume', () => {
      expect(litres(0)).toBe('0 L');
    });
  });

  describe('pct', () => {
    it('computes a percentage of a whole', () => {
      expect(pct(1, 4)).toBe(25);
    });

    it('guards divide-by-zero', () => {
      expect(pct(5, 0)).toBe(0);
      expect(pct(5, -1)).toBe(0);
    });

    it('returns a number, not a string', () => {
      expect(typeof pct(1, 2)).toBe('number');
    });
  });

  describe('money', () => {
    it('renders an em-dash for null/undefined/empty string', () => {
      expect(money(null)).toBe('—');
      expect(money(undefined)).toBe('—');
      expect(money('')).toBe('—');
    });

    it('formats real amounts, keeping explicit zero distinct', () => {
      expect(money(0)).toBe('₹0');
      expect(money(5000)).toBe('₹5,000');
    });
  });

  describe('signedInr', () => {
    it('prefixes positive deltas with +', () => {
      expect(signedInr(4200)).toBe('+₹4,200');
    });

    it('prefixes negative deltas with − via inr of the absolute value', () => {
      expect(signedInr(-4200)).toBe('-₹4,200');
    });

    it('renders zero unsigned', () => {
      expect(signedInr(0)).toBe('₹0');
    });

    it('coerces non-numeric input to zero', () => {
      expect(signedInr('abc')).toBe('₹0');
    });
  });

  describe('drCr — accounting presentation', () => {
    it('zero balance is tone zero with no suffix', () => {
      expect(drCr(0)).toEqual({ amount: 0, suffix: '', text: '₹0', tone: 'zero' });
    });

    it('positive balance is a net debit', () => {
      expect(drCr(50000)).toEqual({
        amount: 50000,
        suffix: 'Dr',
        text: '₹50,000 Dr',
        tone: 'debit',
      });
    });

    it('negative balance is a net credit, printed unsigned', () => {
      expect(drCr(-50000)).toEqual({
        amount: 50000,
        suffix: 'Cr',
        text: '₹50,000 Cr',
        tone: 'credit',
      });
    });

    it('coerces non-numeric input to zero', () => {
      expect(drCr(undefined).tone).toBe('zero');
    });
  });
});
