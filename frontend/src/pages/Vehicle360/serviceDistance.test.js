import { describe, expect, it } from 'vitest';
import { serviceProgress } from './panels/overview/referenceOverviewModel';
import { serviceState } from './vehicle360Logic';

describe('service forecast distance', () => {
  it('keeps the overview and header on the forecast snapshot after live odometer advances', () => {
    const prediction = {
      currentOdometer: 10000,
      lastServiceOdometer: 5000,
      projectedServiceDueOdometer: 15000,
      kmUntilDue: 5000,
    };
    const overview = serviceProgress(prediction, { canOdo: 12000 }, { odometer: { value: 13000 } });
    expect(overview).toMatchObject({ current: 10000, remaining: 5000, percent: 50 });
    expect(serviceState(prediction).km).toBe(overview.remaining);
  });
  it('calculates missing distance remaining from the same snapshot in the header', () => {
    const prediction = { currentOdometer: 16000, projectedServiceDueOdometer: 15000 };
    expect(serviceState(prediction)).toMatchObject({ km: 1000, overdue: true });
  });
  it('preserves a real zero remaining distance', () => {
    expect(serviceProgress({ kmUntilDue: 0 }, { canOdo: 12000 }, {}).remaining).toBe(0);
  });
});
