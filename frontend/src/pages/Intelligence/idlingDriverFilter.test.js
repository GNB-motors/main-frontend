import { describe, it, expect } from 'vitest';
import { idleEventMatchesDriver, filterIdleEvents } from './idlingDriverFilter';

const event = {
  vehicleId: 'truck1',
  registrationNumber: 'WB11T0662',
  startAt: '2026-11-01T01:00:00Z',
  endAt: '2026-11-01T02:00:00Z',
};
const assignment = {
  driverId: { _id: 'driver1' },
  vehicleId: { _id: 'truck1', registrationNumber: 'WB11T0662' },
  startDate: '2026-11-01T00:00:00Z',
  endDate: '2026-11-01T03:00:00Z',
};

describe('idling driver attribution', () => {
  it('uses the recorded event driver before assignment fallback', () => {
    expect(
      idleEventMatchesDriver({ ...event, driverId: { _id: 'driver2' } }, 'driver1', [assignment]),
    ).toBe(false);
    expect(idleEventMatchesDriver({ ...event, driverId: 'driver1' }, 'driver1')).toBe(true);
  });
  it('requires an assignment covering the whole event, including handovers', () => {
    expect(idleEventMatchesDriver(event, 'driver1', [assignment])).toBe(true);
    expect(
      idleEventMatchesDriver(event, 'driver1', [
        { ...assignment, endDate: '2026-11-01T01:30:00Z' },
      ]),
    ).toBe(false);
    expect(idleEventMatchesDriver(event, 'driver2', [assignment])).toBe(false);
    expect(idleEventMatchesDriver(event, 'driver1', [])).toBe(false);
    expect(
      idleEventMatchesDriver({ ...event, vehicleId: 'another-truck' }, 'driver1', [assignment]),
    ).toBe(false);
  });
  it('matches populated vehicle registrations when the event lacks its vehicle id', () => {
    expect(
      idleEventMatchesDriver(
        { ...event, vehicleId: null, registrationNumber: 'wb 11t0662' },
        'driver1',
        [assignment],
      ),
    ).toBe(true);
  });
  it('does not attribute live events to ended assignments', () => {
    expect(
      idleEventMatchesDriver(
        { ...event, endAt: null },
        'driver1',
        [assignment],
        Date.parse('2026-11-01T04:00:00Z'),
      ),
    ).toBe(false);
  });
  it('combines an exact plate match with the driver filter', () => {
    const rows = [
      { ...event, driverId: 'driver1' },
      { ...event, driverId: 'driver2' },
      { ...event, registrationNumber: 'WB11T06620', driverId: 'driver1' },
    ];
    expect(filterIdleEvents(rows, { vehicle: 'wb 11t0662', driver: 'driver1' })).toEqual([rows[0]]);
  });
});
