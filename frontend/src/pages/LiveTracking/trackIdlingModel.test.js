import { describe, it, expect } from 'vitest';
import { formatIdlingChip, idlingMinutesByPlate, idlingMinutesFor } from './trackIdlingModel';

describe('the idling chip', () => {
  it('says how long a truck has been idling', () => {
    expect(formatIdlingChip(23)).toBe('Idling 23 min');
    expect(formatIdlingChip(65)).toBe('Idling 1 h 5 min');
    expect(formatIdlingChip(120)).toBe('Idling 2 h');
  });

  it('says nothing when the minutes are unknown', () => {
    expect(formatIdlingChip(null)).toBeNull();
    expect(formatIdlingChip(undefined)).toBeNull();
    expect(formatIdlingChip(0)).toBeNull();
  });

  it('keeps the longest open segment of a truck', () => {
    const rows = [
      { registrationNumber: 'MH 12 AB 1234', durationMin: 10 },
      { registrationNumber: 'MH12AB1234', durationMin: 25 },
    ];
    expect(idlingMinutesFor(rows, 'MH 12 AB 1234')).toBe(25);
    expect(idlingMinutesByPlate(rows).get('MH12AB1234')).toBe(25);
  });

  it('says nothing for a truck that is not idling', () => {
    expect(idlingMinutesFor([], 'MH 12 AB 1234')).toBeNull();
  });
});
