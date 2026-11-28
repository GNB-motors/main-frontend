import { expect, it } from 'vitest';
import { pumpHonestyStatus } from './pumpRows';

it.each([null, undefined, '', NaN, Infinity])(
  'does not clear a pump with missing measurement: %s',
  (pct) => {
    expect(pumpHonestyStatus(pct, 8)).toBe('INSUFFICIENT_DATA');
  },
);
it('retains a measured zero and requires enough fills', () => {
  expect(pumpHonestyStatus(0, 3)).toBe('HONEST');
  expect(pumpHonestyStatus(0, 2)).toBe('INSUFFICIENT_DATA');
});
