import { describe, it, expect } from 'vitest';
import { visibleReportGroups, resolveReport, DEFAULT_REPORT } from './reportCatalog';

const flags = (on) => (key) => on.includes(key);
const ids = (groups) => groups.flatMap((g) => g.children.map((c) => c.id));

describe('visibleReportGroups', () => {
  it('shows every report when the org has all sub-flags', () => {
    expect(
      ids(visibleReportGroups(flags(['vehicleActivity', 'fuelIntegrity', 'autoTrips']))),
    ).toEqual([
      'driver',
      'vehicle',
      'mileageIntervals',
      'modelComparison',
      'dieselReport',
      'adblueReport',
      'oilAverage',
      'fuelCycles',
      'nonBusiness',
      'runningCost',
      'registerMatch',
    ]);
  });

  it('hides the Trip Economics reports for an org without autoTrips', () => {
    const visible = ids(visibleReportGroups(flags(['vehicleActivity', 'fuelIntegrity'])));
    expect(visible).not.toContain('fuelCycles');
    expect(visible).not.toContain('nonBusiness');
    expect(visible).not.toContain('runningCost');
    expect(visible).not.toContain('registerMatch');
  });

  it('keeps the Oil & Average report for every org (its API has no sub-flag)', () => {
    expect(ids(visibleReportGroups(flags([])))).toContain('oilAverage');
    expect(resolveReport('oilAverage', flags([]))).toBe('oilAverage');
  });

  it('hides AdBlue for an org without fuelIntegrity (its API would 404)', () => {
    const visible = ids(visibleReportGroups(flags(['vehicleActivity'])));
    expect(visible).not.toContain('adblueReport');
    expect(visible).toContain('modelComparison');
  });

  it('hides Model Comparison without vehicleActivity', () => {
    expect(ids(visibleReportGroups(flags([])))).not.toContain('modelComparison');
  });
});

describe('resolveReport', () => {
  it('keeps a requested report the org can open', () => {
    expect(resolveReport('vehicle', flags([]))).toBe('vehicle');
  });

  it('falls back to the default for a hidden or unknown report', () => {
    expect(resolveReport('adblueReport', flags([]))).toBe(DEFAULT_REPORT);
    expect(resolveReport('outliers', flags([]))).toBe(DEFAULT_REPORT);
    expect(resolveReport(null, flags([]))).toBe(DEFAULT_REPORT);
  });
});
