import {
  formatINR,
  formatInrCompact,
  formatNum,
  formatKm,
  formatLitres,
  formatPct,
  timeAgo,
  freshnessOf,
  gradeSignal,
} from './formatters.js';

describe('formatters.js', () => {
  describe('formatINR', () => {
    it('formats whole rupees with Indian grouping', () => {
      expect(formatINR(123456)).toBe('₹1,23,456');
    });

    it('supports paise via decimals option', () => {
      expect(formatINR(1234.5, { decimals: 2 })).toBe('₹1,234.50');
    });

    it('renders — for null and NaN input', () => {
      expect(formatINR(null)).toBe('—');
      expect(formatINR(undefined)).toBe('—');
      expect(formatINR('abc')).toBe('—');
    });

    it('coerces numeric strings', () => {
      expect(formatINR('5000')).toBe('₹5,000');
    });
  });

  describe('formatInrCompact', () => {
    it('uses crore / lakh / k tiers with Indian rounding', () => {
      expect(formatInrCompact(12345678)).toBe('₹1.23Cr');
      expect(formatInrCompact(123456)).toBe('₹1.2L');
      expect(formatInrCompact(45300)).toBe('₹45.3k');
      expect(formatInrCompact(999)).toBe('₹999');
    });

    it('signs negative values with the minus sign', () => {
      expect(formatInrCompact(-12345678)).toBe('−₹1.23Cr');
    });

    it('renders — for null/NaN input', () => {
      expect(formatInrCompact(null)).toBe('—');
      expect(formatInrCompact(NaN)).toBe('—');
    });
  });

  describe('formatNum', () => {
    it('formats integers with Indian grouping', () => {
      expect(formatNum(123456)).toBe('1,23,456');
    });

    it('honours the decimals option', () => {
      expect(formatNum(1234.56, { decimals: 2 })).toBe('1,234.56');
      expect(formatNum(1234.56, { decimals: 1 })).toBe('1,234.6');
    });

    it('renders — for invalid input', () => {
      expect(formatNum(null)).toBe('—');
      expect(formatNum('nope')).toBe('—');
    });
  });

  describe('formatKm / formatLitres / formatPct', () => {
    it('formatKm rounds and appends km', () => {
      expect(formatKm(1234.4)).toBe('1,234 km');
      expect(formatKm(null)).toBe('—');
    });

    it('formatLitres defaults to one decimal', () => {
      expect(formatLitres(152.44)).toBe('152.4 L');
      expect(formatLitres(152.44, { decimals: 0 })).toBe('152 L');
      expect(formatLitres(NaN)).toBe('—');
    });

    it('formatPct appends % and honours decimals', () => {
      expect(formatPct(87.25)).toBe('87%');
      expect(formatPct(87.25, { decimals: 1 })).toBe('87.3%');
      expect(formatPct(null)).toBe('—');
    });
  });

  describe('timeAgo', () => {
    const now = Date.now();

    it('returns never for missing or invalid input', () => {
      expect(timeAgo(null, now)).toBe('never');
      expect(timeAgo('not-a-date', now)).toBe('never');
    });

    it('clamps future timestamps to just now', () => {
      expect(timeAgo(new Date(now + 60000), now)).toBe('just now');
    });

    it('walks the minute/hour/day/month tiers', () => {
      const min = 60000;
      expect(timeAgo(new Date(now - 30 * min), now)).toBe('30m ago');
      expect(timeAgo(new Date(now - 3 * 60 * min), now)).toBe('3h ago');
      expect(timeAgo(new Date(now - 2 * 24 * 60 * min), now)).toBe('2d ago');
      expect(timeAgo(new Date(now - 65 * 24 * 60 * min), now)).toBe('2mo ago');
    });

    it('returns just now under one minute', () => {
      expect(timeAgo(new Date(now - 10000), now)).toBe('just now');
    });
  });

  describe('freshnessOf', () => {
    const now = Date.now();
    const h = 3600000;

    it('classifies the freshness bands', () => {
      expect(freshnessOf(new Date(now - 30 * 60000), now)).toBe('fresh');
      expect(freshnessOf(new Date(now - 3 * h), now)).toBe('aging');
      expect(freshnessOf(new Date(now - 12 * h), now)).toBe('stale');
      expect(freshnessOf(new Date(now - 48 * h), now)).toBe('dead');
    });

    it('treats missing or invalid input as dead', () => {
      expect(freshnessOf(null, now)).toBe('dead');
      expect(freshnessOf('garbage', now)).toBe('dead');
    });
  });

  describe('gradeSignal', () => {
    it('maps grades to signal words', () => {
      expect(gradeSignal('A')).toBe('ok');
      expect(gradeSignal('B')).toBe('ok');
      expect(gradeSignal('C')).toBe('caution');
      expect(gradeSignal('D')).toBe('critical');
      expect(gradeSignal(undefined)).toBe('critical');
    });
  });
});
