import { describe, it, expect } from 'vitest';
import { WhereNextRouteSchema } from './fleetView.schema';

describe('where-next road engine route', () => {
  it('accepts a route with no historical run count', () => {
    expect(
      WhereNextRouteSchema.safeParse({
        polyline: [
          [23, 87],
          [23.1, 87.1],
        ],
        km: 32,
        viaNames: [],
        usedTimes: null,
      }).success,
    ).toBe(true);
  });
});
