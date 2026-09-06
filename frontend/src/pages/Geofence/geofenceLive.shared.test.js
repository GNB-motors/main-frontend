import { describe, it, expect } from 'vitest';
import { toGeofenceLiveVehicle } from './geofenceLive.shared.js';

describe('toGeofenceLiveVehicle', () => {
  it('maps a positions-stream row to the geofence live-locations shape', () => {
    const row = {
      registrationNumber: 'KA01AB1234',
      vin: 'VIN1',
      state: 'ACTIVE',
      eventDateTime: '2026-09-06T10:00:00.000Z',
      latitude: 12.97,
      longitude: 77.59,
      speed: 42.4,
      ignition: true,
      primaryFuelLevel: 88,
      isStale: false,
    };
    expect(toGeofenceLiveVehicle(row)).toEqual({
      vehicleId: 'KA01AB1234',
      registrationNumber: 'KA01AB1234',
      lat: 12.97,
      lng: 77.59,
      speed: 42.4,
      status: 'Moving',
      fuelLevel: 88,
      odometer: null,
      lastSeenAt: '2026-09-06T10:00:00.000Z',
      isStale: false,
    });
  });

  it('derives FleetEdge-style status from state and ignition', () => {
    const base = { registrationNumber: 'X', latitude: 1, longitude: 2 };
    expect(toGeofenceLiveVehicle({ ...base, state: 'ACTIVE', ignition: false }).status).toBe(
      'Idling',
    );
    expect(toGeofenceLiveVehicle({ ...base, state: 'PARKED' }).status).toBe('Stopped');
    expect(toGeofenceLiveVehicle({ ...base, state: 'OFFLINE' }).status).toBe('Offline');
    expect(toGeofenceLiveVehicle({ ...base }).status).toBe('Offline');
  });

  it('falls back to the vin and nulls missing telemetry', () => {
    const mapped = toGeofenceLiveVehicle({ vin: 'VIN-ONLY' });
    expect(mapped.vehicleId).toBe('VIN-ONLY');
    expect(mapped.registrationNumber).toBe('VIN-ONLY');
    expect(mapped.lat).toBeNull();
    expect(mapped.lng).toBeNull();
    expect(mapped.speed).toBeNull();
    expect(mapped.fuelLevel).toBeNull();
    expect(mapped.lastSeenAt).toBeNull();
    expect(mapped.isStale).toBe(false);
  });

  it('returns null for a missing row', () => {
    expect(toGeofenceLiveVehicle(null)).toBeNull();
    expect(toGeofenceLiveVehicle(undefined)).toBeNull();
  });
});
