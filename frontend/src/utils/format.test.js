import { describe, it, expect } from 'vitest';
import { humanizeCode } from './format';

describe('humanizeCode', () => {
  it('turns an upper-snake code into sentence case', () => {
    expect(humanizeCode('REFUEL_SOON')).toBe('Refuel soon');
    expect(humanizeCode('PICKUP_TO_PICKUP')).toBe('Pickup to pickup');
  });

  it('turns a single upper-case code into sentence case', () => {
    expect(humanizeCode('CRITICAL')).toBe('Critical');
  });

  it('leaves a short code alone', () => {
    expect(humanizeCode('OK')).toBe('OK');
    expect(humanizeCode('ERP')).toBe('ERP');
  });

  it('leaves anything that is not a code alone', () => {
    expect(humanizeCode('Bill matches')).toBe('Bill matches');
    expect(humanizeCode('Not assigned')).toBe('Not assigned');
    expect(humanizeCode('12')).toBe('12');
    expect(humanizeCode('')).toBe('');
    expect(humanizeCode('—')).toBe('—');
  });

  it('passes a missing value straight through', () => {
    expect(humanizeCode(null)).toBeNull();
    expect(humanizeCode(undefined)).toBeUndefined();
  });
});
