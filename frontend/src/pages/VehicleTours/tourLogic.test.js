import { describe, it, expect } from 'vitest';
import { tourTelematicsView } from './tourLogic.js';

describe('tourTelematicsView', () => {
  it('is null before the cycle has a telematics row', () => {
    expect(tourTelematicsView(null)).toBeNull();
    expect(tourTelematicsView(undefined)).toBeNull();
  });

  it('derives whole-cycle mileage from km and fuel', () => {
    const view = tourTelematicsView({
      status: 'COMPUTED',
      confidence: 'HIGH',
      computedAt: '2026-09-30T10:00:00Z',
      actual: { totalTripKm: 1840.5, fuelConsumedL: 610, fuelSource: 'SINK' },
      warehouse: { anchored: true },
    });
    expect(view.measured).toBe(true);
    expect(view.kmPerL).toBe(3.02);
    expect(view.fuelSource).toBe('FleetEdge fuel meter');
    expect(view.confidence.tone).toBe('ok');
    expect(view.anchored).toBe(true);
  });

  it('gives no mileage without fuel, and flags an unanchored cycle as low confidence', () => {
    const view = tourTelematicsView({
      status: 'NO_DATA',
      confidence: 'LOW',
      actual: { totalTripKm: null, fuelConsumedL: null, fuelSource: null },
      warehouse: { anchored: false },
    });
    expect(view.measured).toBe(false);
    expect(view.kmPerL).toBeNull();
    expect(view.fuelSource).toBeNull();
    expect(view.confidence.tone).toBe('warn');
    expect(view.anchored).toBe(false);
  });
});
