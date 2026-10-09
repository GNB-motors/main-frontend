import { describe, expect, it } from 'vitest';
import {
  EMPTY_MANUAL_TRIP,
  EMPTY_PLAN,
  formReducer,
  manualTripBody,
  planBody,
  planWarnings,
  driverOptions,
  placeOptions,
  validateManualTrip,
  validatePlan,
} from './tripForms';

const NOW = new Date('2026-10-09T12:00:00');
const manual = (extra = {}) => ({
  ...EMPTY_MANUAL_TRIP,
  vehicleId: 'v1',
  startAt: '2026-10-07T06:00',
  endAt: '2026-10-07T18:00',
  ...extra,
});
const plan = (extra = {}) => ({
  ...EMPTY_PLAN,
  vehicleId: 'v1',
  pickupSiteId: 'plant',
  dropName: 'Cuttack dealer',
  plannedStartAt: '2026-10-10T06:00',
  ...extra,
});

describe('tripForms', () => {
  it('formReducer sets one field and resets', () => {
    const s = formReducer(EMPTY_PLAN, { type: 'set', field: 'vehicleId', value: 'v9' });
    expect(s.vehicleId).toBe('v9');
    expect(formReducer(s, { type: 'reset', initial: EMPTY_PLAN })).toBe(EMPTY_PLAN);
  });

  it('a missed trip needs a truck, an ordered past window, at most 15 days', () => {
    expect(validateManualTrip(manual(), NOW)).toBeNull();
    expect(validateManualTrip(manual({ vehicleId: '' }), NOW)).toMatch(/truck/);
    expect(validateManualTrip(manual({ endAt: '2026-10-07T05:00' }), NOW)).toMatch(/after/);
    expect(validateManualTrip(manual({ endAt: '2026-10-10T05:00' }), NOW)).toMatch(/schedule/);
    expect(validateManualTrip(manual({ startAt: '2026-09-20T05:00' }), NOW)).toMatch(/15 days/);
    expect(validateManualTrip(manual({ km: 'abc' }), NOW)).toMatch(/number/);
  });

  it('manual trip body leaves blank ends to the server and sends instants', () => {
    const body = manualTripBody(manual({ dropName: ' Cuttack ', km: '240', note: '' }));
    expect(body).toEqual({
      vehicleId: 'v1',
      startAt: new Date('2026-10-07T06:00').toISOString(),
      endAt: new Date('2026-10-07T18:00').toISOString(),
      drop: { name: 'Cuttack' },
      km: 240,
    });
    expect(manualTripBody(manual({ pickupSiteId: 'p', dropSiteId: 'd' }))).toMatchObject({
      pickup: { orgSiteId: 'p' },
      drop: { orgSiteId: 'd' },
    });
  });

  it('a plan needs a truck, both ends and a start; the body prefers the picked place', () => {
    expect(validatePlan(plan())).toBeNull();
    expect(validatePlan(plan({ pickupSiteId: '' }))).toMatch(/loads/);
    expect(validatePlan(plan({ dropName: ' ' }))).toMatch(/drops/);
    expect(validatePlan(plan({ plannedEndAt: '2026-10-10T05:00' }))).toMatch(/after/);
    expect(planBody(plan({ driverId: 'd1', pickupName: 'ignored' }))).toEqual({
      vehicleId: 'v1',
      driverId: 'd1',
      pickup: { orgSiteId: 'plant' },
      drop: { name: 'Cuttack dealer' },
      plannedStartAt: new Date('2026-10-10T06:00').toISOString(),
    });
  });

  it('pick lists keep drivers only and label places with their type', () => {
    expect(
      driverOptions([
        { _id: '1', role: 'DRIVER', firstName: 'Ravi' },
        { _id: '2', role: 'MANAGER', firstName: 'Asha' },
      ]),
    ).toEqual([{ id: '1', label: 'Ravi' }]);
    expect(placeOptions([{ _id: 's', name: 'AMBUJA', siteType: 'LOADING' }])).toEqual([
      { id: 's', label: 'AMBUJA · LOADING' },
    ]);
  });

  it('plan warnings: not started first, then the run’s deviations', () => {
    expect(planWarnings({ late: true, flags: ['DROP_MISMATCH'] })).toEqual([
      'Not started',
      'Dropped elsewhere',
    ]);
    expect(planWarnings({ flags: [] })).toEqual([]);
  });
});
