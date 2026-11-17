import { describe, it, expect } from 'vitest';
import sectionCopy from './sectionCopy';

describe('sectionCopy', () => {
  it('says what every report section shows in one plain line', () => {
    for (const id of [
      'fleetNow',
      'yesterdaysWork',
      'moneyOut',
      'moneyIn',
      'people',
      'exceptions',
      'trend',
      'dataHealth',
    ]) {
      const line = sectionCopy.about({ id });
      expect(line).toBeTruthy();
      expect(line.length).toBeLessThan(110);
    }
  });

  it('speaks of today as still going and of a past day as done', () => {
    expect(sectionCopy.empty({ id: 'yesterdaysWork' }, { pending: true })).toBe(
      'No trip has left a pickup yet today.',
    );
    expect(sectionCopy.empty({ id: 'yesterdaysWork' })).toBe('No trip left a pickup on this day.');
  });

  it('never prints the server notes for an empty section', () => {
    const text = sectionCopy.empty({
      id: 'moneyOut',
      notes: ['sensor litres unavailable — bills shown alone'],
    });
    expect(text).toBe('No diesel bills or expenses were recorded for this day.');
  });

  it('falls back to a plain sentence for an unknown section', () => {
    expect(sectionCopy.empty({ id: 'somethingNew' })).toBe('Nothing was recorded for this day.');
    expect(sectionCopy.about({ id: 'somethingNew' })).toBeNull();
  });

  it('writes the freshest source time for a person, or nothing', () => {
    const section = {
      footer: {
        sources: [
          { name: 'A', freshAsOf: '2026-11-04T00:49:43.105Z' },
          { name: 'B', freshAsOf: '2026-11-03T10:00:00.000Z' },
          { name: 'C', freshAsOf: null },
        ],
      },
    };
    expect(sectionCopy.updated(section)).toBe('Updated 4 Nov, 6:19 am');
    expect(sectionCopy.updated({ footer: { sources: [] } })).toBeNull();
  });
});
