import { describe, it, expect } from 'vitest';
import { changedFlags } from './changedFlags';

describe('changedFlags', () => {
  it('sends only the flags the admin toggled, so a save never resets the rest', () => {
    const original = { overview: true, geofence: false, optimalSpeed: true };
    const edited = { overview: true, geofence: true, optimalSpeed: true };
    expect(changedFlags(['overview', 'geofence', 'optimalSpeed', 'drivingDna'], original, edited)).toEqual({
      geofence: true,
    });
  });

  it('treats a missing flag as off', () => {
    expect(changedFlags(['drivingDna', 'reports'], {}, { drivingDna: true, reports: false })).toEqual({
      drivingDna: true,
    });
  });

  it('is empty when nothing was toggled', () => {
    expect(changedFlags(['overview'], { overview: true }, { overview: true })).toEqual({});
  });
});
