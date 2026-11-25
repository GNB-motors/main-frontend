import { expect, it } from 'vitest';
import { profileWeeks, weeklyTripFacts, tripsForDriver, weeklyTotal } from './driverProfileModel';
it('builds four consecutive seven-day IST periods', () => {
  const weeks = profileWeeks('2026-11-24');
  expect(weeks.map(({ from, to }) => [from, to])).toEqual([
    ['2026-10-28', '2026-11-03'],
    ['2026-11-04', '2026-11-10'],
    ['2026-11-11', '2026-11-17'],
    ['2026-11-18', '2026-11-24'],
  ]);
});
it('keeps other drivers out and missing distances unknown', () => {
  const trips = [
    {
      driverId: { _id: 'd1' },
      createdAt: '2026-11-18T00:00:00Z',
      mileage: { totalDistanceKm: 300 },
    },
    { driverId: 'd2', createdAt: '2026-11-18T00:00:00Z', mileage: { totalDistanceKm: 999 } },
    { driverId: 'd1', createdAt: '2026-11-20T00:00:00Z' },
  ];
  const selected = tripsForDriver(trips, 'd1');
  const facts = weeklyTripFacts(selected, profileWeeks('2026-11-24'));
  expect(facts.at(-1)).toMatchObject({ trips: 2, km: null });
  expect(weeklyTripFacts([selected[0]], profileWeeks('2026-11-24')).at(-1).km).toBe(300);
});
it('assigns a trip created at IST midnight to the correct week', () => {
  const facts = weeklyTripFacts(
    [{ createdAt: '2026-11-17T18:30:00Z', startOdometer: 100, endOdometer: 170 }],
    profileWeeks('2026-11-24'),
  );
  expect(facts.at(-1)).toMatchObject({ trips: 1, km: 70 });
});
it('totals the four weeks only when every week was measured', () => {
  const weeks = [{ km: 120 }, { km: 0 }, { km: 80 }, { km: 40 }];
  expect(weeklyTotal(weeks, 'km')).toBe(240);
  expect(weeklyTotal([...weeks.slice(0, 3), { km: null }], 'km')).toBeNull();
  expect(weeklyTotal([{}, {}], 'trips')).toBeNull();
});
