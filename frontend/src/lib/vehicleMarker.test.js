import { describe, it, expect } from 'vitest';
import { bearingToRotation, markerTone } from './vehicleMarker';

describe('bearingToRotation', () => {
  it('normalises bearings to 0-360', () => {
    expect(bearingToRotation(0)).toBe(0);
    expect(bearingToRotation(90)).toBe(90);
    expect(bearingToRotation(359.9)).toBeCloseTo(359.9);
    expect(bearingToRotation(360)).toBe(0);
    expect(bearingToRotation(725)).toBe(5);
  });

  it('handles negatives by wrapping', () => {
    expect(bearingToRotation(-90)).toBe(270);
  });

  it('maps absent/invalid to 0 — never NaN into a transform', () => {
    expect(bearingToRotation(null)).toBe(0);
    expect(bearingToRotation(undefined)).toBe(0);
    expect(bearingToRotation('north')).toBe(0);
  });
});

describe('markerTone', () => {
  it('reserves critical for real alert severity', () => {
    expect(markerTone({ alertSeverity: 'CRITICAL' })).toBe('critical');
    expect(markerTone({ alertSeverity: 'WARNING' })).toBe('critical');
  });

  it('treats stale or offline as inert, not as an alarm', () => {
    expect(markerTone({ isStale: true, status: 'ACTIVE' })).toBe('inert');
    expect(markerTone({ status: 'OFFLINE' })).toBe('inert');
  });

  it('defaults to ok only for live, non-alerting vehicles', () => {
    expect(markerTone({ status: 'ACTIVE' })).toBe('ok');
    expect(markerTone({ status: 'PARKED' })).toBe('ok');
  });

  it('absent everything is inert, never a guessed alarm', () => {
    expect(markerTone({})).toBe('inert');
    expect(markerTone(null)).toBe('inert');
    expect(markerTone(undefined)).toBe('inert');
  });
});
