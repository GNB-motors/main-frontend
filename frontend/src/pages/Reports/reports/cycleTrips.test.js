import { describe, it, expect } from 'vitest';
import { notInTripsAlert, tripRoute, tripNotes, tripCountLabel } from './cycleTrips';

describe('notInTripsAlert', () => {
  it('stays quiet for ordinary empty running', () => {
    expect(notInTripsAlert({ count: 3, cycleKm: 1000, ladenKm: 550, otherKm: 450 })).toBeNull();
  });

  it('flags a cycle that ran with no trip', () => {
    expect(notInTripsAlert({ count: 0, cycleKm: 600, ladenKm: 0, otherKm: 600 })?.tone).toBe('red');
    expect(notInTripsAlert({ count: 0, cycleKm: 20, ladenKm: 0, otherKm: 20 })).toBeNull();
  });

  it('flags trips longer than the slips’ odometer beyond tolerance', () => {
    expect(notInTripsAlert({ count: 2, cycleKm: 1000, ladenKm: 1100, otherKm: -100 })?.tone).toBe(
      'amber',
    );
    expect(notInTripsAlert({ count: 2, cycleKm: 1000, ladenKm: 1015, otherKm: -15 })).toBeNull();
  });

  it('says nothing without a summary or cycle km', () => {
    expect(notInTripsAlert(null)).toBeNull();
    expect(notInTripsAlert({ count: 0, cycleKm: null })).toBeNull();
  });
});

describe('trip display', () => {
  it('names the route with extra drops', () => {
    expect(tripRoute({ pickupName: 'Plant', dropName: 'Depot', drops: 1 })).toBe('Plant → Depot');
    expect(tripRoute({ pickupName: 'Plant', dropName: 'Depot', drops: 3 })).toBe(
      'Plant → Depot (+2 drops)',
    );
    expect(tripRoute({ drops: 1 })).toBe('Unknown pickup → Unknown drop');
  });

  it('explains a split trip and its flags', () => {
    expect(tripNotes({ partial: true, share: 0.42, flags: ['ODO_DISAGREES'] })).toEqual([
      '42% in this cycle (crosses a fill)',
      'Slip odometer disagrees with the trip — split by time',
    ]);
    expect(tripNotes({ partial: false, share: 1, flags: [] })).toEqual([]);
  });

  it('counts trips', () => {
    expect(tripCountLabel({ count: 1 })).toBe('1 trip');
    expect(tripCountLabel({ count: 4 })).toBe('4 trips');
    expect(tripCountLabel(null)).toBe('—');
  });
});
