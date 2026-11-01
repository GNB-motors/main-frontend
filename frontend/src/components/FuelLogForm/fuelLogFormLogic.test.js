import { describe, expect, it } from 'vitest';
import {
  fuelEntryPayload,
  fuelOcrPatch,
  toRefuelISO,
  toRefuelLocal,
  validateFuelEntry,
} from './fuelLogFormLogic';

const values = {
  fillingType: 'FULL_TANK',
  litres: '85',
  rate: '',
  odometerReading: '10500',
  refuelTime: '2026-10-31T10:00',
};
const now = new Date('2026-11-02T00:00:00Z');
const check = (patch, last) =>
  validateFuelEntry({ ...values, ...patch }, { id: 'v' }, { id: 'd' }, last, now);

describe('diesel entry mileage inputs', () => {
  it('converts IST independently of the browser timezone and rejects invalid calendar dates', () => {
    expect(toRefuelLocal('2026-10-31T04:30:00Z')).toBe('2026-10-31T10:00');
    expect(toRefuelISO('2026-10-31T10:00')).toBe('2026-10-31T04:30:00.000Z');
    expect(toRefuelISO('2026-02-31T10:00')).toBeNull();
    expect(toRefuelISO('2026-10-31T25:00')).toBeNull();
  });
  it.each(['', '0', '-1', 'Infinity', 'bad'])('rejects unusable litres %s', (litres) => {
    expect(check({ litres })).toMatch(/litres/);
  });
  it('requires the fill choice and actual time', () => {
    expect(check({ fillingType: '' })).toMatch(/full/);
    expect(check({ refuelTime: '' })).toMatch(/date and time/);
    expect(check({ refuelTime: '2026-12-01T10:00' })).toMatch(/future/);
  });
  it('requires full-tank odometer, permits partial fills without it and keeps rate optional', () => {
    expect(check({ odometerReading: '' })).toMatch(/odometer/);
    expect(check({ fillingType: 'PARTIAL', odometerReading: '' })).toBeNull();
    expect(check({ rate: '0' })).toMatch(/rate/);
    expect(check({})).toBeNull();
  });
  it('does not compare an older entry to a later log as its predecessor', () => {
    const last = { odometerReading: 11000, refuelTime: '2026-11-01T10:00:00Z' };
    expect(check({}, last)).toBeNull();
    expect(check({ refuelTime: '2026-11-01T23:00' }, last)).toMatch(/greater than/);
  });
  it('omits absent bill fields and hidden odometers from partial entries', () => {
    expect(
      fuelEntryPayload({ ...values, fillingType: 'PARTIAL' }, { id: 'v' }, { id: 'd' }),
    ).toEqual({
      vehicleId: 'v',
      driverId: 'd',
      fuelType: 'DIESEL',
      fillingType: 'PARTIAL',
      litres: 85,
      refuelTime: '2026-10-31T04:30:00.000Z',
    });
  });
  it('handles OCR dates both with and without an offset', () => {
    expect(fuelOcrPatch({ datetime: '2026-10-31 10:00' }, 'fuel').refuelTime).toBe(
      '2026-10-31T10:00',
    );
    expect(fuelOcrPatch({ datetime: '2026-10-31T04:30:00Z' }, 'fuel').refuelTime).toBe(
      '2026-10-31T10:00',
    );
    expect(fuelOcrPatch({ datetime: 'invalid' }, 'fuel')).not.toHaveProperty('refuelTime');
  });
  it('preserves operator corrections when a scan completes later', () => {
    expect(
      fuelOcrPatch(
        { datetime: '2026-10-31 10:00', volume: 85, rate: 92 },
        'fuel',
        new Set(['refuelTime', 'litres']),
      ),
    ).toEqual({ rate: '92' });
  });
});
