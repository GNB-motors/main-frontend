import { inr, compactInr, num, pct, money, signedInr, drCr } from './formatMoney.js';

describe('formatMoney.js — central currency formatting', () => {
  describe('inr', () => {
    it('formats with Indian grouping, no paise', () => {
      expect(inr(1200000)).toBe('₹12,00,000');
      expect(inr(0)).toBe('₹0');
    });

    it('treats null/undefined/NaN as zero', () => {
      expect(inr(null)).toBe('₹0');
      expect(inr(undefined)).toBe('₹0');
    });

    it('rounds away paise', () => {
      expect(inr(1234.6)).toBe('₹1,235');
    });
  });

  describe('compactInr', () => {
    it('uses crore above 1e7', () => {
      expect(compactInr(42000000)).toBe('₹4.20 Cr');
    });

    it('uses lakh above 1e5', () => {
      expect(compactInr(250000)).toBe('₹2.50 L');
    });

    it('uses k above 1e3', () => {
      expect(compactInr(45300)).toBe('₹45.3k');
    });

    it('falls back to full inr below 1e3', () => {
      expect(compactInr(999)).toBe('₹999');
    });

    it('is sign-aware via the raw value, not abs', () => {
      expect(compactInr(-42000000)).toBe('₹-4.20 Cr');
    });
  });

  describe('num', () => {
    it('formats plain integers with Indian grouping', () => {
      expect(num(120000)).toBe('1,20,000');
      expect(num(null)).toBe('0');
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
