import { describe, it, expect } from 'vitest';
import { LABELS, TONES, humanise, label, toneOf } from './vocabulary';

describe('humanise', () => {
  it('converts UPPER_SNAKE to title case', () => {
    expect(humanise('RETURN_PARK')).toBe('Return park');
    expect(humanise('PARTIALLY_PAID')).toBe('Partially paid');
  });

  it('is case-insensitive', () => {
    expect(humanise('partially_paid')).toBe('Partially paid');
  });

  it('handles single words', () => {
    expect(humanise('DRAFT')).toBe('Draft');
  });

  it('returns empty string for absent values', () => {
    expect(humanise(null)).toBe('');
    expect(humanise(undefined)).toBe('');
    expect(humanise('')).toBe('');
  });
});

describe('label', () => {
  it('returns curated labels for known keys', () => {
    expect(label('status', 'ACTIVE')).toBe('Moving');
    expect(label('status', 'OFFLINE')).toBe('No signal');
    expect(label('telematics', 'NO_TELEMATICS')).toBe('This truck has no tracking device');
    expect(label('idleSource', 'DERIVED_ENGINE_HOURS')).toBe('Estimated from engine hours');
  });

  it('is case-insensitive across groups', () => {
    expect(label('severity', 'critical')).toBe('Critical');
    expect(label('severity', 'Critical')).toBe('Critical');
  });

  it('humanises unknown keys instead of rendering them raw', () => {
    expect(label('saleBillStatus', 'PARTIALLY_PAID')).toBe('Partially paid');
    expect(label('anything', 'SOME_NEW_FLAG')).toBe('Some new flag');
  });

  it('returns the fallback for absent values — absent is not a label', () => {
    expect(label('status', null)).toBe('—');
    expect(label('status', undefined)).toBe('—');
    expect(label('status', '')).toBe('—');
    expect(label('status', '  ')).toBe('—');
  });

  it('honours a custom fallback', () => {
    expect(label('status', null, 'Unknown')).toBe('Unknown');
  });

  it('never returns raw snake case for any string input', () => {
    for (const group of Object.keys(LABELS)) {
      const out = label(group, 'X_Y_Z');
      expect(out).not.toMatch(/_/);
    }
  });
});

describe('toneOf', () => {
  it('maps urgency constants to reserved tones', () => {
    expect(toneOf('severity', 'CRITICAL')).toBe('critical');
    expect(toneOf('severity', 'caution')).toBe('caution');
    expect(toneOf('risk', 'OVERDUE')).toBe('critical');
    expect(toneOf('status', 'ACTIVE')).toBe('ok');
    expect(toneOf('status', 'OFFLINE')).toBe('critical');
  });

  it('defaults unknown keys to inert — tone never invents urgency', () => {
    expect(toneOf('whatever', 'SOMETHING_NEW')).toBe('inert');
  });

  it('defaults absent values to inert', () => {
    expect(toneOf('status', null)).toBe('inert');
    expect(toneOf('status', '')).toBe('inert');
  });
});

describe('curation sanity', () => {
  it('TONES only contains the four reserved tones', () => {
    for (const tone of Object.values(TONES)) {
      expect(['ok', 'caution', 'critical', 'inert']).toContain(tone);
    }
  });
});

describe('Diesel & Mileage hub groups', () => {
  it('names every fill result in plain words, with a tone that says if it needs a look', () => {
    expect(label('refuel', 'BILL_TOO_HIGH')).toBe('Bill too high');
    expect(toneOf('refuel', 'BILL_TOO_HIGH')).toBe('critical');
    expect(toneOf('refuel', 'BILL_MISSING')).toBe('caution');
    expect(toneOf('refuel', 'BILL_MATCHES')).toBe('ok');
    expect(toneOf('refuel', 'GAUGE_JUMP')).toBe('inert');
    expect(toneOf('refuel', 'NO_TANK_READING')).toBe('inert');
  });

  it('pump verdicts never render the raw constant', () => {
    expect(label('pumpHonesty', 'CHRONIC_SHORTAGE')).toBe('Always short');
    expect(label('pumpHonesty', 'INSUFFICIENT_DATA')).toBe('Too few fills');
    expect(toneOf('pumpHonesty', 'INSUFFICIENT_DATA')).toBe('inert');
  });
});
