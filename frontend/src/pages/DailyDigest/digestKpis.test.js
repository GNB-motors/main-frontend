import { describe, it, expect } from 'vitest';
import { buildDigestKpis } from './digestKpis';

describe('Daily Digest KPIs', () => {
  const fleetDashboard = [{ status: 'AVAILABLE' }, { status: 'MAINTENANCE' }];

  it('counts the Trip page’s trips today, not the legacy calendar tours (audit DD-02)', () => {
    const calendar = { vehicles: [{ events: [{ type: 'trip', date: new Date(), len: 1 }] }] };
    const kpis = buildDigestKpis({
      fleetDashboard,
      m: {},
      calendar,
      healthScore: null,
      tripsToday: 37,
    });
    const trips = kpis.find((k) => k.id === 'trips');
    expect(trips.value).toBe('37');
    expect(trips.to).toBe('/auto-trips?range=today');
  });

  it('labels availability and estimated burn for what they are (DD-01, DD-04)', () => {
    const kpis = buildDigestKpis({
      fleetDashboard,
      m: { fuelCostInr: 1000 },
      calendar: null,
      healthScore: null,
    });
    expect(kpis.find((k) => k.id === 'active')).toMatchObject({ label: 'Available', value: '1' });
    expect(kpis.find((k) => k.id === 'fuel').label).toBe('Fuel burned (est.)');
  });
});
