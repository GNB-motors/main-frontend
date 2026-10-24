import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REPORT,
  REPORT_GROUPS,
  activeReportId,
  isInlineReport,
  reportDestination,
  resolveReport,
  visibleReportGroups,
} from './reportCatalog';

const ALL_FLAGS = ['vehicleActivity', 'fuelIntegrity', 'autoTrips', 'sapV2'];
const flags = (on) => (key) => on.includes(key);
const ids = (groups) => groups.flatMap((g) => g.children.map((c) => c.id));

describe('visibleReportGroups', () => {
  it('keeps the six reports this page renders in front, in order', () => {
    const visible = ids(visibleReportGroups(flags(ALL_FLAGS)));
    expect(visible.slice(0, 6)).toEqual([
      'vehicle',
      'driver',
      'mileageIntervals',
      'modelComparison',
      'dieselReport',
      'adblueReport',
    ]);
  });

  it('consolidates the Trip Economics reports this page renders', () => {
    const visible = ids(visibleReportGroups(flags(ALL_FLAGS)));
    expect(visible).toEqual(
      expect.arrayContaining([
        'oilAverage',
        'fuelCycles',
        'nonBusiness',
        'runningCost',
        'registerMatch',
        'laneKm',
      ]),
    );
  });

  it('no longer carries the empty Tolls group', () => {
    expect(REPORT_GROUPS.map((g) => g.id)).not.toContain('tolls');
    expect(visibleReportGroups(flags(ALL_FLAGS)).map((g) => g.id)).not.toContain('tolls');
  });

  it('keeps only the genuine-report groups (module deep-links removed)', () => {
    expect(visibleReportGroups(flags(ALL_FLAGS)).map((g) => g.id)).toEqual([
      'fuel',
      'trips',
      'compliance',
    ]);
  });

  it('shows SAP routes on sapV2 alone, and hides the other Trip Economics reports without autoTrips', () => {
    const visible = ids(visibleReportGroups(flags(['vehicleActivity', 'fuelIntegrity', 'sapV2'])));
    expect(visible).not.toContain('oilAverage');
    expect(visible).not.toContain('fuelCycles');
    expect(visible).not.toContain('nonBusiness');
    expect(visible).not.toContain('runningCost');
    expect(visible).not.toContain('registerMatch');
    expect(visible).toContain('laneKm');
    expect(resolveReport('laneKm', flags(['sapV2']))).toBe('laneKm');
    expect(ids(visibleReportGroups(flags(['autoTrips'])))).not.toContain('laneKm');
    expect(resolveReport('laneKm', flags([]))).toBe(DEFAULT_REPORT);
  });

  it('hides the Oil & Average report without autoTrips (its API router is gated)', () => {
    expect(ids(visibleReportGroups(flags([])))).not.toContain('oilAverage');
    expect(resolveReport('oilAverage', flags([]))).toBe(DEFAULT_REPORT);
    expect(resolveReport('oilAverage', flags(['autoTrips']))).toBe('oilAverage');
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

describe('reportDestination', () => {
  it('returns null for a report this page renders', () => {
    expect(reportDestination('driver')).toBeNull();
    expect(isInlineReport('driver')).toBe(true);
  });

  it('returns the screen a dedicated report row owns', () => {
    expect(reportDestination('defLedger')).toBe('/def-ledger');
    expect(reportDestination('fuelIntegrity')).toBe('/fuel-integrity');
    expect(isInlineReport('defLedger')).toBe(false);
  });

  it('keeps the Fuel vs FleetEdge reconciliation deep link', () => {
    expect(reportDestination('fuelComparison')).toBe('/mileage?tab=reconciliation&view=ecu');
  });

  it('is null for a removed module link or a row not in the catalog', () => {
    expect(reportDestination('erpDayBook')).toBeNull();
    expect(reportDestination('routeDeviation')).toBeNull();
    expect(reportDestination('nope')).toBeNull();
  });
});

describe('activeReportId', () => {
  it('reads ?report= on the Reports hub, defaulting when absent', () => {
    expect(activeReportId('/reports', '?report=vehicle')).toBe('vehicle');
    expect(activeReportId('/reports', '')).toBe(DEFAULT_REPORT);
  });

  it('matches a dedicated report screen by its path, ignoring query', () => {
    expect(activeReportId('/fuel-integrity', '')).toBe('fuelIntegrity');
    expect(activeReportId('/def-ledger', '')).toBe('defLedger');
    expect(activeReportId('/mileage', '?tab=reconciliation&view=ecu')).toBe('fuelComparison');
  });

  it('is null away from any report screen', () => {
    expect(activeReportId('/vehicles', '')).toBeNull();
    expect(activeReportId('/erp', '')).toBeNull();
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

  it('falls back for a row that links out — it has no table on this page', () => {
    expect(resolveReport('fuelComparison', flags(ALL_FLAGS))).toBe(DEFAULT_REPORT);
    expect(resolveReport('defLedger', flags([]))).toBe(DEFAULT_REPORT);
  });
});
