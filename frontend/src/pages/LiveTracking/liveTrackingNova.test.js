import { describe, it, expect } from 'vitest';
import {
  NOVA_STATUS,
  haversineKm,
  bearingDegrees,
  formatAgoText,
  formatHrsText,
  resolveVehicleStatus,
} from './liveTracking.shared.js';

describe('Nova Edge Pro Live Tracking Helpers', () => {
  it('correctly resolves vehicle statuses', () => {
    expect(resolveVehicleStatus({ speed: 45, ignition: true })).toBe('Moving');
    expect(resolveVehicleStatus({ speed: 0, ignition: 'ON' })).toBe('Idling');
    expect(resolveVehicleStatus({ speed: 0, ignition: false })).toBe('Stopped');
    expect(resolveVehicleStatus({ isStale: true })).toBe('Offline');
    expect(resolveVehicleStatus({ state: 'OFFLINE' })).toBe('Offline');
  });

  it('computes haversine distance between two coordinates', () => {
    // Kolkata → Howrah, ~10 km apart.
    const dist = haversineKm([22.5726, 88.3639], [22.5958, 88.2636]);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(20);
  });

  it('computes compass bearing between points', () => {
    const p1 = [22.0, 88.0];
    const p2 = [23.0, 88.0]; // directly north
    const brg = bearingDegrees(p1, p2);
    expect(Math.round(brg)).toBe(0);
  });

  it('formats time ago strings appropriately', () => {
    expect(formatAgoText(0)).toBe('just now');
    expect(formatAgoText(15)).toBe('15 min ago');
    expect(formatAgoText(120)).toBe('2 hr ago');
    expect(formatAgoText(2880)).toBe('2 days ago');
    expect(formatAgoText(null)).toBe('—');
  });

  it('formats hours and minutes text', () => {
    expect(formatHrsText(95)).toBe('1h 35m');
    expect(formatHrsText(45)).toBe('0h 45m');
    expect(formatHrsText(0)).toBe('0h 00m');
  });

  it('exposes the status color palette', () => {
    expect(NOVA_STATUS.moving.c).toBe('#187A32');
    expect(NOVA_STATUS.stopped.c).toBe('#6A43D8');
    expect(NOVA_STATUS.idling.c).toBe('#C56200');
    expect(NOVA_STATUS.offline.c).toBe('#5D5D5E');
  });
});
