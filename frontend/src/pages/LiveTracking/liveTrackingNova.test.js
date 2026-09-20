import { describe, it, expect } from 'vitest';
import {
  NOVA_STATUS,
  CITY_COORDS,
  DEPOTS,
  haversineKm,
  bearingDegrees,
  formatAgoText,
  formatHrsText,
  aheadPath,
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
    const kolkata = CITY_COORDS.KOL;
    const howrah = CITY_COORDS.HWH;
    const dist = haversineKm([kolkata[0], kolkata[1]], [howrah[0], howrah[1]]);
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

  it('generates an interpolated ahead route path', () => {
    const vehicle = {
      lat: 22.5726,
      lng: 88.3639,
      route: ['KOL', 'Kolkata, WB', 'SLG', 'Siliguri, WB'],
    };
    const pts = aheadPath(vehicle);
    expect(pts).toBeDefined();
    expect(pts.length).toBeGreaterThan(5);
    expect(pts[0]).toEqual([22.5726, 88.3639]);
    expect(pts[pts.length - 1]).toEqual([CITY_COORDS.SLG[0], CITY_COORDS.SLG[1]]);
  });

  it('contains valid depot coordinates and statuses', () => {
    expect(DEPOTS.length).toBeGreaterThanOrEqual(6);
    expect(NOVA_STATUS.moving.c).toBe('#187A32');
    expect(NOVA_STATUS.stopped.c).toBe('#6A43D8');
    expect(NOVA_STATUS.idling.c).toBe('#C56200');
    expect(NOVA_STATUS.offline.c).toBe('#5D5D5E');
  });
});
